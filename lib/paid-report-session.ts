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
// Stripe allows 50 metadata keys. The checkout route adds, at most: the chunk
// count, foundation_type, selected_addon, acknowledged_immediate_supply and
// acknowledged_at — five. 43 leaves two spare rather than landing exactly on
// the limit, which is where 45 put it once the consent record was added.
//
// Lowering the ceiling also narrows what the decoder accepts, which is safe: a
// realistic summary measures two chunks (the €49 outage in #243 was a 660-char
// payload), so no live session is anywhere near this bound.
const MAX_SUMMARY_CHUNKS = 43

function isPaidReportTier(value: unknown): value is PaidReportTier {
  return typeof value === "string" && VALID_TIERS.includes(value as PaidReportTier)
}

export function encodePaidReportSummary(summary: PaidReportSummary): string {
  return Buffer.from(JSON.stringify(summary), "utf-8").toString("base64")
}

/*
 * paidReportSummaryMetadata() lived here. It split the base64 summary across
 * numbered Stripe metadata values so the report page could rebuild the report
 * after the redirect — which is how the buyer's score, sub-scores, profile and
 * email ended up in a payment processor (#244).
 *
 * Deleted rather than left unused: an available writer is an invitation to call
 * it again. The summary is now written to paid_report_intents by
 * app/api/checkout/route.ts and Stripe receives only an opaque token.
 *
 * The DECODER below stays. Sessions created before this shipped carry the
 * chunked metadata and nothing else, and their buyers have already paid.
 */

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

/** Metadata key carrying the opaque intent token. Nothing else about the
 *  buyer's answers reaches Stripe. */
export const SUMMARY_TOKEN_KEY = "summary_token"

/** Bytes of entropy in an intent token. 32 bytes → 64 hex chars, inside the
 *  32–128 CHECK on paid_report_intents.token. */
export const SUMMARY_TOKEN_BYTES = 32

/** The narrow slice of a Supabase client the resolver needs — keeps the full
 *  service-role client out of reach of anything downstream, matching the
 *  PdfStorageClient pattern in lib/report/pdf-access.ts. */
export interface PaidReportIntentReader {
  /**
   * Deliberately `unknown` rather than the builder chain this actually calls.
   *
   * Typing the full chain made TypeScript compare it structurally against
   * `SupabaseClient`'s PostgREST generics and give up (TS2589, "type
   * instantiation is excessively deep"). The chain is described by
   * `IntentQuery` below and asserted once, at the single call site — which is
   * where the runtime narrowing happens anyway, since a jsonb column returns
   * `unknown` no matter how it is typed.
   */
  from(table: string): unknown
}

/** The shape `from("paid_report_intents")` is used as. */
type IntentQuery = {
  select(columns: string): {
    eq(column: string, value: string): {
      eq(column: string, value: string): {
        maybeSingle(): PromiseLike<{ data: unknown; error: unknown }>
      }
    }
  }
}

/**
 * The summary for a settled checkout session.
 *
 * Token first, legacy metadata second. The fallback is not optional: sessions
 * created before this deployed carry the chunked metadata and nothing else, and
 * a buyer mid-checkout at deploy time would otherwise lose the report they had
 * already paid for.
 *
 * The lookup matches on the token AND the session id. A token alone would let a
 * leaked token read someone's summary; a session id alone would not prove the
 * row was issued for that session. Requiring both means a token lifted from one
 * checkout cannot be replayed against another.
 *
 * Returns null rather than throwing on a missing row, an unreadable row, or a
 * mismatch — every caller already treats null as "cannot serve this report",
 * which is the safe direction.
 */
export async function resolvePaidReportSummary(
  session: Stripe.Checkout.Session,
  supabase: PaidReportIntentReader | null,
): Promise<PaidReportSummary | null> {
  const token = session.metadata?.[SUMMARY_TOKEN_KEY]

  if (token && supabase) {
    try {
      const query = supabase.from("paid_report_intents") as IntentQuery
      const { data, error } = await query
        .select("summary")
        .eq("token", token)
        .eq("stripe_session_id", session.id)
        .maybeSingle()

      const summary = (data as { summary?: unknown } | null)?.summary
      if (!error && summary) {
        return coercePaidReportSummary(summary)
      }
    } catch {
      // Fall through to the legacy path rather than failing a paid report on a
      // transport error.
    }
  }

  return getPaidReportSummaryFromSession(session)
}

/** Validates a stored summary through the same checks the encoded path uses, so
 *  a hand-edited row cannot put unvalidated values into a paid report. */
export function coercePaidReportSummary(value: unknown): PaidReportSummary | null {
  if (!value || typeof value !== "object") return null
  return decodePaidReportSummary(
    Buffer.from(JSON.stringify(value), "utf-8").toString("base64"),
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
