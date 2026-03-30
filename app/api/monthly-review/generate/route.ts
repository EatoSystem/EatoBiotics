import { NextRequest, NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import { getUser } from "@/lib/supabase-server"
import { getSupabase } from "@/lib/supabase"
import { getUserMembershipTier } from "@/lib/membership"

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  // Allow cron trigger with CRON_SECRET or authenticated user
  const authHeader = req.headers.get("authorization")
  const isCron = authHeader === `Bearer ${process.env.CRON_SECRET}`

  if (!isCron) {
    const user = await getUser()
    if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 })
    const tier = await getUserMembershipTier(user.id)
    if (tier !== "transform") return NextResponse.json({ error: "Transform required" }, { status: 403 })
  }

  const adminSupabase = getSupabase()
  if (!adminSupabase) return NextResponse.json({ error: "DB unavailable" }, { status: 500 })

  // If cron: process all active transform members
  // If user request: process just that user
  let userIds: string[] = []

  if (isCron) {
    const { data } = await adminSupabase
      .from("profiles")
      .select("id")
      .eq("membership_tier", "transform")
      .eq("membership_status", "active")
    userIds = (data ?? []).map((p) => p.id as string)
  } else {
    const user = await getUser()
    if (user) userIds = [user.id]
  }

  const month = new Date()
  month.setDate(1)
  month.setHours(0, 0, 0, 0)
  const monthStr = month.toISOString().slice(0, 10)
  const monthLabel = new Date().toLocaleDateString("en-IE", { month: "long", year: "numeric" })

  const results: string[] = []

  for (const userId of userIds) {
    try {
      const { data: profile } = await adminSupabase.from("profiles").select("name, health_goals").eq("id", userId).single()

      // Last 30 days of meal analyses
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      const { data: analyses } = await adminSupabase
        .from("analyses")
        .select("biotics_score, created_at")
        .eq("user_id", userId)
        .gte("created_at", thirtyDaysAgo.toISOString())
        .order("created_at", { ascending: true })

      const scores = (analyses ?? []).map((a) => a.biotics_score as number).filter(Boolean)
      const scoreStart = scores[0] ?? null
      const scoreEnd = scores[scores.length - 1] ?? null
      const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null

      // Weekly check-ins from last month
      const { data: checkins } = await adminSupabase
        .from("weekly_checkins")
        .select("content")
        .eq("user_id", userId)
        .gte("created_at", thirtyDaysAgo.toISOString())
        .order("created_at", { ascending: false })
        .limit(4)

      // Consultation summaries from last month
      const { data: sessions } = await adminSupabase
        .from("consultations")
        .select("summary")
        .eq("user_id", userId)
        .gte("created_at", thirtyDaysAgo.toISOString())
        .not("summary", "is", null)
        .limit(5)

      // Latest assessment
      const { data: latestAssessment } = await adminSupabase
        .from("leads")
        .select("overall_score, sub_scores")
        .or(`user_id.eq.${userId}`)
        .not("overall_score", "is", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .single()

      const name = (profile?.name as string | null) ?? "Member"
      const goals = (profile?.health_goals as string[] | null)?.join(", ") ?? "general food system health"
      const overallScore = (latestAssessment?.overall_score as number | null) ?? null

      const prompt = `You are EatoBiotic generating ${name}'s Monthly Food System Review for ${monthLabel}.

MEMBER DATA:
- Overall Biotics Score: ${overallScore ?? "N/A"}/100
- Meal analyses this month: ${scores.length}
- Average meal score this month: ${avgScore ?? "N/A"}
- Score at start of month: ${scoreStart ?? "N/A"}
- Score at end of month: ${scoreEnd ?? "N/A"}
- Health goals: ${goals}
${checkins && checkins.length > 0 ? `\nWEEKLY CHECK-INS:\n${checkins.map((c, i) => `Week ${i + 1}: ${(c.content as string).slice(0, 200)}`).join("\n")}` : ""}
${sessions && sessions.length > 0 ? `\nCONSULTATION TOPICS:\n${sessions.map((s) => `- ${s.summary}`).join("\n")}` : ""}

Generate a structured monthly review in 4 parts:
1. HOW YOUR FOOD SYSTEM PERFORMED THIS MONTH (honest, data-driven, 2-3 sentences)
2. YOUR 3 BIGGEST WINS (specific achievements, one sentence each)
3. WHAT STILL NEEDS ATTENTION (honest gaps, 2-3 sentences)
4. YOUR 3 FOCUS AREAS FOR NEXT MONTH (specific, actionable, one sentence each)

Total length: ~350 words. Tone: warm, direct, honest, like a trusted advisor reviewing your progress.`

      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        messages: [{ role: "user", content: prompt }],
      })

      const content = response.content[0].type === "text" ? response.content[0].text : ""

      try {
        await adminSupabase.from("monthly_reviews").upsert(
          {
            user_id: userId,
            month: monthStr,
            content,
            score_start: scoreStart,
            score_end: scoreEnd,
          },
          { onConflict: "user_id,month" }
        )
      } catch (dbErr) {
        console.error(`[monthly-review] DB save failed for ${userId}:`, dbErr)
      }

      results.push(`Generated review for ${userId}`)
    } catch (err) {
      console.error(`[monthly-review] Failed for ${userId}:`, err)
      results.push(`Failed for ${userId}`)
    }
  }

  return NextResponse.json({ processed: results.length, results })
}
