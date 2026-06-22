import { NextRequest, NextResponse } from "next/server"
import { getSupabase } from "@/lib/supabase"
import { rateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit"
import { rankCountries } from "@/lib/market"

/**
 * Country leaderboard for the "launch-by-demand" mechanic.
 * GET /api/waitlist/leaderboard[?code=SHARECODE]
 *  → ranked countries by waitlist signups (top 8) + total, and—when a code is
 *    given—the caller's country and its rank. Pre-launch volumes are small, so
 *    we tally client-side rather than needing a DB aggregate/RPC.
 */
export async function GET(req: NextRequest) {
  const limit = rateLimit(`waitlist-leaderboard:${getClientIp(req)}`, 30, 10 * 60_000)
  if (!limit.allowed) {
    const { body, init } = rateLimitResponse(limit)
    return NextResponse.json(body, init)
  }

  const supabase = getSupabase()
  if (!supabase) return NextResponse.json({ ok: true, total: 0, top: [], entries: 0 })

  const { data } = await supabase
    .from("leads")
    .select("country")
    .eq("assessment_type", "waitlist")
    .not("country", "is", null)
    .limit(50000)

  const ranked = rankCountries((data ?? []).map((row) => row.country as string | null))
  const total = ranked.reduce((s, e) => s + e.count, 0)

  // Optional: the caller's country + rank (looked up by share_code).
  let you: { name: string; rank: number; count: number } | null = null
  const code = (req.nextUrl.searchParams.get("code") ?? "").trim()
  if (code) {
    const { data: lead } = await supabase
      .from("leads")
      .select("country")
      .eq("share_code", code)
      .eq("assessment_type", "waitlist")
      .maybeSingle()
    const myCountry = (lead?.country as string | null)?.trim()
    if (myCountry) {
      const entry = ranked.find((e) => e.name === myCountry)
      if (entry) you = { name: entry.name, rank: entry.rank, count: entry.count }
    }
  }

  return NextResponse.json({ ok: true, total, entries: ranked.length, top: ranked.slice(0, 8), you })
}
