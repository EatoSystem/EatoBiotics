import Anthropic from "@anthropic-ai/sdk"
import Stripe from "stripe"
import { NextRequest, NextResponse } from "next/server"
import { getSupabase } from "@/lib/supabase"
import type { DeepQuestion } from "@/lib/deep-assessment"
import type { DeepReport } from "@/lib/claude-report"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
  apiVersion: "2026-02-25.clover",
})

// ── Types ──────────────────────────────────────────────────────────────────

type SubScores = {
  diversity: number
  feeding: number
  adding: number
  consistency: number
  feeling: number
}

type FreeScores = {
  overall: number
  subScores: SubScores
  profile: { type: string; tagline: string; description: string }
  tier: "starter" | "full" | "premium"
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

function buildDeepAnalysisPrompt(
  freeScores: FreeScores,
  questions: DeepQuestion[],
  answers: Record<string, unknown>
): string {
  const { overall, subScores, profile, tier } = freeScores
  const qaBlock = buildQABlock(questions, answers)

  const tierSchemaInstructions =
    tier === "starter"
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
      : tier === "full"
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
  "specificFoodList": [{"food": "...", "emoji": "...", "whyForThem": "references their specific answers", "howToUse": "..."}, {"food": "...", "emoji": "...", "whyForThem": "...", "howToUse": "..."}, {"food": "...", "emoji": "...", "whyForThem": "...", "howToUse": "..."}, {"food": "...", "emoji": "...", "whyForThem": "...", "howToUse": "..."}, {"food": "...", "emoji": "...", "whyForThem": "...", "howToUse": "..."}],
  "scoreProjection": {
    "low": [conservative target score, e.g. current + 8],
    "high": [optimistic target score, e.g. current + 18],
    "timeline": "[X–Y weeks]",
    "keyDrivers": ["[specific habit change 1]", "[specific habit change 2]", "[specific habit change 3]"]
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
  "specificFoodList": [{"food": "...", "emoji": "...", "whyForThem": "references their specific answers", "howToUse": "..."}, {"food": "...", "emoji": "...", "whyForThem": "...", "howToUse": "..."}, {"food": "...", "emoji": "...", "whyForThem": "...", "howToUse": "..."}, {"food": "...", "emoji": "...", "whyForThem": "...", "howToUse": "..."}, {"food": "...", "emoji": "...", "whyForThem": "...", "howToUse": "..."}],
  "scoreProjection": {
    "low": [conservative target score, e.g. current + 10],
    "high": [optimistic target score, e.g. current + 22],
    "timeline": "[X–Y weeks]",
    "keyDrivers": ["[specific habit change 1]", "[specific habit change 2]", "[specific habit change 3]"]
  },
  "membershipBridge": "[One sentence connecting their top finding to what consistent daily tracking enables]"
}`

  return `You are EatoBiotics — a gut health expert writing a deeply personalised paid report.

FREE ASSESSMENT RESULTS:
Overall score: ${overall}/100
Profile: "${profile.type}"
Tagline: "${profile.tagline}"
Description: "${profile.description}"

Pillar scores:
- Plant Diversity: ${subScores.diversity}/100
- Feeding (Fibre & Whole Foods): ${subScores.feeding}/100
- Live & Fermented Foods: ${subScores.adding}/100
- Consistency: ${subScores.consistency}/100
- Feeling (Symptoms & Energy): ${subScores.feeling}/100

DEEP ASSESSMENT RESPONSES:
${qaBlock}

WRITING RULES:
- Write as if this report could ONLY belong to this exact person
- Reference their specific answers by name: "You mentioned...", "Since you rated your stress at 7...", "Your description of typical lunch suggests..."
- Never use the word "diet" — use "food system" or "way of eating"
- Be specific, not generic — every sentence must be earned by their actual answers
- Warm, intelligent, non-clinical tone
- Short paragraphs (3–4 sentences max each)

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

  const { sessionId, questions: rawQuestions, answers } = body

  if (!sessionId) {
    return NextResponse.json({ error: "Missing sessionId" }, { status: 400 })
  }
  if (!rawQuestions || !answers) {
    return NextResponse.json({ error: "Missing questions or answers" }, { status: 400 })
  }

  const questions = rawQuestions as DeepQuestion[]
  const devMode = !process.env.STRIPE_SECRET_KEY

  // Step 1: Check Supabase idempotency
  const supabase = getSupabase()
  if (supabase) {
    try {
      const { data: existing } = await supabase
        .from("deep_assessments")
        .select("status, pdf_url, report_json")
        .eq("stripe_session_id", sessionId)
        .maybeSingle()

      if (existing?.status === "complete" && existing.pdf_url) {
        return NextResponse.json({ ok: true, pdfUrl: existing.pdf_url })
      }
    } catch (err) {
      console.error("[submit-deep-assessment] Supabase idempotency check error:", err)
    }
  }

  // Step 2: Stripe verification + decode client_reference_id
  let freeScores: FreeScores

  if (devMode) {
    // Dev mode: use mock free scores
    freeScores = {
      overall: 58,
      subScores: {
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
      tier: "full",
    }
  } else {
    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId)
      if (session.payment_status !== "paid") {
        return NextResponse.json({ error: "Payment not confirmed" }, { status: 401 })
      }

      const clientRefId = session.client_reference_id
      if (!clientRefId) {
        return NextResponse.json({ error: "Missing session metadata" }, { status: 400 })
      }

      freeScores = JSON.parse(
        Buffer.from(clientRefId, "base64").toString("utf-8")
      ) as FreeScores
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

      if (sessionRow?.email) {
        const { data: lead } = await supabase
          .from("leads")
          .select("name")
          .eq("email", sessionRow.email)
          .maybeSingle()

        if (lead?.name) {
          leadName = lead.name
        }
      }
    } catch (err) {
      console.error("[submit-deep-assessment] Lead name lookup error:", err)
    }
  }

  // Step 4: Mark as analysing
  if (supabase) {
    try {
      await supabase.from("deep_assessments").upsert(
        {
          stripe_session_id: sessionId,
          tier,
          free_scores: { overall, subScores, profile },
          answers,
          status: "analysing",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "stripe_session_id" }
      )
    } catch (err) {
      console.error("[submit-deep-assessment] Supabase status=analysing upsert error:", err)
    }
  }

  // Step 5: Call Claude for deep analysis
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "Claude not configured — add ANTHROPIC_API_KEY to .env.local" },
      { status: 503 }
    )
  }

  let report: DeepReport
  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const maxTokens = tier === "premium" ? 6144 : tier === "full" ? 4096 : 3072

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: maxTokens,
      messages: [
        {
          role: "user",
          content: buildDeepAnalysisPrompt(freeScores, questions, answers),
        },
      ],
    })

    const rawText =
      message.content[0].type === "text" ? message.content[0].text : ""

    const cleaned = rawText
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```\s*$/, "")
      .trim()

    report = JSON.parse(cleaned) as DeepReport
  } catch (err) {
    console.error("[submit-deep-assessment] Claude error:", err)
    return NextResponse.json({ error: "Report generation failed" }, { status: 500 })
  }

  // Step 6: Save report_json to DB
  if (supabase) {
    try {
      await supabase.from("deep_assessments").upsert(
        {
          stripe_session_id: sessionId,
          report_json: report,
          status: "analysing",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "stripe_session_id" }
      )
    } catch (err) {
      console.error("[submit-deep-assessment] Supabase report_json save error:", err)
    }
  }

  // Step 7: PDF generation
  let pdfBuffer: Buffer | null = null
  try {
    const { generatePDF } = await import("@/lib/pdf/generate-pdf")
    pdfBuffer = await generatePDF({
      tier,
      leadName,
      generatedAt: new Date().toLocaleDateString("en-IE", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      freeScores: { overall, subScores, profile: profile as any },
      report,
    })
  } catch (err) {
    console.error("[submit-deep-assessment] PDF generation error:", err)
    pdfBuffer = null
  }

  // Step 8: Upload PDF to Supabase Storage
  let pdfUrl: string | null = null
  if (pdfBuffer && supabase) {
    try {
      const { error: uploadError } = await supabase.storage
        .from("pdf-reports")
        .upload(`${sessionId}.pdf`, pdfBuffer, {
          contentType: "application/pdf",
          upsert: true,
        })

      if (uploadError) {
        console.error("[submit-deep-assessment] Supabase Storage upload error:", uploadError.message)
      } else {
        const { data: signedData } = await supabase.storage
          .from("pdf-reports")
          .createSignedUrl(`${sessionId}.pdf`, 60 * 60 * 24 * 7)

        pdfUrl = signedData?.signedUrl ?? null
      }
    } catch (err) {
      console.error("[submit-deep-assessment] PDF upload exception:", err)
    }
  }

  // Step 9: Send paid email via Resend
  let emailSentAt: string | null = null
  try {
    const { buildPaidReportEmail } = await import("@/lib/email/paid-report-email")
    const resendKey = process.env.RESEND_API_KEY
    const emailFrom = process.env.EMAIL_FROM ?? "reports@eatobiotics.com"

    // Look up the lead email for sending
    let leadEmail: string | null = null
    if (supabase) {
      const { data: sessionRow } = await supabase
        .from("deep_assessments")
        .select("email")
        .eq("stripe_session_id", sessionId)
        .maybeSingle()
      leadEmail = sessionRow?.email ?? null
    }

    if (resendKey && leadEmail) {
      const { Resend } = await import("resend")
      const resend = new Resend(resendKey)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
          typeof anyReport.topTriggerExplanation === "string"
            ? anyReport.topTriggerExplanation
            : "",
        sessionId,
        pdfUrl: pdfUrl ?? null,
      })

      const ownerEmail = process.env.OWNER_EMAIL
      const { error: emailError } = await resend.emails.send({
        from: `EatoBiotics <${emailFrom}>`,
        to: leadEmail,
        bcc: ownerEmail ? [ownerEmail] : undefined,
        subject,
        html,
      })

      if (emailError) {
        console.error("[submit-deep-assessment] Resend error:", emailError.message)
      } else {
        emailSentAt = new Date().toISOString()
      }
    } else if (!resendKey) {
      console.log("[submit-deep-assessment] RESEND_API_KEY not set — skipping email")
    }
  } catch (err) {
    console.error("[submit-deep-assessment] Email step error:", err)
  }

  // Step 10: Mark complete in Supabase
  if (supabase) {
    try {
      await supabase.from("deep_assessments").upsert(
        {
          stripe_session_id: sessionId,
          status: "complete",
          pdf_url: pdfUrl,
          email_sent_at: emailSentAt,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "stripe_session_id" }
      )
    } catch (err) {
      console.error("[submit-deep-assessment] Supabase complete status upsert error:", err)
    }
  }

  return NextResponse.json({ ok: true, pdfUrl })
}
