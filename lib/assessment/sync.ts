/**
 * lib/assessment/sync.ts — cross-device persistence for the assessment journey.
 *
 * Mirrors the Stability module pattern (lib/stability/storage.ts): localStorage is
 * the instant, anonymous-friendly cache; when the user is signed in we also push
 * the journey + normalised summaries to Supabase (/api/assessment/journey) and
 * hydrate them back on mount. Two-way last-write-wins, so an anonymous-then-signed-
 * in journey migrates up, and a fresh device pulls it down. All writes are
 * fire-and-forget and no-op silently when signed out.
 */

import { getJourney, patchJourney, type Journey } from "./journey"
import { allSummaries, writeCachedSummaries } from "./registry"

/** Set true once a server GET returns 200 — gates pushes for logged-out users. */
let authed = false
/** Ensures we only GET once per page load (like Stability's mount hydrate). */
let hydrated = false

const META_KEY = "eb_assessment_sync_meta_v1"

function readMetaUpdatedAt(): string | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.localStorage.getItem(META_KEY)
    return raw ? ((JSON.parse(raw) as { updatedAt?: string }).updatedAt ?? null) : null
  } catch {
    return null
  }
}

function writeMetaUpdatedAt(updatedAt: string): void {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(META_KEY, JSON.stringify({ updatedAt }))
  } catch {
    /* ignore */
  }
}

function hasLocalData(): boolean {
  return Object.keys(allSummaries()).length > 0
}

/** Fire-and-forget push of the current journey + summaries (only when signed in). */
export function pushIfAuthed(): void {
  if (!authed || typeof window === "undefined") return
  const summaries = allSummaries()
  if (Object.keys(summaries).length === 0) return // nothing worth persisting yet
  writeMetaUpdatedAt(new Date().toISOString())
  void fetch("/api/assessment/journey", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ journey: getJourney(), summaries }),
  }).catch(() => {})
}

/**
 * Pull the signed-in user's journey from Supabase and reconcile with local
 * (last-write-wins on updatedAt). Returns true if signed in.
 */
export async function hydrateFromServer(): Promise<boolean> {
  if (typeof window === "undefined") return false
  try {
    const res = await fetch("/api/assessment/journey", { method: "GET" })
    if (res.status === 401) {
      authed = false
      return false
    }
    if (!res.ok) return false
    authed = true

    const { journey, summaries, updatedAt } = (await res.json()) as {
      journey: Partial<Journey> | null
      summaries: Record<string, unknown> | null
      updatedAt: string | null
    }

    const serverHas = !!summaries && Object.keys(summaries).length > 0
    const localUpdatedAt = readMetaUpdatedAt()

    if (serverHas && (!hasLocalData() || (updatedAt ?? "") >= (localUpdatedAt ?? ""))) {
      // Server wins → pull into the local cache + journey store.
      writeCachedSummaries(summaries as Parameters<typeof writeCachedSummaries>[0])
      if (journey) patchJourney(journey)
      writeMetaUpdatedAt(updatedAt ?? new Date().toISOString())
    } else if (hasLocalData()) {
      // Local is newer (or server empty) → push it up.
      pushIfAuthed()
    }
    return true
  } catch {
    return false
  }
}

/** Hydrate once per page load (safe to call from multiple mounts). */
export async function ensureHydrated(): Promise<void> {
  if (hydrated) return
  hydrated = true
  await hydrateFromServer()
}

/** Make sure we've checked auth, then push local state if signed in. */
export async function persist(): Promise<void> {
  await ensureHydrated()
  pushIfAuthed()
}
