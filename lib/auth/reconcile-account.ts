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
 * ══ THE WINDOW IS ANCHORED TO THE PURCHASE, NEVER TO `now` ══════════════════
 *
 * One qualifying €49 purchase grants ONE fixed 30-day window, measured from
 * that purchase. Reconciliation may RECOVER that entitlement; it may never
 * move its expiry forward.
 *
 * This used to compute `now + 30d` and activate whenever that beat the stored
 * expiry — and `reconcileAccountAfterAuth` calls it on EVERY sign-in. So the
 * window slid forward on each visit:
 *
 *     purchase day 0 → day 30 · sign in day 2 → day 32
 *     sign in day 29 → day 59 · sign in day 400 → day 430
 *
 * The "30 days of EatoBiotics access" sold with the Report never expired for
 * anyone who kept signing in, and a redelivered webhook slid it too. The
 * comment here claimed "this also makes repeated calls idempotent"; it was a
 * sliding window, and the claim is what made it survive review. Found in
 * Step 7 by a replay assertion that failed by two milliseconds.
 *
 * Deriving the expiry from `purchasedAt` makes repeated calls genuinely
 * idempotent: the same purchase always computes the same expiry, so the
 * `existing >= proposed` guard below actually holds on the second call.
 *
 * - Only `free`/`trial` accounts are eligible (never downgrade a subscriber).
 * - No qualifying purchase (`purchasedAt` null) → nothing to grant.
 * - An unreadable purchase timestamp fails CLOSED. Granting a fresh window
 *   from `now` is the exact defect being repaired, so it is not the fallback.
 * - A window that has already elapsed is not revived.
 * - A genuine LATER purchase legitimately opens a new window from itself.
 */
export function decideTrialActivation(
  currentTier: string | null | undefined,
  currentExpiry: string | null | undefined,
  /** When the qualifying purchase happened. `null` = no qualifying purchase. */
  purchasedAt: string | number | Date | null | undefined,
  now: number = Date.now()
): TrialDecision {
  if (purchasedAt === null || purchasedAt === undefined) return { activate: false }

  const purchased = new Date(purchasedAt).getTime()
  if (Number.isNaN(purchased)) return { activate: false }

  const tier = currentTier ?? "free"
  if (!TRIAL_ELIGIBLE_TIERS.includes(tier)) return { activate: false }

  const proposed = purchased + THIRTY_DAYS_MS

  // The window this purchase bought has already run out. Signing in later does
  // not revive it.
  if (proposed <= now) return { activate: false }

  if (currentExpiry) {
    const existing = new Date(currentExpiry).getTime()
    if (!Number.isNaN(existing) && existing >= proposed) {
      // Already has equal/longer access — nothing to do. With the expiry
      // anchored to the purchase, this is the branch every repeat call takes.
      return { activate: false }
    }
  }
  return { activate: true, expiresAt: new Date(proposed).toISOString() }
}

/**
 * The qualifying purchase for the entitlement decision: the MOST RECENT paid
 * row's `created_at`.
 *
 * Most recent, not earliest, because a genuine second purchase should open a
 * new window from itself. Exported so the webhook and the sign-in path derive
 * the entitlement from the identical durable record — the two paths sharing
 * one function is what stops them disagreeing about when access ends.
 *
 * Returns null when no row carries a usable timestamp, which
 * `decideTrialActivation` treats as "grant nothing" rather than "grant now".
 */
export function latestPurchaseAt(
  rows: { created_at?: string | null }[] | null | undefined,
): string | null {
  let latest: string | null = null
  let latestMs = -Infinity
  for (const row of rows ?? []) {
    if (!row?.created_at) continue
    const ms = new Date(row.created_at).getTime()
    if (Number.isNaN(ms) || ms <= latestMs) continue
    latestMs = ms
    latest = row.created_at
  }
  return latest
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
    //
    //    The rows are read rather than counted because the DECISION needs the
    //    purchase timestamp, not just its existence — see decideTrialActivation.
    //    `created_at` carries DEFAULT now() and neither writer sets it
    //    explicitly, so it is the durable record of when this purchase landed,
    //    and it is still readable at sign-in long after the Stripe session and
    //    the paid_report_intents row have gone.
    const { data: paidRows } = await adminSupabase
      .from("deep_assessments")
      .select("created_at")
      .eq("user_id", userId)

    const rows = (paidRows ?? []) as { created_at?: string | null }[]
    result.linkedReports = rows.length

    const { data: profile } = await adminSupabase
      .from("profiles")
      .select("membership_tier, trial_expires_at")
      .eq("id", userId)
      .maybeSingle()

    const decision = decideTrialActivation(
      profile?.membership_tier as string | null,
      profile?.trial_expires_at as string | null,
      latestPurchaseAt(rows)
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
