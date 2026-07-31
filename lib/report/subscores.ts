/**
 * One definition of "the canonical three pathways", shared by everything that
 * has to read an assessment's sub-scores.
 *
 * ── Why this exists ──────────────────────────────────────────────────────────
 *
 * Sub-scores have been produced in three different shapes over the life of this
 * app, and consumers kept being written against whichever one was current:
 *
 *   canonical   prebiotics / probiotics / postbiotics   ← the product's model
 *   aliases     feed / seed / heal                      ← legacy KEYS, still emitted
 *   legacy five diversity / feeding / adding /
 *               consistency / feeling                   ← Family's native pillars
 *
 * The You assessment (`computeSubScores`, lib/assessment-scoring.ts) emits the
 * canonical three plus the aliases, and never the legacy five. The Family
 * assessment (`computeResult`, lib/family-assessment-scoring.ts) emits all
 * eleven. Code keyed on the legacy five therefore reads `undefined` for every
 * You-flow customer, which has now caused two separate production bugs:
 *
 *   1. /api/generate-report interpolated five "undefined/100" lines into every
 *      free full-report prompt.
 *   2. The paid PDF's score panel rendered rows with no label and no colour.
 *
 * Both were the same mistake made twice, so the fix lives in one place. Read
 * sub-scores through `normalizeToBiotics` rather than indexing a shape directly.
 */

export type IncomingSubScores = {
  prebiotics?: number
  probiotics?: number
  postbiotics?: number
  feed?: number
  seed?: number
  heal?: number
  /** Family's native pillars. Present only for the Family flow. */
  diversity?: number
  feeding?: number
  adding?: number
  consistency?: number
  feeling?: number
}

export type BioticScores = {
  prebiotics: number
  probiotics: number
  postbiotics: number
}

export type BioticScoreKey = keyof BioticScores

export const PATHWAY_LABEL: Record<BioticScoreKey, string> = {
  prebiotics: "Prebiotics",
  probiotics: "Probiotics",
  postbiotics: "Postbiotics",
}

/** What each pathway actually means, for surfaces with room to say so. */
export const PATHWAY_MEANING: Record<BioticScoreKey, string> = {
  prebiotics: "what feeds your microbes",
  probiotics: "live-culture exposure",
  postbiotics: "recovery, rhythm, resilience",
}

/**
 * Canonical key first, then the feed/seed/heal alias — the same precedence
 * lib/assessment-scoring.ts uses.
 *
 * Returns null when any pathway cannot be resolved, so callers fail closed
 * rather than rendering or prompting with a hole in the data. The legacy five
 * are deliberately NOT mapped onto the three: `diversity` is not `prebiotics`,
 * and inventing that equivalence would silently misreport Family scores. Family
 * results carry the canonical keys too, so they normalize on those.
 */
export function normalizeToBiotics(sub: IncomingSubScores | null | undefined): BioticScores | null {
  if (!sub) return null
  const pick = (canonical?: number, alias?: number): number | null => {
    const v = canonical ?? alias
    return typeof v === "number" && Number.isFinite(v) ? v : null
  }
  const prebiotics = pick(sub.prebiotics, sub.feed)
  const probiotics = pick(sub.probiotics, sub.seed)
  const postbiotics = pick(sub.postbiotics, sub.heal)
  if (prebiotics === null || probiotics === null || postbiotics === null) return null
  return { prebiotics, probiotics, postbiotics }
}

/** Weakest first — the pathway a report should lead its advice with. */
export function orderedByNeed(sub: BioticScores): Array<[BioticScoreKey, number]> {
  return (Object.entries(sub) as Array<[BioticScoreKey, number]>).sort((a, b) => a[1] - b[1])
}
