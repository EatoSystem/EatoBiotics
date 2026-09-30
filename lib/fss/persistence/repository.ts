import type { Answers } from "@/lib/fss/engine/score"
import type { ScoreProvenance } from "@/lib/fss/engine/provenance"

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
 * A recommendation. Gate 2 stores none — this is the CONTRACT Gate 3 fills.
 *
 * Declared now, empty, so that the shape Gate 3 has to satisfy is agreed while
 * the reasoning is fresh rather than invented alongside the content.
 */
export interface StoredAction {
  readonly id: string
  readonly scoreId: string
  /** Which priority produced this, and from which domain. */
  readonly sourcePriority: string
  readonly sourceDomain: string
  /** The methodology in force when it was recommended — see the docblock. */
  readonly provenance: ScoreProvenance
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
