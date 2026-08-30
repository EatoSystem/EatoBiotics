/**
 * The membership tier vocabulary — pure, and safe to import from a client
 * component.
 *
 * `lib/membership.ts` imports `getSupabase()` (the service-role client) and its
 * own docstring says "Never import getSupabase() on the client side". But the
 * tier NAMES are needed on both sides: `report-membership-cta.tsx` is a
 * `"use client"` component that has to know whether a viewer already has paid
 * access before it shows them an upsell.
 *
 * Importing `lib/membership` there pulled a server-oriented module — and its
 * Supabase dependency — into a client component. Splitting the vocabulary out
 * is not duplication: `lib/membership.ts` re-exports these, so there is still
 * exactly one definition and every existing server caller is unaffected.
 *
 * Nothing here reads the environment, touches Supabase, or makes an access
 * DECISION. Deciding what a tier may do stays in lib/membership.ts, where the
 * grace-period logic and the feature matrix live.
 */

/** Full set of tiers. trial / member are the current model; grow/restore/transform are legacy. */
export type MembershipTier = "free" | "trial" | "member" | "grow" | "restore" | "transform"

export type MembershipStatus = "active" | "inactive" | "cancelled" | "past_due"

/**
 * Every tier that carries paid access, current and legacy.
 *
 * Legacy tiers stay in the list deliberately: those subscribers still have
 * access, and dropping them here would present an upsell to someone already
 * paying. Retired as a purchase option ≠ retired as an entitlement.
 */
export const PAID_TIERS: MembershipTier[] = ["trial", "member", "grow", "restore", "transform"]

/** Does this tier value — from a DB row, so `string`-typed — carry paid access? */
export function isPaidTierName(tier: string | null | undefined): boolean {
  return Boolean(tier && (PAID_TIERS as readonly string[]).includes(tier))
}

/**
 * The current Member price, in euro per month.
 *
 * Lives here rather than in lib/membership.ts because the pricing page, the
 * report CTA and the account cards are all client components — the same reason
 * the tier names moved. `TIER_META.member` in lib/membership.ts derives its
 * display string from this, so the number has exactly one definition.
 *
 * The legacy Grow/Restore/Transform prices deliberately do NOT get constants.
 * They are not offers any more; they survive only as the historical price of an
 * entitlement someone already holds, and giving them a named export here would
 * invite a surface to quote one as though it were purchasable.
 */
export const MEMBER_PRICE_EUR = 24.99
