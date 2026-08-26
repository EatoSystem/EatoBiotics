import type Stripe from "stripe"
import { ADDON_KEYS as CANONICAL_ADDON_KEYS, asAddonType, type AddonType } from "@/lib/addon-types"

export type PaidReportTier = "personal" | "starter" | "full" | "premium"

/** Foundation/Health-system architecture carried through checkout. The add-on
 *  union is an alias of the single definition in lib/addon-types.ts — this name
 *  is kept because it is the wire vocabulary used in Stripe metadata. */
export type PaidReportFoundation = "you" | "family"
export type PaidReportHealthSystem = AddonType

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
  /** Optional deeper-support Health system selected at checkout (wire key kept
   *  as `selectedAddon` for backward-compatible Stripe metadata / DB payloads). */
  selectedAddon?: PaidReportHealthSystem | null
}

const VALID_FOUNDATIONS: PaidReportFoundation[] = ["you", "family"]

/**
 * The ONLY validators for these two values.
 *
 * Exported because they were being re-implemented at every boundary — checkout
 * carried its own `HEALTH_SYSTEMS` array and submit-deep-assessment its own
 * inline union, so "which add-ons exist" was stated in three places and could
 * drift. Anything accepting a foundation or add-on from a request body, a
 * Stripe payload or a stored row must funnel through these: unknown values
 * become `null` rather than flowing on as an unrecognised string.
 */
export function asFoundation(value: unknown): PaidReportFoundation | null {
  return typeof value === "string" && VALID_FOUNDATIONS.includes(value as PaidReportFoundation)
    ? (value as PaidReportFoundation)
    : null
}

export const asAddon = asAddonType

/** Every add-on, in a stable order — for iteration in UI and tests. */
export const ADDON_KEYS = CANONICAL_ADDON_KEYS

const VALID_TIERS: PaidReportTier[] = ["personal", "starter", "full", "premium"]
export const STRIPE_METADATA_VALUE_LIMIT = 500

const SUMMARY_METADATA_KEY = "result_summary"
const SUMMARY_CHUNK_COUNT_KEY = "result_summary_parts"
const SUMMARY_CHUNK_PREFIX = "result_summary_"
// Stripe allows 50 metadata keys. Leave room for the count key plus the
// duplicated foundation/add-on dashboard fields the checkout route adds.
const MAX_SUMMARY_CHUNKS = 45

function isPaidReportTier(value: unknown): value is PaidReportTier {
  return typeof value === "string" && VALID_TIERS.includes(value as PaidReportTier)
}

export function encodePaidReportSummary(summary: PaidReportSummary): string {
  return Buffer.from(JSON.stringify(summary), "utf-8").toString("base64")
}

export function paidReportSummaryMetadata(summary: PaidReportSummary): Record<string, string> {
  const encoded = encodePaidReportSummary(summary)
  const chunks = encoded.match(new RegExp(`.{1,${STRIPE_METADATA_VALUE_LIMIT}}`, "g")) ?? []

  if (chunks.length === 0 || chunks.length > MAX_SUMMARY_CHUNKS) {
    throw new Error("Paid report summary is too large for Stripe metadata")
  }

  return chunks.reduce<Record<string, string>>(
    (metadata, chunk, index) => {
      metadata[`${SUMMARY_CHUNK_PREFIX}${index}`] = chunk
      return metadata
    },
    { [SUMMARY_CHUNK_COUNT_KEY]: String(chunks.length) }
  )
}

function encodedPaidReportSummaryFromMetadata(
  metadata: Record<string, string> | null | undefined
): string | null {
  if (!metadata) return null

  const legacySummary = metadata[SUMMARY_METADATA_KEY]
  if (legacySummary) return legacySummary

  const chunkCount = Number(metadata[SUMMARY_CHUNK_COUNT_KEY])
  if (!Number.isInteger(chunkCount) || chunkCount < 1 || chunkCount > MAX_SUMMARY_CHUNKS) {
    return null
  }

  const chunks: string[] = []
  for (let index = 0; index < chunkCount; index++) {
    const chunk = metadata[`${SUMMARY_CHUNK_PREFIX}${index}`]
    if (!chunk || chunk.length > STRIPE_METADATA_VALUE_LIMIT) return null
    chunks.push(chunk)
  }
  return chunks.join("")
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
  // Current sessions split the payload across Stripe metadata values because
  // each individual value is capped at 500 chars. Legacy sessions used either
  // metadata.result_summary or client_reference_id, so both remain readable.
  return decodePaidReportSummary(
    encodedPaidReportSummaryFromMetadata(session.metadata) ?? session.client_reference_id
  )
}

export function getPaidReportSummaryReferenceFromSession(session: Stripe.Checkout.Session): string | null {
  return encodedPaidReportSummaryFromMetadata(session.metadata) ?? session.client_reference_id ?? null
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
