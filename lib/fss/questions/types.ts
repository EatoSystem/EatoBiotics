/* ════════════════════════════════════════════════════════════════════════
   questions-v1.0 — the candidate question set, as a MANIFEST OF COMPOSITION.

   FSS-v1 Candidate — Frozen for Scientific Review, Not Yet Scientifically
   Approved. Nothing in this module is production-active.

   ── Why a manifest and not a second copy of the questions ──────────────────

   The candidate model needs most of the fifteen legacy items plus a handful of
   new ones. There were three ways to express that:

     copy the fifteen into a new file   two sources of the same sentence, free
                                        to drift, and nothing would notice
     compose them at scoring time       no single artefact answers "what does
                                        assessment-v1.0 ask?", which is the
                                        first question a reviewer asks
     REFERENCE them, pinned             one source per sentence, one resolved
                                        artefact, and a loud failure if the
                                        thing referenced ever moves

   The third is what this is. A legacy item is named by id and pinned to a
   hash of its own content; the candidate items are owned here outright.

   ── The pin is not decoration ─────────────────────────────────────────────

   `lib/assessment-data.ts` is inside the methodology freeze, so in principle
   it cannot change. In practice "cannot change" is a property of a test, and
   a test can be updated by someone who has established that a methodology
   change is intended — which is exactly the moment assessment-v1.0 must stop
   silently inheriting the new wording and start failing.

   So the pin is a SECOND, independent statement: assessment-v1.0 asked THIS
   question, with THIS wording and THESE options. If the legacy item moves for
   any reason, resolution throws rather than quietly producing a different
   instrument under the same version number.
   ════════════════════════════════════════════════════════════════════════ */

/** The five candidate scored domains. Frozen for review, not approved. */
export type FssDomain =
  | "diversity"
  | "plantsAndFibre"
  | "fermentedFoods"
  | "foodQuality"
  | "mealRhythm"

/**
 * What an item contributes to — declared per item, never inferred.
 *
 * This is the field that keeps Decision 4 honest at the level of the data
 * rather than the level of a comment: What You Notice and Your Food Context
 * are carried by the same instrument and reach the Score by no path at all.
 */
export type Contribution = "fss" | "what-you-notice" | "food-context"

/** The four parts a person moves through. Presentation grouping. */
export type AssessmentPart = "what-you-eat" | "how-you-eat" | "what-you-notice" | "your-food-context"

/** An answer option. Same 0–3 shape as the legacy instrument. */
export interface CandidateOption {
  readonly value: 0 | 1 | 2 | 3
  readonly label: string
  readonly description?: string
}

/** An item this version owns outright. */
export interface OwnedItem {
  readonly kind: "owned"
  readonly id: string
  readonly part: AssessmentPart
  readonly sectionTitle: string
  readonly text: string
  readonly options: readonly CandidateOption[]
  /** `fss` items must name a domain; the unscored layers must not. */
  readonly contributes: Contribution
  readonly domain?: FssDomain
  /** Drafts pending scientific sign-off carry this, and it is rendered. */
  readonly status: "draft-pending-review"
}

/**
 * A reference to a legacy item, pinned to its content.
 *
 * `pin` is the sha256 of the same seven-field projection the methodology
 * freeze hashes, computed for this one question. See `legacy-pin.ts`.
 */
export interface LegacyRef {
  readonly kind: "legacy-ref"
  readonly id: string
  readonly pin: string
  readonly part: AssessmentPart
  readonly sectionTitle: string
  readonly contributes: Contribution
  readonly domain?: FssDomain
}

export type ManifestEntry = OwnedItem | LegacyRef

/** One item of the resolved set — a legacy reference and an owned item look identical here. */
export interface ResolvedQuestion {
  readonly id: string
  readonly order: number
  readonly part: AssessmentPart
  readonly sectionTitle: string
  readonly text: string
  readonly options: readonly CandidateOption[]
  readonly contributes: Contribution
  readonly domain?: FssDomain
  readonly origin: "legacy-frozen" | "candidate-v1"
  readonly status?: "draft-pending-review"
}

export interface ResolvedQuestionSet {
  readonly questionSetVersion: string
  readonly assessmentVersion: string
  readonly questions: readonly ResolvedQuestion[]
}
