import { createHash } from "node:crypto"

/**
 * Affirmative consent to process health data, and the record of it.
 *
 * `app/privacy/page.tsx` §2 calls assessment responses sensitive personal data
 * and says we handle them with additional care. Until now nothing asked the
 * person first, and nothing recorded that they had agreed — so "we treat this
 * as sensitive" was a statement about our intentions rather than about a
 * lawful basis.
 *
 * Applies wherever health-derived answers are collected, not only where money
 * changes hands: the free assessments store scores against an email in `leads`,
 * and the waitlist quiz stores a Food System profile and sub-scores in the same
 * table. Whether someone paid is not what makes the data sensitive.
 *
 * The statement is versioned and hashed because a consent record that does not
 * say WHAT was agreed is not much of a record: a later copy edit would silently
 * reinterpret every consent already given. `HEALTH_CONSENT_VERSION` must be
 * bumped whenever `HEALTH_CONSENT_STATEMENT` changes — a test fails otherwise,
 * by pinning the hash of the current text against the version.
 */

/** Bump whenever the statement text below changes. */
export const HEALTH_CONSENT_VERSION = "2026-08-28.1"

export const HEALTH_CONSENT_STATEMENT =
  "I agree that EatoBiotics may process my answers about my food, digestion and " +
  "wellbeing to produce my results. I understand these are health-related data, " +
  "that they are stored by Supabase in the EU, that an AI provider (Anthropic) " +
  "may be used to generate my report, and that I can withdraw consent and have " +
  "my data deleted at any time from my account or by emailing us."

/** Where the consent was given. Recorded so a gap in one flow is visible. */
export type HealthConsentSource =
  | "assessment_gut"
  | "assessment_mind"
  | "assessment_family"
  | "waitlist"
  | "deep_assessment"

export const HEALTH_CONSENT_SOURCES: HealthConsentSource[] = [
  "assessment_gut",
  "assessment_mind",
  "assessment_family",
  "waitlist",
  "deep_assessment",
]

export function isHealthConsentSource(value: unknown): value is HealthConsentSource {
  return typeof value === "string" && (HEALTH_CONSENT_SOURCES as string[]).includes(value)
}

/** SHA-256 of the exact statement shown, so the record survives copy changes. */
export function healthConsentStatementHash(statement = HEALTH_CONSENT_STATEMENT): string {
  return createHash("sha256").update(statement, "utf8").digest("hex")
}

export const HEALTH_CONSENT_REQUIRED_MESSAGE =
  "Please agree to us processing your answers before continuing."

/** The wire field every client sends and every route checks. */
export const HEALTH_CONSENT_FIELD = "healthDataConsent" as const

/**
 * True only for an explicit `true`.
 *
 * Deliberately strict: the string "true" and a truthy 1 are what a sloppy
 * client sends, and neither is a person ticking a box.
 */
export function hasHealthConsent(value: unknown): boolean {
  return value === true
}

/** The narrow slice of a Supabase client this module needs. */
export interface ConsentWriter {
  from(table: string): unknown
}

type ConsentInsert = {
  insert(row: Record<string, unknown>): PromiseLike<{ error: unknown }>
}

/**
 * Records a consent. Never throws.
 *
 * Returns whether the row landed, so a caller that must fail closed can. The
 * assessment routes deliberately do NOT fail closed on a write error: the
 * person did consent, refusing their assessment because our bookkeeping failed
 * would be a worse outcome than an incomplete audit trail, and the failure is
 * logged for follow-up.
 *
 * NO CALLER CURRENTLY FAILS CLOSED, the paid path included. All three —
 * app/api/checkout, app/api/submit-lead, app/api/waitlist — await this and
 * discard the boolean. That is the intended behaviour and worth stating
 * plainly, because the sentence above reads like a promise that someone does:
 * an earlier version of this comment said the paid path was 'the one where a
 * missing record would matter', which invited exactly that reading. Refusing a
 * paid checkout because an audit insert failed is worse for the buyer than an
 * incomplete trail, and the failure is logged either way.
 *
 * What checkout DOES guarantee is ordering: the row is written before Stripe is
 * called and long before generation begins, so a consent recorded here always
 * precedes the processing it covers.
 */
export async function recordHealthConsent(
  supabase: ConsentWriter | null,
  params: { email?: string | null; userId?: string | null; source: HealthConsentSource },
): Promise<boolean> {
  if (!supabase) return false
  const email = params.email?.toLowerCase().trim() || null
  if (!email && !params.userId) return false

  try {
    const table = supabase.from("consents") as ConsentInsert
    const { error } = await table.insert({
      user_id: params.userId ?? null,
      email,
      kind: "health_processing",
      document_version: HEALTH_CONSENT_VERSION,
      statement_hash: healthConsentStatementHash(),
      source: params.source,
    })
    if (error) {
      console.error("[health-consent] record failed:", (error as { message?: string })?.message)
      return false
    }
    return true
  } catch (err) {
    console.error("[health-consent] record threw:", err)
    return false
  }
}
