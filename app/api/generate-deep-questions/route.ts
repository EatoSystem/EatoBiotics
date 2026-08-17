import { anthropic, CLAUDE_MODEL } from "@/lib/anthropic"
import { stripe } from "@/lib/stripe-server"
import {
  getPaidReportSummaryFromSession,
  isCheckoutSessionSettled,
  asAddon,
  type PaidReportHealthSystem,
  type PaidReportSummary,
  type PaidReportTier,
} from "@/lib/paid-report-session"
import { addonQuestionsFor } from "@/lib/assessment/addon-questions"
import { NextRequest, NextResponse } from "next/server"
import { getSupabase } from "@/lib/supabase"
import {
  FALLBACK_DEEP_QUESTIONS,
  type DeepQuestion,
} from "@/lib/deep-assessment"
import { readQuestionSnapshot } from "@/lib/assessment/question-snapshot"
import { PILLAR_LABELS as CORE_PILLAR_LABELS } from "@/lib/pillars"

type SubScores = {
  prebiotics?: number
  probiotics?: number
  postbiotics?: number
  feed?: number
  seed?: number
  heal?: number
  diversity?: number
  feeding?: number
  adding?: number
  consistency?: number
  feeling?: number
}

type RequestBody = {
  sessionId: string
  tier: "personal" | "starter" | "full" | "premium"
  overall: number
  subScores: SubScores
  profile: { type: string; tagline: string; description: string }
}

/**
 * Everything this route is allowed to decide anything with.
 *
 * The request body carries `tier`, `overall`, `subScores` and `profile`, and
 * anyone holding the session id can set them to whatever they like. Those four
 * decide what the customer paid for, how many questions they get, how much
 * model budget is spent on them, and which lens is appended — so all four come
 * from the settled Stripe checkout, and the body contributes only `sessionId`.
 *
 * The scores really are customer-authored: they come from the free assessment.
 * But they were captured into Stripe metadata at checkout, so the settled
 * session is the authoritative copy of that same answer set. There is no
 * remaining field that has to be re-read from the request.
 *
 * This is a distinct type from `RequestBody` on purpose. Nothing spreads the
 * body into it, so there is no composition order in which a request value could
 * win — the shape simply has nowhere to put one.
 */
type TrustedQuestionInput = {
  tier: PaidReportTier
  overall: number
  subScores: SubScores
  profile: { type: string; tagline: string; description: string }
  entitledAddon: PaidReportHealthSystem | null
  foundation: "you" | "family"
}

const PILLAR_LABELS: Record<string, string> = {
  // Current 3 Biotics + Feed/Seed/Heal aliases — from the canonical Food System Core
  ...CORE_PILLAR_LABELS,
  // Legacy keys (backward compat for old stored sub_scores)
  diversity: "Plant Diversity",
  feeding: "Feeding (Fibre & Whole Foods)",
  adding: "Live & Fermented Foods",
  consistency: "Consistency",
  feeling: "Feeling (Symptoms & Energy)",
}

const TIER_LABELS: Record<string, string> = {
  personal: "Personal",
  starter: "Starter",
  full: "Full",
  premium: "Premium",
}

function getBioticScores(sub: SubScores): Record<"prebiotics" | "probiotics" | "postbiotics", number> {
  return {
    prebiotics:
      sub.prebiotics ?? sub.feed ?? Math.round(((sub.diversity ?? 0) + (sub.feeding ?? 0)) / 2),
    probiotics: sub.probiotics ?? sub.seed ?? sub.adding ?? 0,
    postbiotics:
      sub.postbiotics ?? sub.heal ?? Math.round(((sub.consistency ?? 0) + (sub.feeling ?? 0)) / 2),
  }
}

function getSortedPillars(sub: SubScores): Array<[string, number]> {
  return Object.entries(getBioticScores(sub)).sort((a, b) => a[1] - b[1])
}

function buildDeepQuestionsPrompt(trusted: TrustedQuestionInput): string {
  const { tier, overall, subScores, profile } = trusted
  const sorted = getSortedPillars(subScores)
  const effectiveTier = tier === "personal" ? "full" : tier
  const bioticScores = getBioticScores(subScores)

  const weakest1 = sorted[0][0]
  const score1 = sorted[0][1]
  const weakest2 = sorted[1][0]
  const score2 = sorted[1][1]
  const strongest = sorted[sorted.length - 1][0]
  const scoreS = sorted[sorted.length - 1][1]

  const weakest1Label = PILLAR_LABELS[weakest1] ?? weakest1
  const weakest2Label = PILLAR_LABELS[weakest2] ?? weakest2
  const strongestLabel = PILLAR_LABELS[strongest] ?? strongest
  const tierLabel = TIER_LABELS[tier] ?? tier

  const questionCount = effectiveTier === "starter" ? 10 : effectiveTier === "full" ? 18 : 25

  const distributionBlock =
    effectiveTier === "starter"
      ? `[Starter - 10 total]: 4 on ${weakest1Label}, 3 on ${weakest2Label}, 2 lifestyle (sleep, stress, exercise), 1 gut feeling/symptoms`
      : effectiveTier === "full"
      ? `[Full - 18 total]: 4 on ${weakest1Label}, 3 on ${weakest2Label}, 2 each on remaining 3 pillars, 3 lifestyle, 2 food environment (cooking habits, meal planning)`
      : `[Premium - 25 total]: 5 on ${weakest1Label}, 4 on ${weakest2Label}, 2 each on remaining 3 pillars, 3 lifestyle, 3 gut diagnostic (symptom frequency, energy patterns, food reactions), 2 motivation/barriers (what has failed before, biggest obstacle)`

  return `You are EatoBiotics — a food system health expert personalising a paid deep-dive assessment.

A user completed our 15-question Food System Assessment:
Overall: ${overall}/100
Profile: "${profile.type}" — "${profile.tagline}"
Prebiotics: ${bioticScores.prebiotics}/100
Probiotics: ${bioticScores.probiotics}/100
Postbiotics: ${bioticScores.postbiotics}/100

Their two weakest pillars are: ${weakest1Label} (${score1}/100) and ${weakest2Label} (${score2}/100).
Their strongest pillar is: ${strongestLabel} (${scoreS}/100).

They have purchased the ${tierLabel} report. Generate exactly ${questionCount} deep assessment questions.

QUESTION DISTRIBUTION FOR ${tierLabel.toUpperCase()}:
${distributionBlock}

CRITICAL RULES:
- Do NOT repeat questions from the original 15-question assessment
- Probe the WHY behind low scores — go deeper, not wider
- Use a mix of question types: single, multi, slider, textarea, yesno
- For "multi": 4–6 options, at least one "none of the above"
- For "slider": always include min, max, minLabel, maxLabel
- For "textarea": max 2 per full assessment — use for "describe your typical X"
- For "yesno": use when a yes/no split leads to meaningfully different follow-up paths
- eduContext: 1 sentence max, educational (not evaluative)
- IDs: "dq1", "dq2", etc. in order

SECTION STRUCTURE — CRITICAL:
Every question MUST include a "section" field. Distribute questions across these 4 sections naturally based on the user's score profile:
- "symptoms" — how their gut is communicating with them right now (bloating, energy, skin, brain fog, bowel habits, food reactions)
- "history" — events that shaped their microbiome (antibiotics, conditions, stress periods, diet changes, family history)
- "lifestyle" — daily patterns affecting their gut (sleep quality, stress levels, exercise, eating rhythm, meal environment)
- "goals" — what success looks like for them (what they want to change, 3-month vision, biggest obstacle)

Aim for roughly equal distribution across sections. Every section must have at least 2 questions.

Return ONLY valid JSON, no markdown fences:
{
  "questions": [
    {
      "id": "dq1",
      "type": "single"|"multi"|"slider"|"textarea"|"yesno",
      "pillar": "prebiotics"|"probiotics"|"postbiotics"|"lifestyle",
      "section": "symptoms"|"history"|"lifestyle"|"goals",
      "text": "...",
      "eduContext": "...",
      "options": [{"label": "...", "value": "..."}],
      "min": 1, "max": 10, "minLabel": "...", "maxLabel": "...",
      "followUp": {"condition": "yes"|"no", "question": {"id": "...", "type": "...", "pillar": "...", "section": "...", "text": "...", "options": [...], "required": true}},
      "required": true
    }
  ]
}`
}

/**
 * Persistence failed, so there is nothing to return.
 *
 * Deliberately not a degraded 200. The questionnaire only means anything if
 * submit-deep-assessment can read the same set back off the row; handing the
 * client an ephemeral one lets a customer answer 18 questions and then be
 * refused. The client treats any non-ok response as its retry path
 * (components/assessment/deep/deep-assessment-client.tsx), so this surfaces as
 * "please try again" rather than a dead end.
 */
function persistenceFailed(): NextResponse {
  return NextResponse.json(
    { error: "Could not save your questions. Please try again." },
    { status: 503 }
  )
}

/**
 * The trusted input, derived only from the settled Stripe checkout.
 *
 * `null` when no authoritative source exists, which every caller turns into a
 * refusal rather than a fallback to the request body.
 *
 * Deliberately NOT derived from the stored row: an existing `deep_assessments`
 * row may still hold the client-written `tier`/`free_scores` this change is
 * correcting, so trusting it would launder exactly the values being removed.
 * Authority comes from the session that was just validated, every time.
 */
function trustedInputFromSession(summary: PaidReportSummary | null): TrustedQuestionInput | null {
  if (!summary) return null
  return {
    tier: summary.tier,
    overall: summary.overall,
    // `PaidReportSummary.subScores` is a plain Record; the prompt helpers read
    // named pillar keys off it and tolerate absent ones, so narrow rather than
    // assert — an unexpected key set degrades to the documented ?? chain in
    // getBioticScores instead of throwing.
    subScores: summary.subScores as SubScores,
    profile: summary.profile,
    entitledAddon: asAddon(summary.selectedAddon),
    foundation: summary.foundationType === "family" ? "family" : "you",
  }
}

/**
 * The local-development trusted input.
 *
 * With no `STRIPE_SECRET_KEY` there is no session to read, so the body is the
 * only source there is. Named explicitly rather than reached by falling through
 * a `??`, and unreachable in production because `devMode` is
 * `!process.env.STRIPE_SECRET_KEY`.
 */
function trustedInputForDevMode(body: RequestBody): TrustedQuestionInput {
  return {
    tier: body.tier,
    overall: body.overall,
    subScores: body.subScores,
    profile: body.profile,
    entitledAddon: null,
    foundation: "you",
  }
}

/**
 * The two columns this row does not own: `tier` and `free_scores`.
 *
 * Both describe what was purchased, so they are projected from the same trusted
 * input everything else in this route uses — which itself comes only from the
 * settled Stripe checkout. `app/api/stripe/webhook` writes these two columns
 * from that same summary in this same shape, so whichever writer lands first the
 * row says the same thing.
 *
 * There is no body-derived branch here any more. If no trusted input could be
 * established the caller already refused, so this cannot be reached with a
 * value the customer chose.
 */
function ownedAssessmentFields(
  trusted: TrustedQuestionInput
): { tier: string; free_scores: Record<string, unknown> } {
  return {
    tier: trusted.tier,
    free_scores: {
      overall: trusted.overall,
      subScores: trusted.subScores,
      profile: trusted.profile,
      foundationType: trusted.foundation,
      selectedAddon: trusted.entitledAddon,
    },
  }
}

export async function POST(req: NextRequest) {
  let body: RequestBody
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  // `sessionId` is the ONLY field taken from the request body in production.
  // `tier`, `overall`, `subScores` and `profile` are still accepted so existing
  // clients keep working, but nothing below reads them — see TrustedQuestionInput.
  const { sessionId } = body

  if (!sessionId) {
    return NextResponse.json({ error: "Missing sessionId" }, { status: 400 })
  }

  const devMode = !process.env.STRIPE_SECRET_KEY

  // The body's `tier` is only validated where it is actually used: dev mode,
  // which has no session to read it from. In production the tier comes from the
  // settled checkout and is validated by decodePaidReportSummary, so requiring
  // it here would reject a perfectly good request that simply omits it.
  if (devMode && !["personal", "starter", "full", "premium"].includes(body.tier)) {
    return NextResponse.json({ error: "Invalid tier" }, { status: 400 })
  }

  /**
   * Step 1: Stripe verification, and the single point where authority enters
   * this route.
   *
   * Everything downstream — the prompt, the question count, the model budget,
   * the lens, and the persisted columns — reads `trusted`. Nothing reads the
   * body again.
   */
  let trusted: TrustedQuestionInput

  if (devMode) {
    trusted = trustedInputForDevMode(body)
  } else {
    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId)
      // The shared settled check, not `payment_status === "paid"`: Stripe marks
      // a 100%-promo-code checkout `no_payment_required`, and the webhook and
      // submit-deep-assessment both already accept it. Gating differently here
      // 401'd those buyers out of their own questionnaire.
      if (!isCheckoutSessionSettled(session)) {
        return NextResponse.json({ error: "Payment not confirmed" }, { status: 401 })
      }

      const fromSession = trustedInputFromSession(getPaidReportSummaryFromSession(session))
      if (!fromSession) {
        // Settled, but the checkout carries no readable summary. There is no
        // authoritative tier or score set, and the body is not a substitute, so
        // refuse rather than generate a questionnaire off a customer's claim.
        console.error(
          "[generate-deep-questions] Settled session has no decodable summary — refusing to derive question inputs from the request body"
        )
        return persistenceFailed()
      }
      trusted = fromSession
    } catch (err) {
      console.error("[generate-deep-questions] Stripe error:", err)
      return NextResponse.json({ error: "Failed to verify payment" }, { status: 401 })
    }
  }

  /**
   * Core questions + the purchased lens's questions.
   *
   * Appended, never interleaved: the core set is exactly what it was before
   * add-ons existed, which is what keeps a no-add-on questionnaire identical.
   * The lens comes from the settled entitlement via `trusted`, so a body-supplied
   * add-on cannot add questions the customer did not buy.
   */
  const withLensQuestions = (core: DeepQuestion[]): DeepQuestion[] => [
    ...core,
    ...addonQuestionsFor(trusted.entitledAddon, trusted.foundation),
  ]

  /**
   * Step 2: reuse the persisted snapshot, if there is one.
   *
   * The reuse decision keys on the SNAPSHOT and never on the row's `status`.
   * Five statuses reach this row from four files — "in_progress" (the Stripe
   * webhook, and save-deep-progress by default), "questions_generated" (here),
   * "analysing", and "complete" | "partial" (submit-deep-assessment) — plus
   * whatever arbitrary string a caller hands the unauthenticated
   * save-deep-progress PATCH, which writes `status` straight through.
   *
   * None of them means "discard the questions and start over". So a status
   * allowlist can only ever be wrong in one direction: it regenerates over a
   * snapshot the customer may already be part-way through answering. The old
   * four-value list omitted "partial", a status submit-deep-assessment really
   * does write, and was kept honest only by a redirect rule living in
   * lib/report-status.ts — an invariant this route does not own.
   *
   * Regenerating is worse than losing the set, because core ids are positional:
   * a fresh set reuses "dq1", "dq2", … with different text, so answers already
   * saved against those ids re-bind to different questions instead of being
   * dropped. Hence: if a usable snapshot exists, it is returned untouched, with
   * no Claude call and no write.
   */
  const supabase = getSupabase()
  if (supabase) {
    try {
      const { data: existing } = await supabase
        .from("deep_assessments")
        .select("questions")
        .eq("stripe_session_id", sessionId)
        .maybeSingle()

      const snapshot = readQuestionSnapshot(existing?.questions)
      if (snapshot) {
        return NextResponse.json({ questions: snapshot })
      }
    } catch (err) {
      console.error("[generate-deep-questions] Supabase idempotency check error:", err)
    }
  }

  /**
   * Step 3: choose a question set — Claude when it is available, the
   * deterministic bank when it is not.
   *
   * Neither branch returns. Both converge on the single persistence step below,
   * because a questionnaire that was never stored cannot be submitted against:
   * submit-deep-assessment reads this row back and 400s when it is empty, so a
   * customer who answered an unstored set would be stuck. Two early returns
   * here — no API key, and Claude failing — used to do exactly that, turning a
   * transient Claude outage into a paid flow that dead-ends after the work.
   */
  let questions: DeepQuestion[] | null = null

  if (process.env.ANTHROPIC_API_KEY) {
    try {
      // Budget follows the tier that was PAID FOR, not the one requested.
      const effectiveTier = trusted.tier === "personal" ? "full" : trusted.tier
      const maxTokens = effectiveTier === "premium" ? 4096 : effectiveTier === "full" ? 3072 : 2048

      const message = await anthropic.messages.create({
        model: CLAUDE_MODEL,
        max_tokens: maxTokens,
        messages: [{ role: "user", content: buildDeepQuestionsPrompt(trusted) }],
      })

      const rawText =
        message.content[0].type === "text" ? message.content[0].text : ""

      const cleaned = rawText
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```\s*$/, "")
        .trim()

      const parsed = JSON.parse(cleaned)
      // Validated before it can be stored: Step 2 will hand this exact set back
      // on every later request, so an unrenderable response must not be pinned.
      questions = readQuestionSnapshot(withLensQuestions(parsed.questions))
      if (!questions) {
        console.error("[generate-deep-questions] Claude returned an unusable question set")
      }
    } catch (err) {
      console.error("[generate-deep-questions] Claude error:", err)
    }
  } else {
    console.warn("[generate-deep-questions] ANTHROPIC_API_KEY not set — using fallback questions")
  }

  if (!questions) {
    questions = withLensQuestions(FALLBACK_DEEP_QUESTIONS)
  }

  if (!supabase) {
    // In dev mode there is no settled session and no row to bind to anyway;
    // resolveTrustedQuestions reconstructs the deterministic bank at submit
    // time. With Stripe configured this is instead a production
    // misconfiguration: nowhere to persist means nothing safe to return.
    if (devMode) return NextResponse.json({ questions })
    console.error(
      "[generate-deep-questions] Supabase not configured — refusing to return an unpersisted question set"
    )
    return persistenceFailed()
  }

  /**
   * Step 4: install the snapshot with a compare-and-set, never a blind write.
   *
   * `upsert(..., { onConflict: "stripe_session_id" })` was last-write-wins, and
   * that recreated the exact defect this route exists to prevent:
   *
   *   A and B both read no snapshot → A installs set A and returns it → B
   *   installs set B → A's client submits answers against ids now bound to B.
   *
   * Positional ids are what make it harmful: the regenerated set reuses dq1,
   * dq2, … with different text, so those answers RE-BIND rather than being
   * dropped. It is reachable — /assessment/deep calls this route on load while
   * the Stripe webhook that creates the row is still in flight, so two requests
   * can genuinely both find nothing.
   *
   * The fix needs no migration: `stripe_session_id` is NOT NULL + UNIQUE, so
   * a duplicate insert raises 23505 (the same idiom the Stripe webhook uses for
   * its processed-event ledger), and an update guarded by `questions IS NULL`
   * reports through `.select()` whether it actually touched a row. Between them
   * a writer may install ONLY while the row still has no snapshot; whoever
   * loses re-reads and returns the winner's set instead of its own.
   *
   * Claude is not called again on retry — the generated set above is reused.
   */
  const INSTALL_ATTEMPTS = 3

  for (let attempt = 0; attempt < INSTALL_ATTEMPTS; attempt++) {
    let observed: { questions?: unknown } | null
    try {
      const { data } = await supabase
        .from("deep_assessments")
        .select("questions")
        .eq("stripe_session_id", sessionId)
        .maybeSingle()
      observed = (data as { questions?: unknown } | null) ?? null
    } catch (err) {
      // Without a trustworthy read we cannot tell a winner from a loser, and
      // guessing is how a customer ends up answering a discarded set.
      console.error("[generate-deep-questions] Supabase read-before-install error:", err)
      return persistenceFailed()
    }

    // Someone installed while we were generating — theirs is authoritative.
    const winner = readQuestionSnapshot(observed?.questions)
    if (winner) return NextResponse.json({ questions: winner })

    if (observed && observed.questions != null) {
      // Non-null but unrenderable. The guard below can never match it, so
      // there is no bounded path to convergence — and overwriting a value we
      // cannot characterise is the one thing the CAS exists to forbid. Refuse
      // rather than spin. Nothing in this codebase can write such a value: the
      // route validates before storing, and neither the Stripe webhook nor
      // save-deep-progress touches `questions`.
      console.error(
        "[generate-deep-questions] Stored questions are unusable and cannot be replaced safely"
      )
      return persistenceFailed()
    }

    try {
      if (!observed) {
        /**
         * Creating the row — usually because the Stripe webhook has not landed
         * yet. `tier` and `free_scores` are NOT NULL with no default, so they
         * have to be supplied here; the question is only *from where*.
         *
         * From the settled session, never the request body. The webhook writes
         * these two columns from exactly this summary, so building them the
         * same way means whichever writer wins, the row says the same thing.
         * Using the body instead would make a paid row describe whatever the
         * caller claimed to have bought.
         */
        const owned = ownedAssessmentFields(trusted)

        const { error } = await supabase.from("deep_assessments").insert({
          stripe_session_id: sessionId,
          ...owned,
          questions,
          status: "questions_generated",
        })
        // The write succeeded and nothing may overwrite a non-null `questions`,
        // so the row now provably holds exactly this set.
        if (!error) return NextResponse.json({ questions })
        if (error.code !== "23505") {
          console.error("[generate-deep-questions] Supabase insert error:", error.message)
          return persistenceFailed()
        }
        // Lost the insert race — re-read and return whatever they installed.
        continue
      }

      // The row exists (usually created by the Stripe webhook) but carries no
      // snapshot. Update only the columns this route owns: `tier` and
      // `free_scores` came from the request body, whereas the webhook writes
      // them from the settled session, so they are left alone.
      const { data, error } = await supabase
        .from("deep_assessments")
        .update({ questions, status: "questions_generated" })
        .eq("stripe_session_id", sessionId)
        .is("questions", null)
        .select("questions")

      if (error) {
        console.error("[generate-deep-questions] Supabase install error:", error.message)
        return persistenceFailed()
      }
      if (data && data.length > 0) return NextResponse.json({ questions })
      // Zero rows matched: the guard no longer holds because someone installed
      // first. Re-read and return theirs.
    } catch (err) {
      console.error("[generate-deep-questions] Supabase install exception:", err)
      return persistenceFailed()
    }
  }

  console.error(
    `[generate-deep-questions] Could not converge on a stored snapshot in ${INSTALL_ATTEMPTS} attempts`
  )
  return persistenceFailed()
}
