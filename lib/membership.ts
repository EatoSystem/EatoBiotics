/**
 * Membership tier utilities — usable in server components and API routes.
 * Never import getSupabase() on the client side.
 */
import { getSupabase } from "@/lib/supabase"

/* ── Types ──────────────────────────────────────────────────────────────── */

export type MembershipTier = "free" | "grow" | "restore" | "transform"
export type MembershipStatus = "active" | "inactive" | "cancelled" | "past_due"

/* ── Feature flags ──────────────────────────────────────────────────────── */

export const FEATURES = {
  unlimited_analyses:   ["grow", "restore", "transform"],
  score_history_30:     ["grow", "restore", "transform"],
  score_history_90:     ["restore", "transform"],
  plate_builder:        ["grow", "restore", "transform"],
  condition_calibration:["restore", "transform"],
  monthly_gut_plan:     ["restore", "transform"],
  pdf_reports:          ["restore", "transform"],
  ai_consultation:      ["transform"],
  weekly_checkin:       ["transform"],
  weekly_meal_plans:    ["transform"],
  founding_member:      ["transform"],
} as const

export type Feature = keyof typeof FEATURES

export function canAccess(tier: MembershipTier, feature: Feature): boolean {
  return (FEATURES[feature] as readonly string[]).includes(tier)
}

/* ── Tier ↔ Stripe price mapping ────────────────────────────────────────── */

export const TIER_PRICES: Record<string, MembershipTier> = {
  [process.env.STRIPE_GROW_PRICE_ID ?? ""]:      "grow",
  [process.env.STRIPE_RESTORE_PRICE_ID ?? ""]:   "restore",
  [process.env.STRIPE_TRANSFORM_PRICE_ID ?? ""]: "transform",
}

export const PRICE_IDS: Record<MembershipTier, string | undefined> = {
  free:      undefined,
  grow:      process.env.STRIPE_GROW_PRICE_ID,
  restore:   process.env.STRIPE_RESTORE_PRICE_ID,
  transform: process.env.STRIPE_TRANSFORM_PRICE_ID,
}

/** Map a Stripe price ID to a tier name. Returns null if unrecognised. */
export function tierFromPriceId(priceId: string): MembershipTier | null {
  return TIER_PRICES[priceId] ?? null
}

/** Map a Stripe price ID to a tier name — throws if not found. */
export function tierFromPriceIdOrThrow(priceId: string): MembershipTier {
  const tier = tierFromPriceId(priceId)
  if (!tier) throw new Error(`Unknown price ID: ${priceId}`)
  return tier
}

/* ── Tier metadata ───────────────────────────────────────────────────────── */

export const TIER_META: Record<MembershipTier, { label: string; price: string; priceMonthly: number }> = {
  free:      { label: "Free",      price: "Free",       priceMonthly: 0 },
  grow:      { label: "Grow",      price: "€9.99/mo",   priceMonthly: 9.99 },
  restore:   { label: "Restore",   price: "€49/mo",     priceMonthly: 49 },
  transform: { label: "Transform", price: "€99/mo",     priceMonthly: 99 },
}

/* ── Server-side tier lookup ────────────────────────────────────────────── */

/**
 * Fetches the effective membership tier for a user.
 *
 * Returns the tier only when:
 * - status is 'active', OR
 * - status is 'past_due' and membership_expires_at is still in the future
 *   (grace period — keep access until subscription truly lapses)
 *
 * Falls back to 'free' in all other cases.
 */
export async function getUserMembershipTier(userId: string): Promise<MembershipTier> {
  const supabase = getSupabase()
  if (!supabase) return "free"

  const { data, error } = await supabase
    .from("profiles")
    .select("membership_tier, membership_status, membership_expires_at")
    .eq("id", userId)
    .single()

  if (error || !data) return "free"

  const tier   = (data.membership_tier   as MembershipTier)   ?? "free"
  const status = (data.membership_status as MembershipStatus) ?? "inactive"

  if (status === "active") return tier

  // Grace period: past_due but not yet expired
  if (status === "past_due" && data.membership_expires_at) {
    const expires = new Date(data.membership_expires_at)
    if (expires > new Date()) return tier
  }

  return "free"
}

/* ── Founding member check ───────────────────────────────────────────────── */

/**
 * Returns true if a subscription created at `createdAt` qualifies for
 * founding member status. Uses FOUNDING_MEMBER_CUTOFF_DATE env var (ISO string).
 * Returns false if the env var is not set.
 */
export function isFoundingMember(createdAt: Date | string): boolean {
  const cutoff = process.env.FOUNDING_MEMBER_CUTOFF_DATE
  if (!cutoff) return false
  return new Date(createdAt) < new Date(cutoff)
}
