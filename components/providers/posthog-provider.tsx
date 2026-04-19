"use client"

import posthog from "posthog-js"
import { PostHogProvider } from "posthog-js/react"
import { useEffect } from "react"

/* ── PostHog Provider ────────────────────────────────────────────────────
   Initialises PostHog once on the client.
   Wrap the entire app in this so every page and component can use
   usePostHog() or posthog.capture() directly.
────────────────────────────────────────────────────────────────────── */

export function PHProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST

    if (!key) {
      // PostHog key not set — analytics disabled (dev or missing env var)
      return
    }

    posthog.init(key, {
      api_host: host ?? "https://eu.i.posthog.com",
      person_profiles: "identified_only",
      // We fire $pageview manually via PostHogPageview to support App Router
      capture_pageview: false,
      capture_pageleave: true,
      session_recording: {
        maskAllInputs: true,
      },
    })
  }, [])

  return <PostHogProvider client={posthog}>{children}</PostHogProvider>
}
