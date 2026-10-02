import type { Answers, FoodSystemScore } from "@/lib/fss/engine/score"
import { FSS_V1_PROVENANCE, type ScoreProvenance } from "@/lib/fss/engine/provenance"
import type { FssDomain, ResolvedQuestionSet } from "@/lib/fss/questions/types"
import { DOMAIN_PRESENTATION, PRIORITY_COPY } from "@/lib/fss/presentation/domains"
import { PRIORITY_MAX, type PriorityEvidence, type ResolvedPriority } from "./types"

/* ════════════════════════════════════════════════════════════════════════
   Your Priority — a structured object, not a label.

   ── What the structure buys, and why a label would not ────────────────────

   Gate 2 produced a priority as `{ domain, why }`, where `why` was one
   constant sentence identical for all five domains. That is enough to render a
   card and not enough to explain anything: nothing in it says WHICH ANSWERS
   put the domain there, so nobody — not a customer, not a reviewer, not a
   future session — can reconstruct the reasoning.

   This returns the chain instead:

     source domain → the answered items behind it → a rank-based rationale →
     the reviewed sentence a person reads → how much of the domain was
     answered → the methodology in force

   The evidence is the load-bearing part. It points at a question that was
   asked and an answer that was given, both quoted and neither interpreted,
   which is what makes "this is where your answers described the least" a
   statement about reported behaviour rather than about a person.

   ── The vocabulary this refuses, and where it came from ───────────────────

   `lib/report/deterministic/priority.ts` solved this for the €49 Report and
   refuses, by name, a priority meaning "a biological weakness · the root cause
   · the highest risk · a treatment target · what is damaging their system ·
   the biggest physiological blocker". It even carries a guard asserting the
   module contains no ranking vocabulary at all.

   That module CANNOT be imported here: the science contract's importer
   allow-list is pinned by value to five files under `lib/report/`, and a sixth
   importer fails CI. So the refusals are transcribed below as this layer's own
   data and enforced against this layer's own copy.

   The two engines stay philosophically distinct on purpose. The Consultation's
   refuses arithmetic because its inputs are self-report categories; this one
   ranks because it has a candidate score to rank on. Ranking a score is not
   the same move as ranking an answer.
   ════════════════════════════════════════════════════════════════════════ */

/**
 * What a priority must never be taken to mean.
 *
 * Data rather than prose so a guard can iterate it, in the shape of
 * `NOT_A_STARTING_POINT` and `REGENERATE_BOUNDARY.mustNotMean`. Transcribed,
 * not imported — see the docblock.
 */
export const PRIORITY_MUST_NOT_MEAN = [
  "a biological weakness",
  "a nutrient deficiency",
  "the root cause",
  "the highest risk",
  "a treatment target",
  "what is damaging their system",
  "the biggest physiological blocker",
  "a disease state",
  "the most important thing about them",
] as const

/**
 * The 0–3 option labels for one domain's scored items, in asked order.
 *
 * Reads the instrument rather than re-describing it, so evidence can only ever
 * quote a question that exists and an option that was offered.
 */
function evidenceFor(
  set: ResolvedQuestionSet,
  answers: Answers,
  domain: FssDomain,
): readonly PriorityEvidence[] {
  return set.questions
    .filter((q) => q.contributes === "fss" && q.domain === domain)
    .filter((q) => typeof answers[q.id] === "number")
    .sort((a, b) => a.order - b.order)
    .map((q) => {
      const value = answers[q.id] as 0 | 1 | 2 | 3
      const option = q.options.find((o) => o.value === value)
      return {
        questionId: q.id,
        order: q.order,
        question: q.text,
        // An answer we cannot name is not evidence. A missing option means the
        // instrument and the stored answer disagree, which should be visible
        // rather than rendered as a blank.
        answer: option?.label ?? PRIORITY_COPY.unknownAnswer,
        value,
      }
    })
}

/**
 * One to three priorities. In practice one.
 *
 * ── The selection rule, and the number that is deliberately not chosen ────
 *
 * The exact-lowest scored domains, ties included, capped at three. There is NO
 * "close enough" tolerance, and that absence is the decision: a tolerance is a
 * threshold, a threshold is a methodology choice, and this model has no
 * reviewer yet. Gate 2 wrote that down and it is kept verbatim.
 *
 * The consequence, stated rather than hidden: with five distinct scores this
 * returns exactly ONE priority, and the 1–3 range exists for ties rather than
 * as a typical case. That matches the €49 Report's "Where to start — exactly
 * one", and a plan that opens with three things to do has not prioritised.
 *
 * ── Three behaviours worth knowing ────────────────────────────────────────
 *
 * `insufficient` domains are excluded: a domain we could not characterise
 * cannot be the thing we are most confident about.
 *
 * A WITHHELD overall score still yields priorities. Withholding the composite
 * is a statement about the composite — the per-domain findings are still there,
 * and refusing to act on them because one other domain was unanswered would
 * punish the person for the gap twice.
 *
 * All-insufficient yields NONE, and the surface must say so rather than
 * rendering an empty section.
 */
export function resolvePriorities(args: {
  score: FoodSystemScore
  set: ResolvedQuestionSet
  answers: Answers
  provenance?: ScoreProvenance
}): readonly ResolvedPriority[] {
  const { score, set, answers } = args
  const provenance = args.provenance ?? score.provenance ?? FSS_V1_PROVENANCE

  const scored = score.domains.filter(
    (d): d is Extract<typeof d, { state: "scored" }> => d.state === "scored",
  )
  if (scored.length === 0) return []

  const lowest = Math.min(...scored.map((d) => d.score))

  /*
   * `score.domains` order is the order the engine built it in, which follows
   * the instrument. Filtering preserves it, so ties resolve the same way on
   * every run — a priority that moved between two identical walks would be
   * worse than an arbitrary one.
   */
  const chosen = scored.filter((d) => d.score === lowest).slice(0, PRIORITY_MAX)

  return chosen.map((d) =>
    describePriority({
      domain: d.domain,
      domainScore: d.score,
      answered: d.answered,
      total: d.total,
      scoredDomains: scored.length,
      set,
      answers,
      provenance,
    }),
  )
}

/**
 * Describe ONE priority, for a domain somebody has already selected.
 *
 * ── Why selection and description are two functions ───────────────────────
 *
 * Because Gate 4 persists the SELECTION and derives the DESCRIPTION, and those
 * two halves must not be able to disagree.
 *
 * `resolvePriorities` is the selection: it reads the scored domains, finds the
 * lowest, and decides. That decision is a versioned product decision — it is
 * stored, under `SYSTEM_MODEL_VERSION`, because reopening a Food System six
 * months from now must not silently re-decide it under a newer rule.
 *
 * This is the description: given a domain that was chosen, it produces the
 * evidence, the rationale, the reviewed sentence and the confidence. All of
 * that regenerates from versioned inputs, so persisting it would make a copy
 * edit a data migration.
 *
 * The split is structural rather than stylistic: `resolvePriorities` calls
 * THIS, so there is exactly one place a priority is described, and a stored
 * decision read back through it is described identically to a fresh one. Two
 * code paths would drift, and the first symptom would be a historical plan
 * whose explanation no longer matched its own selection.
 *
 * ── It makes no selection claim ───────────────────────────────────────────
 *
 * It does not check that `domain` is the lowest, and it must not: the caller
 * either just selected it or is reading back a selection that was made under a
 * policy this code no longer implements. Re-asserting the rule here would turn
 * a historical record into a disagreement with the present.
 */
export function describePriority(args: {
  domain: FssDomain
  domainScore: number
  answered: number
  total: number
  /** How many domains were scored, for the auditable rank sentence. */
  scoredDomains: number
  set: ResolvedQuestionSet
  answers: Answers
  provenance: ScoreProvenance
}): ResolvedPriority {
  const { domain, domainScore, answered, total, scoredDomains, set, answers, provenance } = args
  return {
    id: priorityIdFor(domain),
    sourceDomain: domain,
    domainScore,
    evidence: evidenceFor(set, answers, domain),
    rationale: PRIORITY_COPY.rationale(domainScore, scoredDomains),
    explanation: PRIORITY_COPY.explanation,
    headline: DOMAIN_PRESENTATION[domain].priorityHeadline,
    confidence: {
      answered,
      total,
      completeness: total === 0 ? 0 : answered / total,
    },
    status: "candidate-pending-review",
    provenance,
  }
}

/**
 * The stable id for a priority on one domain.
 *
 * Derived from the domain and never from a counter, which is what lets a
 * stored decision reference it and a later read find it again. One function so
 * the format exists once: a second literal `priority:${domain}` somewhere else
 * would be a second definition of an identity.
 */
export function priorityIdFor(domain: FssDomain): string {
  return `priority:${domain}`
}
