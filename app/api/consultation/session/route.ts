import { NextRequest, NextResponse } from "next/server"

import { getSupabase } from "@/lib/supabase"
import { stripe } from "@/lib/stripe-server"
import { rateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit"
import { asAddonType } from "@/lib/addon-types"
import { asFoundation, isCheckoutSessionSettled, resolvePaidReportSummary } from "@/lib/paid-report-session"
import { resumeDeterministicSession } from "@/lib/consultation/session-init"
import {
  readDeterministicConsultationSnapshot,
  readDeterministicStateSlot,
} from "@/lib/consultation/session-envelope"
import { readConsultationSeal } from "@/lib/consultation/seal"
import { readConsultationFinalisation } from "@/lib/consultation/finalisation"

/**
 * Resume a deterministic Consultation — Phase 3C-A.
 *
 * ══ WHAT IT RETURNS, AND WHY NOT MORE ═══════════════════════════════════════
 *
 * Server-sanitised state only: which bank, the customer's own surviving answers,
 * what they have touched, what they deliberately skipped, and where they are.
 *
 * It deliberately does NOT return a question list. The legacy flow hands the
 * client a persisted `DeepQuestion[]` because that array IS its questionnaire;
 * the deterministic flow must not copy that shape, because here the BANK is
 * authoritative and the row only holds answers. A client that received a
 * question list from storage could render a set the server would not accept —
 * which is the whole class of disagreement Phase 3A set out to remove.
 *
 * ══ NOT ACTIVE ═════════════════════════════════════════════════════════════
 *
 * Nothing calls this in Phase 3C-A. Real paid sessions stay legacy and the
 * deterministic client remains preview-only with no persistence attached.
 */

export async function GET(req: NextRequest) {
  const limit = rateLimit(`consultation-session:${getClientIp(req)}`, 60, 10 * 60_000)
  if (!limit.allowed) {
    const { body, init } = rateLimitResponse(limit)
    return NextResponse.json(body, init)
  }

  const sessionId = req.nextUrl.searchParams.get("session_id")?.trim()
  if (!sessionId || sessionId.length < 8 || sessionId.length > 200) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }

  const supabase = getSupabase()
  if (!supabase) return NextResponse.json({ error: "Service unavailable" }, { status: 503 })

  // Entitlement first: an unsettled session has nothing to resume, and reading
  // a row before establishing that would leak whether one exists.
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    if (!isCheckoutSessionSettled(session)) {
      return NextResponse.json({ error: "Payment is not settled" }, { status: 402 })
    }
    const summary = await resolvePaidReportSummary(session, supabase)
    if (!summary) return NextResponse.json({ error: "No assessment found" }, { status: 404 })

    const trustedFoundation = asFoundation(summary.foundationType) ?? "you"
    const trustedLens = asAddonType(summary.selectedAddon)

    const { data, error } = await supabase
      .from("deep_assessments")
      // The seal columns are read so a completed Consultation can be
      // recognised, and a half-written one refused. Migration 48 adds them.
      .select("questions, answers, updated_at, consultation_finalisation, consultation_handoff_id")
      .eq("stripe_session_id", sessionId)
      .maybeSingle()
    if (error) {
      console.error("[consultation-session] read error:", error.message)
      return NextResponse.json({ error: "Could not load your Consultation" }, { status: 503 })
    }
    if (!data) return NextResponse.json({ error: "No assessment found" }, { status: 404 })

    const row = data as {
      questions?: unknown
      answers?: unknown
      updated_at?: string | null
      consultation_finalisation?: unknown
      consultation_handoff_id?: unknown
    }

    /*
     * ══ ORDER IS THE CONTRACT — Phase 3C-C2B ═══════════════════════════════
     *
     * Everything below reads the STORED row and adjudicates the seal BEFORE
     * anything resolves the live question bank. That ordering is not a
     * refactor; it is the fix for a real defect.
     *
     * `resumeDeterministicSession` resolves the bank named by the snapshot and
     * refuses when this build no longer holds it — correct for a Consultation
     * somebody is still answering, and wrong for one that is finished. Calling
     * it first meant a validly sealed, coherent, historically finalised record
     * became unloadable the moment its bank was revised, which contradicts
     * C2A's rule that an existing valid seal is authority for its own handoff.
     *
     * So: parse, check against Stripe, adjudicate the seal — and only then, for
     * a session that is still live, hand over to the canonical resume. Live
     * resume semantics are NOT restated here.
     */

    // An array is the legacy questionnaire, whatever its contents. Deliberately
    // `Array.isArray` rather than the C2B mode classifier: an array that fails
    // `readQuestionSnapshot` is still not this flow's row, and reclassifying it
    // as unreadable would change what a legacy customer gets from this route.
    if (Array.isArray(row.questions)) {
      // Not an error: this customer is simply on the legacy questionnaire.
      return NextResponse.json({ kind: "legacy" as const }, { status: 200 })
    }

    const snapshot = readDeterministicConsultationSnapshot(row.questions)
    if (!snapshot) {
      return NextResponse.json({ error: "This Consultation cannot be resumed" }, { status: 409 })
    }

    // The stored session must still agree with what was paid for. Checked
    // before the seal, as in the finalise route, so a mismatched row cannot
    // hand back a completion either.
    if (snapshot.foundation !== trustedFoundation || snapshot.entitledLens !== trustedLens) {
      return NextResponse.json({ error: "This Consultation cannot be resumed" }, { status: 409 })
    }

    // Only an ABSENT column means "nothing stored yet". A present value that
    // will not parse is refused rather than resumed as an empty Consultation.
    const slot = readDeterministicStateSlot(row.answers)
    if (slot.status === "unreadable") {
      return NextResponse.json({ error: "This Consultation cannot be resumed" }, { status: 409 })
    }
    const stored = slot.state

    /*
     * ── The seal has to agree with the phase — Phase 3C-C2B ──────────────
     *
     * Two contradictions are possible, and both are refusals rather than
     * repairs:
     *
     *   still answering, but sealed   — a frozen record with a live session on
     *                                   top of it. Whatever the customer does
     *                                   next, one of the two is wrong.
     *   finished, but not sealed      — `ready-for-report` with no finalisation
     *                                   is a completion claim with nothing
     *                                   behind it, and serving it would show a
     *                                   customer a completion screen for a
     *                                   record that does not exist.
     *
     * The same shared reader the finalise and mutation routes use, so the three
     * cannot disagree about what "sealed" means.
     */
    const seal = readConsultationSeal(row, stored)

    if (stored.phase === "ready-for-report") {
      /*
       * A finished Consultation. No bank, no resume, no builder.
       *
       * The cursor check is redundant — `readConsultationSeal` already reports
       * `sealed-with-open-cursor` as incoherent — and is stated anyway because
       * the two say different things: the seal reader is about the record's
       * coherence, this is about what a completion payload may describe. The
       * seal check below is the belt; this is the braces.
       */
      if (stored.currentQuestionId !== null || seal.status !== "sealed") {
        console.error(
          `[consultation-session] ready-for-report without a coherent seal: ${sessionId} (${seal.status})`,
        )
        return NextResponse.json({ error: "This Consultation cannot be resumed" }, { status: 409 })
      }

      /*
       * The stored payload is validated, and validated against THIS session's
       * snapshot — not rebuilt.
       *
       * `readConsultationFinalisation` compares identity against the snapshot
       * it is given and never consults the bank registry, which is what makes a
       * historical seal loadable: a seal made under a bank that has since been
       * revised is still the authority for its own handoff, and regenerating it
       * would replace what the customer finished with what their answers would
       * mean today.
       */
      const persisted = readConsultationFinalisation(seal.finalisation, snapshot)
      if (!persisted.ok) {
        console.error(
          `[consultation-session] stored finalisation rejected: ${sessionId} (${persisted.reason})`,
        )
        return NextResponse.json({ error: "This Consultation cannot be resumed" }, { status: 409 })
      }

      /*
       * A completion is its own payload, not a session with the fields emptied.
       *
       * A sealed Consultation has nothing editable in it, so serving the
       * session shape carrying `{}` and `[]` would be a lie in the shape of
       * data — and the honest alternative, the stored answers, is data this
       * route cannot sanitise, because sanitising needs the bank it has
       * deliberately not resolved. So the wire says what this is: finished,
       * which bank it was answered against, and the context it was answered in.
       * Never the finalisation, never the handoff id.
       */
      return NextResponse.json({
        kind: "deterministic-complete" as const,
        // Echoed from the stored state, never minted here. Only the finalise
        // route may put a Consultation into this phase, and a guard asserts no
        // other deterministic route writes the literal — reporting what was
        // found must not be able to drift into setting it.
        phase: stored.phase,
        bankVersion: snapshot.bankVersion,
        context: { foundation: snapshot.foundation, lens: snapshot.entitledLens },
      })
    }

    if (seal.status !== "unsealed") {
      console.error(
        `[consultation-session] unfinished Consultation carries a seal: ${sessionId} (${seal.status})`,
      )
      return NextResponse.json({ error: "This Consultation cannot be resumed" }, { status: 409 })
    }

    /*
     * Still live, so today's bank matters and the canonical resume owns it.
     *
     * It re-parses the state slot this function already parsed. That is
     * deliberate: the parse above decides WHICH adjudication applies, and
     * resume owns rebuilding a live session — including the cursor repair and
     * the answer sanitisation, neither of which belongs in a route.
     */
    const outcome = resumeDeterministicSession({
      persistedQuestions: row.questions,
      persistedAnswers: row.answers,
    })
    if (outcome.status === "legacy_session") {
      return NextResponse.json({ kind: "legacy" as const }, { status: 200 })
    }
    if (outcome.status !== "ok") {
      return NextResponse.json({ error: "This Consultation cannot be resumed" }, { status: 409 })
    }
    const { session: resumed } = outcome

    return NextResponse.json({
      kind: "deterministic" as const,
      bankVersion: resumed.snapshot.bankVersion,
      context: resumed.context,
      candidateAnswers: resumed.state.candidateAnswers,
      touchedQuestionIds: resumed.state.touchedQuestionIds,
      skippedOptionalQuestionIds: resumed.state.skippedOptionalQuestionIds,
      currentQuestionId: resumed.state.currentQuestionId,
      phase: resumed.state.phase,
      // Whether anyone has been here yet, read from the stored state before the
      // cursor was repaired. The repaired cursor cannot answer it: it points at
      // question one for a brand-new session and for one paused there alike, and
      // a client deciding Orientation from the cursor would skip it for someone
      // who has never seen it.
      started: resumed.started,
      updatedAt: row.updated_at ?? null,
    })
  } catch (err) {
    console.error("[consultation-session] failed:", err)
    return NextResponse.json({ error: "Could not load your Consultation" }, { status: 503 })
  }
}
