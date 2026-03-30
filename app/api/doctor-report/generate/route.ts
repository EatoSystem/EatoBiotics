import { NextRequest, NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import { getUser } from "@/lib/supabase-server"
import { getSupabase } from "@/lib/supabase"
import { getUserMembershipTier } from "@/lib/membership"

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  void req
  const user = await getUser()
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 })
  const tier = await getUserMembershipTier(user.id)
  if (tier !== "transform") return NextResponse.json({ error: "Transform required" }, { status: 403 })

  const adminSupabase = getSupabase()
  if (!adminSupabase) return NextResponse.json({ error: "DB unavailable" }, { status: 500 })

  const { data: profile } = await adminSupabase
    .from("profiles")
    .select("name, health_goals")
    .eq("id", user.id)
    .single()

  const { data: latestAssessment } = await adminSupabase
    .from("leads")
    .select("overall_score, sub_scores, created_at")
    .or(`email.eq.${user.email!},user_id.eq.${user.id}`)
    .not("overall_score", "is", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .single()

  const { data: sessions } = await adminSupabase
    .from("consultations")
    .select("summary, created_at")
    .eq("user_id", user.id)
    .not("summary", "is", null)
    .order("created_at", { ascending: false })
    .limit(3)

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const { data: analyses } = await adminSupabase
    .from("analyses")
    .select("biotics_score")
    .eq("user_id", user.id)
    .gte("created_at", thirtyDaysAgo.toISOString())
    .not("biotics_score", "is", null)

  const avgMealScore =
    analyses && analyses.length > 0
      ? Math.round(
          (analyses as { biotics_score: number }[]).reduce((a, b) => a + b.biotics_score, 0) /
            analyses.length
        )
      : null

  const name = (profile?.name as string | null) ?? "Patient"
  const goals = (profile?.health_goals as string[] | null) ?? []
  const overallScore = (latestAssessment?.overall_score as number | null) ?? null
  const subScores = latestAssessment?.sub_scores as Record<string, number> | null
  const assessmentDate = latestAssessment?.created_at
    ? new Date(latestAssessment.created_at as string).toLocaleDateString("en-IE", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "N/A"

  const pillarLines = subScores
    ? Object.entries(subScores)
        .map(([k, v]) => `  ${k.charAt(0).toUpperCase() + k.slice(1)}: ${Math.round(v)}/100`)
        .join("\n")
    : "  No pillar data"

  const consultLines = (sessions ?? []).map((s, i) => `  ${i + 1}. ${s.summary}`).join("\n")

  const prompt = `You are EatoBiotic generating a professional food system health summary report for ${name} to share with their healthcare provider.

MEMBER DATA:
- Assessment date: ${assessmentDate}
- Overall Biotics Score: ${overallScore ?? "N/A"}/100 (out of 100, where 70+ is excellent)
- 5-Pillar Breakdown:
${pillarLines}
- Average meal score (last 30 days): ${avgMealScore ?? "N/A"}/100
- Health goals: ${goals.join(", ") || "General food system health"}
${consultLines ? `\nRecent EatoBiotic consultation topics:\n${consultLines}` : ""}

Generate a professional, structured health report with these sections:
1. PATIENT FOOD SYSTEM SUMMARY (2-3 sentences overview)
2. BIOTICS SCORE BREAKDOWN (brief interpretation of each pillar: what it means clinically)
3. DIETARY PATTERN ANALYSIS (what the data reveals about eating patterns)
4. KEY CONCERNS (2-3 specific areas worth clinical attention)
5. RECOMMENDED FOCUS AREAS (3 food-based recommendations — cite the scientific mechanism briefly)
6. NOTES FOR CLINICIAN (context about the EatoBiotics 3 Biotics Framework and scoring methodology)

Tone: professional, evidence-based, clinician-facing. Include appropriate caveats (this is a food system assessment, not a clinical diagnosis).
Length: ~500 words.`

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1500,
      messages: [{ role: "user", content: prompt }],
    })
    const content = response.content[0].type === "text" ? response.content[0].text : ""
    return NextResponse.json({ content, name, assessmentDate, overallScore })
  } catch (err) {
    console.error("[doctor-report]", err)
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 })
  }
}
