/*
  SQL migration — run once in Supabase SQL editor:

  ALTER TABLE weekly_checkins
    ADD COLUMN IF NOT EXISTS report_json jsonb;
*/

import { NextRequest, NextResponse } from "next/server"
import { anthropic } from "@/lib/anthropic"
import { getUser } from "@/lib/supabase-server"
import { getSupabase } from "@/lib/supabase"

/* ── Week boundary helpers ──────────────────────────────────────────── */

function getWeekBounds(): { start: string; startISO: string; endISO: string } {
  const now = new Date()
  const dow = now.getUTCDay()
  const diff = dow === 0 ? 6 : dow - 1
  const monday = new Date(now)
  monday.setUTCDate(now.getUTCDate() - diff)
  monday.setUTCHours(0, 0, 0, 0)
  const sunday = new Date(monday)
  sunday.setUTCDate(monday.getUTCDate() + 6)
  sunday.setUTCHours(23, 59, 59, 999)
  return {
    start:    monday.toISOString().slice(0, 10),
    startISO: monday.toISOString(),
    endISO:   sunday.toISOString(),
  }
}

function avg(rows: Record<string, unknown>[], key: string): number {
  const vals = rows.map((r) => r[key] as number | null).filter((v) => v != null) as number[]
  return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0
}

/* ── Weekly report JSON type (exported for report page) ─────────────── */

export interface WeeklyReportJson {
  weekStarting:         string
  weekNumber:           number
  mealCount:            number
  averageScore:         number
  previousWeekAverage:  number | null
  pillars: { prebiotic: number; probiotic: number; postbiotic: number }
  bestMeal:    { name: string; score: number; date: string } | null
  weakestMeal: { name: string; score: number; date: string } | null
  mealsThisWeek: Array<{ id: string; name: string; type: string; score: number; date: string }>
  weekSummaryTitle: string
  narrative:         string
  pullQuote:         string
  patterns:          string[]
  pillarInsights:    { prebiotic: string; probiotic: string; postbiotic: string }
  focusAction:       string
  stretchGoal:       string
}

/* ── Route handler ───────────────────────────────────────────────────── */

export async function POST(req: NextRequest) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 })

  let force = false
  try { const b = await req.json() as { force?: boolean }; force = b.force ?? false } catch { /* no body */ }

  const adminSupabase = getSupabase()
  if (!adminSupabase) return NextResponse.json({ error: "Database not configured" }, { status: 503 })

  const { start: weekStarting, startISO, endISO } = getWeekBounds()

  /* Return cached if already generated this week */
  if (!force) {
    const { data: existing } = await adminSupabase
      .from("weekly_checkins")
      .select("id, content, report_json, week_starting")
      .eq("user_id", user.id)
      .eq("week_starting", weekStarting)
      .limit(1)
      .single()
    if (existing) return NextResponse.json({ cached: true, report: existing })
  }

  /* Fetch this week's analyses */
  const { data: weekRows } = await adminSupabase
    .from("analyses")
    .select("id, meal_name, meal_type, biotics_score, prebiotic_score, probiotic_score, postbiotic_score, insight, created_at")
    .eq("user_id", user.id)
    .gte("created_at", startISO)
    .lte("created_at", endISO)
    .order("created_at", { ascending: true })
  const analyses = (weekRows ?? []) as Record<string, unknown>[]

  /* Fetch previous week for trend */
  const prevStart = new Date(weekStarting)
  prevStart.setUTCDate(prevStart.getUTCDate() - 7)
  const { data: prevRows } = await adminSupabase
    .from("analyses")
    .select("biotics_score, prebiotic_score, probiotic_score, postbiotic_score")
    .eq("user_id", user.id)
    .gte("created_at", prevStart.toISOString())
    .lt("created_at", startISO)
  const prevAnalyses = (prevRows ?? []) as Record<string, unknown>[]

  /* Fetch user profile */
  const { data: profile } = await adminSupabase
    .from("profiles")
    .select("name, membership_started_at")
    .eq("id", user.id)
    .single()
  const memberName = (profile?.name as string | null) ?? "Member"
  const memberStartedAt = profile?.membership_started_at as string | null
  const weekNumber = memberStartedAt
    ? Math.max(1, Math.ceil((Date.now() - new Date(memberStartedAt).getTime()) / (7 * 86_400_000)))
    : 1

  /* Compute aggregates */
  const mealCount      = analyses.length
  const avgScore       = avg(analyses, "biotics_score")
  const avgPrebiotic   = avg(analyses, "prebiotic_score")
  const avgProbiotic   = avg(analyses, "probiotic_score")
  const avgPostbiotic  = avg(analyses, "postbiotic_score")
  const prevAvgScore   = prevAnalyses.length ? avg(prevAnalyses, "biotics_score") : null

  const best    = analyses.length ? analyses.reduce((b, a) => ((a.biotics_score as number ?? 0) > (b.biotics_score as number ?? 0) ? a : b)) : null
  const weakest = analyses.length > 1 ? analyses.reduce((w, a) => ((a.biotics_score as number ?? 100) < (w.biotics_score as number ?? 100) ? a : w)) : null

  /* Build meal list for Claude */
  const mealLines = analyses.length === 0
    ? "No meals logged this week yet."
    : analyses.map((a, i) => {
        const d = new Date(a.created_at as string).toLocaleDateString("en-IE", { weekday: "short", day: "numeric", month: "short" })
        return `${i + 1}. ${d} — ${(a.meal_name as string) ?? "Unnamed"} (${a.meal_type ?? "Meal"}): ${a.biotics_score ?? "?"}/100 | Pre:${a.prebiotic_score ?? "?"} Pro:${a.probiotic_score ?? "?"} Post:${a.postbiotic_score ?? "?"}`
      }).join("\n")

  const scoreContext = prevAvgScore != null
    ? `Average this week: ${avgScore}/100 (previous week: ${prevAvgScore}/100, change: ${avgScore - prevAvgScore > 0 ? "+" : ""}${avgScore - prevAvgScore})`
    : `Average this week: ${avgScore}/100 (no previous week data)`

  /* Generate report with Claude */
  const prompt = `Generate "The Food System Inside You" weekly report for ${memberName} — Week ${weekNumber} of their EatoBiotics journey.

WEEK DATA (${weekStarting}):
Meals logged: ${mealCount}
${scoreContext}
Prebiotic average: ${avgPrebiotic}/100 | Probiotic average: ${avgProbiotic}/100 | Postbiotic average: ${avgPostbiotic}/100
${best ? `Best meal: ${best.meal_name ?? "Unnamed"} (${best.biotics_score}/100)` : ""}
${weakest && weakest !== best ? `Weakest meal: ${weakest.meal_name ?? "Unnamed"} (${weakest.biotics_score}/100)` : ""}

MEALS:
${mealLines}

${mealCount === 0 ? "No meals logged. Write a motivating report that acknowledges the week is early and gives clear direction for what to log first." : ""}
${mealCount === 1 ? "Only 1 meal logged. Still write a full, useful report — extract as much insight as possible from this single meal and use it to guide the week ahead." : ""}

Return ONLY valid JSON (no markdown, no explanation):
{
  "weekSummaryTitle": "<4–7 word title for this week>",
  "narrative": "<3–4 sentences: what the data tells us about this person's food system this week. Warm, personal, specific. Honest about limited data if few meals.>",
  "pullQuote": "<1 compelling sentence that captures the core insight — displayed as a pull quote on the dashboard>",
  "patterns": ["<specific observation 1>", "<specific observation 2>"],
  "pillarInsights": {
    "prebiotic": "<1 sentence: prebiotic performance this week>",
    "probiotic": "<1 sentence: probiotic performance this week>",
    "postbiotic": "<1 sentence: postbiotic performance this week>"
  },
  "focusAction": "<the single most important thing to do differently — specific and immediately actionable>",
  "stretchGoal": "<a secondary improvement — slightly harder or longer-term>"
}`

  let reportAI: {
    weekSummaryTitle: string; narrative: string; pullQuote: string
    patterns: string[]; pillarInsights: { prebiotic: string; probiotic: string; postbiotic: string }
    focusAction: string; stretchGoal: string
  }

  try {
    const response = await anthropic.messages.create({
      model:      "claude-sonnet-4-20250514",
      max_tokens: 1000,
      messages:   [{ role: "user", content: prompt }],
    })
    const text = response.content[0]?.type === "text" ? response.content[0].text : ""
    const m = text.match(/\{[\s\S]*\}/)
    if (!m) throw new Error("No JSON in response")
    reportAI = JSON.parse(m[0])
  } catch (err) {
    console.error("[weekly-report] Claude error:", err)
    return NextResponse.json({ error: "Report generation failed" }, { status: 500 })
  }

  /* Build full report_json */
  const reportJson: WeeklyReportJson = {
    weekStarting,
    weekNumber,
    mealCount,
    averageScore:        avgScore,
    previousWeekAverage: prevAvgScore,
    pillars:             { prebiotic: avgPrebiotic, probiotic: avgProbiotic, postbiotic: avgPostbiotic },
    bestMeal:    best    ? { name: (best.meal_name    as string) ?? "Unnamed", score: (best.biotics_score    as number) ?? 0, date: (best.created_at    as string).slice(0, 10) } : null,
    weakestMeal: weakest && weakest !== best ? { name: (weakest.meal_name as string) ?? "Unnamed", score: (weakest.biotics_score as number) ?? 0, date: (weakest.created_at as string).slice(0, 10) } : null,
    mealsThisWeek: analyses.map((a) => ({
      id:    a.id    as string,
      name:  (a.meal_name as string) ?? "Unnamed meal",
      type:  (a.meal_type as string) ?? "Meal",
      score: (a.biotics_score as number) ?? 0,
      date:  (a.created_at as string).slice(0, 10),
    })),
    ...reportAI,
  }

  const content = `${reportAI.narrative}\n\nYour focus: ${reportAI.focusAction}`

  /* Remove existing this week if forcing */
  if (force) {
    await adminSupabase.from("weekly_checkins").delete().eq("user_id", user.id).eq("week_starting", weekStarting)
  }

  /* Save */
  const { data: saved, error } = await adminSupabase
    .from("weekly_checkins")
    .insert({
      user_id:             user.id,
      content,
      week_starting:       weekStarting,
      biotics_score_start: prevAvgScore,
      biotics_score_end:   avgScore,
      report_json:         reportJson,
    })
    .select("id, content, report_json, week_starting")
    .single()

  if (error) {
    console.error("[weekly-report] DB error:", error.message)
    return NextResponse.json({ error: "Failed to save report" }, { status: 500 })
  }

  return NextResponse.json({ cached: false, report: saved })
}
