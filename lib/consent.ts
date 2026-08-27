/**
 * Cookie-consent constants shared between the banner (components/cookie-consent.tsx)
 * and the analytics providers. Analytics must not initialise until consent is
 * "accepted".
 */
export const EB_CONSENT_KEY = "eb_cookie_consent"

/** Stored values for EB_CONSENT_KEY. */
export type ConsentValue = "accepted" | "declined"

/** Dispatched on window when the user accepts, so providers can init without a reload. */
export const EB_CONSENT_EVENT = "eb-consent-accepted"

/**
 * Dispatched on window to reopen the banner after a choice has already been
 * stored — the withdrawal path.
 *
 * GDPR requires withdrawing consent to be as easy as giving it, and the banner
 * renders only while nothing is stored, so once someone accepted there was no
 * way back short of clearing site data. `app/privacy/page.tsx` told them to use
 * "browser settings", which is not a control this Service offers.
 */
export const EB_CONSENT_REOPEN_EVENT = "eb-consent-reopen"

/** Reads the persisted consent value (client-only; null if unset/unavailable). */
export function getConsent(): ConsentValue | null {
  if (typeof window === "undefined") return null
  try {
    const v = localStorage.getItem(EB_CONSENT_KEY)
    return v === "accepted" || v === "declined" ? v : null
  } catch {
    return null
  }
}

/**
 * Persists a choice and notifies anything listening.
 *
 * Only the accept path dispatches EB_CONSENT_EVENT, because that is the only
 * transition a provider can act on live: an SDK that has already initialised
 * and set storage cannot be un-initialised in place. Withdrawal is handled by
 * the caller reloading — see `withdrawConsent`.
 */
export function setConsent(value: ConsentValue): void {
  try {
    localStorage.setItem(EB_CONSENT_KEY, value)
  } catch {
    // Storage unavailable (private mode, blocked cookies). Nothing is persisted,
    // so the banner reappears next visit and no analytics start meanwhile —
    // which is the safe direction to fail in.
  }
  if (value === "accepted") {
    try {
      window.dispatchEvent(new Event(EB_CONSENT_EVENT))
    } catch { /* noop */ }
  }
}

/**
 * Records a withdrawal and reloads, so SDKs started under the previous consent
 * stop running.
 *
 * The reload is the honest part. Without it the page would report "essential
 * only" while PostHog, Statsig and Vercel Analytics carried on for the rest of
 * the session, which is worse than not offering the control at all.
 */
export function withdrawConsent(): void {
  setConsent("declined")
  try {
    window.location.reload()
  } catch { /* noop */ }
}

/** Asks the banner to reappear so a stored choice can be changed. */
export function openConsentPreferences(): void {
  try {
    window.dispatchEvent(new Event(EB_CONSENT_REOPEN_EVENT))
  } catch { /* noop */ }
}
