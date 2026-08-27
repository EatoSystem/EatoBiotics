"use client"

import { useEffect, useState } from "react"
import { EB_CONSENT_EVENT, getConsent } from "@/lib/consent"

/**
 * True once the visitor has accepted analytics cookies.
 *
 * `components/providers/posthog-provider.tsx` already did this correctly, in an
 * effect of its own. Statsig and Vercel Analytics did not: Statsig initialised
 * whenever `NEXT_PUBLIC_STATSIG_CLIENT_KEY` was set and then synced the real
 * Supabase user id and email into it, and `<Analytics />` was mounted
 * unconditionally in the root layout. So `app/privacy/page.tsx` §8 — "Analytics
 * cookies … only placed with your consent" — was true of one of the three.
 *
 * This exists so the rule is stated once rather than copied a third time.
 *
 * Always starts `false`, including on the server and on the first client render.
 * That keeps the markup identical across the hydration boundary (localStorage is
 * unreadable during SSR, so any other initial value would mismatch) and means
 * the safe answer is the one given before anything is known.
 */
export function useAnalyticsConsent(): boolean {
  const [accepted, setAccepted] = useState(false)

  useEffect(() => {
    const sync = () => setAccepted(getConsent() === "accepted")
    sync() // returning visitor who already accepted
    window.addEventListener(EB_CONSENT_EVENT, sync)
    return () => window.removeEventListener(EB_CONSENT_EVENT, sync)
  }, [])

  return accepted
}
