import type Stripe from "stripe"

export type PaidReportTier = "personal" | "starter" | "full" | "premium"

/** Foundation/add-on architecture carried through checkout (kept as local unions
 *  so this payment helper stays decoupled from the assessment registry). */
export type PaidReportFoundation = "you" | "family"
export type PaidReportAddon = "stability" | "glucose" | "mind" | "performance"

export type PaidReportSummary = {
  tier: PaidReportTier
  overall: number
  subScores: Record<string, number>
  profile: {
    type: string
    tagline: string
    description: string
    color?: string
  }
  email?: string | null
  /** Which foundation assessment this report is built from ("you"/"family"). */
  foundationType?: PaidReportFoundation | null
  /** Optional deeper-support add-on selected at checkout. */
  selectedAddon?: PaidReportAddon | null
}

const VALID_TIERS: PaidReportTier[] = ["personal", "starter", "full", "premium"]
const VALID_FOUNDATIONS: PaidReportFoundation[] = ["you", "family"]
const VALID_ADDONS: PaidReportAddon[] = ["stability", "glucose", "mind", "performance"]

function isPaidReportTier(value: unknown): value is PaidReportTier {
  return typeof value === "string" && VALID_TIERS.includes(value as PaidReportTier)
}

function asFoundation(value: unknown): PaidReportFoundation | null {
  return typeof value === "string" && VALID_FOUNDATIONS.includes(value as PaidReportFoundation)
    ? (value as PaidReportFoundation)
    : null
}

function asAddon(value: unknown): PaidReportAddon | null {
  return typeof value === "string" && VALID_ADDONS.includes(value as PaidReportAddon)
    ? (value as PaidReportAddon)
    : null
}

export function encodePaidReportSummary(summary: PaidReportSummary): string {
  return Buffer.from(JSON.stringify(summary), "utf-8").toString("base64")
}

export function decodePaidReportSummary(encoded: string | null | undefined): PaidReportSummary | null {
  if (!encoded) return null

  try {
    const parsed = JSON.parse(Buffer.from(encoded, "base64").toString("utf-8")) as Partial<PaidReportSummary>

    if (!isPaidReportTier(parsed.tier)) return null
    if (typeof parsed.overall !== "number") return null
    if (!parsed.subScores || typeof parsed.subScores !== "object") return null
    if (!parsed.profile || typeof parsed.profile !== "object") return null
    if (typeof parsed.profile.type !== "string") return null
    if (typeof parsed.profile.tagline !== "string") return null
    if (typeof parsed.profile.description !== "string") return null

    return {
      tier: parsed.tier,
      overall: parsed.overall,
      subScores: parsed.subScores as Record<string, number>,
      profile: {
        type: parsed.profile.type,
        tagline: parsed.profile.tagline,
        description: parsed.profile.description,
        color: typeof parsed.profile.color === "string" ? parsed.profile.color : undefined,
      },
      email: typeof parsed.email === "string" ? parsed.email : null,
      // Optional + backward compatible: legacy sessions simply omit these.
      foundationType: asFoundation(parsed.foundationType),
      selectedAddon: asAddon(parsed.selectedAddon),
    }
  } catch {
    return null
  }
}

export function getPaidReportSummaryFromSession(session: Stripe.Checkout.Session): PaidReportSummary | null {
  // New MVP flow stores the payload in metadata because Stripe limits client_reference_id to 200 chars.
  // The legacy client_reference_id fallback keeps older checkout sessions readable.
  return decodePaidReportSummary(session.metadata?.result_summary ?? session.client_reference_id)
}

export function isCheckoutSessionSettled(session: Stripe.Checkout.Session): boolean {
  // Stripe may mark 100% promo-code checkouts as "no_payment_required".
  // Treat that as settled so free-code demos unlock the paid report flow.
  return session.payment_status === "paid" || session.payment_status === "no_payment_required"
}

export function displayTierForReport(tier: PaidReportTier): "starter" | "full" | "premium" {
  if (tier === "starter") return "starter"
  if (tier === "premium") return "premium"
  return "full"
}
