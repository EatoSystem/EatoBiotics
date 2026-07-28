import type { Metadata } from "next"
import { Hero } from "@/components/newdemo/hero"
import { Process } from "@/components/newdemo/process"
import { Score } from "@/components/newdemo/score"
import { GlobalLocal } from "@/components/newdemo/global-local"
import { Foundation } from "@/components/newdemo/foundation"
import { DigitalTwin } from "@/components/newdemo/digital-twin"
import { Begin } from "@/components/newdemo/begin"
import { StickyCta } from "@/components/newdemo/sticky-cta"

/*
 * A restructure-and-reduction pass on the homepage, for review against `/`.
 * Production is untouched — every section here is a copy under
 * components/newdemo/, so nothing shared with `/`, `/c/[country]` or `/enter`
 * was modified.
 *
 * Seven sections, down from production's eleven. Five substantive corrections
 * drive the order:
 *   1. Postbiotics accuracy — no food is described as a postbiotic (see
 *      components/newdemo/foundation.tsx for the full rule)
 *   2. Score↔Twin relationship — stated in §2, echoed in §6
 *   3. Two competing frameworks split by role — §2 is what EatoBiotics does,
 *      §5 is what the user does, and they share no vocabulary
 *   4. Pathway sprawl — eleven tiles reduced to You + Family plus one line
 *   5. Global/local moved from ~85% scroll to position four
 *
 * Dropped from production: PowersEverything (§2 covers the same ground more
 * briefly) and StateOfProduct (build status, not visitor-facing).
 *
 * Two dark bands only: §4 and §7d.
 */
export const metadata: Metadata = {
  title: "Homepage concept — EatoBiotics",
  description: "Internal homepage concept for review. Not a public page.",
  robots: { index: false, follow: false },
}

export default function NewDemoPage() {
  return (
    <div className="bg-white">
      {/* Appears once the hero scrolls out of view. Portals to document.body —
          see components/newdemo/sticky-cta.tsx for why fixed positioning cannot
          live inside <main> on this site. */}
      <StickyCta watchId="newdemo-hero" />

      <Hero />
      <Process />
      <Score />
      <GlobalLocal />
      <Foundation />
      <DigitalTwin />
      <Begin />
    </div>
  )
}
