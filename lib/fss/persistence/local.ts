"use client"

import {
  RepositoryWriteRefused,
  type FoodSystemRepository,
  type StoredAction,
  type StoredAssessment,
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
 */

const PREFIX = "eatobiotics.fss.v1."

function read<T>(key: string): T | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.localStorage.getItem(PREFIX + key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

function write(key: string, value: unknown): void {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(value))
  } catch {
    // Storage unavailable or full. The walk continues without memory, which is
    // the right trade: losing the answers is recoverable, crashing is not.
  }
}

export class LocalStorageRepository implements FoodSystemRepository {
  readonly backend = "local" as const
  readonly writable = true

  async loadAssessment(id: string): Promise<StoredAssessment | null> {
    return read<StoredAssessment>(`assessment.${id}`)
  }

  async saveAssessment(assessment: StoredAssessment): Promise<void> {
    write(`assessment.${assessment.id}`, assessment)
  }

  async loadLatestScore(): Promise<StoredScore | null> {
    return read<StoredScore>("score.latest")
  }

  async saveScore(score: StoredScore): Promise<void> {
    write("score.latest", score)
  }

  async loadActions(scoreId: string): Promise<readonly StoredAction[]> {
    return read<StoredAction[]>(`actions.${scoreId}`) ?? []
  }

  async saveAction(action: StoredAction): Promise<void> {
    const existing = await this.loadActions(action.scoreId)
    write(`actions.${action.scoreId}`, [...existing.filter((a) => a.id !== action.id), action])
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
  async loadLatestScore(): Promise<StoredScore | null> {
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
