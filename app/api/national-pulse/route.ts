import { NextRequest, NextResponse } from "next/server"
import { getSupabase } from "@/lib/supabase"
import { rateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit"

export const dynamic = "force-dynamic"

/** Minimum contributions before ANY aggregate is shown at all. */
const MIN_TOTAL = 25
/** Minimum contributions from one country before that country's average is shown. */
const MIN_PER_COUNTRY = 10

/**
 * The national Food System Pulse — the read side of "participate outward".
 * Aggregates anonymised opt-in score contributions (POST /api/contribute →
 * `contributions`, Migration 43) into a global average plus per-country
 * averages, with honesty thresholds so tiny samples are never presented as
 * a national statistic. Public, rate-limited, cache-friendly.
 */
export async function GET(req: NextRequest) {
  const limit = rateLimit(`national-pulse:${getClientIp(req)}`, 30, 10 * 60_000)
  if (!limit.allowed) {
    const { body, init } = rateLimitResponse(limit)
    return NextResponse.json(body, init)
  }

  const supabase = getSupabase()
  if (!supabase) return NextResponse.json({ ok: true, total: 0, average: null, countries: [] })

  // Pre-launch volumes are small — tally in-process like the waitlist
  // leaderboard does, rather than needing a DB aggregate/RPC.
  const { data, error } = await supabase
    .from("contributions")
    .select("overall_score, country")
    .limit(50000)
  if (error) {
    // Table may not exist yet (Migration 43 unapplied) — present as empty.
    return NextResponse.json({ ok: true, total: 0, average: null, countries: [] })
  }

  const rows = data ?? []
  const total = rows.length
  if (total < MIN_TOTAL) {
    return NextResponse.json({ ok: true, total, average: null, countries: [] })
  }

  const average = Math.round(rows.reduce((s, r) => s + (r.overall_score as number), 0) / total)

  const byCountry = new Map<string, number[]>()
  for (const r of rows) {
    const c = (r.country as string | null)?.trim()
    if (!c) continue
    const scores = byCountry.get(c) ?? []
    scores.push(r.overall_score as number)
    byCountry.set(c, scores)
  }

  const countries = Array.from(byCountry.entries())
    .filter(([, scores]) => scores.length >= MIN_PER_COUNTRY)
    .map(([code, scores]) => ({
      code,
      count: scores.length,
      average: Math.round(scores.reduce((s, v) => s + v, 0) / scores.length),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 12)

  return NextResponse.json(
    { ok: true, total, average, countries },
    { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=600" } }
  )
}
