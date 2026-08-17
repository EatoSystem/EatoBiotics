import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getSupabase } from "@/lib/supabase"
import { rateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit"
import { readQuestionSnapshot } from "@/lib/assessment/question-snapshot"
import { nextUpdatedAt } from "@/lib/assessment/cas-token"

/**
 * Autosave for one answer on a paid deep assessment.
 *
 * ── Why this is a delta, not a snapshot ─────────────────────────────────────
 *
 * The client used to POST its ENTIRE answer map on every keystroke, with no
 * debounce, no retry and no in-flight sequencing
 * (components/assessment/deep/deep-assessment-client.tsx). Two answers given in
 * quick succession put two requests on the wire carrying different maps, and
 * whichever landed last won. If the earlier one landed last — ordinary network
 * reordering, no attacker involved — the newer answer was erased.
 *
 * That is a real loss of a paying customer's work, so the contract is now one
 * changed answer per request. The server merges it into the stored map, which
 * makes out-of-order delivery of two DIFFERENT questions harmless: each request
 * only ever asserts its own field.
 *
 * ── Why the merge still needs a compare-and-set ─────────────────────────────
 *
 * Merging is read-modify-write, so two requests can still interleave: both read
 * the same map, both merge their own field, and the second write drops the
 * first field. The update is therefore guarded on the `updated_at` the read
 * observed, and a writer that loses re-reads and re-applies its single delta.
 *
 * `updated_at` is a sound CAS token here, but by CONVENTION rather than by
 * constraint, and that is worth stating plainly: `deep_assessments` has no
 * triggers (verified against production), so `updated_at` only moves when a
 * writer sets it explicitly. Both writers of `answers` — this route and
 * submit-deep-assessment — do. A future writer that touches `answers` without
 * bumping `updated_at` would silently weaken this guard, which is why the
 * regression suite pins the behaviour rather than trusting the convention.
 *
 * The token also has to actually MOVE on every successful write, which
 * millisecond-precision wall-clock time does not guarantee on its own — see
 * `nextUpdatedAt` in lib/assessment/cas-token.ts.
 *
 * ── What the server cannot fix ──────────────────────────────────────────────
 *
 * Merging makes two saves for DIFFERENT questions order-independent. It does
 * nothing for two saves of the SAME question: whichever lands second wins, and
 * "second" means last network completion, not the latest thing the customer
 * typed. That ordering is owned by the client — one request in flight per
 * question, newest value last — in lib/assessment/answer-autosave.ts.
 *
 * ── Authority ───────────────────────────────────────────────────────────────
 *
 * This route owns exactly one column: `answers`. It cannot create a row, cannot
 * write `status`, and cannot touch tier, scores, questions, report data,
 * delivery fields or entitlement. Access is possession of the high-entropy
 * `stripe_session_id`, which is the same capability model the rest of this flow
 * uses; see the PR for why Stripe verification was not added here.
 */

/** One changed answer. `clear` removes only that answer, never the map. */
const bodySchema = z
  .object({
    sessionId: z.string().trim().min(8).max(200),
    questionId: z.string().trim().min(1).max(100),
    // number | string | string[] — the shape the questionnaire renders. The
    // value is never interpreted, only shape-checked, so nothing here reasons
    // about what an answer means.
    value: z.union([z.number(), z.string().max(5000), z.array(z.string().max(500)).max(50)]).optional(),
    clear: z.literal(true).optional(),
  })
  .refine((b) => b.clear === true || b.value !== undefined, {
    message: "either value or clear is required",
  })

/** Bounded so a contended row cannot spin. */
const SAVE_ATTEMPTS = 3

export async function PATCH(req: NextRequest) {
  // Unauthenticated autosave keyed by an unguessable Stripe session id — rate
  // limit per IP to blunt enumeration and abuse.
  const limit = rateLimit(`save-deep-progress:${getClientIp(req)}`, 60, 10 * 60_000)
  if (!limit.allowed) {
    const { body: rlBody, init } = rateLimitResponse(limit)
    return NextResponse.json(rlBody, init)
  }

  let body: z.infer<typeof bodySchema>
  try {
    body = bodySchema.parse(await req.json())
  } catch {
    // No echo of the payload: it carries a customer's answer.
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const { sessionId, questionId } = body

  const supabase = getSupabase()
  if (!supabase) {
    // Local dev without Supabase: nothing to save to, and saying "ok" would be
    // a lie the client cannot distinguish from a real save.
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 })
  }

  for (let attempt = 0; attempt < SAVE_ATTEMPTS; attempt++) {
    let row: { answers?: unknown; questions?: unknown; updated_at?: string | null } | null
    try {
      const { data, error } = await supabase
        .from("deep_assessments")
        .select("answers, questions, updated_at")
        .eq("stripe_session_id", sessionId)
        .maybeSingle()
      if (error) {
        // A failed read returns no data, which is indistinguishable from "no
        // such row" unless the error is checked. Reporting 404 here would tell
        // a paying customer their assessment does not exist because the
        // database blipped — so a read fault is reported as a read fault.
        console.error("[save-deep-progress] read error:", error.message)
        return NextResponse.json({ error: "Could not save your progress" }, { status: 503 })
      }
      row = (data as typeof row) ?? null
    } catch (err) {
      console.error("[save-deep-progress] read failed:", err)
      return NextResponse.json({ error: "Could not save your progress" }, { status: 503 })
    }

    if (!row) {
      // This route never creates rows. A row exists only for a settled
      // checkout, written by the Stripe webhook or generate-deep-questions, so
      // its absence means there is no paid assessment to save against.
      return NextResponse.json({ error: "No assessment found for this session" }, { status: 404 })
    }

    // Answers are only meaningful against the question set this session was
    // actually given, so the id is checked against the persisted snapshot.
    const snapshot = readQuestionSnapshot(row.questions)
    if (!snapshot) {
      return NextResponse.json({ error: "Questions are not ready yet" }, { status: 409 })
    }
    if (!snapshot.some((q) => q.id === questionId)) {
      // Rejected, not stored. An id outside the snapshot cannot be rendered or
      // read back by report generation, so keeping it would only grow the row.
      return NextResponse.json({ error: "Unknown question" }, { status: 422 })
    }

    const stored = (row.answers ?? {}) as Record<string, unknown>
    const merged = { ...stored }
    if (body.clear) delete merged[questionId]
    else merged[questionId] = body.value

    try {
      // CAS on the `updated_at` this attempt observed. `updated_at` is nullable
      // in the schema, so match on IS NULL when that is what was read — an
      // `.eq()` against null never matches and would loop to exhaustion.
      let q = supabase
        .from("deep_assessments")
        .update({ answers: merged, updated_at: nextUpdatedAt(row.updated_at) })
        .eq("stripe_session_id", sessionId)
      q = row.updated_at == null ? q.is("updated_at", null) : q.eq("updated_at", row.updated_at)

      const { data, error } = await q.select("stripe_session_id")

      if (error) {
        console.error("[save-deep-progress] write failed:", error.message)
        return NextResponse.json({ error: "Could not save your progress" }, { status: 503 })
      }
      if (data && data.length > 0) {
        return NextResponse.json({ ok: true, saved: questionId })
      }
      // Zero rows matched: someone else wrote between our read and our write.
      // Re-read and re-apply this one delta — their field survives, ours lands.
    } catch (err) {
      console.error("[save-deep-progress] write exception:", err)
      return NextResponse.json({ error: "Could not save your progress" }, { status: 503 })
    }
  }

  // Never claim a save that did not happen: the client shows unsaved state and
  // the customer can retry, rather than believing their answer is stored.
  console.error(`[save-deep-progress] could not converge in ${SAVE_ATTEMPTS} attempts`)
  return NextResponse.json({ error: "Could not save your progress" }, { status: 503 })
}
