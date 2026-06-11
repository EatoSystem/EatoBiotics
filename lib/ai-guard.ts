/* ── AI usage guard ───────────────────────────────────────────────────────
   Cost protection for Claude-backed endpoints. Two layers:

   1. Burst limit — in-memory fixed window per user+feature (lib/rate-limit).
      Catches loops/abuse within a single warm instance immediately.
   2. Daily cap — counted in the `ai_usage` table (Migration 22), one row per
      user/day/feature. Globally consistent across instances.

   Usage (first thing after auth + tier checks in a route):

     const blocked = await guardAiUsage(user.id, "meal_plan", AI_LIMITS.meal_plan)
     if (blocked) return blocked

   The daily counter fails OPEN if the DB is unavailable (the route would fail
   later anyway, and the burst limiter still bounds the worst case) — but the
   increment happens BEFORE the Claude call, so a successful request is always
   counted.
──────────────────────────────────────────────────────────────────────── */

import { NextResponse } from "next/server"
import { getSupabase } from "@/lib/supabase"
import { rateLimit } from "@/lib/rate-limit"

export interface AiLimit {
  /** Max requests per burst window (per user, per feature, per instance). */
  burstLimit: number
  /** Burst window in ms. */
  burstWindowMs: number
  /** Max requests per UTC day (per user, per feature, global). */
  dailyLimit: number
}

/** Per-feature limits — the single tuning point for AI spend. */
export const AI_LIMITS = {
  meal_plan:         { burstLimit: 4,  burstWindowMs: 60 * 60 * 1000, dailyLimit: 3 },
  weekly_report:     { burstLimit: 4,  burstWindowMs: 60 * 60 * 1000, dailyLimit: 3 },
  monthly_review:    { burstLimit: 4,  burstWindowMs: 60 * 60 * 1000, dailyLimit: 3 },
  monthly_plan:      { burstLimit: 4,  burstWindowMs: 60 * 60 * 1000, dailyLimit: 3 },
  food_intelligence: { burstLimit: 6,  burstWindowMs: 60 * 60 * 1000, dailyLimit: 10 },
  report_chat:       { burstLimit: 20, burstWindowMs: 10 * 60 * 1000, dailyLimit: 40 },
  eatobiotic:        { burstLimit: 20, burstWindowMs: 10 * 60 * 1000, dailyLimit: 40 },
} as const satisfies Record<string, AiLimit>

export type AiFeature = keyof typeof AI_LIMITS

function midnightUtcIso(): string {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() + 1)
  d.setUTCHours(0, 0, 0, 0)
  return d.toISOString()
}

/**
 * Checks (and counts) one AI request for a user+feature.
 * Returns `null` when allowed, or a ready-to-return 429 NextResponse.
 */
export async function guardAiUsage(
  userId: string,
  feature: AiFeature,
  limit: AiLimit = AI_LIMITS[feature],
): Promise<NextResponse | null> {
  // 1. Burst limit (in-memory, immediate)
  const burst = rateLimit(`ai:${feature}:${userId}`, limit.burstLimit, limit.burstWindowMs)
  if (!burst.allowed) {
    return NextResponse.json(
      { error: "You're going a little fast — please wait a moment and try again." },
      { status: 429, headers: { "Retry-After": String(burst.retryAfterSeconds) } },
    )
  }

  // 2. Daily cap (DB-backed, global)
  const supabase = getSupabase()
  if (!supabase) return null // fail open: burst limiter still applies

  const today = new Date().toISOString().slice(0, 10)
  try {
    const { data: row, error: readErr } = await supabase
      .from("ai_usage")
      .select("count")
      .eq("user_id", userId)
      .eq("usage_date", today)
      .eq("feature", feature)
      .maybeSingle()

    if (readErr) {
      console.error(`[ai-guard] read failed for ${feature}:`, readErr.message)
      return null
    }

    const used = row?.count ?? 0
    if (used >= limit.dailyLimit) {
      return NextResponse.json(
        {
          error: `Daily limit reached for this feature (${limit.dailyLimit}/day). It resets at midnight UTC.`,
          resetAt: midnightUtcIso(),
        },
        { status: 429 },
      )
    }

    // Count this request BEFORE the (expensive) Claude call.
    const { error: writeErr } = await supabase
      .from("ai_usage")
      .upsert(
        { user_id: userId, usage_date: today, feature, count: used + 1, updated_at: new Date().toISOString() },
        { onConflict: "user_id,usage_date,feature" },
      )
    if (writeErr) console.error(`[ai-guard] count failed for ${feature}:`, writeErr.message)
  } catch (err) {
    console.error(`[ai-guard] unexpected error for ${feature}:`, err)
  }

  return null
}
