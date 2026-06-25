"use client"

import { ScrollReveal } from "@/components/scroll-reveal"
import { DiscoverFlow } from "@/components/waitlist/discover-flow"

/**
 * Waitlist hero for the gated landing page. The hero IS the "Discover Your Food
 * System Type" flow — a short quiz → profile reveal → waitlist signup that posts
 * to /api/waitlist. Its intro card leads with "Meet the living world inside you",
 * the three biotic engines, and the "Meet my food system" call to action.
 * Everything below it on /enter reuses the real homepage showcase sections.
 */
export function WaitlistHero() {
  return (
    <section className="relative px-6 pt-28 pb-16 md:pt-32 md:pb-20">
      <ScrollReveal className="relative z-10 mx-auto w-full max-w-[520px]">
        <DiscoverFlow />
      </ScrollReveal>
    </section>
  )
}
