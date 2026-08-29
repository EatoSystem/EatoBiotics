import { anthropic, CLAUDE_MODEL } from "@/lib/anthropic"
import { stripe } from "@/lib/stripe-server"
import { NextRequest, NextResponse } from "next/server"
import { getSupabase } from "@/lib/supabase"
import type { DeepQuestion } from "@/lib/deep-assessment"
import type { DeepReport } from "@/lib/claude-report"
import {
  resolvePaidReportSummary,
  isCheckoutSessionSettled,
  asAddon,
  type PaidReportFoundation,
  type PaidReportHealthSystem,
} from "@/lib/paid-report-session"
import {
  buildAddonLens,
  reconcileAddonLens,
  mergeGeneratedLens,
  claudeContributedToLens,
} from "@/lib/report/addon-lens"
import { sanitizeLensAnswers, withoutLensAnswers } from "@/lib/assessment/addon-questions"
import { resolveTrustedQuestions, answersForTrustedQuestions } from "@/lib/assessment/trusted-questions"
import { buildFallbackPaidReport } from "@/lib/fallback-paid-report"
import {
  buildFoodSystemReport,
  claudeContributedToFoodSystem,
  ensureFoodSystem,
  mergeGeneratedNarrative,
  resolveReportMode,
} from "@/lib/report/build-food-system-report"
import { parseFoodSystemReport } from "@/lib/report/food-system-report-types"
import {
  withProvenance,
  readProvenance,
  reusedAddonLensSource,
  logGenerationSource,
  sessionTag,
  type GenerationSource,
  type FoodSystemNarrativeSource,
  type AddonLensNarrativeSource,
} from "@/lib/report/generation-provenance"
import { overallReportStatus } from "@/lib/report-status"
// Aliased: the route already has a local `reportError` string (the report_error column value).
import { reportError as alertOwner } from "@/lib/report-error"
import { PDF_BUCKET, pdfObjectPath } from "@/lib/report/pdf-access"
import { isUnverifiedPaidFlowAllowed } from "@/lib/paid-flow-policy"

// ── Types ──────────────────────────────────────────────────────────────────

type SubScores = {
  // 3 Biotics format
  prebiotics?: number
  probiotics?: number
  postbiotics?: number
  // Feed/Seed/Heal aliases from the previous rebuild
  feed?: number
  seed?: number
  heal?: number
  // Legacy format (starter/full/premium)
  diversity?: number
  feeding?: number
  adding?: number
  consistency?: number
  feeling?: number
}

type FreeScores = {
  overall: number
  subScores: SubScores
  profile: { type: string; tagline: string; description: string }
  tier: "personal" | "starter" | "full" | "premium"
  email?: string | null
  foundationType?: PaidReportFoundation | null
  /** Canonical union — never re-declare the add-on list here. */
  selectedAddon?: PaidReportHealthSystem | null
}

type RequestBody = {
  sessionId: string
  questions: unknown[]
  answers: Record<string, unknown>
}

// ── Helpers ────────────────────────────────────────────────────────────────

function formatAnswer(question: DeepQuestion, rawAnswer: unknown): string {
  if (rawAnswer === undefined || rawAnswer === null) return "(no answer)"
  if (question.type === "slider") {
    return `${rawAnswer}/10`
  }
  if (question.type === "multi") {
    if (Array.isArray(rawAnswer)) return rawAnswer.join(", ")
    return String(rawAnswer)
  }
  return String(rawAnswer)
}

function buildQABlock(questions: DeepQuestion[], answers: Record<string, unknown>): string {
  return questions
    .map((q) => {
      const answer = formatAnswer(q, answers[q.id])
      return `Q: ${q.text} (type: ${q.type})\nA: ${answer}`
    })
    .join("\n\n")
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

function buildDeepAnalysisPrompt(
  freeScores: FreeScores,
  questions: DeepQuestion[],
  answers: Record<string, unknown>,
  lens?: { addon: PaidReportHealthSystem; answers: Record<string, unknown> } | null,
): string {
  const { overall, subScores, profile, tier } = freeScores
  const qaBlock = buildQABlock(questions, answers)
  const effectiveTier = tier === "personal" ? "full" : tier
  const bioticScores = getBioticScores(subScores)

  const tierSchemaInstructions =
    effectiveTier === "starter"
      ? `Return this JSON schema:
{
  "opening": "2-3 sentence personalised intro",
  "scoreInterpretation": "what their score means",
  "strengths": ["label1", "label2", "label3"],
  "strengthExplanations": ["explanation1", "explanation2", "explanation3"],
  "opportunities": ["label1", "label2", "label3"],
  "opportunityExplanations": ["explanation1", "explanation2", "explanation3"],
  "sevenDayPlan": [{"day": "Monday", "action": "..."}, {"day": "Tuesday", "action": "..."}, {"day": "Wednesday", "action": "..."}, {"day": "Thursday", "action": "..."}, {"day": "Friday", "action": "..."}, {"day": "Saturday", "action": "..."}, {"day": "Sunday", "action": "..."}],
  "closing": "warm closing paragraph",
  "deepInsight": "2 paragraphs connecting their deep answers to their gut pattern",
  "topTrigger": "the single most impactful finding from their deep answers (1 sentence)",
  "topTriggerExplanation": "why this matters specifically for them (2-3 sentences)",
  "scoreProjection": {
    "low": [conservative target score — realistic with basic habit changes, e.g. current + 8],
    "high": [optimistic target score — achievable with full adherence, e.g. current + 18],
    "timeline": "[X–Y weeks — be specific, e.g. '8–10 weeks']",
    "keyDrivers": ["[specific habit change 1]", "[specific habit change 2]", "[specific habit change 3]"]
  },
  "membershipBridge": "[One sentence connecting their top finding to what consistent daily tracking enables — make it specific to their biggest gap, not generic]"
}`
      : effectiveTier === "full"
      ? `Return this JSON schema:
{
  "opening": "2-3 sentence personalised intro",
  "scoreInterpretation": "what their score means",
  "strengths": ["label1", "label2", "label3"],
  "strengthExplanations": ["explanation1", "explanation2", "explanation3"],
  "opportunities": ["label1", "label2", "label3"],
  "opportunityExplanations": ["explanation1", "explanation2", "explanation3"],
  "sevenDayPlan": [{"day": "Monday", "action": "..."}, {"day": "Tuesday", "action": "..."}, {"day": "Wednesday", "action": "..."}, {"day": "Thursday", "action": "..."}, {"day": "Friday", "action": "..."}, {"day": "Saturday", "action": "..."}, {"day": "Sunday", "action": "..."}],
  "closing": "warm closing paragraph",
  "habitAnalysis": "2-3 paragraphs on cross-pillar patterns",
  "rhythmInsight": "2 paragraphs on consistency + feeling combined",
  "energyBreakdown": "2 paragraphs on daily experience",
  "thirtyDayRoadmap": [{"week": 1, "focus": "...", "theme": "...", "actions": ["...", "...", "..."]}, {"week": 2, "focus": "...", "theme": "...", "actions": ["...", "...", "..."]}, {"week": 3, "focus": "...", "theme": "...", "actions": ["...", "...", "..."]}, {"week": 4, "focus": "...", "theme": "...", "actions": ["...", "...", "..."]}],
  "lifestyleConnection": "2 paragraphs on how their sleep/stress/exercise answers connect to their scores",
  "topTrigger": "the single most impactful finding from their deep answers (1 sentence)",
  "topTriggerExplanation": "why this matters specifically for them (2-3 sentences)",
  "deepInsight": "2 paragraphs connecting their deep answers to their gut pattern",
  "specificFoodList": [{"food": "...", "biotic": "prebiotics|probiotics|postbiotics|synbiotic", "mechanism": "what this food does inside the system, in plain English", "whyForThem": "references their specific answers", "howToUse": "..."}, {"food": "...", "biotic": "prebiotics|probiotics|postbiotics|synbiotic", "mechanism": "what this food does inside the system, in plain English", "whyForThem": "...", "howToUse": "..."}, {"food": "...", "biotic": "prebiotics|probiotics|postbiotics|synbiotic", "mechanism": "what this food does inside the system, in plain English", "whyForThem": "...", "howToUse": "..."}, {"food": "...", "biotic": "prebiotics|probiotics|postbiotics|synbiotic", "mechanism": "what this food does inside the system, in plain English", "whyForThem": "...", "howToUse": "..."}, {"food": "...", "biotic": "prebiotics|probiotics|postbiotics|synbiotic", "mechanism": "what this food does inside the system, in plain English", "whyForThem": "...", "howToUse": "..."}],
  "scoreProjection": {
    "low": [conservative target score, e.g. current + 8],
    "high": [optimistic target score, e.g. current + 18],
    "timeline": "[X–Y weeks]",
    "keyDrivers": ["[specific habit change 1]", "[specific habit change 2]", "[specific habit change 3]"]
  },
  "foodSystem": {
    "systemSnapshot": {"oneLine": "one sentence naming what their answers suggest is working and what to change first", "dominantPattern": "the pattern their answers describe, in one or two sentences", "mainLever": "the single change with most leverage, in one sentence"},
    "educationModules": [{"plainEnglish": "what Prebiotics are, in plain English", "whyItMatters": "why this pathway matters", "whatYourAnswersSuggest": "what THEIR answers suggest about it", "actionBridge": "the one action that follows"}, {"plainEnglish": "same for Probiotics", "whyItMatters": "...", "whatYourAnswersSuggest": "...", "actionBridge": "..."}, {"plainEnglish": "same for Postbiotics", "whyItMatters": "...", "whatYourAnswersSuggest": "...", "actionBridge": "..."}],
    "bodySignalMap": [{"id": "gut-comfort", "explanation": "what their answers suggest is worth watching here, framed as a food-pattern clue and never as a diagnosis"}, {"id": "energy", "explanation": "..."}, {"id": "immune-recovery", "explanation": "..."}],
    "priorityLever": {"title": "short name for the one thing to do first", "whyThisFirst": "why this before anything else, referencing their answers", "firstStep": "the smallest version they could start tomorrow", "whatToNotice": "what they may notice over 2-3 weeks — use 'may notice', never 'will'"},
    "foodTools": [{"food": "...", "biotic": "prebiotics|probiotics|postbiotics|synbiotic", "mechanism": "what it does inside the system, in plain English", "whyForThisCustomer": "why it suits THIS person's answers", "howToUse": "...", "swap": "an alternative if it does not suit them"}],
    "closingMissionPage": {"insideYou": "2-3 sentences on what this report covered inside them", "aroundYou": "2-3 sentences connecting their habits outward to household, community and the wider food system", "nextAction": "one realistic next action inside their account"}
  },
  "membershipBridge": "[One sentence connecting their top finding to what consistent daily tracking enables]"
}`
      : /* premium */ `Return this JSON schema:
{
  "opening": "2-3 sentence personalised intro",
  "scoreInterpretation": "what their score means",
  "strengths": ["label1", "label2", "label3"],
  "strengthExplanations": ["explanation1", "explanation2", "explanation3"],
  "opportunities": ["label1", "label2", "label3"],
  "opportunityExplanations": ["explanation1", "explanation2", "explanation3"],
  "sevenDayPlan": [{"day": "Monday", "action": "..."}, {"day": "Tuesday", "action": "..."}, {"day": "Wednesday", "action": "..."}, {"day": "Thursday", "action": "..."}, {"day": "Friday", "action": "..."}, {"day": "Saturday", "action": "..."}, {"day": "Sunday", "action": "..."}],
  "closing": "warm closing paragraph",
  "habitAnalysis": "2-3 paragraphs on cross-pillar patterns",
  "rhythmInsight": "2 paragraphs on consistency + feeling combined",
  "energyBreakdown": "2 paragraphs on daily experience",
  "thirtyDayRoadmap": [{"week": 1, "focus": "...", "theme": "...", "actions": ["...", "...", "..."]}, {"week": 2, "focus": "...", "theme": "...", "actions": ["...", "...", "..."]}, {"week": 3, "focus": "...", "theme": "...", "actions": ["...", "...", "..."]}, {"week": 4, "focus": "...", "theme": "...", "actions": ["...", "...", "..."]}],
  "priorityMap": {"biggestBlocker": "...", "blockerExplanation": "...", "biggestBuilder": "...", "builderExplanation": "..."},
  "phasedStrategy": [{"phase": "...", "duration": "...", "milestone": "...", "actions": ["...", "...", "..."]}, {"phase": "...", "duration": "...", "milestone": "...", "actions": ["...", "...", "..."]}, {"phase": "...", "duration": "...", "milestone": "...", "actions": ["...", "...", "..."]}],
  "systemInterpretation": "3-4 paragraph deep analysis referencing their deep answers",
  "systemStory": "3-4 sentence personal narrative",
  "lifestyleConnection": "2 paragraphs on how their sleep/stress/exercise answers connect to their scores",
  "gutDiagnosticSummary": "2 paragraphs summarising what their diagnostic answers reveal",
  "symptomPattern": "2 paragraphs cross-referencing symptom answers with pillar scores",
  "topTrigger": "the single most impactful finding from their deep answers (1 sentence)",
  "topTriggerExplanation": "why this matters specifically for them (2-3 sentences)",
  "deepInsight": "2 paragraphs connecting their deep answers to their gut pattern",
  "specificFoodList": [{"food": "...", "biotic": "prebiotics|probiotics|postbiotics|synbiotic", "mechanism": "what this food does inside the system, in plain English", "whyForThem": "references their specific answers", "howToUse": "..."}, {"food": "...", "biotic": "prebiotics|probiotics|postbiotics|synbiotic", "mechanism": "what this food does inside the system, in plain English", "whyForThem": "...", "howToUse": "..."}, {"food": "...", "biotic": "prebiotics|probiotics|postbiotics|synbiotic", "mechanism": "what this food does inside the system, in plain English", "whyForThem": "...", "howToUse": "..."}, {"food": "...", "biotic": "prebiotics|probiotics|postbiotics|synbiotic", "mechanism": "what this food does inside the system, in plain English", "whyForThem": "...", "howToUse": "..."}, {"food": "...", "biotic": "prebiotics|probiotics|postbiotics|synbiotic", "mechanism": "what this food does inside the system, in plain English", "whyForThem": "...", "howToUse": "..."}],
  "scoreProjection": {
    "low": [conservative target score, e.g. current + 10],
    "high": [optimistic target score, e.g. current + 22],
    "timeline": "[X–Y weeks]",
    "keyDrivers": ["[specific habit change 1]", "[specific habit change 2]", "[specific habit change 3]"]
  },
  "foodSystem": {
    "systemSnapshot": {"oneLine": "one sentence naming what their answers suggest is working and what to change first", "dominantPattern": "the pattern their answers describe, in one or two sentences", "mainLever": "the single change with most leverage, in one sentence"},
    "educationModules": [{"plainEnglish": "what Prebiotics are, in plain English", "whyItMatters": "why this pathway matters", "whatYourAnswersSuggest": "what THEIR answers suggest about it", "actionBridge": "the one action that follows"}, {"plainEnglish": "same for Probiotics", "whyItMatters": "...", "whatYourAnswersSuggest": "...", "actionBridge": "..."}, {"plainEnglish": "same for Postbiotics", "whyItMatters": "...", "whatYourAnswersSuggest": "...", "actionBridge": "..."}],
    "bodySignalMap": [{"id": "gut-comfort", "explanation": "what their answers suggest is worth watching here, framed as a food-pattern clue and never as a diagnosis"}, {"id": "energy", "explanation": "..."}, {"id": "immune-recovery", "explanation": "..."}],
    "priorityLever": {"title": "short name for the one thing to do first", "whyThisFirst": "why this before anything else, referencing their answers", "firstStep": "the smallest version they could start tomorrow", "whatToNotice": "what they may notice over 2-3 weeks — use 'may notice', never 'will'"},
    "foodTools": [{"food": "...", "biotic": "prebiotics|probiotics|postbiotics|synbiotic", "mechanism": "what it does inside the system, in plain English", "whyForThisCustomer": "why it suits THIS person's answers", "howToUse": "...", "swap": "an alternative if it does not suit them"}],
    "closingMissionPage": {"insideYou": "2-3 sentences on what this report covered inside them", "aroundYou": "2-3 sentences connecting their habits outward to household, community and the wider food system", "nextAction": "one realistic next action inside their account"}
  },
  "membershipBridge": "[One sentence connecting their top finding to what consistent daily tracking enables]"
}`

  // The lens block. Only the three prose fields are requested: everything else
  // in the chapter is derived and would be overwritten anyway, so asking for it
  // would waste tokens and invite the model to believe it owns those fields.
  const lensBlock = lens
    ? `

THE CUSTOMER ALSO PURCHASED A FOCUSED LENS: ${lens.addon.toUpperCase()}.
Their lens answers:
${Object.entries(lens.answers)
        .map(([k, v]) => `  ${k}: ${Array.isArray(v) ? v.join(", ") : String(v)}`)
        .join("\n") || "  (none answered)"}

Add a "lens" object INSIDE "foodSystem" with exactly these three fields:
{
  "lens": {
    "patternSummary": "2-3 sentences describing what THEIR lens answers show, in 'your answers suggest' language",
    "pathwayConnections": [
      {"pathway": "prebiotics", "connection": "one sentence linking this lens to prebiotics"},
      {"pathway": "probiotics", "connection": "one sentence linking this lens to probiotics"},
      {"pathway": "postbiotics", "connection": "one sentence linking this lens to postbiotics"}
    ],
    "signals": [{"label": "must match a label we supply", "whatToNotice": "one observation prompt"}]
  }
}

RULES FOR THE LENS — these are enforced after you respond, so breaking them only
loses your text:
- Do NOT invent a score for this lens. It has none.
- Do NOT state or imply any measurement. For glucose in particular: this
  questionnaire does not measure blood glucose.
- Do NOT diagnose, or claim that food will change a symptom, mood or condition.
- Use "your answers suggest", "is associated with", "may". Never "you have",
  "this will fix", or a deadline.
- Safety wording, evidence, the priority connection and the actions are fixed by
  us and will replace anything you write for them.`
    : ""

  return `You are EatoBiotics — a food system health expert writing a deeply personalised paid report.

FREE ASSESSMENT RESULTS:
Overall score: ${overall}/100
Profile: "${profile.type}"
Tagline: "${profile.tagline}"
Description: "${profile.description}"

Pillar scores (3 Biotics):
- Prebiotics: ${bioticScores.prebiotics}/100
- Probiotics: ${bioticScores.probiotics}/100
- Postbiotics: ${bioticScores.postbiotics}/100

DEEP ASSESSMENT RESPONSES:
${qaBlock}

WRITING RULES:
- Write as if this report could ONLY belong to this exact person
- Reference their specific answers by name: "You mentioned...", "Since you rated your stress at 7...", "Your description of typical lunch suggests..."
- Never use the word "diet" — use "food system" or "way of eating"
- Be specific, not generic — every sentence must be earned by their actual answers
- Warm, intelligent, non-clinical tone
- Short paragraphs (3–4 sentences max each)
- Never output emoji or any pictographic character, anywhere in the JSON
- For every food, teach before you recommend: "mechanism" says what the food
  does inside the Food System in plain English, and "biotic" names the pathway
  it feeds. Set "biotic" to "synbiotic" only when a food genuinely does both
  (e.g. a live yoghurt eaten with oats)
- Keep health language educational and non-diagnostic: prefer "your answers
  suggest", "may support", "is associated with". Never claim a food treats,
  cures, or directly fixes a condition
- The "foodSystem" block is the educational report: teach the mechanism, then
  say what THEIR answers suggest, and only then recommend. Its scores, pathway
  ranking, colours, closing headline and safety footer are filled in by the
  application — write the prose only, and do not invent numbers
- In "bodySignalMap", keep the given "id" values and write only the
  explanations. These are food-pattern clues, never findings about the body

${lensBlock}

${tierSchemaInstructions}

Return ONLY valid JSON matching this exact schema — no markdown, no extra text.`
}

// ── Route Handler ──────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  let body: RequestBody
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  // `questions` is still ACCEPTED in the body so older clients keep working,
  // but it is deliberately not destructured: nothing in this route may read it.
  // The question set comes from the row this session already wrote — see
  // lib/assessment/trusted-questions.ts for why the body cannot be the source.
  const { sessionId, answers } = body

  if (!sessionId) {
    return NextResponse.json({ error: "Missing sessionId" }, { status: 400 })
  }
  if (!answers) {
    return NextResponse.json({ error: "Missing answers" }, { status: 400 })
  }

  // See lib/paid-flow-policy.ts. Previously `!process.env.STRIPE_SECRET_KEY`,
  // which treated a misconfigured environment as authority to accept mock
  // scores and persist a paid-shaped deep_assessments row.
  const devMode = isUnverifiedPaidFlowAllowed()

  // Step 1: Idempotency. Only short-circuit when the row is FULLY delivered
  // (status === "complete", which is now only set when report + PDF + email all
  // succeeded). For a partially-failed prior run we keep the row so we can reuse
  // the work that did succeed and retry only the failed stages below.
  const supabase = getSupabase()

  // Fail closed without a database.
  //
  // This route fulfils a purchase. Every step after this point either costs
  // money (a Claude call), produces an artefact the customer is told to expect
  // (a PDF), or makes a promise to them (the delivery email) — and none of it is
  // recoverable unless the row exists. Running on without persistence produced
  // the worst possible shape: the buyer is emailed a report the site cannot
  // render, backed by a link that expires in 7 days.
  //
  // `getSupabase()` returns null for a missing URL, a missing service-role key,
  // or a malformed URL (lib/supabase.ts) — a misconfigured production deploy
  // looks exactly like local dev from here, so there is no safe "dev only"
  // carve-out. `send-results-email` already fails closed the same way for the
  // Mind flow; this matches it.
  if (!supabase) {
    console.error("[submit-deep-assessment] Supabase not configured — refusing to fulfil a paid report")
    return NextResponse.json(
      {
        error: "We couldn't start your report just now. Please try again in a moment.",
        code: "report_persistence_unavailable",
      },
      { status: 503 }
    )
  }

  let existingRow: {
    status?: string | null
    report_json?: unknown
    /** The set generate-deep-questions persisted for THIS session. */
    questions?: unknown
    pdf_url?: string | null
    pdf_status?: string | null
    email_status?: string | null
    email_sent_at?: string | null
  } | null = null
  if (supabase) {
    try {
      const { data: existing } = await supabase
        .from("deep_assessments")
        .select("status, pdf_url, report_json, pdf_status, email_status, email_sent_at, questions")
        .eq("stripe_session_id", sessionId)
        .maybeSingle()

      if (existing?.status === "complete" && existing.report_json) {
        return NextResponse.json({ ok: true, pdfUrl: existing.pdf_url ?? null })
      }
      existingRow = existing ?? null
    } catch (err) {
      console.error("[submit-deep-assessment] Supabase idempotency check error:", err)
    }
  }

  // Step 2: Stripe verification + decode canonical checkout metadata
  let freeScores: FreeScores

  if (devMode) {
    // Dev mode: use mock free scores
    freeScores = {
      overall: 58,
      subScores: {
        prebiotics: 62,
        probiotics: 38,
        postbiotics: 67,
        feed: 62,
        seed: 38,
        heal: 67,
        // legacy fields
        diversity: 55,
        feeding: 68,
        adding: 38,
        consistency: 72,
        feeling: 58,
      },
      profile: {
        type: "Emerging Balance",
        tagline: "The building blocks are there.",
        description:
          "You have awareness and some strong habits...",
      },
      tier: "personal",
    }
  } else {
    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId)
      if (!isCheckoutSessionSettled(session)) {
        return NextResponse.json({ error: "Payment not confirmed" }, { status: 401 })
      }

      const summary = await resolvePaidReportSummary(session, supabase)
      if (!summary) {
        return NextResponse.json({ error: "Missing session metadata" }, { status: 400 })
      }

      freeScores = summary as FreeScores
    } catch (err) {
      console.error("[submit-deep-assessment] Stripe verification error:", err)
      return NextResponse.json({ error: "Failed to verify payment" }, { status: 401 })
    }
  }

  const { overall, subScores, profile, tier } = freeScores

  // Step 3: Look up lead name from Supabase
  let leadName = "there"
  if (supabase) {
    try {
      // We don't have email in the request, so we try to find it via the session record
      const { data: sessionRow } = await supabase
        .from("deep_assessments")
        .select("email")
        .eq("stripe_session_id", sessionId)
        .maybeSingle()

      const lookupEmail = sessionRow?.email ?? freeScores.email
      if (lookupEmail) {
        const { data: lead } = await supabase
          .from("leads")
          .select("name")
          .eq("email", lookupEmail)
          .maybeSingle()

        if (lead?.name) {
          leadName = lead.name
        }
      }
    } catch (err) {
      console.error("[submit-deep-assessment] Lead name lookup error:", err)
    }
  }

  // Step 4: Mark as analysing.
  //
  // This write is a precondition, not bookkeeping. Everything after it costs
  // money (a Claude call), produces a PDF object, and emails the customer — and
  // all of that is unrecoverable if no row exists to hang it on: `reportViewState`
  // sends a buyer with no row back into the questionnaire, and the emailed PDF
  // link expires in 7 days. So a failure here stops the request before any of it.
  //
  // An awaited PostgREST call RESOLVES with `{ error }` rather than throwing, so
  // the try/catch alone never saw this — it only caught transport-level throws.
  if (supabase) {
    let intakeWriteError: string | null = null
    try {
      const { error } = await supabase.from("deep_assessments").upsert(
        {
          stripe_session_id: sessionId,
          tier,
          free_scores: {
            overall,
            subScores,
            profile,
            foundationType: freeScores.foundationType ?? null,
            selectedAddon: freeScores.selectedAddon ?? null,
          },
          email: freeScores.email ?? null,
          answers,
          status: "analysing",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "stripe_session_id" }
      )
      if (error) intakeWriteError = error.message
    } catch (err) {
      intakeWriteError = err instanceof Error ? err.message : String(err)
    }

    if (intakeWriteError) {
      // Database text stays in the log line; the customer sees a retryable
      // failure with no internals. The alert carries identifiers and stage only
      // — never answers, scores or report prose.
      console.error("[submit-deep-assessment] intake write failed:", intakeWriteError)
      await alertOwner(
        "submit-deep-assessment-intake-write-failed",
        `session=${sessionId} tier=${tier} stage=analysing generation=not_started`
      )
      return NextResponse.json(
        {
          error: "We couldn't start your report just now. Please try again in a moment.",
          code: "report_persistence_unavailable",
        },
        { status: 503 }
      )
    }
  }

  // Step 5: Produce the report. Reuse a prior run's report_json if present (so a
  // retry doesn't pay for Claude again). If AI generation is unavailable or
  // fails, fall back to a deterministic report so a paid user never loses access
  // — the report always exists, so report_status is effectively always
  // "generated"; report_error records *why* a fallback was used for diagnostics.
  let report: DeepReport
  let reportError: string | null = null
  /**
   * What produced this report, in three parts. Separate from `reportError`,
   * which stays a free-text operational diagnostic: these are validated enums
   * #222 can query. They are inert — nothing downstream branches on them.
   *
   * `generationSource` describes the REQUEST: did a model response arrive and
   * survive validation. The other two describe the CONTENT, one per
   * independently-merged narrative layer, because accepting a response is not
   * the same as shipping its prose — both merges fall back field by field and
   * return the derived base untouched when the model omits the key.
   */
  let generationSource: GenerationSource = "legacy_unknown"
  let foodSystemNarrativeSource: FoodSystemNarrativeSource = "legacy_unknown"
  let addonLensNarrativeSource: AddonLensNarrativeSource = "legacy_unknown"

  const reportMode = resolveReportMode(freeScores)
  const foodSystemInput = { mode: reportMode, subScores, overall, profile }

  // ── Entitlement ───────────────────────────────────────────────────────────
  // Taken from `freeScores`, which is decoded from the SETTLED Stripe session a
  // few steps above — not from the request body. The submitted payload carries
  // only sessionId, questions and answers, so a client cannot claim a lens it
  // did not buy, and re-validating through asAddon means a tampered or
  // unrecognised value becomes null rather than an unrenderable string.
  const entitledAddon = asAddon(freeScores.selectedAddon)
  const isFamilyReport = freeScores.foundationType === "family"
  // Only the answers belonging to THIS lens. A payload stuffed with another
  // lens's ids contributes nothing.
  const lensAnswerSet = sanitizeLensAnswers(entitledAddon, answers)

  /**
   * What the MODEL is allowed to read.
   *
   * `buildQABlock` prints `answers[q.id]` verbatim for every submitted
   * question, so sanitizing only the builder's copy left a second door open: a
   * payload could hand Claude arbitrary text under a real lens id. Every lens
   * id is stripped here — including other add-ons' — and only the validated
   * entitled answers are put back. Core `dq*` answers are unchanged; they are
   * free text by design and the model is meant to read them.
   */
  const promptAnswers = { ...withoutLensAnswers(answers), ...lensAnswerSet }

  /**
   * The question set the SERVER believes was asked.
   *
   * Never the request body. `generate-deep-questions` already persisted the
   * exact set it produced under this same stripe_session_id, so the trusted
   * copy is read back from the row; the lens questions are re-derived from the
   * settled entitlement rather than read back, which makes a wrong-add-on set
   * unrepresentable. See lib/assessment/trusted-questions.ts.
   */
  const trusted = resolveTrustedQuestions({
    persisted: existingRow?.questions,
    entitledAddon,
    foundation: isFamilyReport ? "family" : "you",
    devMode,
  })

  // Refuse ONLY when we are about to generate. A reused report is returned from
  // report_json without ever building a prompt, so legacy rows — persisted long
  // before questions were stored, or stored without them — stay viewable and
  // must not be rejected for lacking a question set.
  //
  // On the generate path, refusing beats producing a paid health report from
  // context we cannot vouch for, and it is recoverable: the client re-runs
  // generate-deep-questions and submits again.
  const willGenerate = !existingRow?.report_json
  if (willGenerate && !trusted.ok) {
    console.error("[submit-deep-assessment] no server-side question set for", sessionId)
    return NextResponse.json(
      {
        error: "Question set unavailable — please reload your assessment and try again.",
        code: "question_set_unavailable",
      },
      { status: 400 },
    )
  }

  // Non-empty on every path that reads it: the guard above returned already if
  // generation was going to happen without a trusted set. The reuse branch
  // never touches these.
  const questions = trusted.ok ? trusted.questions : []
  // Answers narrowed to canonical ids. Both consumers iterate `questions`, so an
  // unknown id is already unreachable; this makes that explicit and testable.
  const trustedAnswers = answersForTrustedQuestions(questions, promptAnswers)

  /** Attach the derived lens to a freshly built report. No-op without one. */
  const withLens = (r: DeepReport): DeepReport =>
    reconcileAddonLens(r, { addon: entitledAddon, answers: lensAnswerSet, isFamily: isFamilyReport })

  if (existingRow?.report_json) {
    // Reports persisted before the educational block existed come back without
    // one, and this path returns them verbatim — so enrich rather than reuse
    // blind. Derived only: no regeneration, so a retry costs nothing extra and
    // the report keeps whatever narrative it already had.
    // Provenance describes the CONTENT, so it is read off the stored report and
    // preserved. Enriching a reused report with a derived food-system block or
    // add-on lens is not generation and must not relabel it; a report written
    // before this shipped honestly reads `legacy_unknown`.
    const stored = readProvenance(existingRow.report_json)
    const storedLensKey = (existingRow.report_json as DeepReport).foodSystem?.lens?.key ?? null

    generationSource = stored.generationSource
    foodSystemNarrativeSource = stored.foodSystemNarrativeSource

    report = reconcileAddonLens(
      ensureFoodSystem(existingRow.report_json as DeepReport, foodSystemInput),
      { addon: entitledAddon, answers: lensAnswerSet, isFamily: isFamilyReport },
    )

    addonLensNarrativeSource = reusedAddonLensSource(
      stored,
      storedLensKey,
      report.foodSystem?.lens?.key ?? null,
    )
  } else if (!process.env.ANTHROPIC_API_KEY) {
    console.warn("[submit-deep-assessment] ANTHROPIC_API_KEY not set; using fallback paid report")
    reportError = "ANTHROPIC_API_KEY not set — used deterministic fallback"
    generationSource = "deterministic_no_api_key"
    foodSystemNarrativeSource = "deterministic"
    addonLensNarrativeSource = entitledAddon ? "deterministic" : "not_applicable"
    report = withLens(
      buildFallbackPaidReport({ tier, overall, subScores, profile, questions, answers: trustedAnswers, mode: reportMode }),
    )
  } else {
    try {
      const effectiveTier = tier === "personal" ? "full" : tier
      const maxTokens = effectiveTier === "premium" ? 6144 : effectiveTier === "full" ? 4096 : 3072

      const message = await anthropic.messages.create({
        model: CLAUDE_MODEL,
        max_tokens: maxTokens,
        messages: [
          {
            role: "user",
            content: buildDeepAnalysisPrompt(
              freeScores,
              questions,
              // Scrubbed and narrowed to canonical ids — never the raw body.
              trustedAnswers,
              entitledAddon ? { addon: entitledAddon, answers: lensAnswerSet } : null,
            ),
          },
        ],
      })

      const rawText =
        message.content[0].type === "text" ? message.content[0].text : ""

      const cleaned = rawText
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```\s*$/, "")
        .trim()

      const parsed: unknown = JSON.parse(cleaned)
      if (!parsed || typeof parsed !== "object") {
        throw new Error("Claude returned non-object JSON")
      }

      // The educational block is DERIVED, not taken from the response: scores,
      // pathway ranking, visual tokens, the closing headline, evidence notes and
      // the safety footer all come from the assessment result, and only prose is
      // overlaid. So a model that omits the block, half-fills it, or invents a
      // score cannot put any of that in front of a customer.
      const derivedBase = buildFoodSystemReport(foodSystemInput)
      // The lens is DERIVED here for the same reason the block around it is:
      // identity, priority connection, actions and safety wording must come
      // from the assessment, not from the response.
      const foodSystemBase: typeof derivedBase = entitledAddon
        ? {
            ...derivedBase,
            lens: buildAddonLens({
              addon: entitledAddon,
              answers: lensAnswerSet,
              foodSystem: derivedBase,
              isFamily: isFamilyReport,
            }),
          }
        : derivedBase

      const generatedFoodSystem = (parsed as { foodSystem?: unknown }).foodSystem
      const foodSystem = mergeGeneratedNarrative(foodSystemBase, generatedFoodSystem)
      if (foodSystemBase.lens) {
        // Prose only — see mergeGeneratedLens for the exact list it may touch.
        foodSystem.lens = mergeGeneratedLens(
          foodSystemBase.lens,
          (generatedFoodSystem as { lens?: unknown } | undefined)?.lens,
        )
      }

      // Validate what we assembled rather than trusting it. This used to be a
      // bare `as DeepReport` cast, so a malformed response was persisted to
      // report_json and rendered unchecked.
      const validFoodSystem = parseFoodSystemReport(foodSystem)
      if (!validFoodSystem) {
        console.warn(
          "[submit-deep-assessment] foodSystem failed validation after merge; using derived base",
        )
        // The gap this provenance marker exists to close: Claude answered, but
        // its content was discarded, and until now the row was indistinguishable
        // from a clean generation. `reportError` also gets the operational
        // message it was always missing here — safe, because nothing reads that
        // column to decide status, access, delivery, alerts or retries.
        reportError = "Claude returned a foodSystem that failed validation — used derived base"
      }
      generationSource = validFoodSystem ? "claude_response_accepted" : "deterministic_validation_failure"

      // What the customer will actually read. On validation failure that is the
      // derived base itself, so the detectors below compare it against itself
      // and correctly report `deterministic` — no special case needed.
      const shipped = validFoodSystem ?? foodSystemBase

      // Accepting a response is not the same as shipping its prose. Both merges
      // fall back field by field, so this asks the only question that matters:
      // did any string the merge is allowed to take end up different from the
      // one this codebase derived?
      foodSystemNarrativeSource = claudeContributedToFoodSystem(foodSystemBase, shipped)
        ? "claude_contributed"
        : "deterministic"

      addonLensNarrativeSource = !shipped.lens
        ? "not_applicable"
        : foodSystemBase.lens && claudeContributedToLens(foodSystemBase.lens, shipped.lens)
        ? "claude_contributed"
        : "deterministic"

      report = {
        ...(parsed as DeepReport),
        foodSystem: shipped,
      }
    } catch (err) {
      console.error("[submit-deep-assessment] Claude error; using fallback paid report:", err)
      reportError = `Claude generation failed — used fallback: ${err instanceof Error ? err.message : String(err)}`
      generationSource = "deterministic_claude_error"
      foodSystemNarrativeSource = "deterministic"
      addonLensNarrativeSource = entitledAddon ? "deterministic" : "not_applicable"
      report = withLens(
      buildFallbackPaidReport({ tier, overall, subScores, profile, questions, answers: trustedAnswers, mode: reportMode }),
    )
    }
  }

  /**
   * Stamp the provenance LAST, after every branch has produced its report.
   *
   * The success path builds its result by spreading Claude's parsed response, so
   * a model that returned a `_meta` of its own would otherwise get to declare
   * its own provenance. Stamping here makes the server the only writer, on every
   * path, including reuse (where the value read off the stored report is
   * re-stamped unchanged so the shape stays uniform).
   */
  report = withProvenance(report, {
    generationSource,
    foodSystemNarrativeSource,
    addonLensNarrativeSource,
  })

  logGenerationSource({
    generationSource,
    foodSystemNarrativeSource,
    addonLensNarrativeSource,
    tier,
    mode: reportMode,
    addon: entitledAddon,
    reuse: Boolean(existingRow?.report_json),
    sessionTag: sessionTag(sessionId),
  })

  // Step 6: Persist report_json (stays "analysing" until delivery is verified).
  //
  // This is the write that decides whether the customer owns anything. Until it
  // lands, `report_json` is null, and `reportViewState(status, hasReport=false)`
  // returns "resume_questionnaire" — a buyer who paid is bounced back into the
  // intake form. Delivering a PDF and an email on top of that produces the worst
  // available outcome: a "your report is ready" email pointing at a link that
  // dies in 7 days, backed by a row the site refuses to render.
  //
  // So delivery is gated on it. On failure the request stops here: no PDF upload,
  // no email, and no ok:true. A retry re-generates (the Claude cost is real but
  // bounded) and re-attempts the write; nothing has been delivered that a retry
  // could duplicate.
  let reportPersisted = false
  if (supabase) {
    let persistError: string | null = null
    try {
      const { error } = await supabase.from("deep_assessments").upsert(
        {
          stripe_session_id: sessionId,
          report_json: report,
          status: "analysing",
          report_status: "generated",
          report_error: reportError,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "stripe_session_id" }
      )
      if (error) persistError = error.message
      else reportPersisted = true
    } catch (err) {
      persistError = err instanceof Error ? err.message : String(err)
    }

    if (!reportPersisted) {
      console.error("[submit-deep-assessment] report_json save failed:", persistError)
      // Stage and provenance enum only — no answers, no report prose, no email.
      await alertOwner(
        "submit-deep-assessment-report-persist-failed",
        `session=${sessionId} tier=${tier} stage=report_json ` +
          `generationSource=${generationSource} delivery=withheld`
      )
      return NextResponse.json(
        {
          error: "Your report was generated but could not be saved. Please try again in a moment.",
          code: "report_persistence_failed",
        },
        { status: 503 }
      )
    }
  }

  // Step 7+8: PDF generation + upload. Reuse a prior run's uploaded PDF if there
  // is one; otherwise generate and upload, recording the precise outcome so a
  // failure is never hidden behind status="complete".
  let pdfUrl: string | null = existingRow?.pdf_url ?? null
  let pdfStatus: "uploaded" | "generated" | "upload_failed" | "failed" | "pending" =
    pdfUrl && existingRow?.pdf_status === "uploaded" ? "uploaded" : "pending"
  let pdfError: string | null = null

  if (pdfStatus !== "uploaded") {
    let pdfBuffer: Buffer | null = null
    try {
      const { generatePDF } = await import("@/lib/pdf/generate-pdf")
      const pdfTier = tier === "personal" ? "full" : tier
      pdfBuffer = await generatePDF({
        tier: pdfTier,
        leadName,
        generatedAt: new Date().toLocaleDateString("en-IE", { day: "numeric", month: "long", year: "numeric" }),
        // subScores is no longer cast: ReportPDFProps now accepts the shapes the
        // assessments actually emit, so this argument is type-checked.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        freeScores: { overall, subScores, profile: profile as any },
        report,
      })
      pdfStatus = "generated"
    } catch (err) {
      console.error("[submit-deep-assessment] PDF generation error:", err)
      pdfStatus = "failed"
      pdfError = err instanceof Error ? err.message : String(err)
    }

    if (pdfBuffer && supabase) {
      try {
        const { error: uploadError } = await supabase.storage
          .from(PDF_BUCKET)
          .upload(pdfObjectPath(sessionId), pdfBuffer, { contentType: "application/pdf", upsert: true })

        if (uploadError) {
          console.error("[submit-deep-assessment] Supabase Storage upload error:", uploadError.message)
          pdfStatus = "upload_failed"
          pdfError = uploadError.message
        } else {
          // Delivery-time convenience link for the email — 7 days. Durable
          // access does not depend on it: the report page mints a fresh URL
          // from the same object path on every authorised view.
          const { data: signedData } = await supabase.storage
            .from(PDF_BUCKET)
            .createSignedUrl(pdfObjectPath(sessionId), 60 * 60 * 24 * 7)
          pdfUrl = signedData?.signedUrl ?? null
          pdfStatus = pdfUrl ? "uploaded" : "upload_failed"
          if (!pdfUrl) pdfError = "Signed URL not returned after upload"
        }
      } catch (err) {
        console.error("[submit-deep-assessment] PDF upload exception:", err)
        pdfStatus = "upload_failed"
        pdfError = err instanceof Error ? err.message : String(err)
      }
    }
  }

  // Step 9: Send the report email. Skip if a prior run already delivered it.
  //
  // `existingRow.email_status` alone is not enough to prevent a duplicate. It is
  // written by the step-10 upsert, which runs AFTER the send — so if that write
  // fails, the row never records the delivery and the next invocation of this
  // route emails the customer a second time.
  //
  // The `email_sends` ledger (Migration 23, already applied) closes that window:
  // it is written immediately after a successful send, before step 10, and its
  // `UNIQUE (email, kind)` constraint makes the record authoritative even if
  // every later write fails. Keyed per checkout session so a buyer who purchases
  // twice still receives both reports.
  const emailLedgerKind = `paid_report:${sessionId}`
  let emailStatus: "sent" | "failed" | "pending" =
    existingRow?.email_status === "sent" ? "sent" : "pending"
  let emailSentAt: string | null = existingRow?.email_sent_at ?? null
  let emailError: string | null = null

  if (emailStatus !== "sent") {
    try {
      const { buildPaidReportEmail } = await import("@/lib/email/paid-report-email")
      const { sendEmail } = await import("@/lib/email/send")
      const resendKey = process.env.RESEND_API_KEY
      const emailFrom = process.env.EMAIL_FROM ?? "reports@eatobiotics.com"

      // Look up the lead email for sending
      let leadEmail: string | null = freeScores.email ?? null
      if (supabase) {
        const { data: sessionRow } = await supabase
          .from("deep_assessments")
          .select("email")
          .eq("stripe_session_id", sessionId)
          .maybeSingle()
        leadEmail = sessionRow?.email ?? leadEmail
      }

      // Durable "already delivered?" check. Survives a failed step-10 write,
      // which `existingRow.email_status` does not.
      let alreadyDelivered = false
      if (leadEmail) {
        const { data: ledgerRow, error: ledgerReadError } = await supabase
          .from("email_sends")
          .select("id")
          .eq("email", leadEmail)
          .eq("kind", emailLedgerKind)
          .maybeSingle()

        if (ledgerReadError) {
          // Unreadable ledger means we cannot prove this is a first send. Not
          // sending is the recoverable failure (the report is already durable
          // and viewable on-site, and the next run retries); sending blind risks
          // a duplicate we can never take back.
          console.error("[submit-deep-assessment] email ledger read failed:", ledgerReadError.message)
          emailStatus = "failed"
          emailError = "Delivery ledger unavailable — send skipped to avoid a duplicate"
        } else if (ledgerRow) {
          alreadyDelivered = true
          emailStatus = "sent"
        }
      }

      if (alreadyDelivered || emailStatus === "failed") {
        // Nothing to send: either a prior run already delivered this session's
        // report, or the ledger could not be read.
      } else if (resendKey && leadEmail) {
        const anyReport = report as unknown as Record<string, unknown>
        const { subject, html } = buildPaidReportEmail({
          name: leadName,
          tier,
          overall,
          profileType: profile.type,
          tagline: profile.tagline,
          profileDescription: profile.description,
          subScores,
          topTrigger: typeof anyReport.topTrigger === "string" ? anyReport.topTrigger : "",
          topTriggerExplanation:
            typeof anyReport.topTriggerExplanation === "string" ? anyReport.topTriggerExplanation : "",
          sessionId,
          pdfUrl: pdfUrl ?? null,
          // The settled-session entitlement, already narrowed by asAddon. Never
          // the request body, never anything the model returned.
          selectedAddon: entitledAddon,
        })

        const ownerEmail = process.env.OWNER_EMAIL
        // Transactional (the user paid for this) — bypasses the marketing opt-out.
        const sent = await sendEmail({
          from: `EatoBiotics <${emailFrom}>`,
          to: leadEmail,
          bcc: ownerEmail ? [ownerEmail] : undefined,
          subject,
          html,
          skipOptOutCheck: true,
        })

        if (!sent.ok) {
          console.error("[submit-deep-assessment] report email send failed:", sent.error)
          emailStatus = "failed"
          emailError = sent.error ?? "send returned not-ok"
        } else {
          emailStatus = "sent"
          emailSentAt = new Date().toISOString()

          // Record the delivery NOW, not in step 10. This is the write that
          // makes "already emailed" durable: if the step-10 status upsert fails,
          // this row still exists and the next invocation skips the send.
          const { error: ledgerWriteError } = await supabase
            .from("email_sends")
            .insert({ email: leadEmail, kind: emailLedgerKind })

          if (ledgerWriteError) {
            // The customer HAS their email; only the record of it failed. Say so
            // rather than silently leaving a duplicate-send window open — the
            // delivery stands, so emailStatus is not downgraded.
            console.error(
              "[submit-deep-assessment] email ledger write failed:",
              ledgerWriteError.message,
            )
            await alertOwner(
              "submit-deep-assessment-email-ledger-write-failed",
              `session=${sessionId} tier=${tier} stage=email_sends delivered=true ` +
                `risk=duplicate_on_retry`
            )
          }
        }
      } else if (!resendKey) {
        console.log("[submit-deep-assessment] RESEND_API_KEY not set — skipping email")
        // leave emailStatus = "pending"
      } else if (!leadEmail) {
        emailError = "No recipient email on file"
      }
    } catch (err) {
      console.error("[submit-deep-assessment] Email step error:", err)
      emailStatus = "failed"
      emailError = err instanceof Error ? err.message : String(err)
    }
  }

  // Step 10: Finalise. The overall status is "complete" ONLY when the report,
  // PDF, and email all succeeded — otherwise it stays "partial" so the failure
  // is visible in the DB and a re-run retries just the failed stages.
  // `reportOk` is derived from the verified write, not asserted. A report object
  // existing in memory was never the question — whether the buyer can reach it
  // is. There is no "no database" fallback here any more: the route fails closed
  // at the top, so reaching this line means persistence was available and the
  // step-6 write was confirmed.
  const overall_status = overallReportStatus({
    reportOk: reportPersisted,
    pdfOk: pdfStatus === "uploaded",
    emailOk: emailStatus === "sent",
  })

  // Whether the row now actually says what `overall_status` says. Bookkeeping
  // can fail on its own, and when it does the durable row still carries the
  // step-6 state ("analysing") — the customer keeps full access to a persisted
  // report, but the response must not claim a status that was never written.
  let statusPersisted = false
  if (supabase) {
    let statusWriteError: string | null = null
    try {
      const { error } = await supabase.from("deep_assessments").upsert(
        {
          stripe_session_id: sessionId,
          status: overall_status,
          pdf_url: pdfUrl,
          pdf_status: pdfStatus,
          pdf_error: pdfError,
          email_status: emailStatus,
          email_error: emailError,
          email_sent_at: emailSentAt,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "stripe_session_id" }
      )
      if (error) statusWriteError = error.message
      else statusPersisted = true
    } catch (err) {
      statusWriteError = err instanceof Error ? err.message : String(err)
    }

    if (!statusPersisted) {
      console.error("[submit-deep-assessment] final status upsert failed:", statusWriteError)
    }
  }

  // A partial delivery must never be silent: alert the owner (alertOwner logs
  // always, emails in production, throttles itself, and never throws). Only the
  // session id and stage statuses are included — no answers, report content, or
  // customer email.
  // A silent failure here used to be possible in both directions: a "complete"
  // run whose status write failed alerted nobody, and the response said the row
  // had been updated. Both are covered now.
  if (overall_status !== "complete" || !statusPersisted) {
    await alertOwner(
      "submit-deep-assessment-partial",
      `session=${sessionId} tier=${tier} status=${overall_status} ` +
        `statusPersisted=${statusPersisted} ` +
        `pdf=${pdfStatus} email=${emailStatus} ` +
        `pdfError=${(pdfError ?? "none").slice(0, 300)} emailError=${(emailError ?? "none").slice(0, 300)}`
    )
  }

  // The report is persisted (step 6 gated on it), so the buyer has durable
  // access via the on-site view and a freshly-minted PDF link — hence ok:true
  // even when delivery stages failed. `status` reports what the row actually
  // says: if the final write failed, the durable value is still step 6's
  // "analysing", which renders as "view_delivery_pending" rather than a
  // redirect. Claiming `overall_status` there would be describing a write that
  // did not happen.
  return NextResponse.json({
    ok: true,
    pdfUrl,
    status: statusPersisted ? overall_status : "analysing",
    statusPersisted,
  })
}
