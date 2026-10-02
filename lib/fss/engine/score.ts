import type { FssDomain, ResolvedQuestionSet } from "@/lib/fss/questions/types"
import { scoredQuestions } from "@/lib/fss/questions/resolve"
import { resolveWeights, type DomainWeights, type NonProductionFixtureContext } from "./weights"
import { FSS_V1_PROVENANCE, type ScoreProvenance } from "./provenance"

/* ════════════════════════════════════════════════════════════════════════
   The FSS-v1 candidate engine.

     domainScore = round( mean(itemValues) / 3 × 100 )
     FoodSystemScore = round( Σ w[d] × domainScore(d) )

   THE BIOTICS APPEAR NOWHERE IN THIS FILE. They are not weighting buckets and
   not an input; that separation is what the whole architecture buys, and it is
   visible here as an absence.

   NO FLOOR. Today's model applies Math.max(n, 20), which means a 0–100 dial
   whose bottom 20 points are unreachable — every score ever issued overstates
   the low end. People are protected by band copy and tone, not by inflating
   the number.

   NOTHING FROM What You Notice OR Your Food Context REACHES THIS. The engine
   reads `scoredQuestions()`, which filters on `contributes === "fss"`, and it
   asserts the filter held rather than trusting it.
   ════════════════════════════════════════════════════════════════════════ */

/** A domain with too few answers to characterise. Never 0 — see below. */
export const INSUFFICIENT = "insufficient" as const

export type DomainResult =
  | { readonly domain: FssDomain; readonly state: "scored"; readonly score: number; readonly answered: number; readonly total: number }
  | { readonly domain: FssDomain; readonly state: typeof INSUFFICIENT; readonly answered: number; readonly total: number }

export type FoodSystemScoreState = "scored" | "withheld"

/**
 * A candidate Food System Score.
 *
 * `provenance` is REQUIRED and there is no constructor that omits it. That is
 * deliberate and it is the whole point: the live defect this work exists to
 * prevent is a score that exists without a record of which method made it, so
 * "forgot the version" must be a type error rather than a code review note.
 */
export interface FoodSystemScore {
  readonly state: FoodSystemScoreState
  /** Absent when withheld. A withheld score is not a zero and must not render as one. */
  readonly score?: number
  readonly domains: readonly DomainResult[]
  /** 0–1, always present, always displayed. */
  readonly completeness: number
  readonly provenance: ScoreProvenance
  /** Why a score was withheld, for the surface that has to say so. */
  readonly withheldBecause?: readonly FssDomain[]
}

/** Below this share of a domain's items answered, the domain is `insufficient`. */
export const MINIMUM_DOMAIN_COMPLETENESS = 0.6

export type Answers = Readonly<Record<string, number | undefined>>

export class EngineError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "EngineError"
  }
}

function domainResult(
  domain: FssDomain,
  values: readonly (number | undefined)[],
): DomainResult {
  const answered = values.filter((v) => typeof v === "number").length
  const total = values.length
  if (total === 0 || answered / total < MINIMUM_DOMAIN_COMPLETENESS) {
    return { domain, state: INSUFFICIENT, answered, total }
  }
  const given = values.filter((v): v is number => typeof v === "number")
  const mean = given.reduce((a, b) => a + b, 0) / given.length
  return { domain, state: "scored", score: Math.round((mean / 3) * 100), answered, total }
}

/**
 * Compute a candidate Food System Score.
 *
 * Requires a non-production fixture context, because there are no approved
 * weights. See `weights.ts` — that refusal is the feature.
 */
export function computeFoodSystemScore(args: {
  set: ResolvedQuestionSet
  answers: Answers
  weights: DomainWeights
  fixtureContext: NonProductionFixtureContext
  provenance?: ScoreProvenance
}): FoodSystemScore {
  const { set, answers, weights, fixtureContext } = args
  const resolved = resolveWeights(weights, fixtureContext)
  const scored = scoredQuestions(set)

  // Belt and braces: `scoredQuestions` filters, and this proves the filter
  // held. An unscored item reaching the arithmetic is the single failure this
  // engine must never have, so it is checked rather than assumed.
  for (const q of scored) {
    if (q.contributes !== "fss") {
      throw new EngineError(
        `"${q.id}" is ${q.contributes} and reached the scoring path. What You Notice and Your Food ` +
          `Context must reach the Score by no path at all.`,
      )
    }
    if (!q.domain) {
      throw new EngineError(`"${q.id}" is scored but names no domain, so it cannot be weighted.`)
    }
  }

  const byDomain = new Map<FssDomain, (number | undefined)[]>()
  for (const q of scored) {
    const list = byDomain.get(q.domain!) ?? []
    list.push(answers[q.id])
    byDomain.set(q.domain!, list)
  }

  const domains = [...byDomain.entries()].map(([domain, values]) => domainResult(domain, values))

  const answeredCount = scored.filter((q) => typeof answers[q.id] === "number").length
  const completeness = scored.length === 0 ? 0 : answeredCount / scored.length

  const insufficient = domains.filter((d) => d.state === INSUFFICIENT).map((d) => d.domain)
  const provenance = args.provenance ?? FSS_V1_PROVENANCE

  /*
   * ANY insufficient domain withholds the whole Score.
   *
   * The alternative — score the domains we have and weight them up to 1 — is
   * how a number stops meaning what it says: two people with the same answers
   * to different subsets would get comparable-looking scores from different
   * instruments. Withholding is the honest output, and the domains are still
   * shown individually with what is missing named.
   */
  if (insufficient.length > 0) {
    return { state: "withheld", domains, completeness, provenance, withheldBecause: insufficient }
  }

  const score = Math.round(
    domains.reduce((sum, d) => sum + (resolved[d.domain] ?? 0) * (d.state === "scored" ? d.score : 0), 0),
  )

  return { state: "scored", score, domains, completeness, provenance }
}
