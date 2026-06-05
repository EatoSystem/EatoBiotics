"use client"

import posthog from "posthog-js"
import { PostHogProvider } from "posthog-js/react"
import { useEffect } from "react"
import { EB_CONSENT_EVENT, getConsent } from "@/lib/consent"

/* ── PostHog Provider ────────────────────────────────────────────────────
   Initialises PostHog ONLY after the user has accepted cookies (consent
   gating). Until then no analytics fire. When the user accepts, the cookie
   banner dispatches EB_CONSENT_EVENT and we initialise without a reload.
   `posthog.capture(...)` calls before init are safely queued/no-op'd.
────────────────────────────────────────────────────────────────────── */

export function PHProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST
    if (!key) return // not configured (dev / missing env)

    let started = false
    const start = () => {
      if (started || getConsent() !== "accepted") return
      started = true
      posthog.init(key, {
        api_host: host ?? "https://eu.i.posthog.com",
        person_profiles: "identified_only",
        // We fire $pageview manually via PostHogPageview to support App Router
        capture_pageview: false,
        capture_pageleave: true,
        session_recording: { maskAllInputs: true },
      })
    }

    start() // already-consented returning visitors
    window.addEventListener(EB_CONSENT_EVENT, start)
    return () => window.removeEventListener(EB_CONSENT_EVENT, start)
  }, [])

  return <PostHogProvider client={posthog}>{children}</PostHogProvider>
}
