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
 * Resolves when a checkout actually happened, from its session id.
 *
 * Injected rather than imported so this module keeps no payment dependency and
 * stays testable without one. The auth routes supply the real implementation.
 */
export type PurchasedAtResolver = (sessionId: string) => Promise<string | null>

/** At most this many sessions are resolved per sign-in. */
const MAX_SESSIONS_RESOLVED = 5

/**
 * The qualifying purchase for the entitlement decision: the most recent time
 * at which one of this account's paid checkouts actually happened.
 *
 * ══ WHY THIS IS NOT `deep_assessments.created_at` ═══════════════════════════
 *
 * Because that column is "when this row was first written", and three
 * different writers can write it first: the Stripe webhook (seconds after
 * settlement), the question generator, and the Consultation claimer. The
 * `success_url` sends the buyer straight to `/assessment/deep`, so in the
 * healthy case the webhook and the questionnaire race within seconds and the
 * row lands next to the purchase either way — which is exactly why anchoring
 * to it looked correct.
 *
 * But the identity repair above exists BECAUSE the webhook may never run. In
 * that case the row is created whenever the buyer gets round to starting, and
 * a buyer who purchased on day 0 and opened the questionnaire on day 10 would
 * be granted access until day 40. Durable is not the same as meaning the
 * purchase, and the first version of this function confused the two.
 *
 * The durable record of the purchase is Stripe's own Checkout Session, and
 * `deep_assessments.stripe_session_id` is a durable key into it. `created` on
 * a session we have already proven settled is:
 *
 *   • present on EVERY settled session, including a 100%-promo
 *     `no_payment_required` one, which has no PaymentIntent to read instead;
 *   • never later than settlement, and bounded before it — a Checkout Session
 *     expires 24h after creation, so a session that settled did so within 24h;
 *   • identical across every delivery, redelivery and later read, which is
 *     what makes repeated calls idempotent.
 *
 * Most recent, not earliest, because a genuine second purchase should open a
 * new window from itself.
 *
 * Returns null when no purchase time can be established — which
 * `decideTrialActivation` treats as "grant nothing". It must never fall back to
 * the row or to the clock: that fallback IS the defect.
 */
export async function latestPurchaseAt(
  rows: { stripe_session_id?: string | null }[] | null | undefined,
  resolve: PurchasedAtResolver,
): Promise<string | null> {
  const sessionIds = [
    ...new Set(
      (rows ?? [])
        .map((r) => r?.stripe_session_id)
        .filter((id): id is string => typeof id === "string" && id.length > 0),
    ),
  ].slice(0, MAX_SESSIONS_RESOLVED)

  let latest: string | null = null
  let latestMs = -Infinity

  for (const sessionId of sessionIds) {
    let purchasedAt: string | null = null
    try {
      purchasedAt = await resolve(sessionId)
    } catch {
      // An unreachable payment provider is not evidence of a purchase time.
      continue
    }
    if (!purchasedAt) continue
    const ms = new Date(purchasedAt).getTime()
    if (Number.isNaN(ms) || ms <= latestMs) continue
    latestMs = ms
    latest = purchasedAt
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
  email: string,
  options?: {
    /**
     * How to find out when a checkout actually happened. Without it no
     * entitlement is granted here — deliberately: the alternative is to guess
     * from a row timestamp, which is the defect this repair exists for.
     */
    resolvePurchasedAt?: PurchasedAtResolver
  }
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
      .select("stripe_session_id")
      .eq("user_id", userId)

    const rows = (paidRows ?? []) as { stripe_session_id?: string | null }[]
    result.linkedReports = rows.length

    const { data: profile } = await adminSupabase
      .from("profiles")
      .select("membership_tier, trial_expires_at")
      .eq("id", userId)
      .maybeSingle()

    // Resolve the purchase time only when a decision is actually live: a paid
    // row exists AND the account is one this could upgrade. A subscriber, or an
    // account with no purchase, needs no call to the payment provider.
    const tier = (profile?.membership_tier as string | null) ?? "free"
    const resolve = options?.resolvePurchasedAt
    const purchasedAt =
      rows.length > 0 && TRIAL_ELIGIBLE_TIERS.includes(tier) && resolve
        ? await latestPurchaseAt(rows, resolve)
        : null

    const decision = decideTrialActivation(
      profile?.membership_tier as string | null,
      profile?.trial_expires_at as string | null,
      purchasedAt
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
