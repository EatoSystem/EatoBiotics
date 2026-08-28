"use client"

import { Analytics } from "@vercel/analytics/next"
import { useAnalyticsConsent } from "./use-analytics-consent"

/**
 * Vercel Analytics, mounted only after the visitor accepts analytics cookies.
 *
 * `app/layout.tsx` mounted `<Analytics />` unconditionally, so the script loaded
 * and reported page views for everyone — including visitors who had chosen
 * "Essential only". Vercel Analytics is cookie-less, which is why it was easy to
 * overlook, but it is still analytics processing that the banner and
 * `app/privacy/page.tsx` §8 both said would not happen without consent.
 *
 * The layout is a server component, so the gate needs a client boundary of its
 * own rather than a conditional in the layout.
 */
export function ConsentedAnalytics() {
  const accepted = useAnalyticsConsent()
  if (!accepted) return null
  return <Analytics />
}
