"use client"

import { FoodSystemExperience } from "@/components/waitlist/food-system-experience"

/**
 * The top of the holding page.
 *
 * ── Why this file is now four lines ─────────────────────────────────────────
 *
 * It used to lay out a two-column hero with the discovery quiz mounted beside
 * the figure as a card. Two things competed: the proposition and a form. The
 * hero is now VISUAL + MESSAGE + CTA, and choosing the CTA replaces the hero
 * with the assessment in place rather than navigating away — so the layout is
 * not a hero containing a flow, it is one flow whose first state is the hero.
 * FoodSystemExperience owns all of it.
 *
 * ── What left, and where it went ────────────────────────────────────────────
 *
 * `foundingAccessDeadline` used to add "Founding access closes <date>" here.
 * It is gone from this page: a date-framed deadline and a counted cohort are
 * two different scarcity stories, and running both at once means neither is
 * the reason to act. The cohort is counted, so the cohort wins. The function
 * moved to lib/waitlist/founding-access.ts, where its docblock records that
 * nothing renders it today — an unused export nobody can explain is worse
 * than one that explains itself.
 *
 * `EarlyAccessBadge` and `EarlyAccessNote` are replaced by CohortLine
 * (components/waitlist/cohort-line.tsx), which keeps the rule they existed to
 * enforce: render nothing at all when the count is unknown.
 *
 * The `#start` anchor is what the First Course section's CTA scrolls to.
 */
export function WaitlistHero() {
  return (
    <div id="start">
      <FoodSystemExperience />
    </div>
  )
}
