import { NextRequest, NextResponse } from "next/server"
import { anthropic, CLAUDE_MODEL } from "@/lib/anthropic"
import { getSupabase } from "@/lib/supabase"
import { verifyCronRequest } from "@/lib/cron-auth"

/** Returns the date of the most recent Monday (UTC) as YYYY-MM-DD. */
function getLastMondayDate(): string {
  const now = new Date()
  const day = now.getUTCDay() // 0=Sun, 1=Mon, ..., 6=Sat
  const diffToMonday = day === 0 ? 6 : day - 1
  const monday = new Date(now)
  monday.setUTCDate(now.getUTCDate() - diffToMonday)
  monday.setUTCHours(0, 0, 0, 0)
  return monday.toISOString().slice(0, 10)
}

function formatBioticScores(subScores: Record<string, number> | null): string {
  if (!subScores) return "No 3 Biotics data"

  const scoreFor = (canonical: string, alias: string) => subScores[canonical] ?? subScores[alias]
  const bioticScores: Array<[string, number | undefined]> = [
    ["Prebiotics", scoreFor("prebiotics", "feed")],
    ["Probiotics", scoreFor("probiotics", "seed")],
    ["Postbiotics", scoreFor("postbiotics", "heal")],
  ]

  const available = bioticScores.filter((entry): entry is [string, number] => typeof entry[1] === "number")
  if (available.length > 0) {
    return available.map(([label, value]) => `${label}: ${Math.round(value)}/100`).join(", ")
  }

  return Object.entries(subScores).map(([k, v]) => `${k}: ${Math.round(v)}/100`).join(", ")
}

/** Generate and save a weekly check-in for a single Transform member. */
async function generateWeeklyCheckin(userId: string, userEmail: string): Promise<void> {
  const adminSupabase = getSupabase()
  if (!adminSupabase) return

  const weekStarting = getLastMondayDate()

  // Deduplication: skip if check-in already exists for this week
  const { data: existing } = await adminSupabase
    .from("weekly_checkins")
    .select("id")
    .eq("user_id", userId)
    .eq("week_starting", weekStarting)
    .limit(1)
    .single()

  if (existing) {
    console.log(`[weekly-checkin] Skipping user ${userId}: already generated for week ${weekStarting}`)
    return
  }

  // Fetch last 7 days of analyses
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const { data: recentAnalyses } = await adminSupabase
    .from("analyses")
    .select("biotics_score, created_at")
    .eq("user_id", userId)
    .gte("created_at", sevenDaysAgo.toISOString())
    .order("created_at", { ascending: true })

  const analyses = recentAnalyses ?? []
  const analysisCount = analyses.length

  // Require at least 1 analysis (report writes itself from whatever data exists)
  if (analysisCount < 1) {
    console.log(`[weekly-checkin] Skipping user ${userId}: no analyses this week`)
    return
  }

  // Fetch last 2 assessment scores (start + current of week)
  const { data: assessments } = await adminSupabase
    .from("leads")
    .select("overall_score, sub_scores, created_at")
    .or(`email.eq.${userEmail},user_id.eq.${userId}`)
    .not("overall_score", "is", null)
    .order("created_at", { ascending: false })
    .limit(2)

  const latestScore   = (assessments?.[0]?.overall_score as number | null) ?? null
  const previousScore = (assessments?.[1]?.overall_score as number | null) ?? null
  const subScores     = assessments?.[0]?.sub_scores as Record<string, number> | null

  // Include meal names in the summary for richer context
  const scoreSummary = (recentAnalyses as Array<{ created_at: unknown; biotics_score: unknown; meal_name?: unknown }>).map((a) => {
    const date = new Date(a.created_at as string).toLocaleDateString("en-IE")
    const name = (a.meal_name as string | null) ?? "meal"
    return `${date}: ${name} — ${a.biotics_score ?? "?"}/100`
  }).join("; ")

  const pillarSummary = formatBioticScores(subScores)

  const dataNote = analysisCount === 1
    ? `Only 1 meal has been logged this week. Extract as much insight as possible from this single data point.`
    : `${analysisCount} meals logged this week.`

  const prompt = `You are the EatoBiotics Weekly Check-in Generator. Create a personal weekly food system health summary.

${dataNote}

Data for this week:
- Current Biotics Score: ${latestScore ?? "Unknown"}/100
- Previous Biotics Score: ${previousScore ?? "Unknown"}/100
- 3 Biotics pillar scores: ${pillarSummary}
- Meal analyses this week: ${scoreSummary}

Write a 3-paragraph weekly check-in directly to the member using "you":
1. This week in your food system health (what the data shows — be honest if data is limited but still insightful)
2. What's working and what needs attention (constructive, specific)
3. Your focus for next week — one clear priority with a practical action

Tone: warm, direct, personal. Under 200 words total. No bullet points. No headers.`

  const response = await anthropic.messages.create({
    model:      CLAUDE_MODEL,
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
    week_starting:       weekStarting,
  })
}

/* ── Route handler ──────────────────────────────────────────────────── */

export async function GET(req: NextRequest) {
  // Protect with CRON_SECRET to prevent unauthorised triggers (fails closed)
  const unauthorised = verifyCronRequest(req)
  if (unauthorised) return unauthorised

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
