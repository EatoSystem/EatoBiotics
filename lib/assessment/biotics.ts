/**
 * Which Biotic a question belongs to, derived from its section title.
 *
 * The Assessment is understood through three Biotics, but `sectionTitle` is
 * finer-grained than that: five titles ("Prebiotics — Plant Diversity",
 * "Prebiotics — Fibre & Whole Foods", …) across three Biotics. So section
 * TITLES change at q1/q4/q7/q10/q13 while BIOTICS change at q1/q7/q10, and the
 * educational beat belongs to the latter.
 *
 * ── Why this is a function over data rather than a prop ─────────────────────
 *
 * `AssessmentQuestionView` is shared by three clients — You, Mind and Family.
 * The Biotics beat belongs to the You journey only. The obvious implementations
 * are a boolean prop the You client passes, or a forked component; both put the
 * You-only behaviour somewhere a future caller has to remember.
 *
 * Deriving it from the section title removes the question. Mind and Family
 * titles ("Brain Nutrition", "How Your Family Responds") are not Biotics, so
 * `bioticOf` returns null and the beat cannot render there — not because
 * someone withheld a flag, but because those questions are not about a Biotic.
 * A new Prebiotics section added tomorrow gets the beat with no wiring at all.
 *
 * Pure and dependency-free so both the components and the guards can read it.
 */

export const BIOTICS = ["Prebiotics", "Probiotics", "Postbiotics"] as const

export type Biotic = (typeof BIOTICS)[number]

/**
 * One line of meaning per Biotic, shown once as its section opens.
 *
 * Postbiotics is the line that has to stay careful. The Assessment reads
 * fifteen self-reported answers; it does not measure metabolites, microbial
 * products, SCFAs or anything in a laboratory. "Appears to respond, from the
 * patterns you report" is the honest description of what a questionnaire can
 * see, and it matches the boundary Phase 2A set on the intro.
 */
export const BIOTIC_INTRO: Record<Biotic, string> = {
  Prebiotics: "What feeds your Food System.",
  Probiotics: "The live and fermented foods you introduce.",
  Postbiotics: "How your Food System appears to respond, from the patterns you report.",
}

/** The Biotic a section title belongs to, or null when it names no Biotic. */
export function bioticOf(sectionTitle: string | null | undefined): Biotic | null {
  if (!sectionTitle) return null
  // Titles are "<Biotic> — <detail>" or exactly "<Biotic>". Matching the
  // leading word rather than the whole string means the five gut section
  // titles resolve without listing them, and a title that merely mentions a
  // Biotic later ("How Your Mind Responds") does not.
  const head = sectionTitle.split("—")[0].trim()
  return (BIOTICS as readonly string[]).includes(head) ? (head as Biotic) : null
}

/** The minimal shape this module needs from a question. */
export interface BioticSectioned {
  sectionTitle: string
}

/**
 * True when the question at `index` opens a Biotic section — i.e. it names a
 * Biotic and the question before it did not name the same one.
 *
 * Index 0 opens a section whenever it names a Biotic at all. Derived rather
 * than hard-coded to q1/q7/q10 so the transitions cannot drift away from the
 * questions if a section is ever added, moved or renamed.
 */
export function startsBiotic(questions: readonly BioticSectioned[], index: number): Biotic | null {
  const current = bioticOf(questions[index]?.sectionTitle)
  if (!current) return null
  if (index === 0) return current
  return bioticOf(questions[index - 1]?.sectionTitle) === current ? null : current
}
