import type { SystemCheck } from "@/lib/fss/system/validate"
import type { ActionState } from "@/lib/fss/persistence/repository"
import type { DecisionRefusal } from "@/lib/fss/system/types"

/* ════════════════════════════════════════════════════════════════════════
   THE REVIEWED COPY FOR MY FOOD SYSTEM.

   ── Why this is a data module and not strings in a component ──────────────

   The same rule `DOMAIN_PRESENTATION`, `PLAN_COPY`, `ACTION_CATALOGUE` and the
   canonical Report renderer already run under: THE RENDERER MUST NOT BE ABLE TO
   INVENT A CUSTOMER-VISIBLE SENTENCE. Nobody reviews a template literal.

   ── What is HERE and what is deliberately NOT ─────────────────────────────

   Here: the shell's own labels — section names, the Today screen's five line
   labels, the four Progress facts, and the sentences for the states where
   something could not be resolved.

   Not here: anything already reviewed somewhere else. A domain's description
   comes from `DOMAIN_PRESENTATION`, a priority's headline and explanation from
   the same place and `PRIORITY_COPY`, an action's wording from
   `ACTION_CATALOGUE`, the plan's field labels from `PLAN_COPY`, the
   comparability rule from `COMPARISON_LANGUAGE`. A second copy of any of those
   would drift from the first, and the drift would show as two parts of one
   screen saying different things about the same fact.

   ── No sentence here states an outcome ────────────────────────────────────

   Nothing says an action worked, helped, improved anything or changed a score.
   Completing something is a person reporting what they did. The strongest
   temptation in a daily product is a congratulation that quietly contains a
   claim, and the absence of one here is deliberate rather than an omission.
   ════════════════════════════════════════════════════════════════════════ */

/** The seven areas, in navigation order. */
export type SectionId = "today" | "score" | "my-food" | "biotics" | "my-plan" | "progress" | "learn"

export const SECTION_ORDER: readonly SectionId[] = [
  "today",
  "score",
  "my-food",
  "biotics",
  "my-plan",
  "progress",
  "learn",
]

/** Today is where a returning person lands. */
export const DEFAULT_SECTION: SectionId = "today"

export interface SectionCopy {
  readonly label: string
  /** One line, naming what the area is for. */
  readonly says: string
}

export const SECTION_COPY: Record<SectionId, SectionCopy> = {
  today: {
    label: "Today",
    says: "What matters now, what you can do today, and what you are working on this week.",
  },
  score: {
    label: "Score",
    says: "Where your food system currently stands.",
  },
  "my-food": {
    label: "My Food",
    says: "What EatoBiotics currently understands about how you eat.",
  },
  biotics: {
    label: "Biotics",
    says: "Prebiotics · Probiotics · Postbiotics — the science, taught accurately. Not personal scores.",
  },
  "my-plan": {
    label: "My Plan",
    says: "Feed · Seed · Rejuvenate, and the actions that follow from your priority.",
  },
  progress: {
    label: "Progress",
    says: "Your baseline and the actions you have marked. No outcome claims.",
  },
  learn: {
    label: "Learn",
    says: "Education relevant to what you are working on.",
  },
}

/* ── The Today screen ──────────────────────────────────────────────────── */

/**
 * Five labels and nothing else.
 *
 * ── The restraint is the specification, not a stylistic preference ────────
 *
 * Today is six lines and one sentence. Not twelve charts, not every domain, not
 * a miniature report. A daily product earns its place by being answerable at a
 * glance; a dashboard of everything we happen to know is the thing this
 * replaces.
 *
 * Every value beside these labels comes from somewhere already reviewed:
 *
 *   Your focus     `DOMAIN_PRESENTATION[d].label` + `.priorityHeadline`
 *   Today          the recommendation's `title`, then `practicalAction`
 *   This week      a COUNT, over the stored action states
 *   Score          `score.score`, with no band word
 *   Review again   `review.dueAt`, made relative by the component
 *   the insight    `DOMAIN_PRESENTATION[d].whereYouAre(domainScore)`
 *
 * Nothing on this screen is authored here. The imperative phrasings that read
 * well in a mock — "Increase food diversity", "Add berries to breakfast" — are
 * recommendations nobody reviewed, and `priorityHeadline` and `title` are the
 * reviewed equivalents that exist for exactly these slots.
 */
export const TODAY_COPY = {
  title: "My Food System",
  focusLabel: "Your focus",
  todayLabel: "Today",
  thisWeekLabel: "This week",
  scoreLabel: "Your Food System Score™",
  reviewLabel: "Review again",

  /** "2 of 3 actions remaining". A count of what is left, never a score. */
  actionsRemaining: (remaining: number, total: number) =>
    `${remaining} of ${total} ${total === 1 ? "action" : "actions"} remaining`,

  /** When every action for the week has been marked, either way. */
  actionsAllMarked: (total: number) =>
    `${total} of ${total} marked — nothing left to decide on this week`,

  /** "in 24 days" / "today" / "3 days ago". Relative, from a `now` at the edge. */
  reviewIn: (days: number) => {
    if (days === 0) return "today"
    if (days === 1) return "tomorrow"
    if (days > 1) return `in ${days} days`
    if (days === -1) return "yesterday"
    return `${Math.abs(days)} days ago`
  },

  /** When no priority was selected, so there is no focus and no action. */
  noFocus:
    "There is nothing to focus on yet, because not enough of the assessment was answered to name a place to start.",

  /** The candidate marker. Every surface must be able to say this. */
  statusNote:
    "Candidate content, frozen for scientific review and not yet approved. Nothing here is medical advice.",
} as const

/**
 * The third Food Context case, which `PLAN_COPY` does not cover.
 *
 * `PLAN_COPY` has `contextRespected` (constraints described) and
 * `contextUnknown` (Part 4 skipped). My Food renders a third state the plan
 * surface never had to: Part 4 WAS answered and nothing was described as being
 * in the way.
 *
 * It is here rather than added to `PLAN_COPY` because that module is Gate 3's
 * reviewed copy for the plan, and this is the shell's sentence for a section
 * the plan does not have. It was very nearly written as a template literal
 * inside the component instead — which is the exact move
 * `DOMAIN_PRESENTATION`'s header refuses, on the grounds that nobody reviews a
 * template literal.
 *
 * The sentence states what was answered and what followed from it. It does not
 * congratulate anybody for having no constraints.
 */
export const CONTEXT_COPY = {
  noneLimiting:
    "You told us about your circumstances and did not describe any of them as being in the way, so nothing was left out of your plan on that basis.",
} as const

/* ── Progress ──────────────────────────────────────────────────────────── */

/**
 * Four facts, and the sentence that says why there are only four.
 *
 * With one score there is nothing to compare, so there is no trend, no delta,
 * no arrow and no "since". Saying so is better than leaving a space where a
 * comparison would go: an empty chart reads as a feature that has not loaded.
 *
 * "Marked done" rather than "completed", and "on this device" rather than
 * nothing: both are facts about what we actually know. We know a person tapped
 * a button on one browser. We do not know they did it.
 */
export const PROGRESS_COPY = {
  title: "Progress",
  baselineLabel: "Baseline established",
  plannedLabel: "Actions planned",
  doneLabel: "Marked done on this device",
  skippedLabel: "Marked skipped",
  reviewLabel: "Next reassessment",

  noComparison:
    "There is one set of answers so far, so there is nothing to compare it with. When you reassess, this is where the two would sit side by side — and only if they came from the same version of the method.",

  /**
   * Shown when this score could never be compared with anything, which is a
   * different and more permanent statement than "not yet".
   */
  neverComparable: (explain: string) => explain,

  /**
   * Said plainly, because the alternative is implying one.
   *
   * Marking actions moves no number here. The section is byte-identical with
   * zero completions and with three, apart from the counts.
   */
  noOutcomeClaim:
    "Marking an action records what you did. It does not change your score, and we cannot tell from it what happened inside you.",
} as const

/* ── Action state ──────────────────────────────────────────────────────── */

/**
 * The three states, and the verbs for moving between them.
 *
 * "Mark done" rather than "Complete", and "Skip" rather than "Dismiss". Both
 * are about the person's own record rather than about the action's fate, and
 * both are reversible — `undo` exists because a mistyped tap should not become
 * a verdict.
 */
export const ACTION_STATE_COPY: Record<ActionState, { readonly label: string; readonly verb: string }> = {
  planned: { label: "Planned", verb: "Mark as planned" },
  done: { label: "Done", verb: "Mark done" },
  skipped: { label: "Skipped", verb: "Skip" },
}

/* ── When something cannot be resolved ─────────────────────────────────── */

/**
 * The sentences for a decision that cannot be read back.
 *
 * Every one of them says the same thing in a different register: WE ARE NOT
 * SHOWING YOU TODAY'S ANSWER FOR A DECISION A DIFFERENT VERSION MADE. None of
 * them offers a substitute, and none of them blames the person.
 */
export const UNRESOLVABLE_COPY: Record<DecisionRefusal, string> = {
  "policy-version-moved":
    "This was decided under a version of our method that has since moved, so we are not going to re-explain it with today's reasoning. What was chosen is shown; why it was chosen then is not something we can reconstruct.",
  "content-version-moved":
    "The wording of these suggestions has changed since this plan was made, so we are showing that rather than putting today's words in place of the ones you were given.",
  "entry-withdrawn":
    "One of these suggestions is no longer part of our reviewed set. We are not substituting another one for it.",
  "domain-absent-from-score":
    "This refers to part of your assessment we can no longer match to your score, so we are not going to guess which part it meant.",
  "decision-inconsistent":
    "The records behind this do not agree with each other, so we are not going to pick one of them to believe.",
} as const

/**
 * The sentences for a current Food System that did not validate.
 *
 * ── These describe, and they do not act ───────────────────────────────────
 *
 * Nothing here is deleted, cleared or recomputed. Every sentence names what is
 * missing and stops, because "fixing" a failed read by throwing away somebody's
 * Food System is the most destructive thing this layer could do and is never
 * the right response to a record that would not load.
 */
export const UNAVAILABLE_COPY: Record<SystemCheck, string> = {
  "system-record-missing":
    "Your Food System is listed as current, but the record itself is not in this browser's storage.",
  "assessment-missing": "The assessment behind your Food System is not in this browser's storage.",
  "score-missing": "The score behind your Food System is not in this browser's storage.",
  "priority-decision-missing":
    "The record of what was prioritised for you is not in this browser's storage.",
  "plan-decision-missing": "The record of which actions were chosen for you is not there.",
  "identities-disagree":
    "The records behind your Food System refer to different assessments, so we cannot tell which one it was built from.",
  "provenance-malformed":
    "Your score is stored without a complete record of which method produced it, so we cannot say what it means.",
  "policy-version-unresolvable":
    "Your Food System was set up under a version of our method this app no longer implements.",
  "action-set-version-unresolvable":
    "Your plan refers to a version of our reviewed suggestions this app no longer has.",
  "action-references-unknown-entry":
    "One of your actions refers to a suggestion that is not in our reviewed set.",
} as const

export const UNAVAILABLE_FRAME = {
  title: "We are not going to guess",
  /** Said before the specific reason, so the reason is read as a reason. */
  intro:
    "Your Food System is here, and we are not showing it, because part of what it is made of did not load. Showing you some of it would mean filling the gaps in, and the gaps are the part that has to be right.",
  /**
   * The explicit promise that nothing was touched. Worth stating: a person
   * reading an error about their own data assumes the worst.
   */
  nothingDeleted:
    "Nothing has been deleted or changed. If you start a new assessment, this one stays where it is.",
  restartLabel: "Start a new assessment",
} as const
