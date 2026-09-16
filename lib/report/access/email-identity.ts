/**
 * Email as an ownership proof — Phase 4B-S1.
 *
 * ══ WHY NORMALISATION IS NOT COSMETIC HERE ══════════════════════════════════
 *
 * Everywhere else in this codebase an email is a delivery address, and
 * `toLowerCase().trim()` is enough. Here it decides whether somebody may read
 * health-derived content about another person, so two strings that a human
 * would read as the same address must compare equal, and two that merely LOOK
 * the same must not be assumed to be.
 *
 * `NFKC` is what closes the second half: without it, compatibility-equivalent
 * codepoints produce byte-different strings that render identically, and an
 * equality check becomes a check on which encoding somebody happened to type.
 *
 * ══ RELATIONSHIP TO THE EXISTING WEBHOOK WRITE ══════════════════════════════
 *
 * `app/api/stripe/webhook/route.ts` writes `email.toLowerCase().trim()`, which
 * differs from this function only for inputs that are not already NFKC-stable.
 * That divergence cannot affect a decision, because every comparison in
 * `recovery-identity.ts` normalises BOTH sides with this function — the stored
 * bytes are never compared raw. A late webhook upsert may therefore rewrite a
 * stored address into its own form without changing who owns anything.
 */

/**
 * The minimum an address must satisfy to be usable as an identity.
 *
 * Deliberately structural rather than clever. Elaborate email regexes reject
 * valid addresses, and this is not validating a signup form — it is refusing to
 * treat something that cannot possibly be an email as proof of control of an
 * email. Anything rejected here returns null, which routes a finalisation to
 * "no recovery identity" rather than to a recovery identity nobody can use.
 */
function structurallyUsable(candidate: string): boolean {
  if (candidate.length === 0 || candidate.length > 320) return false
  if (/\s/.test(candidate)) return false
  const at = candidate.indexOf("@")
  if (at <= 0) return false
  if (candidate.indexOf("@", at + 1) !== -1) return false
  return at < candidate.length - 1
}

/**
 * Trim, NFKC, lowercase — in that order.
 *
 * Case folding after normalisation rather than before: NFKC can change which
 * codepoints are present, so lowercasing first would fold a character that
 * normalisation was about to replace.
 *
 * Returns null for absent, blank or structurally impossible input, so callers
 * get one "no identity" value instead of having to distinguish `null`,
 * `undefined` and `""` themselves.
 */
export function normaliseEmail(value: string | null | undefined): string | null {
  if (typeof value !== "string") return null
  const normalised = value.trim().normalize("NFKC").toLowerCase()
  return structurallyUsable(normalised) ? normalised : null
}

/** The three places a settled Checkout Session can carry an address. */
export interface PurchaseEmailSources {
  /** The resolved paid-report summary's email — the EatoBiotics-side record. */
  readonly summaryEmail?: string | null
  /** `session.customer_details.email` — what Stripe collected at payment. */
  readonly customerDetailsEmail?: string | null
  /** `session.customer_email` — what checkout was created with. */
  readonly customerEmail?: string | null
}

/**
 * The purchase-side recovery candidate, in frozen precedence order.
 *
 *     summary.email → customer_details.email → customer_email → null
 *
 * This is the precedence `app/api/stripe/webhook/route.ts:104` already uses, and
 * it is mirrored rather than reinvented: two definitions of "the purchase email"
 * that disagree would be two definitions of who owns a Report.
 *
 * A source that normalises to null FALLS THROUGH to the next one. An unusable
 * value is not a decision to have no identity — it is one source failing, and
 * the next source is still there.
 *
 * Note what this function does NOT do: it never outranks an address the
 * customer already gave us. That precedence lives in `recovery-identity.ts`,
 * where the assessment's own email wins whenever it is present.
 */
export function canonicalPurchaseEmail(sources: PurchaseEmailSources): string | null {
  return (
    normaliseEmail(sources.summaryEmail) ??
    normaliseEmail(sources.customerDetailsEmail) ??
    normaliseEmail(sources.customerEmail) ??
    null
  )
}

/** Equality between two addresses, each normalised first. Null never matches. */
export function sameEmailIdentity(
  left: string | null | undefined,
  right: string | null | undefined,
): boolean {
  const a = normaliseEmail(left)
  const b = normaliseEmail(right)
  return a !== null && b !== null && a === b
}
