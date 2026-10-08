import type { FoodSystemRepository, StoredScore } from "@/lib/fss/persistence/repository"
import {
  canCompare,
  canCompareDomains,
  type ComparisonVerdict,
} from "@/lib/fss/engine/compare"

/* ════════════════════════════════════════════════════════════════════════
   CAN THESE TWO FOOD SYSTEMS BE COMPARED, AND IN WHAT WAYS?

   ══ A COMPARISON IS A RELATIONSHIP BETWEEN TWO IMMUTABLE FOOD SYSTEMS ══════

   Not between two loose scores. That is why the only thing exported here takes
   a SYSTEM ID and resolves the pair itself, and why no `compare(scoreA, scoreB)`
   exists at this layer even privately-shaped as a helper worth exporting: a
   function that accepts an arbitrary pair is a function that will eventually be
   handed the wrong pair, and the wrong pair produces a number that looks
   exactly as credible as the right one.

   ══ THE PAIR IS RESOLVED, NEVER CHOSEN ════════════════════════════════════

   `previousSystemId` determines it. NOT "the latest two by date", which is the
   implementation that looks equivalent on a two-system account and silently
   compares the wrong things on a three-system one. Viewing B must compare
   A↔B even though C exists and is newer, and
   `tests/unit/my-food-system.test.ts` asks exactly that, because asking only
   "viewing C compares B↔C" cannot tell the two implementations apart.

   ══ THIS MODULE WRITES NO PROSE ═══════════════════════════════════════════

   It produces arithmetic: two numbers, their difference, and a direction. No
   band, no magnitude word, no ranking, no sentence, and NO CAUSAL VOCABULARY —
   there is nowhere in these types to put "because". What EatoBiotics may
   honestly SAY about a change is a separate step with separate review, and the
   key set of every state is pinned by value so a `headline: string` cannot
   arrive here quietly.

   It also touches no interpretation: `interpretation-v1.0` is deliberately
   unregistered and `getScoreBand` throws by design, so band language is not
   available to this layer and must not become available through it.
   ════════════════════════════════════════════════════════════════════════ */

/* ── The facts ─────────────────────────────────────────────────────────── */

/** Arithmetic on two comparable numbers. `delta` is current − previous. */
export interface ScoreChange {
  readonly previous: number
  readonly current: number
  readonly delta: number
  readonly direction: "higher" | "lower" | "same"
}

/**
 * One domain, paired across the two systems.
 *
 * `not-both-scored` is a real fact rather than an absence to hide: a domain
 * that was insufficient at one assessment and scored at the other genuinely
 * moved, and there is genuinely nothing to subtract. Splitting it off means no
 * renderer can reach a `delta` that was never computed.
 */
export type DomainChange =
  | {
      readonly domain: string
      readonly state: "both-scored"
      readonly previous: number
      readonly current: number
      readonly delta: number
      readonly direction: "higher" | "lower" | "same"
    }
  | {
      readonly domain: string
      readonly state: "not-both-scored"
      readonly previous: number | null
      readonly current: number | null
    }

/* ── When the comparison cannot be attempted at all ────────────────────── */

/**
 * A RECORD PROBLEM, which is not a refusal.
 *
 * A refusal is a methodological statement — these two numbers came from
 * different instruments — and dressing a missing file up as one would lie about
 * why the product went quiet. The vocabulary deliberately mirrors
 * `FoodSystemLoad`'s rather than inventing a second one for the same idea.
 *
 * `domain-sets-disagree` is the odd one and the most important: if
 * `canCompareDomains` PERMITTED the pair and their domain names still do not
 * match, then the schema version is lying about what it covers. `canCompare`
 * takes exactly this posture one layer down — "the method version is lying
 * about what it covers, which is worth failing on rather than tolerating,
 * because it means provenance has stopped being reliable."
 */
export type ComparisonUnavailable =
  | "system-record-missing"
  | "previous-system-record-missing"
  | "score-record-missing"
  | "previous-score-record-missing"
  | "domain-sets-disagree"

/* ── The result ────────────────────────────────────────────────────────── */

/**
 * ── WHY THREE COMPARABILITY STATES AND NOT ONE WITH TWO VERDICTS ──────────
 *
 * Because `score-only-comparable` HAS NO `domains` FIELD. A consumer that
 * forgot to read `domainVerdict` cannot render a per-domain delta under a moved
 * schema, since the data it would need is not there to read. That is the same
 * principle the unscored evidence classes use — a function cannot render what
 * the type it received has nowhere to put — applied to the one case 2a was
 * built for: the overall score may be comparable while the domains are not.
 *
 * ── BOTH SCORES ARE CARRIED IN ALL THREE ──────────────────────────────────
 *
 * A refusal suppresses the RELATIONSHIP, not the records. Two results shown
 * separately and labelled is the correct outcome of a method change, and it is
 * the only place `COMPARISON_LANGUAGE.methodChanged` is true: there really are
 * two results, and the method really did change between them.
 */
export type FoodSystemComparison =
  /** One system. Nothing to compare, and NOT a failure. */
  | { readonly state: "no-predecessor"; readonly currentSystemId: string }
  | {
      readonly state: "unavailable"
      readonly currentSystemId: string
      readonly failed: ComparisonUnavailable
    }
  | {
      readonly state: "refused"
      readonly previousSystemId: string
      readonly currentSystemId: string
      readonly previousScore: StoredScore
      readonly currentScore: StoredScore
      readonly scoreVerdict: ComparisonVerdict
      readonly domainVerdict: ComparisonVerdict
    }
  | {
      readonly state: "score-only-comparable"
      readonly previousSystemId: string
      readonly currentSystemId: string
      readonly previousScore: StoredScore
      readonly currentScore: StoredScore
      readonly scoreVerdict: ComparisonVerdict
      readonly domainVerdict: ComparisonVerdict
      readonly score: ScoreChange | null
    }
  | {
      readonly state: "fully-comparable"
      readonly previousSystemId: string
      readonly currentSystemId: string
      readonly previousScore: StoredScore
      readonly currentScore: StoredScore
      readonly scoreVerdict: ComparisonVerdict
      readonly domainVerdict: ComparisonVerdict
      readonly score: ScoreChange | null
      readonly domains: readonly DomainChange[]
    }

/* ── The one entry point ───────────────────────────────────────────────── */

export async function compareSystems(args: {
  repo: FoodSystemRepository
  /** The system being VIEWED. Its own `previousSystemId` picks the partner. */
  systemId: string
}): Promise<FoodSystemComparison> {
  const { repo, systemId } = args

  const current = await repo.loadSystem(systemId)
  if (!current) {
    return { state: "unavailable", currentSystemId: systemId, failed: "system-record-missing" }
  }

  if (current.previousSystemId === null) {
    return { state: "no-predecessor", currentSystemId: systemId }
  }

  /*
   * Resolved by ID, from the record itself. Nothing here reads
   * `loadCurrentSystemId`, sorts by `establishedAt`, or looks at any system
   * other than the two the chain names.
   */
  const previous = await repo.loadSystem(current.previousSystemId)
  if (!previous) {
    return {
      state: "unavailable",
      currentSystemId: systemId,
      failed: "previous-system-record-missing",
    }
  }

  const currentScore = await repo.loadScore(current.scoreId)
  if (!currentScore) {
    return { state: "unavailable", currentSystemId: systemId, failed: "score-record-missing" }
  }
  const previousScore = await repo.loadScore(previous.scoreId)
  if (!previousScore) {
    return {
      state: "unavailable",
      currentSystemId: systemId,
      failed: "previous-score-record-missing",
    }
  }

  const common = {
    previousSystemId: previous.id,
    currentSystemId: current.id,
    previousScore,
    currentScore,
  } as const

  /* ── The two questions, asked separately ──────────────────────────────── */

  const scoreVerdict = canCompare(previousScore.provenance, currentScore.provenance)
  const domainVerdict = canCompareDomains(
    previousScore.domainSchemaVersion,
    currentScore.domainSchemaVersion,
  )

  if (!scoreVerdict.comparable && !domainVerdict.comparable) {
    return { state: "refused", ...common, scoreVerdict, domainVerdict }
  }

  /*
   * A refused SCORE with permitted domains is still a refusal here.
   *
   * The domain schema matching says the parts have the same names; it says
   * nothing about whether the numbers inside them were produced the same way.
   * If the method moved, every per-domain number moved with it, so there is no
   * "domains only" state — and inventing one would let a method change through
   * the narrower gate.
   */
  if (!scoreVerdict.comparable) {
    return { state: "refused", ...common, scoreVerdict, domainVerdict }
  }

  /*
   * COMPARABILITY AND AVAILABILITY ARE DIFFERENT QUESTIONS.
   *
   * A withheld score has no number to subtract, and that is not a method
   * disagreement — the methods agree, there is simply nothing there. So the
   * state stays comparable and `score` is null. Collapsing the two would tell
   * somebody the method changed when it did not.
   */
  const score = scoreChange(previousScore, currentScore)

  if (!domainVerdict.comparable) {
    return { state: "score-only-comparable", ...common, scoreVerdict, domainVerdict, score }
  }

  const domains = domainChanges(previousScore, currentScore)
  if (domains === "disagree") {
    return { state: "unavailable", currentSystemId: systemId, failed: "domain-sets-disagree" }
  }

  return { state: "fully-comparable", ...common, scoreVerdict, domainVerdict, score, domains }
}

/* ── Private arithmetic ────────────────────────────────────────────────── */

function direction(delta: number): "higher" | "lower" | "same" {
  if (delta > 0) return "higher"
  if (delta < 0) return "lower"
  return "same"
}

function scoreChange(previous: StoredScore, current: StoredScore): ScoreChange | null {
  const a = previous.state === "scored" ? previous.score : undefined
  const b = current.state === "scored" ? current.score : undefined
  if (typeof a !== "number" || typeof b !== "number") return null
  const delta = b - a
  return { previous: a, current: b, delta, direction: direction(delta) }
}

/**
 * Pair the domains by name, in the current score's order.
 *
 * Returns `"disagree"` rather than a partial list when the two sets differ,
 * because the domain verdict has already said these two were composed of the
 * same parts. A silent intersection would hide a provenance failure behind a
 * shorter list of perfectly plausible deltas.
 */
function domainChanges(
  previous: StoredScore,
  current: StoredScore,
): readonly DomainChange[] | "disagree" {
  const before = new Map(previous.domains.map((d) => [d.domain, d]))
  const after = new Map(current.domains.map((d) => [d.domain, d]))

  if (before.size !== after.size) return "disagree"
  for (const name of after.keys()) if (!before.has(name)) return "disagree"

  const out: DomainChange[] = []
  for (const d of current.domains) {
    const was = before.get(d.domain)
    const a = was?.state === "scored" ? was.score : undefined
    const b = d.state === "scored" ? d.score : undefined

    if (typeof a === "number" && typeof b === "number") {
      const delta = b - a
      out.push({
        domain: d.domain,
        state: "both-scored",
        previous: a,
        current: b,
        delta,
        direction: direction(delta),
      })
    } else {
      out.push({
        domain: d.domain,
        state: "not-both-scored",
        previous: typeof a === "number" ? a : null,
        current: typeof b === "number" ? b : null,
      })
    }
  }
  return out
}
