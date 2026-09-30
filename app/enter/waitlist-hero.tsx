"use client"

import { useCallback, useState } from "react"
import { FoodSystemExperience } from "@/components/waitlist/food-system-experience"
import { HundredSystems } from "@/components/waitlist/hundred-systems"

/**
 * The top of the holding page: the hero, and 100 Systems beneath it.
 *
 * ── Why this file holds state at all ────────────────────────────────────────
 *
 * It used to be four lines wrapping the experience. The experience replaces
 * the hero IN PLACE — the page is not a hero containing a flow, it is one flow
 * whose first state is the hero — and 100 Systems now sits directly under it.
 *
 * So the two have to know about each other exactly once: while someone is
 * answering question three, "Add My System" must not be sitting underneath the
 * question competing for the same decision. One boolean, owned here, is the
 * whole seam. The phase machine stays inside the experience where every other
 * transition lives; this only learns whether the hero is still the hero.
 *
 * `useCallback` because the experience notifies through an effect keyed on the
 * callback — a new function each render would fire it on every render.
 *
 * ── What left, and where it went ────────────────────────────────────────────
 *
 * `foundingAccessDeadline` used to add "Founding access closes <date>" here.
 * It is gone from this page: a date-framed deadline and a counted programme
 * are two different scarcity stories, and running both means neither is the
 * reason to act. The count is real, so the count wins. The function lives on
 * in lib/waitlist/founding-access.ts, whose docblock records that nothing
 * renders it.
 *
 * The `#start` anchor is what the 100 Systems CTA scrolls to.
 */
export function WaitlistHero() {
  const [idle, setIdle] = useState(true)
  const onIdleChange = useCallback((next: boolean) => setIdle(next), [])

  return (
    <>
      <div id="start">
        <FoodSystemExperience onIdleChange={onIdleChange} />
      </div>
      {idle ? <HundredSystems /> : null}
    </>
  )
}
