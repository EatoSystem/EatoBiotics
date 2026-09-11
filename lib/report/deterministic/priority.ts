import type { ConsultationAnswers } from "@/lib/consultation/types"

import { canonicalValues } from "./canonical-order"
import { valueIsSilenced } from "./permissions"

/**
 * Where to start — Phase 4A-S2.
 *
 * ══ WHAT "PRIORITY" MEANS HERE ══════════════════════════════════════════════
 *
 * A PRACTICAL STARTING POINT. Explicitly never:
 *   · a biological weakness            · the root cause
 *   · the highest risk                 · a treatment target
 *   · what is damaging their system    · the biggest physiological blocker
 *
 * The Science Contract says this for each contributing question in its own
 * words: `priorityLever` means "PRACTICAL TIMING / FIT", "FIT / RELEVANCE /
 * PRACTICAL STARTING POINT", "a routine the customer themselves reports".
 * Nothing below reads an answer as evidence about a body.
 *
 * ══ WHY A PRECEDENCE LIST AND NOT A RANKING NUMBER ══════════════════════════
 *
 * Any numeric ranking would be a hidden metric over self-reports, deciding
 * what matters most about somebody's eating — the thing this whole
 * architecture refuses. Precedence is instead an ordered list of explicit
 * rules, each naming the question it reads and why it outranks the next. It is
 * visible in the tests, arguable in review, and cannot drift into arithmetic.
 *
 * (The guard for this asserts the module contains no ranking vocabulary at
 * all, so the paragraph above deliberately describes the ban rather than
 * spelling the banned words — a guard that matched its own rationale would be
 * decoration.)
 *
 * ══ THE ORDER, AND ITS ARGUMENT ═════════════════════════════════════════════
 *
 * 1. What the customer SAID they want to work on (`intentions.primaryFocus`).
 *    They are the authority on their own priority. Anything the product picks
 *    over their stated focus is the product overruling them.
 *    — unless they said `unsure`, which is not a focus but an invitation.
 *
 * 2. The household's hardest moment (`signals.householdHardestMoment`), for a
 *    Family Consultation. A household plan that ignores the moment the
 *    household named as hardest is a plan for a different household.
 *
 * 3. The stated barrier (`intentions.barrier`). If they know what stops them,
 *    starting there is practical rather than interpretive.
 *
 * 4. Timing, from `signals.energyShape`. Contract meaning: WHEN a change is
 *    placed, never whether or why.
 *
 * 5. How food gets into the house (`environment.planning`). The point upstream
 *    of the plate, and the only rule here a Family Consultation can still
 *    reach once 1–3 have declined.
 *
 * A value silenced at value level is skipped, not substituted — the next rule
 * is tried, and if none applies the Report says so rather than inventing one.
 *
 * ══ REACHABILITY — WHY THESE FIVE AND NOT SEVEN ═════════════════════════════
 *
 * Every question here is `required: true`, so a complete Consultation answers
 * all of the ones applicable to its foundation. That makes reachability
 * checkable rather than assumed, and the check removed three rules.
 *
 * `signals.context`, `signals.settledDays` and `rhythm.longestGap` used to sit
 * at 5, 6 and 7. All three are `you`-only, and so is rule 4 — which has no
 * excluded values, so on a `you` Consultation rule 4 always answers first and
 * nothing below it could ever be consulted. On a `family` Consultation none of
 * the four is even applicable. Three rules, no state that could reach them.
 * They were deleted rather than left as reassuring dead text.
 *
 * Deleting them exposed the real gap: rules 1–3 are the only ones a family can
 * reach, and a household that answers `unsure`, `none-stand-out` and `none`
 * fell off the end of the list with an empty "Where to start". Rule 5 is
 * applicable to both foundations, so it closes that. It is unreachable on a
 * `you` Consultation (rule 4 answers first) and reachable on a `family` one,
 * which is what "reachable" has to mean for a foundation-sensitive list.
 *
 * A test constructs the winning state for each of the five. Adding a rule that
 * nothing can reach fails it.
 */

export interface PriorityCandidate {
  readonly rank: number
  readonly questionId: string
  readonly reason: string
}

/**
 * The precedence list, as data.
 *
 * Exported so a test can print it and a reviewer can read the order without
 * following control flow.
 */
export const PRIORITY_PRECEDENCE: readonly PriorityCandidate[] = [
  {
    rank: 1,
    questionId: "core_intentions_primary_focus_v1",
    reason: "The customer's own stated priority. Nothing the product picks outranks it.",
  },
  {
    rank: 2,
    questionId: "core_signals_household_hardest_moment_v1",
    reason: "For a household, the moment they named as hardest is the practical place to begin.",
  },
  {
    rank: 3,
    questionId: "core_intentions_barrier_v1",
    reason: "A known obstacle is a practical starting point rather than an interpretation.",
  },
  {
    rank: 4,
    questionId: "core_signals_energy_shape_v1",
    reason: "Timing only — when a change is placed, never whether or why.",
  },
  {
    rank: 5,
    questionId: "core_environment_planning_v1",
    reason:
      "How food arrives is upstream of every meal, and it is the last rule a household can still reach.",
  },
]

/**
 * Values that exist but do not constitute a starting point.
 *
 * `unsure` and `none` are real answers — they simply do not name somewhere to
 * begin, so precedence moves on rather than manufacturing one from them.
 */
const NOT_A_STARTING_POINT: Readonly<Record<string, readonly string[]>> = {
  core_intentions_primary_focus_v1: ["unsure"],
  core_intentions_barrier_v1: ["none"],
  core_signals_household_hardest_moment_v1: ["none-stand-out"],
  // `signals.energyShape` and `environment.planning` have no such value: every
  // shape of day and every way food arrives names somewhere to begin.
}

export interface PriorityChoice {
  readonly questionId: string
  readonly value: string
  readonly rank: number
  readonly reason: string
}

/**
 * Choose the starting point.
 *
 * Deterministic: the first rule in `PRIORITY_PRECEDENCE` whose question was
 * answered, whose value is not silenced, and whose value actually names
 * somewhere to begin. Returns `null` when none does — the composer then states
 * that plainly instead of reaching for a fallback.
 *
 * ══ ORDER WITHIN AN ANSWER ══════════════════════════════════════════════════
 *
 * Values are read through `canonicalValues`, which returns them in the frozen
 * bank's option order. An earlier version read the stored array, which is the
 * order the customer's clicks happened to land in — so two Consultations that
 * said exactly the same thing could have produced different Reports. The
 * stored order is a record of interaction, never of meaning.
 *
 * Today every retained rule reads a single-select question, so the helper is
 * doing no reordering. It is called anyway: the next rule someone adds may be
 * a multi-select, and the defect must not be able to come back with it.
 *
 * Within an answer the FIRST canonical value is taken. Not the "strongest":
 * there is no strength here, and picking by any other criterion would be the
 * arithmetic this design excludes.
 */
export function choosePriority(
  trustedAnswers: ConsultationAnswers,
  applicableQuestionIds: readonly string[],
): PriorityChoice | null {
  const applicable = new Set(applicableQuestionIds)

  for (const candidate of PRIORITY_PRECEDENCE) {
    if (!applicable.has(candidate.questionId)) continue

    /*
     * `values` only. `not-enumerated` cannot occur here — every precedence
     * candidate is an enumerated bank question — and `unsupported-value` has
     * already refused the whole Report at the composer's answer-support
     * boundary, so it cannot reach this function either. Both are skipped
     * rather than handled, because inventing a starting point from an answer
     * this build cannot read is precisely what must not happen.
     */
    const resolved = canonicalValues(trustedAnswers, candidate.questionId)
    if (resolved.kind !== "values" || resolved.values.length === 0) continue
    const values = resolved.values

    for (const value of values) {
      if (valueIsSilenced(candidate.questionId, value)) continue
      if ((NOT_A_STARTING_POINT[candidate.questionId] ?? []).includes(value)) continue
      return {
        questionId: candidate.questionId,
        value,
        rank: candidate.rank,
        reason: candidate.reason,
      }
    }
  }

  return null
}
