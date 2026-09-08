import { NextRequest, NextResponse } from "next/server"

import { getSupabase } from "@/lib/supabase"
import { stripe } from "@/lib/stripe-server"
import { rateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit"
import { asAddonType } from "@/lib/addon-types"
import { asFoundation, isCheckoutSessionSettled, resolvePaidReportSummary } from "@/lib/paid-report-session"
import { resumeDeterministicSession } from "@/lib/consultation/session-init"
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
    const outcome = resumeDeterministicSession({
      persistedQuestions: row.questions,
      persistedAnswers: row.answers,
    })

    if (outcome.status === "legacy_session") {
      // Not an error: this customer is simply on the legacy questionnaire.
      return NextResponse.json({ kind: "legacy" as const }, { status: 200 })
    }
    if (outcome.status !== "ok") {
      return NextResponse.json({ error: "This Consultation cannot be resumed" }, { status: 409 })
    }

    const { session: resumed } = outcome
    // The stored session must still agree with what was paid for.
    if (
      resumed.snapshot.foundation !== trustedFoundation ||
      resumed.snapshot.entitledLens !== trustedLens
    ) {
      return NextResponse.json({ error: "This Consultation cannot be resumed" }, { status: 409 })
    }

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
    const seal = readConsultationSeal(row, resumed.state)

    if (resumed.state.phase === "ready-for-report") {
      if (seal.status !== "sealed") {
        console.error(
          `[consultation-session] ready-for-report without a coherent seal: ${sessionId} (${seal.status})`,
        )
        return NextResponse.json({ error: "This Consultation cannot be resumed" }, { status: 409 })
      }

      /*
       * The stored payload is validated, and validated against THIS session's
       * snapshot — not rebuilt.
       *
       * Deliberately no bank resolution and no call to the C1 builder: a seal
       * made under a bank that has since been revised is still the authority
       * for its own handoff, and regenerating it would replace what the
       * customer finished with what their answers would mean today.
       */
      const persisted = readConsultationFinalisation(seal.finalisation, resumed.snapshot)
      if (!persisted.ok) {
        console.error(
          `[consultation-session] stored finalisation rejected: ${sessionId} (${persisted.reason})`,
        )
        return NextResponse.json({ error: "This Consultation cannot be resumed" }, { status: 409 })
      }
    } else if (seal.status !== "unsealed") {
      console.error(
        `[consultation-session] unfinished Consultation carries a seal: ${sessionId} (${seal.status})`,
      )
      return NextResponse.json({ error: "This Consultation cannot be resumed" }, { status: 409 })
    }

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
