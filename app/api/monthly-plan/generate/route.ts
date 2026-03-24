import { NextRequest, NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import { getUser } from "@/lib/supabase-server"
import { getSupabase } from "@/lib/supabase"
import { getUserMembershipTier } from "@/lib/membership"

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

/** Returns the first day of the current month as YYYY-MM-DD (UTC). */
function getFirstOfMonth(): string {
  const now = new Date()
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}-01`
}

export async function POST(req: NextRequest) {
  // Auth check
  const user = await getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 })
  }

  // Tier check — Restore+ only
  const tier = await getUserMembershipTier(user.id)
  if (tier !== "restore" && tier !== "transform") {
    return NextResponse.json(
      { error: "Monthly gut plans require a Restore or Transform membership." },
      { status: 403 }
    )
  }

  const adminSupabase = getSupabase()
  if (!adminSupabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 })
  }

  const month = getFirstOfMonth()

  // Deduplication: one plan per calendar month
  const { data: existingPlan } = await adminSupabase
    .from("monthly_gut_plans")
    .select("id, content, month")
    .eq("user_id", user.id)
    .eq("month", month)
    .limit(1)
    .single()

  if (existingPlan) {
    return NextResponse.json({
      content: existingPlan.content as string,
      month: existingPlan.month as string,
    })
  }

  // Fetch last 30 days of analyses
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { data: recentAnalyses } = await adminSupabase
    .from("analyses")
    .select("biotics_score, prebiotic_score, probiotic_score, postbiotic_score, created_at")
    .eq("user_id", user.id)
    .gte("created_at", thirtyDaysAgo.toISOString())
    .order("created_at", { ascending: true })

  // Fetch latest assessment pillar scores from leads
  const { data: latestAssessment } = await adminSupabase
    .from("leads")
    .select("overall_score, sub_scores, created_at")
    .or(`email.eq.${user.email!},user_id.eq.${user.id}`)
    .not("overall_score", "is", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .single()

  // Fetch health goals
  const { data: profileData } = await adminSupabase
    .from("profiles")
    .select("health_goals, name")
    .eq("id", user.id)
    .single()

  const healthGoals = (profileData?.health_goals as string[] | null) ?? []
  const name = (profileData?.name as string | null) ?? null

  // Build analysis summary
  const analysisCount = recentAnalyses?.length ?? 0
  const avgBioticsScore =
    analysisCount > 0
      ? Math.round(
          (recentAnalyses!.reduce((sum, a) => sum + ((a.biotics_score as number | null) ?? 0), 0) /
            analysisCount)
        )
      : null

  const scoresTrend =
    recentAnalyses && recentAnalyses.length > 0
      ? recentAnalyses
          .map(
            (a) =>
              `${new Date(a.created_at as string).toLocaleDateString("en-IE")}: ${a.biotics_score ?? "—"}`
          )
          .join(", ")
      : "No meal analyses in the past 30 days"

  const pillarSummary =
    latestAssessment?.sub_scores
      ? Object.entries(latestAssessment.sub_scores as Record<string, number>)
          .map(([k, v]) => `${k}: ${Math.round(v)}/100`)
          .join(", ")
      : "No pillar data available"

  const goalsText =
    healthGoals.length > 0
      ? healthGoals.join(", ")
      : "No specific health goals set"

  const overallScore = (latestAssessment?.overall_score as number | null) ?? null

  const prompt = `You are the EatoBiotics Monthly Gut Health Plan Generator. Create a personalised, forward-looking monthly gut health plan for a ${tier === "transform" ? "Transform" : "Restore"} member.

Member data:
- Name: ${name ?? "Member"}
- Latest Biotics Assessment Score: ${overallScore ?? "Unknown"}/100
- 5-Pillar Assessment Scores: ${pillarSummary}
- Meal analyses in the past 30 days: ${analysisCount}
- Average Biotics Score from meal analyses: ${avgBioticsScore ?? "Unknown"}/100
- Meal scores over the past 30 days: ${scoresTrend}
- Health goals: ${goalsText}
- Month: ${new Date(month).toLocaleDateString("en-IE", { month: "long", year: "numeric" })}

Write a personalised monthly gut health plan of approximately 400 words. Structure it as flowing paragraphs (no bullet points, no headers):

1. Opening: A brief, warm summary of where their gut health stands based on the data — honest and direct.
2. Key focus areas: Based on their pillar scores and health goals, identify 2–3 specific areas to focus on this month. Explain why each matters for them.
3. Practical actions: Give 3–4 specific, actionable steps they can take this month — food choices, habits, or behaviours. Make them concrete and achievable.
4. Closing: A motivating, forward-looking close that connects this month's plan to their long-term health goals.

Tone: warm, knowledgeable, personal, like a trusted gut health advisor. Use "you" throughout. Under 420 words total.`

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 700,
    messages: [{ role: "user", content: prompt }],
  })

  const content = response.content[0]?.type === "text" ? response.content[0].text : ""
  if (!content) {
    return NextResponse.json({ error: "Failed to generate plan" }, { status: 500 })
  }

  // Save to monthly_gut_plans
  const { error: insertError } = await adminSupabase.from("monthly_gut_plans").insert({
    user_id: user.id,
    content,
    month,
    pillar_scores: latestAssessment?.sub_scores ?? null,
    health_goals: healthGoals.length > 0 ? healthGoals : null,
  })

  if (insertError) {
    console.error("[monthly-plan] Failed to save plan:", insertError.message)
    return NextResponse.json({ error: "Failed to save plan" }, { status: 500 })
  }

  return NextResponse.json({ content, month })
}
