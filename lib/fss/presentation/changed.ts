import type { FssDomain } from "@/lib/fss/questions/types"

/* ════════════════════════════════════════════════════════════════════════
   WHAT CHANGED — the reviewed copy.

   ══ UNAPPROVED CONTENT, NAMED AS SUCH ══════════════════════════════════════

   Every sentence here is a CANDIDATE. No reviewer has signed off a word of it,
   and the fifteen `comparedToPrevious` lines in particular are the item Gate 5
   adds to the "still visibly unresolved" list. They ship behind the preview
   route and nowhere else.

   ══ WHY FIFTEEN SENTENCES AND NOT THREE WITH A DOMAIN SLOT ════════════════

   Because interpolating a domain phrase into a verb frame is what produced
   "fermented foods has room" in Gate 3.6. Five phrases × three directions
   cannot be made to agree grammatically from one template — "a wider range",
   "fermented foods", "eating rhythm" need different verbs — and the agreement
   problem has no solution that a reviewer could check line by line. So each
   line is written out in full and read as a whole.

   ══ THE ANCHOR IS THE IMMEDIATE PREDECESSOR ════════════════════════════════

   "than at your previous assessment", not "than at baseline". Viewing C
   compares B↔C, so baseline language would be false for every system after the
   second.

   ══ THE SENTENCE-LEVEL RULES, THE SAME FOUR AS `domains.ts` ════════════════

     measured food behaviour      "Your answers described…"
     self-reported observation    "You reported…" / the answer, quoted
     scientific education         impersonal present
     biological inference         NOT AVAILABLE

   So: nothing here says a person's microbiome changed, nothing says anything
   improved, and nothing attributes a change to an action. A direction is
   arithmetic on two numbers from one instrument; "better" is a verdict, and
   this layer does not have one.

   ══ AND NOTHING HERE JOINS TWO CLASSES IN ONE SENTENCE ═════════════════════

   There is no function taking actions and changes together. `coOccurrence` is
   ONE reviewed constant with counts interpolated, and it says in so many words
   that the two sit side by side rather than one explaining the other.
   ════════════════════════════════════════════════════════════════════════ */

export type ChangeDirection = "higher" | "lower" | "similar"

/**
 * Five domains × three directions, each written out.
 *
 * `similar` is NOT "no change" — two assessments a month apart landing in the
 * same place is a real finding, and calling it nothing would make the honest
 * outcome read as a failure of the product.
 */
export const DOMAIN_CHANGE_COPY: Record<FssDomain, Record<ChangeDirection, string>> = {
  diversity: {
    higher:
      "Your answers described a wider range of plant foods than at your previous assessment.",
    lower:
      "Your answers described a narrower range of plant foods than at your previous assessment.",
    similar:
      "Your answers described about the same range of plant foods as at your previous assessment.",
  },
  plantsAndFibre: {
    higher:
      "Your answers described more fibre-rich whole plant food than at your previous assessment.",
    lower:
      "Your answers described less fibre-rich whole plant food than at your previous assessment.",
    similar:
      "Your answers described about as much fibre-rich whole plant food as at your previous assessment.",
  },
  fermentedFoods: {
    higher:
      "Your answers described fermented foods appearing more often than at your previous assessment.",
    lower:
      "Your answers described fermented foods appearing less often than at your previous assessment.",
    similar:
      "Your answers described fermented foods appearing about as often as at your previous assessment.",
  },
  foodQuality: {
    higher:
      "Your answers described more of your food starting from whole ingredients than at your previous assessment.",
    lower:
      "Your answers described less of your food starting from whole ingredients than at your previous assessment.",
    similar:
      "Your answers described about as much of your food starting from whole ingredients as at your previous assessment.",
  },
  mealRhythm: {
    higher:
      "Your answers described a steadier eating rhythm than at your previous assessment.",
    lower:
      "Your answers described a less steady eating rhythm than at your previous assessment.",
    similar:
      "Your answers described about the same eating rhythm as at your previous assessment.",
  },
}

/**
 * Everything structural around those fifteen.
 *
 * ── `scoreNote` IS THE SENTENCE THIS WHOLE GATE TURNS ON ──────────────────
 *
 * A score that moved is the one number a person will read as a verdict on
 * themselves, so it is the one place the product has to say what the number is
 * and is not. It names the input — answers about food — and declines the two
 * inferences a reader will reach for unprompted.
 */
export const CHANGED_COPY = {
  title: "What changed",

  says:
    "Two sets of answers, side by side. This describes what is different between them — not why it is different, which is not something a questionnaire can tell us.",

  /* ── The score ───────────────────────────────────────────────────────── */

  scoreLabel: "Your Food System Score™",
  scoreMove: (previous: number, current: number) => `${previous} → ${current}`,

  scoreNote:
    "Both numbers come from the same version of the assessment, so the change describes a change in the answers you gave about how you eat. It is not a measurement of your gut, and it does not say what caused the difference.",

  /**
   * Equal numbers. Said plainly, because "no change" sounds like a failure.
   *
   * ── AND IT NAMES NO DURATION, WHICH IT ORIGINALLY DID ────────────────────
   *
   * It read "Two months landing in the same place". Nothing here knows the
   * interval — two assessments can be a week or a year apart — so that was a
   * factual claim the copy had no basis for, found by reading it rendered
   * against a one-month fixture.
   */
  scoreSame:
    "Your Food System Score™ is the same as at your previous assessment. Landing in the same place is a real result, not a missing one.",

  /** Comparable, but one of the two had no number to compare. */
  scoreUnavailable:
    "One of these two assessments was not complete enough to produce a score, so there is no change to show. The answers that were given are still below.",

  /* ── The domains ─────────────────────────────────────────────────────── */

  domainsLabel: "Your food patterns",

  /**
   * Shown when the score compares and the domains do not.
   *
   * The one state 2a was built for, and it needs its own sentence: saying
   * nothing would read as "nothing changed in your food patterns", which is a
   * claim, and the honest statement is that the parts were renamed.
   */
  domainsNotComparable:
    "The five parts of the score were defined differently between these two assessments, so they are not compared here. The overall score still is.",

  /** A domain that was not scored in one of the two. */
  domainNotBothScored: (label: string) =>
    `Not enough of the ${label} questions were answered at one of the two assessments to compare them.`,

  /* ── What You Notice ─────────────────────────────────────────────────── */

  observationsLabel: "What you notice",

  /**
   * ── WHY THE ANSWERS ARE QUOTED AND NOT CHARACTERISED ──────────────────
   *
   * The obvious sentence is "you reported afternoon energy dips less often" —
   * and it needs an ordinal model of every option list, which nobody has
   * reviewed, plus a comparative frame interpolated per question, which is the
   * Gate 3.6 agreement bug. Quoting both answers conveys the change exactly and
   * asserts no direction: the person reads what they said then and what they
   * say now, and EatoBiotics claims no relation between the two.
   */
  observationsNote:
    "These are your own answers, quoted. They are not scored and they are not part of your Food System Score™ — reading them beside it is the point of asking.",

  observationThen: "Previously",
  observationNow: "Now",
  observationSame: "Same answer",
  observationNew: "Answered this time, not last time",
  observationDropped: "Answered last time, not this time",
  observationNeither: "Not answered either time",

  /**
   * ── THREE LINES SAYING NOTHING HAPPENED IS THE SAME NOISE AS FOUR ───────
   *
   * The Context block had this and reading it rendered fixed it. What You
   * Notice had it too, one line per question, each true and the block useless.
   * So the all-same case gets one sentence.
   */
  observationsNoneChanged:
    "Your answers to all of these are the same as at your previous assessment.",

  /**
   * The trailing line when SOME changed, and the difference from Context.
   *
   * Context items that did not change are dropped entirely, because a
   * constraint nobody mentioned is not information. An unchanged observation
   * still carries the person's current answer, so the count is named rather
   * than the items silently disappearing.
   */
  observationsRestUnchanged: (n: number) =>
    n === 1
      ? "One other answer here is the same as last time."
      : `${n} other answers here are the same as last time.`,

  observationsNotComparable:
    "The questions themselves changed between these two assessments, so your answers to them are shown separately rather than compared.",

  /* ── Your Context ────────────────────────────────────────────────────── */

  contextLabel: "Your context",

  /**
   * A constraint disappearing is NOT an outcome, and this says so.
   *
   * It is the sentence that stops the most tempting false reading in the whole
   * section: somebody who reported time as a constraint and no longer does has
   * described a different circumstance, not an improvement the product caused.
   */
  contextNote:
    "What you told us about time, cost, access and your kitchen. These are never scored and never counted against you — they shape what we suggest, and a constraint lifting is a change in your circumstances rather than a result.",

  /**
   * The constraint label sits MID-SENTENCE in all three, and that is a
   * constraint on the copy rather than a stylistic choice.
   *
   * `CONSTRAINT_LABELS` are lowercase phrases built for joining — "time on a
   * weekday", "what food costs" — because `plan.ts` reads them out in a list.
   * A sentence starting with one would render "time on a weekday is now…".
   * Reusing that one set and writing around it beats a second set of
   * capitalised labels, which is how two surfaces come to disagree about what
   * somebody said.
   */
  contextAppeared: (label: string) => `You now describe ${label} as being in the way.`,
  contextDisappeared: (label: string) => `You no longer describe ${label} as being in the way.`,
  contextUnchanged: (label: string) => `No change in what you said about ${label}.`,

  /**
   * ── FOUR LINES SAYING NOTHING HAPPENED IS NOISE ─────────────────────────
   *
   * Reading this rendered showed the whole block as "No change in what you
   * said about getting hold of fresh food." four times over, above a longer
   * note. Each line was true and the block was useless — and a section that
   * reads as filler is a section a person learns to skip, including on the
   * visits where it has something to say.
   *
   * So the all-unchanged case gets ONE sentence, and the per-constraint lines
   * are kept for the constraints that actually moved.
   */
  contextNoneChanged:
    "Nothing you told us about your circumstances changed between these two assessments.",

  /* ── Your Actions ────────────────────────────────────────────────────── */

  actionsLabel: "Your actions",

  /** Factual history. "Marked" and not "did", because that is what we know. */
  actionsFacts: (done: number, total: number) =>
    `You marked ${done} of ${total} planned actions done during this period.`,

  actionsSkipped: (skipped: number) => `${skipped} were marked skipped.`,

  actionsNone:
    "There were no actions on the plan from your previous assessment to mark either way.",

  /* ── The one sentence that touches two classes, and refuses to join them ─ */

  /**
   * CO-OCCURRENCE IS NOT CAUSATION, stated to the person rather than only in a
   * comment. One constant, two counts interpolated, and no argument.
   *
   * This is the sentence a product like this one is most tempted to write
   * causally, and the one it has least evidence for: nobody controlled
   * anything, nothing was randomised, a month passed, and a great many other
   * things happened in it.
   */
  coOccurrence: (done: number) =>
    `You marked ${done} actions done in the same period that these answers changed. Both happened; we cannot tell you that one produced the other, and a month holds a great deal besides.`,

  /* ── Refusal, which is still a useful product state ──────────────────── */

  refusedLabel: "Shown separately",

  refusedNote:
    "These two results were produced under versions of the assessment that EatoBiotics does not treat as directly comparable, so they are shown side by side rather than as a change. Each one is still a complete record of what you described at the time.",

  previousLabel: "Previous assessment",
  currentLabel: "This assessment",

  /* ── Nothing to compare yet ──────────────────────────────────────────── */

  noPredecessor:
    "This is your first Food System, so there is nothing yet to compare it with. Reassessing later is what gives this section something to say.",

  /** A record the comparison needed is not in this browser's storage. */
  unavailable:
    "Part of the record this comparison needs is not in this browser's storage, so no comparison is shown. Nothing has been changed or removed.",

  /* ── What's next ─────────────────────────────────────────────────────── */

  nextLabel: "What's next",

  /**
   * The priority and plan this system ALREADY COMMITTED TO, not a new one.
   *
   * A comparison must not re-decide anything. The selection happened once, when
   * this system was established, under a named policy version — re-running it
   * from the comparison would silently replace a recorded decision with a
   * fresher one and make the record unauditable.
   */
  nextNote:
    "This is the priority recorded when you completed this assessment. It was not re-decided from the comparison.",
} as const

/* ════════════════════════════════════════════════════════════════════════
   THE REVIEW THIS COPY HAS NOT HAD — a named dependency, not a note.

   ══ WHY THIS IS A CONSTANT AND A TEST RATHER THAN A COMMENT ═══════════════

   Because the fifteen `DOMAIN_CHANGE_COPY` sentences are the one thing in this
   module that asserts a DIRECTION, and a direction is the step from "your
   answers described X" to "your answers described MORE X than before". The
   arithmetic behind it is sound — two numbers from one instrument — but
   whether each sentence's wording stays inside that and goes no further is a
   content judgement nobody has made.

   A comment saying "unapproved" expires silently. This does not: `state` is
   pinned `"pending"` by a test whose failure message names the six questions
   below, so graduating the copy is a decision somebody takes rather than a
   default that lapses while nobody is looking. The same shape the
   `consultation_reports` activation prerequisite and the `constraints-known`
   pre-activation blocker use in CLAUDE.md.

   ══ AND THE FENCE IS THE OTHER HALF ═══════════════════════════════════════

   A test asserts no file outside the candidate roots imports this module. That
   is what stops Gate 6 making these sentences canonical because the AI needed
   explanatory language to hand — which is exactly how unreviewed copy has
   graduated before.
   ════════════════════════════════════════════════════════════════════════ */

/* ── THE REVIEW PASS OF 2026-10-02, AND WHAT IT CHANGED ───────────────────
 *
 * The six criteria were run over all fifteen sentences, each read against its
 * own domain's reviewed `whatItMeans` and `whereYouAre` bands in
 * `./domains.ts` rather than against anybody's memory of what the domain
 * measures. Outcome: 6 approved, 9 revised, 0 rejected.
 *
 * All fifteen passed four criteria outright — they describe answers rather
 * than biology, assert no causality, name no health improvement, and are
 * comparatives explicitly anchored "than at your previous assessment" rather
 * than absolute judgements. Ten imply a direction, which is by design and is
 * justified: `DomainChange.direction` is arithmetic on two sub-scores produced
 * only when BOTH `canCompare` and `canCompareDomains` permit the pair.
 *
 * ── REVISED · `foodQuality` × 3, the substantive finding ─────────────────
 *
 * It read "less heavily processed food", which is two defects at once.
 *
 *   AMBIGUOUS: "less [heavily-processed food]" (a smaller quantity of it) or
 *   "[less heavily] processed food" (processed to a lesser degree). Different
 *   claims, and the sentence chose neither.
 *
 *   UNREVIEWED VOCABULARY: the domain's approved wording is "how much of what
 *   you eat is prepared from whole ingredients rather than arriving
 *   ready-made", with bands "starting from whole ingredients" / "ready-made".
 *   "Heavily processed" was introduced here and is more loaded than the word a
 *   reviewer actually signed off.
 *
 * Now in the domain's own vocabulary, and unambiguous.
 *
 * ── REVISED · `fermentedFoods` × 3 ───────────────────────────────────────
 *
 * "arriving" → "appearing". The domain's own verb is appear: "how often foods
 * transformed by fermentation APPEAR in your week".
 *
 * ── REVISED · `plantsAndFibre` × 3 ───────────────────────────────────────
 *
 * The dropped "whole" restored. The domain says "fibre-rich WHOLE plant food";
 * this said "fibre-rich plant food". It changed no claim, and one phrase beats
 * two that nearly agree.
 *
 * ── APPROVED · `diversity` × 3 ───────────────────────────────────────────
 *
 * "Range" is the domain's own word, and `whatItMeans` says "the range rather
 * than the amount" explicitly. The copy says range and not amount.
 *
 * ── APPROVED · `mealRhythm` × 3, with a recorded limitation ──────────────
 *
 * "Steadier" is the domain's own word ("a steady rhythm across the week"). But
 * `whatItMeans` is "when you eat, how regularly, AND WHAT A TYPICAL MAIN MEAL
 * IS MADE OF" — so "eating rhythm" describes only part of what the domain
 * scores. It UNDER-describes, which is the safe direction, so the limitation
 * is recorded rather than patched with wording nobody reviewed.
 *
 * ── REPORTED, NOT ACTED ON · the juxtaposition ───────────────────────────
 *
 * These render in a block headed "Your food patterns" directly above a score
 * that moved. Five directional statements stacked above `67 → 72` read as
 * corroboration — work no individual sentence does. Every sentence passes the
 * health-improvement criterion on its own; the BLOCK may not. That is a
 * presentation question rather than a wording one, so it is recorded in
 * `docs/fss/FSS_V1_CLAIMS_BOUNDARY.md` for a deliberate decision.
 * ───────────────────────────────────────────────────────────────────────── */

export const COMPARATIVE_COPY_REVIEW = {
  /**
   * `"pending"` until a named human has answered all six questions below.
   *
   * STILL PENDING AFTER THE 2026-10-02 PASS, deliberately. That pass fixed
   * nine sentences; it is not itself a sign-off, because an agent recording
   * its own analysis as a completed human review is exactly the failure this
   * flag exists to prevent. The revised fifteen are now in place to be read
   * and ratified.
   */
  state: "pending",
  reviewedBy: null,
  reviewedAt: null,
  /**
   * What the review must establish, recorded verbatim so it cannot be
   * narrowed on the way to passing it.
   */
  criteria: [
    "whether they merely describe answers",
    "whether they imply direction",
    "whether direction is justified",
    "whether they imply health improvement",
    "whether they imply causality",
    "whether they accidentally turn relative ranking into absolute health status",
  ],
} as const
