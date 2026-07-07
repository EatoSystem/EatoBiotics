import { NextRequest, NextResponse } from "next/server"
import { getSupabase } from "@/lib/supabase"
import { rateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit"

/**
 * Lightweight social-proof counter for the waitlist hero (/enter).
 * GET /api/waitlist/count
 *   → { total, today, recent } where:
 *     - total  = all waitlist signups
 *     - today  = signups since 00:00 UTC
 *     - recent = up to 6 latest joins as { name, country } (FIRST NAME ONLY,
 *                no email/PII) for the rotating "just joined" card.
 * Uses head-count queries so it never pulls full rows for the totals.
 */
export async function GET(req: NextRequest) {
  const limit = rateLimit(`waitlist-count:${getClientIp(req)}`, 60, 10 * 60_000)
  if (!limit.allowed) {
    const { body, init } = rateLimitResponse(limit)
    return NextResponse.json(body, init)
  }

  const supabase = getSupabase()
  if (!supabase) return NextResponse.json({ ok: true, total: 0, today: 0, recent: [] })

  const startOfDayUTC = new Date()
  startOfDayUTC.setUTCHours(0, 0, 0, 0)

  const [{ count: total }, { count: today }, { data: recentRows }] = await Promise.all([
    supabase
      .from("leads")
      .select("*", { count: "exact", head: true })
      .eq("assessment_type", "waitlist"),
    supabase
      .from("leads")
      .select("*", { count: "exact", head: true })
      .eq("assessment_type", "waitlist")
      .gte("created_at", startOfDayUTC.toISOString()),
    supabase
      .from("leads")
      .select("name, country")
      .eq("assessment_type", "waitlist")
      .order("created_at", { ascending: false })
      .limit(6),
  ])

  // First name only — never expose surnames or any contact detail.
  const recent = (recentRows ?? []).map((row) => {
    const first = ((row.name as string | null) ?? "").trim().split(/\s+/)[0]
    return {
      name: first || "Someone",
      country: ((row.country as string | null) ?? "").trim() || null,
    }
  })

  return NextResponse.json({
    ok: true,
    total: total ?? 0,
    today: today ?? 0,
    recent,
  })
}
