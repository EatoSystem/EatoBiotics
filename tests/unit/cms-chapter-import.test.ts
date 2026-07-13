import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { NextRequest } from "next/server"
import { readFileSync } from "fs"
import { join } from "path"
import {
  resolveChapterImportPlan,
  resolveFinalVerdict,
  renderPlanText,
  classifyDivergence,
  validateCanonicalSources,
  resolveRollbackBookAction,
  mirrorSlug,
  type SourceChapter,
  type ExistingState,
  type ExistingChapter,
  type ExistingMirror,
  type SourceReadProblem,
} from "@/lib/cms/chapter-import"

/* Import-plan resolution + the non-empty-production safety requirement
   (docs/cms-chapter-import-spec.md §4.1 + acceptance criteria). The resolver is
   pure, so these fixtures drive it directly with no DB. The route's fail-closed
   gate is covered at the bottom. */

function makeSource(n: number, over: Partial<SourceChapter> = {}): SourceChapter {
  const slug = `chapter-${n}`
  return {
    number: n,
    sourceSlug: slug,
    mirrorSlug: mirrorSlug(slug),
    sourcePath: `content/book/${slug}.mdx`,
    title: `Chapter ${n}`,
    summary: `Summary ${n}`,
    part: "I",
    partTitle: "Part I",
    body: `# Chapter ${n}\n\nBody.`,
    sourcePublished: true,
    publicationTarget: ["website"],
    sourceSha256: `src-${n}`,
    bodySha256: `body-${n}`,
    metaSha256: `meta-${n}`,
    ...over,
  }
}

const sources25 = Array.from({ length: 25 }, (_, i) => makeSource(i + 1))

function emptyState(over: Partial<ExistingState> = {}): ExistingState {
  return { book: null, targetBookChapters: [], mirrors: [], slugOwners: {}, ...over }
}

const targetChapter = (num: number, status: string): ExistingChapter => ({
  chapterId: `ch-${num}`,
  contentId: `cnt-${num}`,
  chapterNumber: num,
  status,
  mirrorSourcePath: null,
})

const syncedMirror = (n: number, over: Partial<ExistingMirror> = {}): ExistingMirror => ({
  sourcePath: `content/book/chapter-${n}.mdx`,
  chapterId: `ch-${n}`,
  sourceSha256: `src-${n}`,
  bodySha256: `body-${n}`,
  metaSha256: `meta-${n}`,
  rolledBack: false,
  ...over,
})

describe("resolveChapterImportPlan — non-empty-production safety fixtures", () => {
  // Fixture 1
  it("1) existing target book with no chapters → reuse book, CREATE 25", () => {
    const plan = resolveChapterImportPlan(sources25, emptyState({ book: { contentId: "bc", bookId: "bk" } }))
    expect(plan.bookAction).toBe("REUSE")
    expect(plan.counts).toEqual({ CREATE: 25, SKIP: 0, UPDATE_AVAILABLE: 0, CONFLICT: 0 })
    expect(plan.verdict).toBe("READY")
  })

  // Fixture 2
  it("2) unrelated manual book with chapters 1–3 → no conflict for the target book", () => {
    // Chapters of a differently-slugged book never enter targetBookChapters.
    const plan = resolveChapterImportPlan(sources25, emptyState({ book: null, targetBookChapters: [] }))
    expect(plan.bookAction).toBe("CREATE")
    expect(plan.counts.CONFLICT).toBe(0)
    expect(plan.counts.CREATE).toBe(25)
    expect(plan.verdict).toBe("READY")
  })

  // Fixture 3
  it("3) existing target book with ACTIVE manual chapters 1–3 → CONFLICT 3, apply blocked", () => {
    const plan = resolveChapterImportPlan(
      sources25,
      emptyState({
        book: { contentId: "bc", bookId: "bk" },
        targetBookChapters: [targetChapter(1, "draft"), targetChapter(2, "draft"), targetChapter(3, "in_review")],
      })
    )
    expect(plan.counts.CONFLICT).toBe(3)
    expect(plan.counts.CREATE).toBe(22)
    expect(plan.verdict).toBe("BLOCKED")
    expect(plan.items.filter((i) => i.action === "CONFLICT").map((i) => i.number)).toEqual([1, 2, 3])
  })

  // Fixture 4
  it("4) ARCHIVED manual chapters 1–3 in the target book → numbers free, no active conflict", () => {
    const plan = resolveChapterImportPlan(
      sources25,
      emptyState({
        book: { contentId: "bc", bookId: "bk" },
        targetBookChapters: [targetChapter(1, "archived"), targetChapter(2, "archived"), targetChapter(3, "archived")],
      })
    )
    expect(plan.counts.CONFLICT).toBe(0)
    expect(plan.counts.CREATE).toBe(25)
    expect(plan.verdict).toBe("READY")
  })

  // Fixture 5
  it("5) global mdx-chapter-1 slug owned by unrelated content → conflict", () => {
    const plan = resolveChapterImportPlan(
      sources25,
      emptyState({
        book: { contentId: "bc", bookId: "bk" },
        slugOwners: { "mdx-chapter-1": { contentId: "foreign", contentType: "article" } },
      })
    )
    expect(plan.counts.CONFLICT).toBe(1)
    expect(plan.items.find((i) => i.number === 1)?.action).toBe("CONFLICT")
    expect(plan.verdict).toBe("BLOCKED")
  })

  // Fixture 6
  it("6) existing valid mirror rows → SKIP when in sync, UPDATE_AVAILABLE when source changed", () => {
    const changedMirror: ExistingMirror = { ...syncedMirror(2), sourceSha256: "OLD-HASH" }
    const plan = resolveChapterImportPlan(
      sources25,
      emptyState({
        book: { contentId: "bc", bookId: "bk" },
        mirrors: [syncedMirror(1), changedMirror],
      })
    )
    expect(plan.items.find((i) => i.number === 1)?.action).toBe("SKIP")
    expect(plan.items.find((i) => i.number === 2)?.action).toBe("UPDATE_AVAILABLE")
    expect(plan.counts).toEqual({ CREATE: 23, SKIP: 1, UPDATE_AVAILABLE: 1, CONFLICT: 0 })
    // Any UPDATE_AVAILABLE blocks ordinary apply, even with creates pending —
    // it requires explicit human review/reconciliation, never a partial import.
    expect(plan.verdict).toBe("BLOCKED")
  })

  // Fixture 7
  it("7) mixed production state → deterministic full plan, no partial assumptions", () => {
    const plan = resolveChapterImportPlan(
      sources25,
      emptyState({
        book: { contentId: "bc", bookId: "bk" },
        targetBookChapters: [targetChapter(2, "draft"), targetChapter(1, "archived")], // 2 active-conflict, 1 archived→free
        mirrors: [syncedMirror(3), { ...syncedMirror(5), sourceSha256: "OLD" }], // 3 SKIP, 5 UPDATE_AVAILABLE
        slugOwners: { "mdx-chapter-4": { contentId: "foreign", contentType: "image" } }, // 4 CONFLICT
      })
    )
    expect(plan.items.find((i) => i.number === 1)?.action).toBe("CREATE")
    expect(plan.items.find((i) => i.number === 2)?.action).toBe("CONFLICT")
    expect(plan.items.find((i) => i.number === 3)?.action).toBe("SKIP")
    expect(plan.items.find((i) => i.number === 4)?.action).toBe("CONFLICT")
    expect(plan.items.find((i) => i.number === 5)?.action).toBe("UPDATE_AVAILABLE")
    expect(plan.counts).toEqual({ CREATE: 21, SKIP: 1, UPDATE_AVAILABLE: 1, CONFLICT: 2 })
    expect(plan.verdict).toBe("BLOCKED") // conflicts AND the pending update both block
    // Deterministic ordering by chapter number.
    expect(plan.items.map((i) => i.number)).toEqual(Array.from({ length: 25 }, (_, i) => i + 1))
  })

  it("idempotency: a fully-synced book is a NOOP with no creates", () => {
    const plan = resolveChapterImportPlan(
      sources25,
      emptyState({
        book: { contentId: "bc", bookId: "bk" },
        mirrors: sources25.map((s) => syncedMirror(s.number)),
      })
    )
    expect(plan.counts).toEqual({ CREATE: 0, SKIP: 25, UPDATE_AVAILABLE: 0, CONFLICT: 0 })
    expect(plan.verdict).toBe("NOOP")
  })
})

describe("classifyDivergence", () => {
  const base = { storedSourceSha: "s", storedMetaSha: "m", storedBodySha: "b" }
  it("in_sync when body, metadata, and CMS body all match", () => {
    expect(classifyDivergence({ ...base, currentSourceSha: "s", currentMetaSha: "m", currentBodySha: "b" })).toBe("in_sync")
  })
  it("source_changed when only the MDX body differs", () => {
    expect(classifyDivergence({ ...base, currentSourceSha: "s2", currentMetaSha: "m", currentBodySha: "b" })).toBe("source_changed")
  })
  it("cms_changed when only the CMS body differs", () => {
    expect(classifyDivergence({ ...base, currentSourceSha: "s", currentMetaSha: "m", currentBodySha: "b2" })).toBe("cms_changed")
  })
  it("both_changed when MDX body and CMS body both differ", () => {
    expect(classifyDivergence({ ...base, currentSourceSha: "s2", currentMetaSha: "m", currentBodySha: "b2" })).toBe("both_changed")
  })
  it("missing_source when the MDX file is gone", () => {
    expect(classifyDivergence({ ...base, currentSourceSha: null, currentMetaSha: null, currentBodySha: "b" })).toBe("missing_source")
  })

  // Review round 4: a metadata-only canonical change (title, description, part,
  // part_title, publication status/targets in lib/chapters.ts) is JUST AS MUCH
  // a "the source changed" event as an MDX body edit — it must never be
  // silently reported as in_sync.
  it("metadata-only change (body unchanged) → source_changed, not in_sync", () => {
    expect(classifyDivergence({ ...base, currentSourceSha: "s", currentMetaSha: "m2", currentBodySha: "b" })).toBe("source_changed")
  })
  it("metadata change plus a CMS body edit → both_changed", () => {
    expect(classifyDivergence({ ...base, currentSourceSha: "s", currentMetaSha: "m2", currentBodySha: "b2" })).toBe("both_changed")
  })
  it("body-only source change (metadata unchanged) → source_changed", () => {
    expect(classifyDivergence({ ...base, currentSourceSha: "s2", currentMetaSha: "m", currentBodySha: "b" })).toBe("source_changed")
  })
  it("unchanged body and metadata, unchanged CMS body → in_sync", () => {
    expect(classifyDivergence({ ...base, currentSourceSha: "s", currentMetaSha: "m", currentBodySha: "b" })).toBe("in_sync")
  })
})

describe("renderPlanText", () => {
  it("dry-run text names no batch id and states no rows written", () => {
    const plan = resolveChapterImportPlan(sources25, emptyState({ book: { contentId: "bc", bookId: "bk" } }))
    const text = renderPlanText(plan, { sourcesScanned: 25, sourcesExpected: 25 })
    expect(text).toContain("[DRY RUN]")
    expect(text).not.toMatch(/batch/i)
    expect(text).toContain("No rows written")
    expect(text).toContain("READY")
  })
})

describe("resolveFinalVerdict + renderPlanText agree — one authoritative verdict (review round 3)", () => {
  it("missing MDX file: plan.verdict READY alone, but final verdict AND plan text are both BLOCKED", () => {
    const sources24 = sources25.filter((s) => s.number !== 7)
    const plan = resolveChapterImportPlan(sources24, emptyState({ book: { contentId: "bc", bookId: "bk" } }))
    // The plan itself has no conflicts/updates and would say READY...
    expect(plan.verdict).toBe("READY")
    const v = validateCanonicalSources({
      sources: sources24,
      unreadable: [{ sourcePath: "content/book/chapter-7.mdx", reason: "file not found" }],
      expected: 25,
    })
    const text = renderPlanText(plan, { sourcesScanned: 24, sourcesExpected: 25, sourceProblems: v.problems })
    // ...but the source set is incomplete, so BOTH the authoritative verdict and
    // the rendered text must say BLOCKED — they can never disagree.
    expect(resolveFinalVerdict(plan, v.problems)).toBe("BLOCKED")
    expect(text).toMatch(/BLOCKED/)
    expect(text).not.toMatch(/READY —/)
    expect(text).toContain("Source validation:")
    expect(text).toContain("chapter-7")
    expect(text).toContain("No rows written")
  })

  it("metadata/source change only (all UPDATE_AVAILABLE): final verdict is BLOCKED, not NOOP", () => {
    const plan = resolveChapterImportPlan(
      sources25,
      emptyState({
        book: { contentId: "bc", bookId: "bk" },
        mirrors: sources25.map((s) => ({ ...syncedMirror(s.number), sourceSha256: "OLD" })),
      })
    )
    expect(plan.counts).toEqual({ CREATE: 0, SKIP: 0, UPDATE_AVAILABLE: 25, CONFLICT: 0 })
    expect(resolveFinalVerdict(plan, [])).toBe("BLOCKED")
    const text = renderPlanText(plan, { sourcesScanned: 25, sourcesExpected: 25 })
    expect(text).toMatch(/BLOCKED/)
    expect(text).not.toMatch(/in sync/i)
    expect(text).toMatch(/UPDATE_AVAILABLE/)
  })

  it("all unchanged mirrors: true NOOP, text says in sync", () => {
    const plan = resolveChapterImportPlan(
      sources25,
      emptyState({ book: { contentId: "bc", bookId: "bk" }, mirrors: sources25.map((s) => syncedMirror(s.number)) })
    )
    expect(plan.counts).toEqual({ CREATE: 0, SKIP: 25, UPDATE_AVAILABLE: 0, CONFLICT: 0 })
    expect(resolveFinalVerdict(plan, [])).toBe("NOOP")
    const text = renderPlanText(plan, { sourcesScanned: 25, sourcesExpected: 25 })
    expect(text).toMatch(/NOOP/)
    expect(text).toMatch(/in sync/i)
  })

  it("mixed CREATE + UPDATE_AVAILABLE: BLOCKED, never a partial create", () => {
    const plan = resolveChapterImportPlan(
      sources25,
      emptyState({
        book: { contentId: "bc", bookId: "bk" },
        mirrors: [{ ...syncedMirror(1), sourceSha256: "OLD" }], // chapter 1 UPDATE_AVAILABLE, 2-25 CREATE
      })
    )
    expect(plan.counts.CREATE).toBe(24)
    expect(plan.counts.UPDATE_AVAILABLE).toBe(1)
    expect(resolveFinalVerdict(plan, [])).toBe("BLOCKED")
  })
})

describe("validateCanonicalSources — incomplete/inconsistent sources block the import", () => {
  const good = { sources: sources25, unreadable: [] as SourceReadProblem[], expected: 25 }

  it("accepts a complete, consistent 25-chapter source set", () => {
    expect(validateCanonicalSources(good).ok).toBe(true)
  })

  it("blocks when any MDX file is unreadable (never silently shrinks the plan)", () => {
    const sources24 = sources25.filter((s) => s.number !== 25)
    const v = validateCanonicalSources({
      sources: sources24,
      unreadable: [{ sourcePath: "content/book/chapter-25.mdx", reason: "file not found" }],
      expected: 25,
    })
    expect(v.ok).toBe(false)
    expect(v.problems.join(" ")).toMatch(/unreadable.*chapter-25/)
    expect(v.problems.join(" ")).toMatch(/missing expected chapter numbers: 25/)
  })

  it("blocks on an unexpected metadata count", () => {
    const v = validateCanonicalSources({ sources: sources25.slice(0, 20), unreadable: [], expected: 20 })
    expect(v.ok).toBe(false)
    expect(v.problems.join(" ")).toMatch(/expected 25 chapter metadata entries, found 20/)
  })

  it("blocks on duplicate chapter numbers", () => {
    const dup = [...sources25, makeSource(5)] // number 5 twice
    expect(validateCanonicalSources({ sources: dup, unreadable: [], expected: 26 }).ok).toBe(false)
  })

  it("blocks on duplicate slugs", () => {
    const dup = [...sources25.filter((s) => s.number !== 6), makeSource(6, { sourceSlug: "chapter-5" })]
    const v = validateCanonicalSources({ sources: dup, unreadable: [], expected: 25 })
    expect(v.ok).toBe(false)
    expect(v.problems.join(" ")).toMatch(/duplicate chapter slugs/)
  })
})

describe("resolveRollbackBookAction — book affected only when this batch created it", () => {
  it("created book, no chapters remain, soft → archive_book", () => {
    expect(resolveRollbackBookAction({ bookCreatedByBatch: true, remainingChapterCount: 0, hard: false })).toBe("archive_book")
  })
  it("created book, no chapters remain, hard → delete_book", () => {
    expect(resolveRollbackBookAction({ bookCreatedByBatch: true, remainingChapterCount: 0, hard: true })).toBe("delete_book")
  })
  it("created book but chapters remain → leave_book", () => {
    expect(resolveRollbackBookAction({ bookCreatedByBatch: true, remainingChapterCount: 3, hard: true })).toBe("leave_book")
  })
  it("reused manual book → leave_book, even when empty", () => {
    expect(resolveRollbackBookAction({ bookCreatedByBatch: false, remainingChapterCount: 0, hard: false })).toBe("leave_book")
    expect(resolveRollbackBookAction({ bookCreatedByBatch: false, remainingChapterCount: 0, hard: true })).toBe("leave_book")
  })
})

describe("resolver — soft-rolled-back mirror re-import behaviour", () => {
  it("treats a rolled-back mirror as CONFLICT (no silent SKIP, no silent re-create)", () => {
    const plan = resolveChapterImportPlan(
      sources25,
      emptyState({
        book: { contentId: "bc", bookId: "bk" },
        mirrors: [syncedMirror(1, { rolledBack: true })],
      })
    )
    const item = plan.items.find((i) => i.number === 1)
    expect(item?.action).toBe("CONFLICT")
    expect(item?.reason).toMatch(/rolled-back/)
    expect(plan.verdict).toBe("BLOCKED")
  })
})

/* ── Route: fail-closed gate + DB-error handling + source blocking ── */
const mockGetSupabase = vi.fn()
const mockLoad = vi.fn()
vi.mock("@/lib/supabase", () => ({ getSupabase: () => mockGetSupabase() }))
vi.mock("@/lib/cms/chapter-import-source", () => ({ loadCanonicalChapters: () => mockLoad() }))

beforeEach(() => {
  vi.resetModules()
  vi.clearAllMocks()
})
afterEach(() => {
  vi.unstubAllEnvs()
})

function req(cookie?: string, body?: unknown): NextRequest {
  const headers: Record<string, string> = {}
  if (cookie) headers.cookie = `admin_auth=${cookie}`
  if (body !== undefined) headers["content-type"] = "application/json"
  return new NextRequest("http://localhost/api/cms/import/chapters", {
    method: "POST",
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
}

describe("/api/cms/import/chapters fail-closed gate", () => {
  it("returns 404 unauthenticated and never touches the database", async () => {
    vi.stubEnv("ADMIN_SESSION_SECRET", "a-test-secret-value")
    const { POST } = await import("@/app/api/cms/import/chapters/route")
    const res = await POST(req(undefined, { mode: "dry_run" }))
    expect(res.status).toBe(404)
    expect(mockGetSupabase).not.toHaveBeenCalled()
  })

  it("fails closed when no admin secret is configured, even with a cookie", async () => {
    vi.stubEnv("ADMIN_SESSION_SECRET", "")
    vi.stubEnv("ADMIN_PASSWORD", "")
    const { POST } = await import("@/app/api/cms/import/chapters/route")
    const res = await POST(req("any-cookie", { mode: "dry_run" }))
    expect(res.status).toBe(404)
    expect(mockGetSupabase).not.toHaveBeenCalled()
  })

  it("a valid admin cookie passes the gate (503 without a database)", async () => {
    vi.stubEnv("ADMIN_SESSION_SECRET", "a-test-secret-value")
    mockGetSupabase.mockReturnValue(null)
    const { adminCookieToken } = await import("@/lib/admin-auth")
    const { POST } = await import("@/app/api/cms/import/chapters/route")
    const res = await POST(req(adminCookieToken() as string, { mode: "dry_run" }))
    expect(res.status).toBe(503)
    expect(mockGetSupabase).toHaveBeenCalled()
  })
})

// Minimal per-table Supabase query-builder mock (thenable + maybeSingle).
function qb(result: { data?: unknown; error?: unknown }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const b: any = {
    select: () => b,
    eq: () => b,
    in: () => b,
    update: () => b,
    maybeSingle: () => Promise.resolve(result),
    then: (f: (v: unknown) => unknown, r?: (e: unknown) => unknown) => Promise.resolve(result).then(f, r),
  }
  return b
}
function clientByTable(map: Record<string, { data?: unknown; error?: unknown }>, rpc?: ReturnType<typeof vi.fn>) {
  return {
    from: (t: string) => qb(map[t] ?? { data: null, error: null }),
    rpc: rpc ?? vi.fn(() => Promise.resolve({ data: null, error: null })),
  }
}

describe("/api/cms/import/chapters — fail closed on DB errors (never assume empty)", () => {
  it("returns migration-required 503 when the mirror schema is absent (42P01)", async () => {
    vi.stubEnv("ADMIN_SESSION_SECRET", "a-test-secret-value")
    mockLoad.mockResolvedValue({ sources: sources25, unreadable: [], expected: 25, scanned: 25 })
    mockGetSupabase.mockReturnValue(
      clientByTable({
        cms_content: { data: null, error: null },
        cms_chapter_mirror: { data: null, error: { code: "42P01", message: 'relation "cms_chapter_mirror" does not exist' } },
      })
    )
    const { adminCookieToken } = await import("@/lib/admin-auth")
    const { POST } = await import("@/app/api/cms/import/chapters/route")
    const res = await POST(req(adminCookieToken() as string, { mode: "dry_run" }))
    expect(res.status).toBe(503)
    const body = await res.json()
    expect(body.migration_required).toBe(true)
  })

  it("returns a fail-closed 503 on any other DB read error (not an empty result)", async () => {
    vi.stubEnv("ADMIN_SESSION_SECRET", "a-test-secret-value")
    mockLoad.mockResolvedValue({ sources: sources25, unreadable: [], expected: 25, scanned: 25 })
    mockGetSupabase.mockReturnValue(
      clientByTable({
        cms_content: { data: null, error: null },
        cms_chapter_mirror: { data: null, error: { code: "XX000", message: "connection reset" } },
      })
    )
    const { adminCookieToken } = await import("@/lib/admin-auth")
    const { POST } = await import("@/app/api/cms/import/chapters/route")
    const res = await POST(req(adminCookieToken() as string, { mode: "dry_run" }))
    expect(res.status).toBe(503)
    const body = await res.json()
    expect(body.migration_required).toBeUndefined()
    expect(String(body.error)).toMatch(/unavailable/i)
  })
})

describe("/api/cms/import/chapters — incomplete canonical sources block the import", () => {
  const partialLoad = {
    sources: sources25.filter((s) => s.number !== 25),
    unreadable: [{ sourcePath: "content/book/chapter-25.mdx", reason: "file not found" }],
    expected: 25,
    scanned: 24,
  }
  const okState = { cms_content: { data: null, error: null }, cms_chapter_mirror: { data: [], error: null } }

  it("dry_run reports BLOCKED in both the JSON verdict AND the rendered plan text (they cannot disagree)", async () => {
    vi.stubEnv("ADMIN_SESSION_SECRET", "a-test-secret-value")
    mockLoad.mockResolvedValue(partialLoad)
    mockGetSupabase.mockReturnValue(clientByTable(okState))
    const { adminCookieToken } = await import("@/lib/admin-auth")
    const { POST } = await import("@/app/api/cms/import/chapters/route")
    const res = await POST(req(adminCookieToken() as string, { mode: "dry_run" }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.verdict).toBe("BLOCKED")
    expect(String(body.sourceProblems.join(" "))).toMatch(/chapter-25/)
    // The human-readable approval artefact must say the same thing as the API.
    expect(body.planText).toMatch(/BLOCKED/)
    expect(body.planText).not.toMatch(/READY —/)
    expect(body.planText).toContain("Source validation:")
    expect(body.planText).toContain("chapter-25")
  })

  it("apply refuses (409) before allocating a batch id or calling the import RPC", async () => {
    vi.stubEnv("ADMIN_SESSION_SECRET", "a-test-secret-value")
    mockLoad.mockResolvedValue(partialLoad)
    const rpc = vi.fn(() => Promise.resolve({ data: null, error: null }))
    mockGetSupabase.mockReturnValue(clientByTable(okState, rpc))
    const { adminCookieToken } = await import("@/lib/admin-auth")
    const { POST } = await import("@/app/api/cms/import/chapters/route")
    const res = await POST(req(adminCookieToken() as string, { mode: "apply" }))
    expect(res.status).toBe(409)
    expect(rpc).not.toHaveBeenCalled()
  })
})

describe("/api/cms/import/chapters — UPDATE_AVAILABLE blocks apply (never a partial/NOOP import)", () => {
  it("apply refuses (409) when every mirror needs review, even though no conflicts exist", async () => {
    vi.stubEnv("ADMIN_SESSION_SECRET", "a-test-secret-value")
    mockLoad.mockResolvedValue({ sources: sources25, unreadable: [], expected: 25, scanned: 25 })
    const changedMirrors = sources25.map((s) => ({
      source_path: s.sourcePath,
      chapter_id: `ch-${s.number}`,
      source_sha256: "OLD",
      body_sha256: `body-${s.number}`,
      meta_sha256: `meta-${s.number}`,
      rolled_back_at: null,
    }))
    const rpc = vi.fn(() => Promise.resolve({ data: null, error: null }))
    mockGetSupabase.mockReturnValue(
      clientByTable({ cms_content: { data: null, error: null }, cms_chapter_mirror: { data: changedMirrors, error: null } }, rpc)
    )
    const { adminCookieToken } = await import("@/lib/admin-auth")
    const { POST } = await import("@/app/api/cms/import/chapters/route")
    const res = await POST(req(adminCookieToken() as string, { mode: "apply" }))
    expect(res.status).toBe(409)
    expect(rpc).not.toHaveBeenCalled()
    const body = await res.json()
    expect(body.verdict).toBe("BLOCKED")
  })
})

/* ── Review round 4: the route's dry run is NEVER the final integrity check —
   cms_import_chapters (Migration 41) re-validates everything under locks
   inside its own transaction and RAISEs (SQLSTATE P0001 — the default code
   for a plain RAISE EXCEPTION) if state changed since the dry run. These
   tests simulate the route reaching a clean READY plan (so it actually calls
   the RPC) and then the RPC rejecting for each race scenario, verifying the
   route surfaces it as a clean 409 (never a false success, never a partial
   result) rather than crashing or reporting ok:true. The RPC's own atomicity
   (zero partial rows on any RAISE EXCEPTION) is a property of running fully
   inside one Postgres transaction with no exception handler — see the
   Migration 41 comments for the full reasoning; it isn't independently
   re-verifiable here without a live Postgres instance. */
describe("/api/cms/import/chapters — RPC-level race rejections (state changed since dry run)", () => {
  const readyState = { cms_content: { data: null, error: null }, cms_chapter_mirror: { data: [], error: null } }

  async function applyWithRpcError(message: string) {
    vi.stubEnv("ADMIN_SESSION_SECRET", "a-test-secret-value")
    mockLoad.mockResolvedValue({ sources: sources25, unreadable: [], expected: 25, scanned: 25 })
    const rpc = vi.fn(() => Promise.resolve({ data: null, error: { code: "P0001", message } }))
    mockGetSupabase.mockReturnValue(clientByTable(readyState, rpc))
    const { adminCookieToken } = await import("@/lib/admin-auth")
    const { POST } = await import("@/app/api/cms/import/chapters/route")
    const res = await POST(req(adminCookieToken() as string, { mode: "apply" }))
    const body = await res.json()
    return { res, body, rpc }
  }

  it("rejects when a manual active chapter has claimed an incoming chapter number", async () => {
    const { res, body, rpc } = await applyWithRpcError(
      "cms_import_chapters: chapter number 1 is no longer free in the target book (race since dry run)"
    )
    expect(rpc).toHaveBeenCalledTimes(1)
    expect(res.status).toBe(409)
    expect(body.race_detected).toBe(true)
    expect(body.ok).not.toBe(true)
    expect(String(body.detail)).toMatch(/chapter number 1 is no longer free/)
  })

  it("rejects when an incoming CMS slug has become occupied", async () => {
    const { res, body, rpc } = await applyWithRpcError(
      "cms_import_chapters: slug mdx-chapter-1 is no longer free (race since dry run)"
    )
    expect(rpc).toHaveBeenCalledTimes(1)
    expect(res.status).toBe(409)
    expect(body.race_detected).toBe(true)
    expect(String(body.detail)).toMatch(/slug mdx-chapter-1 is no longer free/)
  })

  it("rejects when an incoming source path has become occupied by a mirror row", async () => {
    const { res, body, rpc } = await applyWithRpcError(
      "cms_import_chapters: source_path content/book/chapter-1.mdx already has a mirror row (race since dry run)"
    )
    expect(rpc).toHaveBeenCalledTimes(1)
    expect(res.status).toBe(409)
    expect(body.race_detected).toBe(true)
    expect(String(body.detail)).toMatch(/already has a mirror row/)
  })

  it("rejects when the reused target book was changed or removed", async () => {
    const { res, body, rpc } = await applyWithRpcError(
      "cms_import_chapters: target book content 11111111-1111-1111-1111-111111111111 no longer exists (race since dry run)"
    )
    expect(rpc).toHaveBeenCalledTimes(1)
    expect(res.status).toBe(409)
    expect(body.race_detected).toBe(true)
    expect(String(body.detail)).toMatch(/no longer exists/)
  })

  it("rejects a duplicate or malformed payload", async () => {
    const { res, body, rpc } = await applyWithRpcError("cms_import_chapters: payload has duplicate chapter_number values")
    expect(rpc).toHaveBeenCalledTimes(1)
    expect(res.status).toBe(409)
    expect(body.race_detected).toBe(true)
    expect(String(body.detail)).toMatch(/duplicate chapter_number/)
  })

  it("rejects reuse of an already-used batch id", async () => {
    const { res, body, rpc } = await applyWithRpcError(
      "cms_import_chapters: batch_id 22222222-2222-2222-2222-222222222222 has already been used"
    )
    expect(rpc).toHaveBeenCalledTimes(1)
    expect(res.status).toBe(409)
    expect(body.race_detected).toBe(true)
    expect(String(body.detail)).toMatch(/has already been used/)
  })

  it("a rejected apply never records a success audit entry", async () => {
    // recordCmsAudit is only reached AFTER failOn returns without throwing —
    // since failOn always throws for a P0001 error, the audit call for
    // "chapters_imported" is structurally unreachable on this path. This is
    // asserted by construction (failOn throws synchronously before the
    // recordCmsAudit line), verified here by confirming the response is the
    // clean 409 rejection with no batch_id/result echoed back as if it succeeded.
    const { res, body } = await applyWithRpcError("cms_import_chapters: chapter number 3 is no longer free in the target book (race since dry run)")
    expect(res.status).toBe(409)
    expect(body.batch_id).toBeUndefined()
    expect(body.result).toBeUndefined()
  })
})

/* ── Regression guard: cms_import_batch must survive hard rollback ─────────
   A local PostgreSQL verification exercise found that the original DDL —
   book_id/book_content_id as NOT NULL with ON DELETE CASCADE — let a hard
   rollback of a batch-created (now-empty) book cascade-delete the
   cms_import_batch row along with it, silently breaking two guarantees the
   table exists to provide: the batch stays auditable, and its batch_id is
   permanently reserved against reuse. The fix makes both columns nullable
   with ON DELETE SET NULL instead. This is a real Postgres-engine behavior
   (FK cascade semantics) that no amount of mocking can exercise — see the
   corrective PR's local-Postgres re-verification for the actual runtime
   proof (hard rollback ends with cms_import_batch count 1, not 0, with both
   book references NULL). This test is a lightweight DDL-shape regression
   guard only: it parses the migration SQL and asserts the columns stay
   nullable + SET NULL, so a future edit can't silently revert the fix. */
describe("Migration 41 — cms_import_batch DDL (regression guard for hard-rollback provenance)", () => {
  const migrationsSql = readFileSync(join(process.cwd(), "supabase/migrations.sql"), "utf8")
  const tableMatch = migrationsSql.match(/CREATE TABLE IF NOT EXISTS cms_import_batch \(([\s\S]*?)\n\);/)

  it("the cms_import_batch table definition is present in the migration", () => {
    expect(tableMatch).not.toBeNull()
  })

  const body = tableMatch ? tableMatch[1] : ""
  const bookIdLine = body.match(/^\s*book_id\s+uuid.*$/m)?.[0] ?? ""
  const bookContentIdLine = body.match(/^\s*book_content_id\s+uuid.*$/m)?.[0] ?? ""

  it("book_id is nullable (no NOT NULL) and uses ON DELETE SET NULL, never CASCADE", () => {
    expect(bookIdLine).not.toBe("")
    expect(bookIdLine).toMatch(/ON DELETE SET NULL/)
    expect(bookIdLine).not.toMatch(/NOT NULL/)
    expect(bookIdLine).not.toMatch(/ON DELETE CASCADE/)
  })

  it("book_content_id is nullable (no NOT NULL) and uses ON DELETE SET NULL, never CASCADE", () => {
    expect(bookContentIdLine).not.toBe("")
    expect(bookContentIdLine).toMatch(/ON DELETE SET NULL/)
    expect(bookContentIdLine).not.toMatch(/NOT NULL/)
    expect(bookContentIdLine).not.toMatch(/ON DELETE CASCADE/)
  })

  it("retains batch_id, book_created, created_count, created_at, rolled_back_at, rollback_hard", () => {
    for (const col of ["batch_id", "book_created", "created_count", "created_at", "rolled_back_at", "rollback_hard"]) {
      expect(body).toMatch(new RegExp(`\\b${col}\\b`))
    }
  })

  it("batch_id remains the PRIMARY KEY (the permanent reuse-prevention anchor)", () => {
    expect(body).toMatch(/batch_id\s+uuid PRIMARY KEY/)
  })
})
