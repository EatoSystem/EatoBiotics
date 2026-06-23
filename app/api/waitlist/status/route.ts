import { NextRequest, NextResponse } from "next/server"
import { getSupabase } from "@/lib/supabase"
import { rateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit"
import { waitlistPosition, UNLOCK_THRESHOLD } from "@/lib/waitlist-referral"
import { logServerEvent } from "@/lib/statsig-server"

/**
 * Public waitlist status for the "skip the line" + invite-to-unlock mechanics.
 * GET /api/waitlist/status?code=SHARECODE → the lead's live queue position,
 * referral count, and unlock state. When the lead crosses the referral
 * threshold, a single founding-member coupon is minted (best-effort, only if
 * Stripe + STRIPE_SHARE_COUPON_ID are configured) and stored on the lead.
 */

function genRewardCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  const arr = new Uint8Array(8)
  crypto.getRandomValues(arr)
  let s = ""
  for (const b of arr) s += chars[b % chars.length]
  return `EB-SHARE-${s}`
}

export async function GET(req: NextRequest) {
  const limit = rateLimit(`waitlist-status:${getClientIp(req)}`, 30, 10 * 60_000)
  if (!limit.allowed) {
    const { body, init } = rateLimitResponse(limit)
    return NextResponse.json(body, init)
  }

  const code = (req.nextUrl.searchParams.get("code") ?? "").trim()
  if (!code) return NextResponse.json({ error: "Missing code" }, { status: 400 })

  const supabase = getSupabase()
  if (!supabase) return NextResponse.json({ error: "Unavailable" }, { status: 503 })

  const { data: lead } = await supabase
    .from("leads")
    .select("created_at, referral_count, email, reward_code")
    .eq("share_code", code)
    .eq("assessment_type", "waitlist")
    .maybeSingle()

  if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const referralCount = (lead.referral_count as number | null) ?? 0

  const { count: total } = await supabase
    .from("leads")
    .select("*", { count: "exact", head: true })
    .eq("assessment_type", "waitlist")

  const { count: rawRank } = await supabase
    .from("leads")
    .select("*", { count: "exact", head: true })
    .eq("assessment_type", "waitlist")
    .lte("created_at", lead.created_at as string)

  const position = waitlistPosition(rawRank ?? 1, referralCount)
  const unlocked = referralCount >= UNLOCK_THRESHOLD

  // Mint the founding-member reward once, when newly unlocked (best-effort).
  let rewardCode = (lead.reward_code as string | null) ?? null
  if (unlocked && !rewardCode && process.env.STRIPE_SHARE_COUPON_ID) {
    try {
      const { stripe } = await import("@/lib/stripe-server")
      const reward = genRewardCode()
      await stripe.promotionCodes.create({
        promotion: { type: "coupon", coupon: process.env.STRIPE_SHARE_COUPON_ID },
        code: reward,
        max_redemptions: 1,
        metadata: { type: "share", reason: "waitlist_referral_unlock", email: (lead.email as string) ?? "" },
      })
      // Store the reward against this lead (identified by its share code).
      await supabase.from("leads")
        .update({ reward_code: reward })
        .eq("share_code", code)
        .eq("assessment_type", "waitlist")
      rewardCode = reward
      await logServerEvent("waitlist_reward_minted", code, { reward_code: reward })
    } catch (err) {
      console.error("[waitlist-status] reward mint failed:", err)
    }
  }

  return NextResponse.json({
    ok: true,
    position,
    total: total ?? 0,
    referralCount,
    threshold: UNLOCK_THRESHOLD,
    unlocked,
    rewardCode,
  })
}
