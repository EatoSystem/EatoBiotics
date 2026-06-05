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
