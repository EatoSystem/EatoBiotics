/**
 * EatoBiotics — longitudinal Twin patterns (pure, deterministic).
 *
 * The Twin visibly gets smarter over time: `detectPatterns` reads the member's
 * meal history (up to 30 days from twin-data) and reports only the patterns the
 * data genuinely supports — weekday/weekend gaps, what their best meals share,
 * repeat winners, fortnight food-pattern trends, and weekly rhythm. First-person
 * voice, never medical, silent rather than speculative.
 */

import type { AccountTwinMeal } from "@/lib/agent-loop/account-twin"
import { mealBehaviour, type MealBioticKey } from "@/lib/agent-loop/behaviour"
import { canCompare } from "@/lib/fss/engine/compare"
import { LEGACY_PROVENANCE, type ScoreProvenance } from "@/lib/fss/engine/provenance"

export interface TwinPattern {
  id: string
  title: string
  detail: string
  icon: "momentum" | "biotic" | "streak" | "meal"
}

/* ═══════════════════════════════════════════════════════════════════════════
   GATE 3.6 — the worst of the nine sites, and the last one anybody looked at.

   These titles render in the "what your Food System learned" feed on /account,
   which is V1_CORE. Before this they read:

     "Your Postbiotics climbed 8 points this week"
     "Your Postbiotics slipped 8 points this week"
     "Your best meals lean on Prebiotics"

   The first two are three prohibited things in one sentence: a personal
   Postbiotics state, a number attached to it, and a change claim across two
   weeks. Tranche 1 removed exactly that shape from the pre-launch reveal, 2A
   from /assessment/results, the share card and the generated OG image, and 2C
   from sequence-email.ts. It was still live here because no claims guard had
   ever read this file.

   ── THE NUMBER STAYS, AND THE REASON MATTERS ────────────────────────

   `fortnightTrend` computes a real delta between two averages of measured meal
   sub-scores over two defined seven-day windows. That is a change in REPORTED
   FOOD PATTERNS, which `COMPARISON_LANGUAGE` permits and which the product
   should say. What was never permitted is the Biotic as its subject.

   ── AND BIOTIC_HINT.postbiotic WAS A MECHANISM CLAIM ─────────────────

   It read "your meals feed the producers well" — friendly words for microbial
   production, which POSTBIOTICS_INFERENCE_BOUNDARY lists by name under
   `be-produced-by`. No regex catches it, because it names no Biotic; the pin
   below is what stops it coming back.

   ── REPORTED, NOT FIXED HERE ──────────────────────────────────

   `fortnightTrend` compares two windows with NO method-version check — the
   thing `canCompare` (lib/fss/engine/compare.ts) exists to refuse. It is sound
   today because both windows come from one instrument; it stops being sound
   the moment meal scoring changes version, silently. Wiring `canCompare` into
   the account surface is Gate 5 ("Reassess / What Changed") and would change
   what a live dashboard computes, so it does not belong inside a wording gate.

   ══ GATE 5 — SIX CAUSAL AND OUTCOME CLAIMS, REMOVED ═════════════════════════

   Gate 5 adopts a fifth product rule:

     Compare measurements. Describe observations. Record actions.
     DO NOT INVENT CAUSATION.

   This file was violating it on a live surface before Gate 5 wrote a line.
   `detectPatterns` reaches `app/account/page.tsx` via `buildAccountTwin`, plus
   `/account/this-week` and the weekly `week-inside` email. Six strings, and the
   audit that found them was looking for one:

     "whatever changed, it's working"        causation, stated outright
     "one weekend swap would close most
      of the gap"                            a predicted outcome of an action
     "one targeted meal would bring it back" the same, on the down branch
     "your weekdays would love some of it"   a predicted benefit of transferring
                                             a behaviour
     "a proven winner"                       efficacy, asserted of a meal
     "exactly how I learn what actually
      works for you"                         a claim that this product can
                                             determine what works

   ── WHY ALL SIX RATHER THAN THE ONE THAT WAS REPORTED ─────────────────────

   Because scoping a fix to the form rather than the rule is the failure this
   programme keeps repeating: Tranche 1, 2A and 2C each removed one shape of
   personal-Biotic claim and left the others standing, and Gate 3.6's audit of
   nine sites found fifteen. One sentence here was named in the Gate 5 plan; an
   audit of its class in this file found six.

   ── WHAT THE REPLACEMENTS DO ──────────────────────────────────────────────

   Each states what the logged meals DESCRIBED and stops. Two still name an
   action to try, which is allowed — a suggestion is not a promise — but
   neither says what the action would produce. The trend branches now say "not
   why they changed" in so many words, because this product watched two windows
   of self-logged meals and knows nothing about what happened between them.

   ── WHAT WAS NOT TOUCHED, AND IS REPORTED INSTEAD ─────────────────────────

   Two strings of an adjacent class were found by the same audit and are NOT
   changed here, because this step is scoped to the live `/account` surface:

     `components/account/dashboard-client-data.ts` — "Your inner food system is
     working hard in your favour." A personal-biology claim rather than a causal
     one, on the DEMO-only dashboard (`/account-you`, `/demo/account/[tier]`).

     `lib/email/sequence-email.ts` — "your Biotics Score™ reflects something
     real about how your food system is working."

   Both belong to a claims tranche rather than to this gate, and widening a
   step-0 repair into them without saying so is how scope stops meaning
   anything.
   ══════════════════════════════════════════════════════════════════════════ */

type BioticK = MealBioticKey

/**
 * The closing clause on the best-meals signal.
 *
 * Each names a food category the meal was actually scored on. `postbiotic`
 * no longer claims a meal fed anything: the bucket is polyphenol-rich and
 * resistant-starch foods (lib/biotics-prompt.ts:35), and no food is a
 * postbiotic.
 */
const BIOTIC_HINT: Record<BioticK, string> = {
  prebiotic: "plant variety is your superpower",
  probiotic: "fermented foods are your superpower",
  postbiotic: "polyphenol-rich foods are your superpower",
}

const avg = (xs: number[]) => xs.reduce((s, x) => s + x, 0) / xs.length

const isWeekend = (iso: string) => {
  const d = new Date(iso).getDay()
  return d === 0 || d === 6
}

const dayOf = (iso: string) => new Date(iso).toISOString().slice(0, 10)

function normaliseName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim()
}

/** 1. Weekday vs weekend average gap (needs ≥3 meals on each side, gap ≥5). */
function weekendGap(meals: AccountTwinMeal[]): TwinPattern | null {
  const wd = meals.filter((m) => !isWeekend(m.createdAt)).map((m) => m.score)
  const we = meals.filter((m) => isWeekend(m.createdAt)).map((m) => m.score)
  if (wd.length < 3 || we.length < 3) return null
  const gap = Math.round(avg(wd) - avg(we))
  if (Math.abs(gap) < 5) return null
  return gap > 0
    ? {
        id: "weekend-dip",
        title: `I noticed your weekends dip ${gap} points`,
        detail: "Your weekday meals scored higher than your weekend ones. A weekend meal built like a weekday one is the smallest thing to try.",
        icon: "momentum",
      }
    : {
        id: "weekend-lift",
        title: `Your weekends run ${-gap} points stronger`,
        detail: "Your weekend meals scored higher than your weekday ones. Whatever is different at weekends is the thing to try on a weekday.",
        icon: "momentum",
      }
}

/** 2. What the top-3 meals share (their dominant biotic). Needs ≥3 meals. */
function bestMealSignal(meals: AccountTwinMeal[]): TwinPattern | null {
  if (meals.length < 3) return null
  const top = [...meals].sort((a, b) => b.score - a.score).slice(0, 3)
  const totals: Record<BioticK, number> = { prebiotic: 0, probiotic: 0, postbiotic: 0 }
  for (const m of top) {
    totals.prebiotic += m.prebiotic
    totals.probiotic += m.probiotic
    totals.postbiotic += m.postbiotic
  }
  const lead = (Object.keys(totals) as BioticK[]).sort((a, b) => totals[b] - totals[a])[0]
  return {
    id: `best-lean-${lead}`,
    title: `Your best meals lean on ${mealBehaviour(lead)}`,
    detail: `That is the common thread across your top-scoring meals — ${BIOTIC_HINT[lead]}.`,
    icon: "biotic",
  }
}

/** 3. A repeat winner: the same meal ≥2× with average score ≥70. */
function repeatWinner(meals: AccountTwinMeal[]): TwinPattern | null {
  const groups = new Map<string, AccountTwinMeal[]>()
  for (const m of meals) {
    const k = normaliseName(m.name)
    if (!k) continue
    groups.set(k, [...(groups.get(k) ?? []), m])
  }
  let best: { name: string; score: number; count: number } | null = null
  for (const g of groups.values()) {
    if (g.length < 2) continue
    const a = avg(g.map((m) => m.score))
    if (a >= 70 && (!best || a > best.score)) best = { name: g[0].name, score: Math.round(a), count: g.length }
  }
  if (!best) return null
  return {
    id: "repeat-winner",
    title: `"${best.name}" keeps delivering`,
    detail: `You've logged it ${best.count} times, at an average of ${best.score} — one of your highest-scoring repeats.`,
    icon: "meal",
  }
}

/* ════════════════════════════════════════════════════════════════════════════
   THE MEAL WINDOW'S PROVENANCE — and why it is `legacy-unversioned`.

   Gate 5 step 2c required this comparison to route through the SAME authority
   the candidate product uses, rather than hold a private assumption:

     > There should not be canonical comparison logic and separately
     > agent-loop comparison logic.

   The plan allowed two outcomes and asked for the one that happened to be
   named out loud. THIS IS THE SECOND: the longitudinal claim is REMOVED,
   because the one-rubric assumption could not be verified. Two facts settled
   it, and both were checked rather than assumed:

     1. The `analyses` table records NO rubric version. Its insert writes
        `biotics_score`, `meal_description` and `tier_at_time_of_analysis`
        (`app/api/analyses/log/route.ts`) and nothing about the instrument.
     2. The scoring model is `CLAUDE_MODEL` — an ENVIRONMENT VARIABLE
        (`lib/anthropic.ts`). It can change between one week and the next with
        no code change, no deploy marker and no record on the rows.

   So two seven-day windows may have been scored by different models under
   different prompt text, and which produced a given row cannot be
   established. That is not "probably fine": it is the exact situation
   `LEGACY_UNVERSIONED` was defined for — "the generating method of a
   historical row CANNOT be known, so the honest value is 'we do not know'".

   `canCompare` therefore refuses, permanently, including against another
   window of the same kind. `fortnightTrend` returns null and the pattern does
   not appear. A real number that may be an artefact of a model swap is worse
   than no number, because the person cannot tell which they are looking at.

   ── WHAT WOULD BRING IT BACK, STATED SO IT IS ACTIONABLE ──────────────────

   A rubric version recorded ON THE ROW at analysis time — a column on
   `analyses` naming the prompt version and the model that scored it. Then this
   function returns a real `ScoreProvenance` built from the two windows' rows,
   `canCompare` has something to compare, and the claim returns unchanged. That
   is a migration and a schema decision, so it is not taken here: agent
   sessions are read-only against production, and no column is named for a
   feature this file can live without.
   ════════════════════════════════════════════════════════════════════════════ */

/**
 * What produced the scores in a window of meals.
 *
 * Takes the meals so that a future version can read their recorded rubric
 * version; today there is none to read, and the signature is the honest shape
 * rather than a parameterless constant that would have to change later.
 */
export function mealWindowProvenance(_meals: readonly AccountTwinMeal[]): ScoreProvenance {
  return LEGACY_PROVENANCE
}

/**
 * 4. Fortnight trend — GATED. `detectPatterns` can never return this.
 *
 * The gate and the generator are SPLIT, and the split exists for the guard.
 *
 * Sabotage 1078 restores "Your Prebiotics climbed N points this week" by
 * interpolating `${bestKey}` into the title — so the words "Prebiotics",
 * "Probiotics" and "Postbiotics" appear NOWHERE in this file's source. A
 * source-scanning guard is blind to it; only calling the generator and reading
 * what comes back can see it. That is the Gate 3.6 finding, which caught 1 of 9
 * interpolated claims by scanning the corpus.
 *
 * Gating the generator made the behavioural guard blind too, because
 * `detectPatterns` stopped returning the pattern. So the generator is exported
 * for the guard to call directly, and the gate lives in the caller below.
 *
 * ── THIS EXPORT IS FOR THE GUARD, NOT FOR A SURFACE ───────────────────────
 *
 * `tests/unit/agent-loop-claims.test.ts` asserts that nothing outside the test
 * corpus imports it, so it cannot quietly become a way around the gate.
 */
export function dormantFortnightTrend(
  meals: AccountTwinMeal[],
  now: number,
): TwinPattern | null {
  const week = 7 * 86_400_000
  const recent = meals.filter((m) => now - new Date(m.createdAt).getTime() < week)
  const prior = meals.filter((m) => {
    const age = now - new Date(m.createdAt).getTime()
    return age >= week && age < 2 * week
  })
  if (recent.length < 3 || prior.length < 3) return null


  const keys: BioticK[] = ["prebiotic", "probiotic", "postbiotic"]
  let bestKey: BioticK | null = null
  let bestDelta = 0
  for (const k of keys) {
    const d = avg(recent.map((m) => m[k])) - avg(prior.map((m) => m[k]))
    if (Math.abs(d) > Math.abs(bestDelta)) {
      bestDelta = d
      bestKey = k
    }
  }
  if (!bestKey || Math.abs(bestDelta) < 6) return null
  const rounded = Math.round(bestDelta)
  return rounded > 0
    ? {
        id: `trend-up-${bestKey}`,
        title: `Your meals climbed ${rounded} points on ${mealBehaviour(bestKey)} this week`,
        detail: "Compared with the week before. That is what the meals you logged described, not why they changed.",
        icon: "momentum",
      }
    : {
        id: `trend-down-${bestKey}`,
        title: `Your meals slipped ${-rounded} points on ${mealBehaviour(bestKey)} this week`,
        detail: "Compared with the week before. That is what the meals you logged described, not why they changed.",
        icon: "biotic",
      }
}

/**
 * The gate, and the only thing `detectPatterns` calls.
 *
 * THE VERDICT COMES BEFORE THE GENERATOR RUNS, not after it as a caveat. A
 * function that computes a delta and then decides whether to show it will
 * eventually show it; this one never reaches the arithmetic.
 */
function fortnightTrend(meals: AccountTwinMeal[], now: number): TwinPattern | null {
  const week = 7 * 86_400_000
  const recent = meals.filter((m) => now - new Date(m.createdAt).getTime() < week)
  const prior = meals.filter((m) => {
    const age = now - new Date(m.createdAt).getTime()
    return age >= week && age < 2 * week
  })
  if (!canCompare(mealWindowProvenance(prior), mealWindowProvenance(recent)).comparable) {
    return null
  }
  return dormantFortnightTrend(meals, now)
}

/** 5. Weekly rhythm: meals on ≥4 distinct days in the last 7. */
function weeklyRhythm(meals: AccountTwinMeal[], now: number): TwinPattern | null {
  const week = 7 * 86_400_000
  const days = new Set(
    meals.filter((m) => now - new Date(m.createdAt).getTime() < week).map((m) => dayOf(m.createdAt)),
  )
  if (days.size < 4) return null
  return {
    id: "rhythm",
    title: `You've shown me meals on ${days.size} of the last 7 days`,
    detail: "The more meals I see, the more of your pattern I can describe.",
    icon: "streak",
  }
}

/**
 * All supported patterns, strongest-signal first. `now` is injectable for tests.
 */
export function detectPatterns(meals: AccountTwinMeal[], now: number = Date.now()): TwinPattern[] {
  if (meals.length === 0) return []
  const out: (TwinPattern | null)[] = [
    fortnightTrend(meals, now),
    weekendGap(meals),
    bestMealSignal(meals),
    repeatWinner(meals),
    weeklyRhythm(meals, now),
  ]
  return out.filter((p): p is TwinPattern => p !== null)
}
