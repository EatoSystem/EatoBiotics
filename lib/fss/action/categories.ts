import { ACTIONS } from "@/lib/product-vocabulary"
import type { ActionCategory } from "./types"

/* ════════════════════════════════════════════════════════════════════════
   Feed · Seed · Rejuvenate — the three action categories.

   ── What the constitution permits here, and refuses ───────────────────────

   The ACTION layer "may say what to do, and why it was chosen" and "may never
   say any number attached to Feed, Seed or Rejuvenate." Both halves are built
   into this file: there is a `meaning` field and there is no numeric field.

   ── Why the labels are read from ACTIONS and not from lib/pillars.ts ──────

   `PILLARS` carries the same three words as `aliasLabel`, keyed by
   `PillarKey` — prebiotics, probiotics, postbiotics — with Biotic prose in
   `whatItDoes` and `nudge`. Reading the names from there would make an action
   a Biotic by import, in the one module whose entire job is that they are not
   the same thing. `lib/product-vocabulary.ts` is the vocabulary authority, is
   a zero-import leaf, and says so itself: "Copy may say the actions are
   inspired by the science; it may not equate one to one."

   ── Two traps in this specific copy, named because they are not obvious ───

   "Seed" wants prohibited verbs. The claims guard refuses `reseed`,
   `reseeding`, `seed new life`, `repopulat*` and `colonis*`, and it is right
   to: eating a fermented food is not establishing organisms in a person. The
   honest meaning is about the FOOD arriving in the week, which is a behaviour
   somebody reported.

   "Rejuvenate" has a named boundary. `REGENERATE_BOUNDARY.mustNotMean` refuses
   "increase Postbiotics", "produce Postbiotics", "restore Postbiotics",
   "increase butyrate/acetate/propionate", "restore microbial metabolites",
   "rebuild the microbiome" and "repair the microbiome". So Rejuvenate here
   means renewing and protecting a pattern a person described — never repairing
   a person. (Cited rather than imported: the science contract's importer
   allow-list is pinned to five files under `lib/report/`, and a sixth importer
   fails CI.)
   ════════════════════════════════════════════════════════════════════════ */

/**
 * One action category.
 *
 * ── THERE IS NO NUMERIC FIELD, AND THAT IS THE INVARIANT ──────────────────
 *
 * Not a score, not a weight, not an order, not a count. A number on an action
 * is the conflation the whole score hierarchy exists to prevent — "Feed: 67"
 * is a personal Biotic score wearing a verb — and the cheapest way for it to
 * arrive is somebody adding a convenient `score` or `weight` here.
 *
 * ── AND NO BIOTIC FIELD ───────────────────────────────────────────────────
 *
 * No `biotic`, no `PillarKey`, no `science`. An action is not a Biotic
 * renamed, and a field relating the two would be the equation the guards
 * refuse, composed from data rather than typed out.
 *
 * Both absences are asserted at runtime, because an absence that nothing checks
 * is an absence until the first person who needs a quick fix.
 */
export interface ActionCategoryMeta {
  readonly category: ActionCategory
  /** The customer-facing name, from the vocabulary authority. */
  readonly label: string
  /** What a person is DOING when they do this. Never what it achieves. */
  readonly meaning: string
  readonly color: string
}

/**
 * The three, in the order the product says them.
 *
 * Labels are taken positionally from `ACTIONS` rather than retyped, so a
 * rename travels. A test asserts the three labels equal `ACTIONS` exactly, and
 * `tests/unit/retired-vocabulary.test.ts` already refuses the retired third
 * action in both of its spellings.
 */
export const ACTION_CATEGORIES: Record<ActionCategory, ActionCategoryMeta> = {
  feed: {
    category: "feed",
    label: ACTIONS[0],
    meaning:
      "Giving what is already there more to work with — a wider range of plant foods, and more of the fibre-rich ones.",
    color: "var(--icon-green)",
  },
  seed: {
    category: "seed",
    label: ACTIONS[1],
    meaning:
      "Bringing foods transformed by fermentation into the week — yoghurt, kefir, kimchi, sauerkraut, miso — regularly rather than occasionally.",
    color: "var(--icon-teal)",
  },
  rejuvenate: {
    category: "rejuvenate",
    label: ACTIONS[2],
    meaning:
      "Renewing and protecting the pattern you already have — the rhythm of your week, and the meals that slip first when it gets busy.",
    color: "var(--icon-yellow)",
  },
}

/** The canonical order, so every surface lists them the same way. */
export const ACTION_CATEGORY_ORDER: readonly ActionCategory[] = ["feed", "seed", "rejuvenate"]

export function actionCategory(category: ActionCategory): ActionCategoryMeta {
  return ACTION_CATEGORIES[category]
}
