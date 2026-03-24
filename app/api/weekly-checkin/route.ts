import { NextRequest, NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import { getSupabase } from "@/lib/supabase"

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

/** Generate and save a weekly check-in for a single Transform member. */
async function generateWeeklyCheckin(userId: string, userEmail: string): Promise<void> {
  const adminSupabase = getSupabase()
  if (!adminSupabase) return

  // Fetch last 7 days of analyses
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const { data: recentAnalyses } = await adminSupabase
    .from("analyses")
    .select("biotics_score, created_at")
    .eq("user_id", userId)
    .gte("created_at", sevenDaysAgo.toISOString())
    .order("created_at", { ascending: true })

  // Fetch last 2 assessment scores (start + current of week)
  const { data: assessments } = await adminSupabase
    .from("leads")
    .select("overall_score, sub_scores, created_at")
    .or(`email.eq.${userEmail},user_id.eq.${userId}`)
    .not("overall_score", "is", null)
    .order("created_at", { ascending: false })
    .limit(2)

  const latestScore  = (assessments?.[0]?.overall_score as number | null) ?? null
  const previousScore = (assessments?.[1]?.overall_score as number | null) ?? null
  const subScores     = assessments?.[0]?.sub_scores as Record<string, number> | null

  const analysisCount = recentAnalyses?.length ?? 0
  const scoreSummary = recentAnalyses?.length
    ? recentAnalyses.map((a) => `${new Date(a.created_at as string).toLocaleDateString("en-IE")}: ${a.biotics_score ?? "—"}`).join(", ")
    : "No meal analyses this week"

  const pillarSummary = subScores
    ? Object.entries(subScores).map(([k, v]) => `${k}: ${Math.round(v)}/100`).join(", ")
    : "No pillar data"

  const prompt = `You are the EatoBiotics Weekly Check-in Generator. Create a concise, personal weekly gut health summary for a Transform member.

Data for this week:
- Current Biotics Score: ${latestScore ?? "Unknown"}/100
- Previous Biotics Score: ${previousScore ?? "Unknown"}/100
- 5-Pillar Scores: ${pillarSummary}
- Meal analyses this week: ${analysisCount}
- Meal analysis scores: ${scoreSummary}

Write a 3-paragraph weekly check-in:
1. What went well this week (based on scores and activity)
2. What needs attention (based on lowest pillar or score decline)
3. ONE specific focus for next week — concrete and actionable

Tone: warm, direct, personal. Max 150 words total. Do not use bullet points.`

  const response = await anthropic.messages.create({
    model:      "claude-sonnet-4-20250514",
    max_tokens: 400,
    messages:   [{ role: "user", content: prompt }],
  })

  const content = response.content[0]?.type === "text" ? response.content[0].text : ""
  if (!content) return

  await adminSupabase.from("weekly_checkins").insert({
    user_id:             userId,
    content,
    biotics_score_start: previousScore,
    biotics_score_end:   latestScore,
  })
}

/* ── Route handler ──────────────────────────────────────────────────── */

export async function GET(req: NextRequest) {
  // Protect with CRON_SECRET to prevent unauthorised triggers
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const authHeader = req.headers.get("authorization")
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorised" }, { status: 401 })
    }
  }

  const adminSupabase = getSupabase()
  if (!adminSupabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 })
  }

  // Fetch all active Transform members
  const { data: transformMembers, error } = await adminSupabase
    .from("profiles")
    .select("id, email")
    .eq("membership_tier", "transform")
    .eq("membership_status", "active")

  if (error) {
    console.error("[weekly-checkin] Failed to fetch members:", error.message)
    return NextResponse.json({ error: "Database error" }, { status: 500 })
  }

  const members = transformMembers ?? []
  let processed = 0
  let failed = 0

  for (const member of members) {
    try {
      await generateWeeklyCheckin(member.id as string, member.email as string)
      processed++
    } catch (err) {
      console.error(`[weekly-checkin] Failed for user ${member.id}:`, err)
      failed++
    }
  }

  console.log(`[weekly-checkin] Processed: ${processed}, Failed: ${failed}, Total: ${members.length}`)
  return NextResponse.json({ processed, failed, total: members.length })
}
