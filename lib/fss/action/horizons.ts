import type { TimeHorizon } from "./types"

/* ════════════════════════════════════════════════════════════════════════
   Today · This Week · The next 30 days.

   ══ THE RULE, AND IT IS THE WHOLE FILE ══════════════════════════════════

   A HORIZON SAYS WHEN YOU DO IT. IT NEVER SAYS WHEN IT WORKS.

     permitted   "a spoonful most days this week"          a cadence
     permitted   "one meal, today"                          a cadence
     permitted   "hold it for a month and see what sticks"   a cadence
     REFUSED     "in a week you will feel steadier"          a prediction
     REFUSED     "thirty days to a better gut"               a prediction
     REFUSED     "this should raise your score by 10"        a prediction

   ── Why this needs writing down rather than assuming ─────────────────────

   Because three independent surfaces in this repository forbid attaching a
   timeframe to an action, and this gate introduces three timeframes. The
   surfaces are right and the gate is right, and the only thing that makes both
   true is the distinction above:

     components/assessment/result/one-free-action.tsx
       "No 'raise your score by', no 'fix your gut', no timeframe: an action
        that arrives with a predicted outcome stops being something to try and
        becomes a claim to keep."
     lib/fss/presentation/domains.ts
       "none predicts an outcome, none attaches a timeframe, and none promises
        that a change will raise a score."
     components/home/score-preview.tsx
       records removing "could measurably shift your gut diversity within
        weeks" — and removing ONLY the guarantee, leaving the advice.

   The claims boundary says the same thing from its own side: a prediction is
   not available at all, and the "measured food behaviour" move is.

   ── The one hedged-duration precedent, and its limit ─────────────────────

   `lib/report/build-food-system-report.ts` contains the only sentence in the
   product that names a duration and survives review:

     "Over two to three weeks you may notice changes in digestion, comfort or
      energy steadiness. Treat those as feedback on the change, not as a
      measure of health."

   What makes it legal is the second sentence. It names what a person might
   NOTICE, which is self-report, and then explicitly refuses to let that count
   as a measurement. That is the furthest this layer may go, and it is further
   than anything here currently goes.

   ── What is not here ─────────────────────────────────────────────────────

   No ninety-day horizon, no one-year horizon, no trend, no projection. The
   thirty-day horizon names a reassessment POINT and `ReassessmentPoint` carries
   the comparability rule from `lib/fss/engine/compare.ts`; neither computes a
   comparison. Longitudinal work is My Food System, which this gate stops
   before.
   ════════════════════════════════════════════════════════════════════════ */

export interface TimeHorizonMeta {
  readonly horizon: TimeHorizon
  readonly label: string
  /** What this horizon is for, as a question a person would ask. */
  readonly question: string
  /** The cadence note. Says when to do it; never what it will produce. */
  readonly cadence: string
}

export const TIME_HORIZONS: Record<TimeHorizon, TimeHorizonMeta> = {
  today: {
    horizon: "today",
    label: "Today",
    question: "What is one thing I could do now?",
    cadence: "One thing, once. Small enough that a bad day does not stop it.",
  },
  "this-week": {
    horizon: "this-week",
    label: "This week",
    question: "What could I keep up across the week?",
    cadence: "A few times across the week, attached to meals you already eat.",
  },
  "thirty-days": {
    horizon: "thirty-days",
    label: "The next 30 days",
    question: "What is worth holding long enough to find out?",
    cadence:
      "One behaviour, held for a month. What survives an ordinary week is the part that has actually changed.",
  },
}

/** The order every surface presents them in: nearest first. */
export const TIME_HORIZON_ORDER: readonly TimeHorizon[] = ["today", "this-week", "thirty-days"]

export function timeHorizon(horizon: TimeHorizon): TimeHorizonMeta {
  return TIME_HORIZONS[horizon]
}

/**
 * The horizons this layer deliberately does NOT implement.
 *
 * Recorded as values rather than as a comment so a test can assert the union
 * has no member for them — the same shape as `KNOWN_NON_BAND_LADDERS` in the
 * interpretation module, which records what it is leaving alone so the count
 * is honest.
 */
export const DEFERRED_HORIZONS = [
  { name: "ninety-days", why: "Longitudinal comparison, which belongs to My Food System." },
  { name: "one-year", why: "Same, and it would need a comparability rule across method versions." },
] as const
