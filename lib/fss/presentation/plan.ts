import type { ContextConstraint } from "@/lib/fss/action/types"

/* ════════════════════════════════════════════════════════════════════════
   The reviewed structural copy for Your Plan.

   ── Why none of this lives in the component ───────────────────────────────

   Because a renderer that writes its own prose is where unreviewed claims
   appear — nobody reviews a template literal. The component arranges; every
   customer-visible word comes from here or from the action catalogue.

   `PERSONALISATION → Your Plan` is the constitution's own name for this layer,
   so that is the name used. Not "My Food System", which is the LONGITUDINAL
   layer this gate deliberately stops before.

   ── The sentence-level rules, same as everywhere ──────────────────────────

   Each sentence makes exactly one move. The context note is the one worth
   watching: it must say "You told us…", which is the permitted framing for
   something a person reported, and it must not read as a judgement. Somebody
   describing cost as a constraint has told us a fact about their week, not a
   fact about themselves — and the constitution forbids anything that treats it
   as the second.

   And no horizon label carries a predicted outcome. "The next 30 days" names
   when; it does not promise what.
   ════════════════════════════════════════════════════════════════════════ */

export const PLAN_COPY = {
  title: "Your plan",

  /** One line under the heading. Says what the plan is, and what it is not. */
  intro:
    "What follows from your priority — a few things to try, at the pace you would actually do them. Not a list of everything that could be better.",

  /** The four questions this layer answers, as a reviewer-facing contract. */
  questions: [
    "What matters most?",
    "What should I do?",
    "Why this?",
    "How do I make it practical?",
  ],

  /** Field labels on a recommendation card. */
  whyLabel: "Why this",
  frequencyLabel: "How often",

  /** The thirty-day block. */
  thirtyDayBehaviourLabel: "What to hold",
  thirtyDayWhyLabel: "Why this one",
  reassessmentLabel: "Then reassess",

  /**
   * Shown when the person described constraints, so they can see the plan
   * respected what they said.
   *
   * "You told us" is the permitted framing. The sentence names the
   * circumstance and stops — it does not characterise the person, suggest they
   * should change their circumstances, or treat the constraint as a reason the
   * plan is smaller.
   */
  contextRespected: (described: string) =>
    `You told us about ${described} — so the suggestions above are the ones that work around that.`,

  /**
   * Shown when Part 4 was left blank.
   *
   * Says what we do not know rather than assuming there is nothing to know —
   * an unanswered section is not a declaration that somebody has no
   * constraints.
   */
  contextUnknown:
    "You did not tell us about your circumstances, so these are the general suggestions. Answering Your Food Context would let us leave out the ones that would not work for you.",

  /** The candidate marker. Every surface must be able to say this. */
  statusNote:
    "Candidate content, frozen for scientific review and not yet approved. Nothing here is medical advice.",

  /** When there is no priority, so there is no plan. */
  empty:
    "There is no plan yet, because there is no priority yet. Answering more of the assessment would give us something to work from.",
} as const

/**
 * How each constraint is named to a person.
 *
 * Separate from the internal keys on purpose: `kitchen` is a field name, and
 * "your kitchen setup" is what a person told us about. Reviewed phrasing, in
 * the same register as the Food Context questions themselves — circumstances,
 * not choices.
 *
 * ── NO LABEL CONTAINS "and", AND THAT IS A CONSTRAINT NOT A COINCIDENCE ───
 *
 * `describeConstraints` joins these with "and". The kitchen label first read
 * "your kitchen and how confident you feel in it", which produced, on the real
 * page with all four reported:
 *
 *   "…what food costs, your kitchen and how confident you feel in it and time
 *    on a weekday, so nothing above asks for more of it."
 *
 * Two "and"s colliding, and a run-on nobody would have written on purpose. The
 * unit test passed because it joined short fixture strings; only reading the
 * rendered page showed it. A test below now refuses an "and" in any label.
 */
export const CONSTRAINT_LABELS: Readonly<Record<ContextConstraint, string>> = {
  time: "time on a weekday",
  cost: "what food costs",
  access: "getting hold of fresh food",
  kitchen: "your kitchen setup",
}

/**
 * The order constraints are read out in.
 *
 * The instrument's own order — fc1 time, fc2 cost, fc3 access, fc4 kitchen —
 * rather than alphabetical, which is what `ReportedContext.limiting` sorts by
 * so that it renders identically on every machine. Alphabetical is the right
 * answer for a stable array and the wrong one for a sentence.
 */
/**
 * The order constraints are spoken in — the instrument's own (fc1…fc4).
 *
 * EXPORTED in Gate 5 step 2c, because What Changed listed them alphabetically
 * and read as a different product. One order, in one place.
 */
export const SPOKEN_ORDER: readonly ContextConstraint[] = ["time", "cost", "access", "kitchen"]

/**
 * Join the reported constraints into one phrase.
 *
 * In the module rather than the component because this composes a
 * customer-visible sentence, and composition is authoring.
 */
export function describeConstraints(limiting: readonly ContextConstraint[]): string {
  const parts = SPOKEN_ORDER.filter((c) => limiting.includes(c)).map((c) => CONSTRAINT_LABELS[c])
  if (parts.length === 0) return ""
  if (parts.length === 1) return parts[0]
  return `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`
}
