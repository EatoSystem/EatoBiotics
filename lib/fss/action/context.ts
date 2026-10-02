import type { Answers } from "@/lib/fss/engine/score"
import type { ResolvedQuestionSet } from "@/lib/fss/questions/types"
import type {
  ConstraintState,
  ContextConstraint,
  ReportedContext,
} from "./types"

/* ════════════════════════════════════════════════════════════════════════
   Your Food Context — shapes the Plan, reaches the Score by no path.

   ── This is a promise already made, in two places, coming due ─────────────

   `docs/fss/generated/ASSESSMENT_V1_RESOLVED.md` labels every Food Context
   item "**Unscored** — shapes the Plan, never the Score". And
   `components/fss/candidate-result.tsx` tells the person, on screen:

       "What they change is what we would suggest, not what you are worth."

   Until Gate 3 nothing suggested anything, so the first half of that sentence
   was true only in the sense that there was nothing to change. This module is
   where it becomes true or becomes false, and a test asserts the filter
   actually fires rather than sitting there decoratively.

   ── Why a constraint may shape the plan and may never touch the score ─────

   Because scoring someone's circumstances means lowering a number because they
   work nights, or live where fresh food is a bus ride away, or cannot spend
   more on food this month. The constitution puts it flatly: Your Food Context
   "may say that it shapes the Plan" and "may never say anything that lowers
   the Score."

   The engine already enforces the second half structurally — it reads
   `scoredQuestions()` and throws if anything unscored reaches the arithmetic.
   This module only ever decides WHICH REVIEWED SUGGESTION IS OFFERED, which is
   the same class of decision as choosing which of two true sentences to show.

   ── And why the threshold here is not a methodology decision ──────────────

   Gate 2 refused to pick weights or band thresholds, because those change a
   number that describes a person. This threshold changes which suggestion
   appears. Nobody's score moves, no comparison is affected, and no claim is
   made — so it is a product decision, takeable, and taken below.
   ════════════════════════════════════════════════════════════════════════ */

/**
 * Which Food Context item reports which constraint.
 *
 * Named rather than derived from position: `part === "your-food-context"` would
 * give the four items but not which is which, and inferring it from order
 * would mean reordering the assessment silently remapped every plan. The ids
 * are owned by `candidate-items.ts`, so they are stable within this version,
 * and a test asserts each one exists and still contributes `food-context`.
 */
export const CONTEXT_ITEMS: Readonly<Record<ContextConstraint, string>> = {
  time: "fc1", // "how much time and energy do you usually have for preparing food?"
  cost: "fc2", // "how affordable is the food you would like to be eating?"
  access: "fc3", // "how easy is it to get fresh food where you live?"
  kitchen: "fc4", // "do your kitchen and your confidence in it suit the way you would like to cook?"
}

/**
 * The reported 0–3, read as three states.
 *
 *   0  "Very little" / "A real constraint" / "Difficult" / "Not well"
 *   1  "Some, on a good day" / "Often a constraint" / "Possible with effort"
 *   ── limiting above this line; the person described something in the way ──
 *   2  "Usually enough" / "Sometimes a constraint" / "Fairly easy"
 *   3  "Plenty" / "Not a constraint" / "Easy"
 *
 * Three states rather than four because the plan asks exactly one question of
 * them — may this suggestion be offered — and keeping the 0–3 scale here would
 * invite a weighting nobody chose.
 *
 * `1` counts as limiting on the strength of the options' own words: "it depends
 * how the day has gone" and "cost shapes the choice more often than not" both
 * describe a constraint that is usually present.
 */
function stateOf(value: number | undefined): ConstraintState {
  if (value === undefined) return UNKNOWN_STATE
  if (value <= 1) return "limiting"
  if (value === 2) return "workable"
  return "free"
}

/**
 * What an unanswered Food Context item means.
 *
 * NOT "limiting", which is the tempting cautious answer and the wrong one: it
 * would make the plan THINNER for the people who skipped the section, when the
 * section exists to make the plan better. Filtering on an absence is filtering
 * on nothing.
 *
 * NOT "free" either, as a matter of wording — absence is not evidence that
 * somebody has plenty of time. `workable` is the state that causes no filtering
 * in either direction, which is the honest behaviour when nobody has told us
 * anything.
 *
 * `ReportedContext.answered` carries the distinction separately, so a surface
 * can say "you did not tell us about your circumstances" rather than implying
 * we know they have none.
 */
const UNKNOWN_STATE: ConstraintState = "workable"

/**
 * Read Your Food Context back. Never reads a scored item.
 *
 * ── Why the item map is a PARAMETER ───────────────────────────────────────
 *
 * The `contributes === "food-context"` check below is belt and braces — with
 * the real map it can never fire, because fc1–fc4 are all unscored. Which
 * means that with the map hard-wired, DELETING the check changed nothing
 * observable, and sabotage case 1040 walked straight through: the guard for
 * the architecture's most important boundary was unfalsifiable.
 *
 * Gate 2 hit the identical problem with the question-set resolver — every pin
 * matched, so disabling the pin check was a no-op — and fixed it the same way:
 * make the input injectable, so a test can supply the case the check exists
 * for. The parameter is for testing, and it says so rather than pretending to
 * be a feature.
 */
export function readFoodContext(
  set: ResolvedQuestionSet,
  answers: Answers,
  items: Readonly<Record<ContextConstraint, string>> = CONTEXT_ITEMS,
): ReportedContext {
  const byId = new Map(set.questions.map((q) => [q.id, q]))

  const states = {} as Record<ContextConstraint, ConstraintState>
  let anyAnswered = false

  for (const [constraint, id] of Object.entries(items) as [ContextConstraint, string][]) {
    const q = byId.get(id)
    /*
     * Belt and braces, in the same spirit as the engine asserting its own
     * filter held: if an id ever named a SCORED item, this module would be
     * reading the Score's inputs to shape the plan — the exact crossing the
     * architecture forbids. Treated as unknown rather than trusted.
     */
    const usable = q !== undefined && q.contributes === "food-context"
    const value = usable ? answers[id] : undefined
    if (usable && typeof value === "number") anyAnswered = true
    states[constraint] = stateOf(typeof value === "number" ? value : undefined)
  }

  const limiting = (Object.keys(states) as ContextConstraint[])
    .filter((c) => states[c] === "limiting")
    .sort()

  return { states, limiting, answered: anyAnswered }
}

/**
 * May this action be offered to this person?
 *
 * An action declares the circumstances it needs. If the person described one of
 * them as being in the way, the action is not offered — which is the whole of
 * "same priority, different plan for no-time versus no-budget".
 *
 * An action requiring nothing is always offerable, and every domain carries at
 * least one, because a plan that goes silent on the most constrained person is
 * the worst failure available to this layer.
 */
export function isOfferable(
  requires: readonly ContextConstraint[],
  context: ReportedContext,
): boolean {
  return requires.every((c) => context.states[c] !== "limiting")
}
