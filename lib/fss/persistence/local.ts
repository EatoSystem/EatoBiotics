"use client"

import {
  RepositoryWriteFailed,
  RepositoryWriteRefused,
  type FoodSystemRepository,
  type StoredAction,
  type StoredAssessment,
  type StoredFoodSystem,
  type StoredPlanDecision,
  type StoredPriorityDecision,
  type StoredScore,
} from "./repository"

/**
 * The local adapter — the active backend for the candidate runtime.
 *
 * Follows lib/stability/storage.ts: a synchronous local cache behind an async
 * interface, so the seam is already the right shape for a backend that really
 * is asynchronous, and every read and write is wrapped because localStorage
 * throws in private browsing, in some embedded webviews, and whenever a user
 * has blocked site data. A candidate assessment that crashes because storage
 * is unavailable would be a worse failure than one that simply does not
 * remember.
 *
 * ══ TWO WRITE BEHAVIOURS, NAMED APART ═══════════════════════════════════════
 *
 * There is one lenient write and one strict write, and the difference is not a
 * style choice — it is the only thing standing between a failed storage write
 * and a half-created Food System being presented as current.
 *
 *   `write`        swallows the failure. Used for the ASSESSMENT IN PROGRESS,
 *                  saved on every answer. Someone twenty questions in should
 *                  not be shown an error because their browser is in private
 *                  mode. Losing the answers is recoverable; crashing is not.
 *
 *   `writeStrict`  throws `RepositoryWriteFailed`. Used for EVERYTHING ELSE.
 *                  Establishing a Food System is an ordered sequence ending in
 *                  the `system.current` pointer, and `localStorage` has no
 *                  transactions — so the order IS the guarantee. A silent
 *                  failure at step 2 followed by a successful step 7 would make
 *                  a system current that has no score behind it.
 *
 * One behaviour used for two jobs would have had to pick which failure to
 * accept. Two behaviours let each job have the one that is right for it.
 */

const PREFIX = "eatobiotics.fss.v1."

/** The one unkeyed slot in the store, and the commit point of establishment. */
const CURRENT_SYSTEM_KEY = "system.current"

function read<T>(key: string): T | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.localStorage.getItem(PREFIX + key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

/** Lenient. For the assessment in progress only. See the docblock. */
function write(key: string, value: unknown): void {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(value))
  } catch {
    // Storage unavailable or full. The walk continues without memory, which is
    // the right trade: losing the answers is recoverable, crashing is not.
  }
}

/**
 * Strict. Reports failure to its caller.
 *
 * Also throws when there is no `window`, which matters: a server-rendered call
 * that silently did nothing would look like a successful write to the
 * establishment path, and the path would go on to write the pointer.
 */
function writeStrict(key: string, value: unknown): void {
  if (typeof window === "undefined") {
    throw new RepositoryWriteFailed(key, "no window — this write only happens in the browser")
  }
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(value))
  } catch (cause) {
    throw new RepositoryWriteFailed(key, cause)
  }
}

export class LocalStorageRepository implements FoodSystemRepository {
  readonly backend = "local" as const
  readonly writable = true

  /* ── The assessment: lenient ───────────────────────────────────────────── */

  async loadAssessment(id: string): Promise<StoredAssessment | null> {
    return read<StoredAssessment>(`assessment.${id}`)
  }

  async saveAssessment(assessment: StoredAssessment): Promise<void> {
    write(`assessment.${assessment.id}`, assessment)
  }

  /* ── Everything else: strict ───────────────────────────────────────────── */

  async loadScore(id: string): Promise<StoredScore | null> {
    return read<StoredScore>(`score.${id}`)
  }

  async saveScore(score: StoredScore): Promise<void> {
    writeStrict(`score.${score.id}`, score)
  }

  async loadActions(scoreId: string): Promise<readonly StoredAction[]> {
    return read<StoredAction[]>(`actions.${scoreId}`) ?? []
  }

  async saveAction(action: StoredAction): Promise<void> {
    const existing = await this.loadActions(action.scoreId)
    writeStrict(`actions.${action.scoreId}`, [
      ...existing.filter((a) => a.id !== action.id),
      action,
    ])
  }

  async loadPriorityDecision(scoreId: string): Promise<StoredPriorityDecision | null> {
    return read<StoredPriorityDecision>(`priority-decision.${scoreId}`)
  }

  async savePriorityDecision(decision: StoredPriorityDecision): Promise<void> {
    writeStrict(`priority-decision.${decision.scoreId}`, decision)
  }

  async loadPlanDecision(scoreId: string): Promise<StoredPlanDecision | null> {
    return read<StoredPlanDecision>(`plan-decision.${scoreId}`)
  }

  async savePlanDecision(decision: StoredPlanDecision): Promise<void> {
    writeStrict(`plan-decision.${decision.scoreId}`, decision)
  }

  async loadSystem(id: string): Promise<StoredFoodSystem | null> {
    return read<StoredFoodSystem>(`system.${id}`)
  }

  async saveSystem(system: StoredFoodSystem): Promise<void> {
    writeStrict(`system.${system.id}`, system)
  }

  /* ── The pointer. Written last, by its own call. ───────────────────────── */

  async loadCurrentSystemId(): Promise<string | null> {
    return read<string>(CURRENT_SYSTEM_KEY)
  }

  async setCurrentSystem(systemId: string): Promise<void> {
    writeStrict(CURRENT_SYSTEM_KEY, systemId)
  }

  async clearCurrentSystem(): Promise<void> {
    if (typeof window === "undefined") return
    try {
      window.localStorage.removeItem(PREFIX + CURRENT_SYSTEM_KEY)
    } catch {
      // Nothing to do and nothing to report: the pointer is already
      // unreadable, which is the state this call was asked to produce.
    }
  }
}

/**
 * The Supabase adapter — present to prove the interface, REFUSING EVERY WRITE.
 *
 * ── Why a deliberately non-functional adapter is worth having ─────────────
 *
 * Two reasons, and neither is ceremony.
 *
 * First, it proves the interface is implementable by something that is not
 * localStorage. An interface with one implementation is a class wearing a
 * costume, and its abstractions go untested until the day they are needed.
 *
 * Second, it makes the refusal EXPLICIT AND TESTABLE. The alternative — no
 * adapter at all — means that when somebody does write one, there is nothing
 * asserting it must not write to production before the schema is authorised.
 * Here the refusal is the code, and a test proves it.
 *
 * Every write throws. Every read returns empty. It is wired to nothing.
 */
export class SupabaseRepositoryDisabled implements FoodSystemRepository {
  readonly backend = "supabase" as const
  readonly writable = false

  private refuse(): never {
    throw new RepositoryWriteRefused(
      "supabase",
      "No FSS table exists and no migration is authorised. The domain set has no named scientific " +
        "reviewer, so the columns would encode a methodology decision nobody has taken. Writing this " +
        "requires an explicit founder approval gate, not a code change.",
    )
  }

  async loadAssessment(): Promise<StoredAssessment | null> {
    return null
  }
  async saveAssessment(): Promise<void> {
    this.refuse()
  }
  async loadScore(): Promise<StoredScore | null> {
    return null
  }
  async saveScore(): Promise<void> {
    this.refuse()
  }
  async loadActions(): Promise<readonly StoredAction[]> {
    return []
  }
  async saveAction(): Promise<void> {
    this.refuse()
  }
  async loadPriorityDecision(): Promise<StoredPriorityDecision | null> {
    return null
  }
  async savePriorityDecision(): Promise<void> {
    this.refuse()
  }
  async loadPlanDecision(): Promise<StoredPlanDecision | null> {
    return null
  }
  async savePlanDecision(): Promise<void> {
    this.refuse()
  }
  async loadSystem(): Promise<StoredFoodSystem | null> {
    return null
  }
  async saveSystem(): Promise<void> {
    this.refuse()
  }
  async loadCurrentSystemId(): Promise<string | null> {
    return null
  }
  async setCurrentSystem(): Promise<void> {
    this.refuse()
  }
  async clearCurrentSystem(): Promise<void> {
    this.refuse()
  }
}

/**
 * The repository the candidate runtime uses.
 *
 * A function rather than a module-level constant so that no import order
 * decides it, and so a test can assert what it returns. It returns the local
 * adapter unconditionally today — there is no environment in which the
 * candidate product should write to Supabase, so there is no branch that
 * could pick it.
 */
export function foodSystemRepository(): FoodSystemRepository {
  return new LocalStorageRepository()
}
