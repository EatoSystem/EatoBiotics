import type { ConsultationAnswers } from "@/lib/consultation/types"

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
 * 5. Fit, from `signals.context`. Contract meaning: relevance and practical
 *    starting point, never efficacy or a proven trigger.
 *
 * 6. Their own settled-day routine (`signals.settledDays`), which the Report
 *    may back rather than replace.
 *
 * 7. Rhythm (`rhythm.longestGap`), as a last practical foothold.
 *
 * A value silenced at value level is skipped, not substituted — the next rule
 * is tried, and if none applies the Report says so rather than inventing one.
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
    questionId: "core_signals_context_v1",
    reason: "Practical fit with the kind of day they described. Never efficacy or a trigger.",
  },
  {
    rank: 6,
    questionId: "core_signals_settled_days_v1",
    reason: "A routine they already report, which the Report backs rather than replaces.",
  },
  {
    rank: 7,
    questionId: "core_rhythm_longest_gap_v1",
    reason: "A last practical foothold in the shape of the day.",
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
  core_signals_context_v1: ["no-connection"],
  core_signals_settled_days_v1: ["cannot-tell"],
  core_signals_household_hardest_moment_v1: ["none-stand-out"],
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
 * For a multi-select, the FIRST value in bank option order is taken. Not the
 * "strongest": there is no strength here, and picking by any other criterion
 * would be the ranking metric this design excludes.
 */
export function choosePriority(
  trustedAnswers: ConsultationAnswers,
  applicableQuestionIds: readonly string[],
): PriorityChoice | null {
  const applicable = new Set(applicableQuestionIds)

  for (const candidate of PRIORITY_PRECEDENCE) {
    if (!applicable.has(candidate.questionId)) continue

    const raw = trustedAnswers[candidate.questionId]
    const values = Array.isArray(raw) ? raw : typeof raw === "string" ? [raw] : []
    if (values.length === 0) continue

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
