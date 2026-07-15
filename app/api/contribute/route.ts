import { NextRequest, NextResponse } from "next/server"
import { getSupabase } from "@/lib/supabase"
import { rateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit"

/**
 * Anonymised data contribution endpoint — the "participate outward" write
 * path. Called by the assessment results privacy opt-in
 * (components/assessment/privacy-opt-in.tsx). Accepts only: overall score,
 * sub-scores, profile type. No personal identifiers are accepted or stored;
 * the country dimension comes from the server-set eb_country cookie
 * (ISO-3166 alpha-2, best effort), never from the request body.
 *
 * Rows land in `contributions` (Migration 43) and feed the national
 * Food System Pulse aggregate (GET /api/national-pulse).
 */
export async function POST(req: NextRequest) {
  try {
    // Public, unauthenticated write — rate limit per IP.
    const limit = rateLimit(`contribute:${getClientIp(req)}`, 5, 10 * 60_000)
    if (!limit.allowed) {
      const { body, init } = rateLimitResponse(limit)
      return NextResponse.json(body, init)
    }

    const body = await req.json()
    const { overall, subScores, profile } = body as {
      overall: unknown
      subScores?: Record<string, unknown>
      profile?: { type?: unknown }
    }

    if (typeof overall !== "number" || !Number.isFinite(overall)) {
      return NextResponse.json({ ok: false }, { status: 400 })
    }
    const score = Math.round(Math.max(0, Math.min(100, overall)))

    // Keep only numeric sub-scores under known-shaped keys; drop anything else.
    const cleanSubScores: Record<string, number> = {}
    if (subScores && typeof subScores === "object") {
      for (const [key, value] of Object.entries(subScores)) {
        if (/^[a-z_]{1,32}$/.test(key) && typeof value === "number" && Number.isFinite(value)) {
          cleanSubScores[key] = Math.round(Math.max(0, Math.min(100, value)))
        }
      }
    }

    const profileType =
      typeof profile?.type === "string" && profile.type.length <= 64 ? profile.type : null

    const countryCookie = req.cookies.get("eb_country")?.value?.toUpperCase() ?? null
    const country = countryCookie && /^[A-Z]{2}$/.test(countryCookie) ? countryCookie : null

    const supabase = getSupabase()
    if (!supabase) {
      // No DB configured (local/preview) — acknowledge without persisting.
      console.log("[contribute] Supabase not configured — dropping contribution")
      return NextResponse.json({ ok: true })
    }

    const { error } = await supabase.from("contributions").insert({
      overall_score: score,
      sub_scores: Object.keys(cleanSubScores).length > 0 ? cleanSubScores : null,
      profile_type: profileType,
      country,
    })
    if (error) {
      // Table may not exist yet (Migration 43 unapplied) — never fail the
      // opt-in UX over a missing aggregate.
      console.error("[contribute] insert error:", error.message)
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 })
  }
}
