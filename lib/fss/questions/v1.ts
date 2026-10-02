import type { ManifestEntry } from "./types"
import { CANDIDATE_ITEMS } from "./candidate-items"

/* ════════════════════════════════════════════════════════════════════════
   questions-v1.0 — the manifest.

   ORDER IS EXPLICIT AND IS PART OF THE VERSION. The array below is the order
   a person meets the questions in, and it is not the legacy order: q5 moves
   out of the Prebiotics run into Food Quality, and q13–q15 move out of the
   scored body entirely. Deriving order from the legacy `index` would silently
   reproduce the old instrument's shape under a new version number.

   EVERY ENTRY DECLARES ITS CONTRIBUTION. Nothing is inferred from a section
   title, a pillar or a position. `fss` items name a domain; the two unscored
   layers must not, and resolution refuses a manifest that gets that wrong.

   THE PINS ARE CONTENT HASHES, recorded 2026-09-30 against the frozen
   instrument. Regenerate them ONLY as part of a deliberate decision that
   assessment-v1.0 should now ask a differently-worded question — which is a
   methodology change and a new version, not a maintenance task. Printing
   `currentPins()` and pasting the output to make a test pass is the precise
   failure this file exists to prevent.
   ════════════════════════════════════════════════════════════════════════ */

export const QUESTION_SET_VERSION = "questions-v1.0"
export const ASSESSMENT_VERSION = "assessment-v1.0"

/* ── Part 1 · What You Eat ────────────────────────────────────────────── */

const WHAT_YOU_EAT: ManifestEntry[] = [
  // Diversity — the range and rotation of plants. q1–q3 unchanged.
  { kind: "legacy-ref", id: "q1", pin: "9f212f55ef7016075ad778e6c0b67a68ad0ce9ea669a45506ca42b66171ed560", part: "what-you-eat", sectionTitle: "Diversity", contributes: "fss", domain: "diversity" },
  { kind: "legacy-ref", id: "q2", pin: "917f5f35176ebe9081205cc57afde6942dd93c6c6f9dec08d188628b1487b569", part: "what-you-eat", sectionTitle: "Diversity", contributes: "fss", domain: "diversity" },
  { kind: "legacy-ref", id: "q3", pin: "8aab55e20e26121c9b9dea4c05ae1ed23671778a82f2e144ef7a87499295e720", part: "what-you-eat", sectionTitle: "Diversity", contributes: "fss", domain: "diversity" },

  // Plants & Fibre — quantity, as distinct from range.
  //
  // q6 is here and its wording is UNCHANGED. It reads "prebiotic-rich foods",
  // which the claims work would otherwise have corrected, and it is the one
  // remaining entry in the claims ledger for exactly this reason: the text is
  // a scoring input inside the methodology freeze. Rewording it is FSS Phase 3
  // work gated on scientific sign-off, not something to slip in here because
  // the sentence is now inconvenient.
  { kind: "legacy-ref", id: "q4", pin: "8496e1f6679527313eb63c5b4031fa928ad11c222f358561a6e2ffa96c78f871", part: "what-you-eat", sectionTitle: "Plants & Fibre", contributes: "fss", domain: "plantsAndFibre" },
  { kind: "legacy-ref", id: "q6", pin: "223dab5d7ca24c1a55bc7d2b50e498454f3d05b6baeb6507368b3d920a64a6e2", part: "what-you-eat", sectionTitle: "Plants & Fibre", contributes: "fss", domain: "plantsAndFibre" },

  // Fermented Foods — frequency, variety, intent. q7–q9 unchanged.
  { kind: "legacy-ref", id: "q7", pin: "a4f4c894dc806ae1987a09e6f05efbf85a71c3f95fb69f2b9e6d02e1c7a86369", part: "what-you-eat", sectionTitle: "Fermented Foods", contributes: "fss", domain: "fermentedFoods" },
  { kind: "legacy-ref", id: "q8", pin: "8434650d2dd6f9e939b5fa67cc5a4361a593c0af23d973d8020fc4fc2b35c396", part: "what-you-eat", sectionTitle: "Fermented Foods", contributes: "fss", domain: "fermentedFoods" },
  { kind: "legacy-ref", id: "q9", pin: "a2d7ffb374ef15cbf34a3192f4292d4306f11da5210bb9fee4a10e71ab33d404", part: "what-you-eat", sectionTitle: "Fermented Foods", contributes: "fss", domain: "fermentedFoods" },

  // Food Quality — q5 LEAVES Prebiotics. It measures what displaces whole
  // foods, not what feeds microbes, and it was the least defensible member of
  // that bucket. Two new items join it so the domain does not rest on one.
  { kind: "legacy-ref", id: "q5", pin: "3f085f7dea97ad4f6057aa93ad5fed2dbb6235187c776797aba7ff2a6361fe52", part: "what-you-eat", sectionTitle: "Food Quality", contributes: "fss", domain: "foodQuality" },
  ...CANDIDATE_ITEMS.filter((i) => i.id === "fq2" || i.id === "fq3"),
]

/* ── Part 2 · How You Eat ─────────────────────────────────────────────── */

const HOW_YOU_EAT: ManifestEntry[] = [
  { kind: "legacy-ref", id: "q10", pin: "6649ebbf17889cd6d67b9df7c879b3a1a5aca812307f0c123c921c08fee5c5c6", part: "how-you-eat", sectionTitle: "Meal Rhythm", contributes: "fss", domain: "mealRhythm" },
  { kind: "legacy-ref", id: "q11", pin: "42774f865ca4cd36ad8aef3fbabe00931bd00e2c60f3959363cf80f53ff21cb0", part: "how-you-eat", sectionTitle: "Meal Rhythm", contributes: "fss", domain: "mealRhythm" },
  { kind: "legacy-ref", id: "q12", pin: "2c4a1b83f0a7f800dcafcaa21a9cd92cbb56451c2109367047c0f85d5a08f796", part: "how-you-eat", sectionTitle: "Meal Rhythm", contributes: "fss", domain: "mealRhythm" },
  ...CANDIDATE_ITEMS.filter((i) => i.id === "mr4"),
]

/* ── Part 3 · What You Notice ─────────────────────────────────────────── */

/*
 * q13–q15 are the SAME QUESTIONS the legacy instrument scores, asked here and
 * deliberately not scored.
 *
 * They are outcomes, not food-system inputs. A score that mixes behaviour and
 * outcome cannot be interpreted: two people with identical habits would score
 * differently because one feels worse. They also carry the highest
 * diagnostic-reading risk in the instrument.
 *
 * So they stay prominent and are reported back — the answers are among the
 * most useful things a person tells us — and they reach the Score by no path.
 * `contributes: "what-you-notice"` is what makes that a property of the data
 * rather than a promise in a comment.
 */
const WHAT_YOU_NOTICE: ManifestEntry[] = [
  { kind: "legacy-ref", id: "q13", pin: "0b95df1d0c101d6cb4368c3a37aed5d852cc7c12bea466d980de2ba146fc877d", part: "what-you-notice", sectionTitle: "What You Notice", contributes: "what-you-notice" },
  { kind: "legacy-ref", id: "q14", pin: "a95c06447b99a22dc40e48f0bcac5ec39c0f5e2375c1f276b68586609f28810a", part: "what-you-notice", sectionTitle: "What You Notice", contributes: "what-you-notice" },
  { kind: "legacy-ref", id: "q15", pin: "ea711354d25e31a05163c5c3f11ab39f2fadf62fcca4e34130c1bf774639b608", part: "what-you-notice", sectionTitle: "What You Notice", contributes: "what-you-notice" },
]

/* ── Part 4 · Your Food Context ───────────────────────────────────────── */

const YOUR_FOOD_CONTEXT: ManifestEntry[] = CANDIDATE_ITEMS.filter(
  (i) => i.contributes === "food-context",
)

/** The manifest, in the order a person meets it. */
export const QUESTION_SET_V1: readonly ManifestEntry[] = [
  ...WHAT_YOU_EAT,
  ...HOW_YOU_EAT,
  ...WHAT_YOU_NOTICE,
  ...YOUR_FOOD_CONTEXT,
]
