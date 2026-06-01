"use client"

import { useEffect } from "react"
import posthog from "posthog-js"

interface TrackConversionProps {
  /** PostHog event name to fire once on mount. */
  event: string
  /**
   * Optional stable key to prevent re-firing across page reloads/revisits
   * (e.g. a Stripe session or subscription id). Stored in localStorage.
   */
  dedupeKey?: string
  /** Extra properties to attach to the event. */
  properties?: Record<string, unknown>
}

/**
 * Fires a single PostHog conversion event on mount. Rendered from server
 * components on post-payment landing pages, which can't call the browser
 * PostHog SDK directly. Dedupes via localStorage so returning to a settled
 * checkout page doesn't double-count the conversion.
 */
export function TrackConversion({ event, dedupeKey, properties }: TrackConversionProps) {
  useEffect(() => {
    if (dedupeKey) {
      const storeKey = `eb_tracked:${dedupeKey}`
      try {
        if (localStorage.getItem(storeKey)) return
        localStorage.setItem(storeKey, "1")
      } catch {
        /* storage unavailable (private mode) — fall through and still fire */
      }
    }
    posthog.capture(event, properties)
  }, [event, dedupeKey, properties])

  return null
}
