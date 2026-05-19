import type Stripe from "stripe"

export type PaidReportTier = "personal" | "starter" | "full" | "premium"

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
}

const VALID_TIERS: PaidReportTier[] = ["personal", "starter", "full", "premium"]

function isPaidReportTier(value: unknown): value is PaidReportTier {
  return typeof value === "string" && VALID_TIERS.includes(value as PaidReportTier)
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

export function displayTierForReport(tier: PaidReportTier): "starter" | "full" | "premium" {
  if (tier === "starter") return "starter"
  if (tier === "premium") return "premium"
  return "full"
}
