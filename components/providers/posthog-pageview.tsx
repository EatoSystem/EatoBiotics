"use client"

import { usePathname, useSearchParams } from "next/navigation"
import { usePostHog } from "posthog-js/react"
import { useEffect } from "react"

/* ── PostHog Pageview ────────────────────────────────────────────────────
   Next.js App Router doesn't trigger auto-pageview on navigation.
   This component fires a manual $pageview on every pathname/searchParams
   change. Wrap it in <Suspense> in layout.tsx (useSearchParams suspends).
────────────────────────────────────────────────────────────────────── */

export function PostHogPageview() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const posthog = usePostHog()

  useEffect(() => {
    if (!posthog) return
    if (pathname) {
      let url = window.location.origin + pathname
      const search = searchParams?.toString()
      if (search) url += `?${search}`
      posthog.capture("$pageview", { $current_url: url })
    }
  }, [pathname, searchParams, posthog])

  return null
}
