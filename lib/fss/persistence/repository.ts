import type { Answers } from "@/lib/fss/engine/score"
import type { ScoreProvenance } from "@/lib/fss/engine/provenance"
import type { ActionCategory, TimeHorizon } from "@/lib/fss/action/types"

/* ════════════════════════════════════════════════════════════════════════
   The persistence seam.

   ── The rule this exists to make structural ───────────────────────────────

   NO UI COMPONENT KNOWS WHICH BACKEND IS ACTIVE. If one does, the eventual
   move from local storage to Supabase stops being a substitution and becomes a
   product rewrite — and the whole reason for an interface here is that the
   move must be the former.

   ── Why local is the DEFAULT and not the fallback ─────────────────────────

   Agent sessions are read-only against production Supabase, and no FSS
   migration may be drafted before the domain set has scientific sign-off —
   writing the columns first creates pressure to keep them, and a column name is
   a methodology decision wearing a schema costume.

   So the candidate runtime persists locally and completely. The repository
   already does this twice — lib/stability/storage.ts and the Living Twin's
   twin_state — and both proved the same thing: a local-first feature is fully
   walkable, fully testable, and owes production nothing.

   ── What every record carries, and why the plan field is the load-bearing one ─

   A stored score carries its full provenance, because the live defect is
   scores that exist without a record of which method made them.

   A stored PLAN or ACTION additionally carries the priority and domain it came
   from and the methodology version in force when it was recommended. That is
   the field most easily dropped and the most expensive to lose: without it,
   nobody can reconstruct WHY EatoBiotics recommended something once the model
   has moved on. A recommendation whose reasoning cannot be reconstructed is not
   auditable, and this product's entire claim to care about its claims rests on
   being auditable.
   ════════════════════════════════════════════════════════════════════════ */

/** An assessment in progress or complete. */
export interface StoredAssessment {
  readonly id: string
  readonly assessmentVersion: string
  readonly questionSetVersion: string
  readonly answers: Answers
  readonly startedAt: string
  readonly completedAt?: string
}

/** A computed score, with the provenance that makes it interpretable. */
export interface StoredScore {
  readonly id: string
  readonly assessmentId: string
  readonly state: "scored" | "withheld"
  readonly score?: number
  readonly domains: readonly { readonly domain: string; readonly state: string; readonly score?: number }[]
  readonly completeness: number
  readonly provenance: ScoreProvenance
  readonly computedAt: string
}

/**
 * A recommendation, as stored. Gate 2 declared this; Gate 3 completed it.
 *
 * ── IT STORES IDS AND VERSIONS, AND NEVER THE PROSE ───────────────────────
 *
 * The sentence a person was shown is reconstructed from the versioned
 * catalogue, not copied in here. That is the whole reason the two version
 * fields exist: a stored action whose `actionSetVersion` no longer resolves
 * must read as *recommended under a method that has moved*, rather than
 * silently showing today's wording for yesterday's recommendation.
 *
 * It is the same refusal `legacy-unversioned` makes for scores, one layer up,
 * and `lib/fss/action/stored.ts` is where it is enforced.
 *
 * ── WHY THERE ARE TWO VERSIONS AND NOT ONE ────────────────────────────────
 *
 * `provenance` says which METHOD scored the person. `actionSetVersion` says
 * which CONTENT recommended to them. Both are needed to reconstruct why
 * EatoBiotics said something, and they move independently — reviewed wording
 * can change without any arithmetic changing.
 *
 * The obvious move would be a sixth field on `ScoreProvenance`. It is refused:
 * that type's five fields are asserted by value in Gate 2's tests, and
 * widening it would change what every existing candidate score claims about
 * itself. The €49 Report reached the same conclusion independently, carrying
 * `composerVersion` and `contentPackVersion` beside its schema version rather
 * than inside it.
 *
 * ── AND WHY IT STILL HAS NO CALLER ────────────────────────────────────────
 *
 * Because Your Plan is deterministic from the answers, so nothing about it
 * needs storing, and nothing about a person's intent should be persisted
 * before anybody asked for it. The only thing that would genuinely belong here
 * is a person's own relationship to a recommendation — started, dismissed —
 * which no surface offers yet.
 *
 * `scoreId` also has no source yet: the walk holds its score in component
 * state and `saveScore` is likewise uncalled. Those two calls arrive together
 * or not at all; minting a `scoreId` for nothing would be half a feature.
 */
export interface StoredAction {
  readonly id: string
  readonly scoreId: string
  /** Which priority produced this, and from which domain. */
  readonly sourcePriority: string
  readonly sourceDomain: string
  /** The catalogue entry this was, so the prose is looked up and never copied. */
  readonly recommendationId: string
  /** Feed · Seed · Rejuvenate. Carried so a stored action is legible on its own. */
  readonly actionCategory: ActionCategory
  readonly timeHorizon: TimeHorizon
  /** The methodology in force when it was recommended — see the docblock. */
  readonly provenance: ScoreProvenance
  /** The content version in force when it was recommended. */
  readonly actionSetVersion: string
  readonly status: "proposed" | "accepted" | "completed" | "dismissed"
  readonly createdAt: string
}

/**
 * Everything the candidate product may persist.
 *
 * Deliberately narrow. A repository that can store anything becomes the place
 * things are stored without anybody deciding they should be.
 */
export interface FoodSystemRepository {
  readonly backend: "local" | "supabase"
  /** True when this backend may be written to in the current runtime. */
  readonly writable: boolean

  loadAssessment(id: string): Promise<StoredAssessment | null>
  saveAssessment(assessment: StoredAssessment): Promise<void>

  loadLatestScore(): Promise<StoredScore | null>
  saveScore(score: StoredScore): Promise<void>

  /** Gate 3. Present so the shape is agreed; no caller yet. */
  loadActions(scoreId: string): Promise<readonly StoredAction[]>
  saveAction(action: StoredAction): Promise<void>
}

export class RepositoryWriteRefused extends Error {
  constructor(backend: string, reason: string) {
    super(`The ${backend} repository refused a write: ${reason}`)
    this.name = "RepositoryWriteRefused"
  }
}
