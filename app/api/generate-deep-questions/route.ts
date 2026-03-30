import Anthropic from "@anthropic-ai/sdk"
import Stripe from "stripe"
import { NextRequest, NextResponse } from "next/server"
import { getSupabase } from "@/lib/supabase"
import {
  FALLBACK_DEEP_QUESTIONS,
  type DeepQuestion,
} from "@/lib/deep-assessment"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
  apiVersion: "2026-02-25.clover",
})

type SubScores = {
  diversity: number
  feeding: number
  adding: number
  consistency: number
  feeling: number
}

type RequestBody = {
  sessionId: string
  tier: "starter" | "full" | "premium"
  overall: number
  subScores: SubScores
  profile: { type: string; tagline: string; description: string }
}

const PILLAR_LABELS: Record<string, string> = {
  diversity: "Plant Diversity",
  feeding: "Feeding (Fibre & Whole Foods)",
  adding: "Live & Fermented Foods",
  consistency: "Consistency",
  feeling: "Feeling (Symptoms & Energy)",
}

const TIER_LABELS: Record<string, string> = {
  starter: "Starter",
  full: "Full",
  premium: "Premium",
}

function getSortedPillars(sub: SubScores): Array<[string, number]> {
  return (Object.entries(sub) as [string, number][]).sort((a, b) => a[1] - b[1])
}

function buildDeepQuestionsPrompt(body: RequestBody): string {
  const { tier, overall, subScores, profile } = body
  const sorted = getSortedPillars(subScores)

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

  const questionCount = tier === "starter" ? 10 : tier === "full" ? 18 : 25

  const distributionBlock =
    tier === "starter"
      ? `[Starter - 10 total]: 4 on ${weakest1Label}, 3 on ${weakest2Label}, 2 lifestyle (sleep, stress, exercise), 1 gut feeling/symptoms`
      : tier === "full"
      ? `[Full - 18 total]: 4 on ${weakest1Label}, 3 on ${weakest2Label}, 2 each on remaining 3 pillars, 3 lifestyle, 2 food environment (cooking habits, meal planning)`
      : `[Premium - 25 total]: 5 on ${weakest1Label}, 4 on ${weakest2Label}, 2 each on remaining 3 pillars, 3 lifestyle, 3 gut diagnostic (symptom frequency, energy patterns, food reactions), 2 motivation/barriers (what has failed before, biggest obstacle)`

  return `You are EatoBiotics — a food system health expert personalising a paid deep-dive assessment.

A user completed our 15-question Food System Assessment:
Overall: ${overall}/100
Profile: "${profile.type}" — "${profile.tagline}"
Plant Diversity: ${subScores.diversity}/100
Feeding (Fibre & Whole Foods): ${subScores.feeding}/100
Live & Fermented Foods: ${subScores.adding}/100
Consistency: ${subScores.consistency}/100
Feeling (Symptoms & Energy): ${subScores.feeling}/100

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
      "pillar": "diversity"|"feeding"|"adding"|"consistency"|"feeling"|"lifestyle",
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

export async function POST(req: NextRequest) {
  let body: RequestBody
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const { sessionId, tier, overall, subScores, profile } = body

  if (!sessionId) {
    return NextResponse.json({ error: "Missing sessionId" }, { status: 400 })
  }
  if (!["starter", "full", "premium"].includes(tier)) {
    return NextResponse.json({ error: "Invalid tier" }, { status: 400 })
  }

  const devMode = !process.env.STRIPE_SECRET_KEY

  // Step 1: Stripe verification (skip in dev mode)
  if (!devMode) {
    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId)
      if (session.payment_status !== "paid") {
        return NextResponse.json({ error: "Payment not confirmed" }, { status: 401 })
      }
    } catch (err) {
      console.error("[generate-deep-questions] Stripe error:", err)
      return NextResponse.json({ error: "Failed to verify payment" }, { status: 401 })
    }
  }

  // Step 2: Check Supabase for idempotency
  const supabase = getSupabase()
  if (supabase) {
    try {
      const { data: existing } = await supabase
        .from("deep_assessments")
        .select("questions, status")
        .eq("stripe_session_id", sessionId)
        .maybeSingle()

      if (
        existing?.questions &&
        ["questions_generated", "in_progress", "analysing", "complete"].includes(
          existing.status ?? ""
        )
      ) {
        return NextResponse.json({ questions: existing.questions })
      }
    } catch (err) {
      console.error("[generate-deep-questions] Supabase idempotency check error:", err)
    }
  }

  // Step 3: Build prompt and call Claude
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn("[generate-deep-questions] ANTHROPIC_API_KEY not set — returning fallback questions")
    return NextResponse.json({ questions: FALLBACK_DEEP_QUESTIONS })
  }

  let questions: DeepQuestion[]

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const maxTokens = tier === "premium" ? 4096 : tier === "full" ? 3072 : 2048

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: maxTokens,
      messages: [{ role: "user", content: buildDeepQuestionsPrompt(body) }],
    })

    const rawText =
      message.content[0].type === "text" ? message.content[0].text : ""

    const cleaned = rawText
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```\s*$/, "")
      .trim()

    const parsed = JSON.parse(cleaned)
    questions = parsed.questions
  } catch (err) {
    console.error("[generate-deep-questions] Claude error:", err)
    return NextResponse.json({ questions: FALLBACK_DEEP_QUESTIONS })
  }

  // Step 4: Upsert to Supabase
  if (supabase) {
    try {
      const { error } = await supabase.from("deep_assessments").upsert(
        {
          stripe_session_id: sessionId,
          tier,
          free_scores: { overall, subScores, profile },
          questions,
          status: "questions_generated",
        },
        { onConflict: "stripe_session_id" }
      )
      if (error) {
        console.error("[generate-deep-questions] Supabase upsert error:", error.message)
      }
    } catch (err) {
      console.error("[generate-deep-questions] Supabase upsert exception:", err)
    }
  }

  return NextResponse.json({ questions })
}
