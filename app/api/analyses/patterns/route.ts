import { NextResponse } from "next/server"
import { getUser } from "@/lib/supabase-server"
import { getSupabase } from "@/lib/supabase"

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

export async function GET() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 })

  const adminSupabase = getSupabase()
  if (!adminSupabase) {
    return NextResponse.json({ dayAverages: [], topFoods: [], bestStreak: 0, trendDirection: "stable" })
  }

  const ninetyDaysAgo = new Date()
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

  const { data: analyses } = await adminSupabase
    .from("analyses")
    .select("biotics_score, created_at, meal_description")
    .eq("user_id", user.id)
    .gte("created_at", ninetyDaysAgo.toISOString())
    .not("biotics_score", "is", null)
    .order("created_at", { ascending: true })

  if (!analyses || analyses.length < 3) {
    return NextResponse.json({
      dayAverages: [],
      topFoods: [],
      bestStreak: 0,
      trendDirection: "stable",
      analysisCount: analyses?.length ?? 0,
    })
  }

  // Day of week averages
  const dayBuckets: Record<number, number[]> = {}
  for (const a of analyses) {
    const day = new Date(a.created_at as string).getDay()
    dayBuckets[day] = [...(dayBuckets[day] ?? []), a.biotics_score as number]
  }
  const dayAverages = Object.entries(dayBuckets)
    .map(([day, scores]) => ({
      day: DAY_NAMES[Number(day)],
      avg: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
      count: scores.length,
    }))
    .sort((a, b) => b.avg - a.avg)

  // Trend direction (last 10 vs first 10)
  const scores = analyses.map((a) => a.biotics_score as number)
  const firstTen = scores.slice(0, Math.min(10, Math.floor(scores.length / 2)))
  const lastTen = scores.slice(-Math.min(10, Math.floor(scores.length / 2)))
  const firstAvg = firstTen.reduce((a, b) => a + b, 0) / firstTen.length
  const lastAvg = lastTen.reduce((a, b) => a + b, 0) / lastTen.length
  const trendDirection =
    lastAvg - firstAvg > 3 ? "up" : lastAvg - firstAvg < -3 ? "down" : "stable"

  // Best streak
  const days = Array.from(
    new Set(analyses.map((a) => (a.created_at as string).slice(0, 10)))
  ).sort()
  let bestStreak = 1, currentStreak = 1
  for (let i = 1; i < days.length; i++) {
    const prev = new Date(days[i - 1])
    const curr = new Date(days[i])
    const diff = (curr.getTime() - prev.getTime()) / 86400000
    if (diff === 1) {
      currentStreak++
      bestStreak = Math.max(bestStreak, currentStreak)
    } else {
      currentStreak = 1
    }
  }

  return NextResponse.json({ dayAverages, bestStreak, trendDirection, analysisCount: analyses.length })
}
