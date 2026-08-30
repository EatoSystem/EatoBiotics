/**
 * Membership tier utilities — usable in server components and API routes.
 * Never import getSupabase() on the client side.
 */
import { getSupabase } from "@/lib/supabase"

/* ── Types ──────────────────────────────────────────────────────────────── */

/*
 * The tier vocabulary lives in lib/membership-tiers.ts, which is pure and safe
 * to import from a client component. Re-exported here so every existing server
 * caller keeps its import path and there is still one definition.
 */
export type { MembershipTier, MembershipStatus } from "@/lib/membership-tiers"
export { PAID_TIERS, isPaidTierName, MEMBER_PRICE_EUR } from "@/lib/membership-tiers"
import { MEMBER_PRICE_EUR } from "@/lib/membership-tiers"
import type { MembershipTier, MembershipStatus } from "@/lib/membership-tiers"

/* ── Feature flags ──────────────────────────────────────────────────────── */

// Single-membership model: there is now one paid plan — `member`. It unlocks
// EVERY feature. `trial` (granted by the one-time €49 report) mirrors `member`
// for 30 days as the on-ramp, except the founding-member badge (paid subs only).
// Legacy grow/restore/transform are retired but kept here for back-compat with
// any existing rows — their historical access is preserved (additive only).

export const FEATURES = {
  unlimited_analyses:    ["trial", "member", "grow", "restore", "transform"],
  score_history_30:      ["trial", "member", "grow", "restore", "transform"],
  score_history_90:      ["trial", "member", "restore", "transform"],
  plate_builder:         ["trial", "member", "grow", "restore", "transform"],
  condition_calibration: ["trial", "member", "restore", "transform"],
  monthly_gut_plan:      ["trial", "member", "restore", "transform"],
  pdf_reports:           ["trial", "member", "restore", "transform"],
  ai_consultation:       ["trial", "member", "transform"],
  glp1_companion:        ["trial", "member", "restore", "transform"],
  stability_insights:    ["trial", "member", "restore", "transform"],
  stability_report:      ["trial", "member", "restore", "transform"],
  ai_voice:              ["trial", "member", "grow", "restore", "transform"],
  weekly_checkin:        ["trial", "member", "transform"],
  weekly_meal_plans:     ["trial", "member", "transform"],
  create_my_plate:       ["trial", "member", "grow", "restore", "transform"],
  founding_member:       ["member", "transform"],
  thirty_day_plan:       ["trial", "member", "grow", "restore", "transform"],
} as const

export type Feature = keyof typeof FEATURES

export function canAccess(tier: MembershipTier, feature: Feature): boolean {
  return (FEATURES[feature] as readonly string[]).includes(tier)
}

/**
 * Single-membership helper: is this a paying plan (i.e. NOT free)?
 * Under the one-membership model, any paid plan — the Member subscription, the
 * 30-day trial, and legacy grow/restore/transform — unlocks every paid feature.
 * Use this for premium route/page gates that should now key off "free vs paid".
 */
export function isPaidTier(tier: MembershipTier): boolean {
  return tier !== "free"
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
  // DISPLAY strings only. The tier id stays `trial` everywhere — DB values,
  // the type union, the webhook, trial_expires_at and every access check are
  // untouched. What changed is what a customer is shown: they did not start a
  // free trial, they bought a €49 Consultation that includes 30 days.
  trial:     { label: "Included Access", price: "Included with your Consultation", priceMonthly: 0 },
  member:    { label: "Member",    price: `€${MEMBER_PRICE_EUR}/mo`, priceMonthly: MEMBER_PRICE_EUR },
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
