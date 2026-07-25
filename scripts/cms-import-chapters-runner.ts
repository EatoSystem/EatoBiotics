/*
 * One-off, local-only runner for the MDX → CMS chapter mirror import (Migration 41).
 *
 * Run from a trusted developer machine or a manually-triggered, protected CI job —
 * never through a public/deployed route. Requires:
 *   - the exact current `main` checkout (reads content/book/*.mdx + lib/chapters.ts
 *     directly off disk, so every hash sent to Postgres corresponds to the real
 *     files on disk — no manual transcription, no possibility of transcription drift)
 *   - SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY
 *   - outbound HTTPS access to Supabase
 *
 * Usage:
 *   npx tsx scripts/cms-import-chapters-runner.ts            # dry run (default, no writes)
 *   npx tsx scripts/cms-import-chapters-runner.ts --apply     # execute the import
 *
 * Defaults to dry-run. The exact `--apply` flag is required to write anything.
 * Refuses to apply unless the freshly-computed plan is EXACTLY: verdict READY,
 * bookAction CREATE, CREATE 25, SKIP 0, UPDATE_AVAILABLE 0, CONFLICT 0, zero
 * source-validation problems, and exactly 25 readable canonical chapters. Calls
 * cms_import_chapters exactly once with one freshly generated batch UUID and
 * never retries automatically on any error.
 */

import { randomUUID } from "crypto"
import { getSupabase } from "../lib/supabase"
import { loadCanonicalChapters } from "../lib/cms/chapter-import-source"
import {
  resolveChapterImportPlan,
  resolveFinalVerdict,
  renderPlanText,
  validateCanonicalSources,
  classifyDivergence,
  sha256,
} from "../lib/cms/chapter-import"
import { readExistingState, toCreatePayload, failOn, StateError } from "../lib/cms/chapter-import-db"

const APPLY = process.argv.includes("--apply")

function fail(message: string): never {
  console.error(`\n✗ ${message}`)
  process.exit(1)
}

async function main() {
  const sb = getSupabase()
  if (!sb) {
    fail(
      "Cannot reach Supabase — SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY are not set (or invalid). " +
        "Set both and re-run. Refusing to proceed without real production access."
    )
  }

  // 1-2. Load + validate the canonical source set directly from the local checkout.
  const loaded = await loadCanonicalChapters()
  const sourceValidation = validateCanonicalSources(loaded)
  console.log(
    `Canonical sources: ${loaded.scanned}/${loaded.expected} MDX files readable, ` +
      `${loaded.unreadable.length} unreadable, ${sourceValidation.problems.length} validation problem(s).`
  )
  if (loaded.expected !== 25 || loaded.scanned !== 25 || sourceValidation.problems.length > 0) {
    for (const p of sourceValidation.problems) console.error(`  - ${p}`)
    for (const u of loaded.unreadable) console.error(`  - unreadable: ${u.sourcePath} (${u.reason})`)
    fail("Canonical source set is not exactly 25 readable chapters with zero problems. Refusing to proceed.")
  }

  // 3-4. Read current production state and regenerate the plan fresh, right now.
  const mirrorSlugs = loaded.sources.map((s) => s.mirrorSlug)
  const existing = await readExistingState(sb, mirrorSlugs)
  const plan = resolveChapterImportPlan(loaded.sources, existing)
  const verdict = resolveFinalVerdict(plan, sourceValidation.problems)
  const planText = renderPlanText(plan, {
    sourcesScanned: loaded.scanned,
    sourcesExpected: loaded.expected,
    sourceProblems: sourceValidation.problems,
  })

  console.log("\n" + planText + "\n")

  // 5. Refuse unless the plan is EXACTLY the approved shape.
  const gateOk =
    verdict === "READY" &&
    plan.bookAction === "CREATE" &&
    plan.bookContentId === null &&
    plan.counts.CREATE === 25 &&
    plan.counts.SKIP === 0 &&
    plan.counts.UPDATE_AVAILABLE === 0 &&
    plan.counts.CONFLICT === 0

  if (!gateOk) {
    fail(
      "Plan is not exactly READY/CREATE:25/SKIP:0/UPDATE_AVAILABLE:0/CONFLICT:0 " +
        `(got verdict=${verdict}, bookAction=${plan.bookAction}, counts=${JSON.stringify(plan.counts)}). Refusing to proceed.`
    )
  }
  console.log("✓ Plan matches the approved shape exactly: READY, CREATE 25, zero SKIP/UPDATE_AVAILABLE/CONFLICT.")

  // 6. Dry-run stops here unless --apply was passed explicitly.
  if (!APPLY) {
    console.log("\nDry run only (no --apply passed). No rows written. Re-run with --apply to execute.")
    return
  }

  console.log("\n--apply passed. Executing exactly one cms_import_chapters call now (no automatic retry on failure)...")

  // 7-8. One batch UUID, one RPC call, using the exact locally-loaded MDX bodies/hashes.
  const batchId = randomUUID()
  const payload = toCreatePayload(loaded.sources, plan, batchId)
  console.log(`Batch ID: ${batchId}`)

  const { data, error } = await sb.rpc("cms_import_chapters", { payload })
  failOn(error, "apply rpc") // 9. no retry — a rejection throws StateError straight to main().catch() below.
  const result = data as { book_id?: string; book_content_id?: string; book_created?: boolean; created?: number }

  console.log("RPC result:", JSON.stringify(result, null, 2))
  if (result.book_created !== true || result.created !== 25) {
    fail(`Unexpected RPC result shape: book_created=${result.book_created}, created=${result.created} (expected true / 25).`)
  }

  // 10. Verify the resulting rows: 1 book, 25 chapters, 25 mirrors, 1 batch row.
  const chaptersRes = await sb.from("cms_chapters").select("id, content_id, chapter_number").eq("book_id", result.book_id as string)
  failOn(chaptersRes.error, "verify: read chapters")
  const chapters = chaptersRes.data ?? []

  const mirrorRes = await sb
    .from("cms_chapter_mirror")
    .select("id, chapter_id, source_path, source_sha256, body_sha256, meta_sha256")
    .in("chapter_id", chapters.map((c) => c.id))
  failOn(mirrorRes.error, "verify: read mirrors")
  const mirrors = mirrorRes.data ?? []

  const batchRes = await sb
    .from("cms_import_batch")
    .select("batch_id, book_id, book_created, created_count")
    .eq("batch_id", batchId)
    .maybeSingle()
  failOn(batchRes.error, "verify: read batch row")

  console.log(
    `\nVerification: book_id=${result.book_id}, chapters=${chapters.length}/25, mirrors=${mirrors.length}/25, ` +
      `batch row present=${!!batchRes.data} (created_count=${batchRes.data?.created_count}).`
  )
  if (chapters.length !== 25 || mirrors.length !== 25 || !batchRes.data || batchRes.data.created_count !== 25) {
    fail("Post-apply verification did not match expectations (25 chapters, 25 mirrors, one batch row with created_count 25).")
  }

  // Cross-check every mirror's stored hashes against the exact local file just imported.
  const bySourcePath = new Map(loaded.sources.map((s) => [s.sourcePath, s]))
  let hashMismatches = 0
  for (const m of mirrors) {
    const src = bySourcePath.get(m.source_path as string)
    if (!src || src.sourceSha256 !== m.source_sha256 || src.bodySha256 !== m.body_sha256 || src.metaSha256 !== m.meta_sha256) {
      hashMismatches++
      console.error(`  ✗ hash mismatch for ${m.source_path}`)
    }
  }
  if (hashMismatches > 0) fail(`${hashMismatches} mirror row(s) did not hash-match their local source file.`)
  console.log("✓ All 25 mirror rows hash-match their local source files exactly.")

  // 11. Divergence verification — freshly imported rows must all be in_sync.
  const contentRes = await sb.from("cms_content").select("id, body").in("id", chapters.map((c) => c.content_id))
  failOn(contentRes.error, "verify: read chapter bodies")
  const bodyByContentId = new Map((contentRes.data ?? []).map((c) => [c.id as string, c.body as string | null]))
  const contentIdByChapterId = new Map(chapters.map((c) => [c.id as string, c.content_id as string]))

  const divergence: Record<string, number> = {}
  for (const m of mirrors) {
    const src = bySourcePath.get(m.source_path as string)!
    const contentId = contentIdByChapterId.get(m.chapter_id as string)
    const currentBodySha = sha256(bodyByContentId.get(contentId ?? "") ?? "")
    const state = classifyDivergence({
      storedSourceSha: m.source_sha256 as string,
      storedMetaSha: m.meta_sha256 as string,
      storedBodySha: m.body_sha256 as string,
      currentSourceSha: src.sourceSha256,
      currentMetaSha: src.metaSha256,
      currentBodySha,
    })
    divergence[state] = (divergence[state] ?? 0) + 1
  }
  console.log("\nDivergence check:", JSON.stringify(divergence))
  if (divergence.in_sync !== 25 || Object.keys(divergence).length !== 1) {
    fail(`Divergence check did not return in_sync:25 exactly (got ${JSON.stringify(divergence)}).`)
  }

  console.log("\n✓ Import complete and fully verified: 1 book, 25 chapters, 25 mirrors, 1 batch row, all in_sync.")
  console.log(`Batch ID for reference (rollback target if ever needed): ${batchId}`)
}

main().catch((err) => {
  if (err instanceof StateError) {
    console.error(`\n✗ ${err.message} — ${JSON.stringify(err.payload)}`)
  } else {
    console.error(err)
  }
  process.exit(1)
})
