import type { SupabaseClient } from "@supabase/supabase-js"

/* ── Post-auth account reconciliation ─────────────────────────────────────
   The single source of truth for what must happen the moment a user is
   authenticated, regardless of *how* they signed in:

     • magic link  → `app/auth/callback/page.tsx` → POST /api/auth/setup-profile
     • OAuth code  → GET /api/auth/callback

   Both paths now funnel through `reconcileAccountAfterAuth` so they can't drift.
   Everything here is idempotent and safe to run on every sign-in:

     1. Link any `leads` / `deep_assessments` rows that share this email but were
        created before the account existed (anonymous assessment → later signup).
     2. Activate the deferred 30-day report trial: a paid one-time report creates
        a `deep_assessments` row at checkout time. If the buyer had no account
        yet, the Stripe webhook can't grant access — it's granted here instead,
        the first time they sign in. See `decideTrialActivation` for the guards.

   Health data is never logged; emails are masked. Failures are swallowed so a
   reconciliation hiccup never blocks the sign-in redirect.
──────────────────────────────────────────────────────────────────────── */

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000

/** Tiers that may be upgraded to a report trial. A paying subscriber
 *  (member/grow/restore/transform) must never be downgraded to "trial". */
const TRIAL_ELIGIBLE_TIERS = ["free", "trial"]

export interface TrialDecision {
  activate: boolean
  /** ISO timestamp for `trial_expires_at` when `activate` is true. */
  expiresAt?: string
}

/**
 * Pure decision for the deferred report trial. Extracted so it can be unit
 * tested without a database.
 *
 * - Only `free`/`trial` accounts are eligible (never downgrade a subscriber).
 * - Requires the user to actually have a paid report on file.
 * - Never *shortens* an existing trial: if the current expiry is already later
 *   than the proposed +30d, leave it. This also makes repeated calls idempotent.
 */
export function decideTrialActivation(
  currentTier: string | null | undefined,
  currentExpiry: string | null | undefined,
  hasPaidReport: boolean,
  now: number = Date.now()
): TrialDecision {
  if (!hasPaidReport) return { activate: false }
  const tier = currentTier ?? "free"
  if (!TRIAL_ELIGIBLE_TIERS.includes(tier)) return { activate: false }

  const proposed = now + THIRTY_DAYS_MS
  if (currentExpiry) {
    const existing = new Date(currentExpiry).getTime()
    if (!Number.isNaN(existing) && existing >= proposed) {
      // Already has equal/longer access — nothing to do.
      return { activate: false }
    }
  }
  return { activate: true, expiresAt: new Date(proposed).toISOString() }
}

/** Mask an email for logs: `jason@example.com` → `j***@example.com`. */
function maskEmail(email: string): string {
  const [local, domain] = email.split("@")
  if (!domain) return "***"
  return `${local.slice(0, 1)}***@${domain}`
}

export interface ReconcileResult {
  trialGranted: boolean
  linkedReports: number
}

/**
 * Idempotently link prior assessments and activate the deferred report trial.
 * Call AFTER the profile row exists (the callers create it). Never throws.
 */
export async function reconcileAccountAfterAuth(
  adminSupabase: SupabaseClient,
  userId: string,
  email: string
): Promise<ReconcileResult> {
  const normalisedEmail = email.toLowerCase().trim()
  const result: ReconcileResult = { trialGranted: false, linkedReports: 0 }

  try {
    // 1. Link prior anonymous rows for this email (runs every sign-in so
    //    assessments taken after account creation are linked too).
    await adminSupabase
      .from("leads")
      .update({ user_id: userId })
      .eq("email", normalisedEmail)
      .is("user_id", null)

    await adminSupabase
      .from("deep_assessments")
      .update({ user_id: userId })
      .eq("email", normalisedEmail)
      .is("user_id", null)

    // 2. Deferred trial activation. Presence of a deep_assessments row means the
    //    user paid for a report (those rows are only created at checkout time).
    const { count: paidReportCount } = await adminSupabase
      .from("deep_assessments")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)

    result.linkedReports = paidReportCount ?? 0

    const { data: profile } = await adminSupabase
      .from("profiles")
      .select("membership_tier, trial_expires_at")
      .eq("id", userId)
      .maybeSingle()

    const decision = decideTrialActivation(
      profile?.membership_tier as string | null,
      profile?.trial_expires_at as string | null,
      (paidReportCount ?? 0) > 0
    )

    if (decision.activate) {
      await adminSupabase
        .from("profiles")
        .update({
          membership_tier: "trial",
          membership_status: "active",
          trial_expires_at: decision.expiresAt,
        })
        .eq("id", userId)
      result.trialGranted = true
      console.log(`[reconcile-account] report trial activated for ${maskEmail(normalisedEmail)}`)
    }
  } catch (err) {
    // Non-fatal: never block the sign-in redirect on a reconciliation error.
    console.error(`[reconcile-account] failed for ${maskEmail(normalisedEmail)}:`, err)
  }

  return result
}
