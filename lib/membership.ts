/**
 * Membership tier utilities — usable in server components and API routes.
 * Never import getSupabase() on the client side.
 */
import { getSupabase } from "@/lib/supabase"

/* ── Types ──────────────────────────────────────────────────────────────── */

/** Full set of tiers. trial / member are the new model; grow/restore/transform are legacy. */
export type MembershipTier = "free" | "trial" | "member" | "grow" | "restore" | "transform"
export type MembershipStatus = "active" | "inactive" | "cancelled" | "past_due"

/* ── Feature flags ──────────────────────────────────────────────────────── */

// trial  → same base access as grow
// member → same access as restore

export const FEATURES = {
  unlimited_analyses:    ["trial", "member", "grow", "restore", "transform"],
  score_history_30:      ["trial", "member", "grow", "restore", "transform"],
  score_history_90:      ["member", "restore", "transform"],
  plate_builder:         ["trial", "member", "grow", "restore", "transform"],
  condition_calibration: ["member", "restore", "transform"],
  monthly_gut_plan:      ["member", "restore", "transform"],
  pdf_reports:           ["member", "restore", "transform"],
  ai_consultation:       ["transform"],
  weekly_checkin:        ["transform"],
  weekly_meal_plans:     ["transform"],
  create_my_plate:       ["trial", "member", "grow", "restore", "transform"],
  founding_member:       ["transform"],
  thirty_day_plan:       ["trial", "member", "grow", "restore", "transform"],
} as const

export type Feature = keyof typeof FEATURES

export function canAccess(tier: MembershipTier, feature: Feature): boolean {
  return (FEATURES[feature] as readonly string[]).includes(tier)
}

/* ── Tier ↔ Stripe price mapping ────────────────────────────────────────── */

export const TIER_PRICES: Record<string, MembershipTier> = {
  [process.env.STRIPE_GROW_PRICE_ID      ?? ""]: "grow",
  [process.env.STRIPE_RESTORE_PRICE_ID   ?? ""]: "restore",
  [process.env.STRIPE_TRANSFORM_PRICE_ID ?? ""]: "transform",
  [process.env.STRIPE_MEMBER_PRICE_ID    ?? ""]: "member",
}

export const PRICE_IDS: Record<MembershipTier, string | undefined> = {
  free:      undefined,
  trial:     undefined,                               // trial is set by one-time purchase, not subscription
  member:    process.env.STRIPE_MEMBER_PRICE_ID,
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
  free:      { label: "Free",      price: "Free",        priceMonthly: 0 },
  trial:     { label: "Trial",     price: "30-day free", priceMonthly: 0 },
  member:    { label: "Member",    price: "€24.99/mo",   priceMonthly: 24.99 },
  grow:      { label: "Grow",      price: "€9.99/mo",    priceMonthly: 9.99 },
  restore:   { label: "Restore",   price: "€49/mo",      priceMonthly: 49 },
  transform: { label: "Transform", price: "€99/mo",      priceMonthly: 99 },
}

/* ── Server-side tier lookup ────────────────────────────────────────────── */

/**
 * Fetches the effective membership tier for a user.
 *
 * Handles:
 * - 'active' status → return stored tier
 * - 'trial' tier   → return 'trial' only if trial_expires_at is in the future
 * - 'past_due'     → grace period while membership_expires_at is in the future
 * - everything else → 'free'
 */
export async function getUserMembershipTier(userId: string): Promise<MembershipTier> {
  const supabase = getSupabase()
  if (!supabase) return "free"

  const { data, error } = await supabase
    .from("profiles")
    .select("membership_tier, membership_status, membership_expires_at, trial_expires_at")
    .eq("id", userId)
    .single()

  if (error || !data) return "free"

  const tier   = (data.membership_tier   as MembershipTier)   ?? "free"
  const status = (data.membership_status as MembershipStatus) ?? "inactive"

  // Trial: set by one-time purchase webhook, uses trial_expires_at column
  if (tier === "trial") {
    if (data.trial_expires_at) {
      const trialExpires = new Date(data.trial_expires_at as string)
      return trialExpires > new Date() ? "trial" : "free"
    }
    return "free"
  }

  if (status === "active") return tier

  // Grace period: past_due but not yet expired
  if (status === "past_due" && data.membership_expires_at) {
    const expires = new Date(data.membership_expires_at as string)
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
