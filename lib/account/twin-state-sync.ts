/**
 * EatoBiotics — twin-state sync client (rituals + milestones ↔ /api/twin-state).
 *
 * localStorage stays the live source of truth (instant taps, works signed-out);
 * these helpers hydrate it from the server on mount and push changes in the
 * background so signed-in members keep their ritual streaks + milestone
 * history across devices. Pure merge logic is exported for unit tests; the
 * fetch wrappers fail silently (offline/unauthed is fine).
 */

import {
  dayKey,
  lastSevenDayKeys,
  loadRitual,
  saveRitual,
  ritualCount,
  type RitualDay,
  type Store,
} from "./ritual"
import { loadSeen, saveSeen } from "./milestones"

export type RitualMap = Record<string, RitualDay>

/** Server days fill gaps; any day the local store knows about wins locally. */
export function mergeServerRituals(store: Store | null, server: RitualMap): string[] {
  const changed: string[] = []
  for (const [day, ritual] of Object.entries(server)) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) continue
    const local = loadRitual(store, day)
    if (ritualCount(local) === 0 && ritualCount(ritual) > 0) {
      saveRitual(store, day, ritual)
      changed.push(day)
    }
  }
  return changed
}

/** The local ritual days worth pushing (last 7, non-empty). */
export function collectLocalRituals(store: Store | null): RitualMap {
  const out: RitualMap = {}
  for (const day of lastSevenDayKeys()) {
    const r = loadRitual(store, day)
    if (ritualCount(r) > 0) out[day] = r
  }
  return out
}

/** Pull server state and merge into localStorage. Returns true if today changed. */
export async function hydrateTwinState(store: Store | null): Promise<boolean> {
  try {
    const res = await fetch("/api/twin-state", { cache: "no-store" })
    if (!res.ok) return false
    const data = (await res.json()) as { rituals?: RitualMap; milestonesSeen?: string[] }
    const changed = mergeServerRituals(store, data.rituals ?? {})
    if (data.milestonesSeen?.length) {
      saveSeen(store, Array.from(new Set([...loadSeen(store), ...data.milestonesSeen])))
    }
    return changed.includes(dayKey())
  } catch {
    return false
  }
}

/** Push local rituals + milestone seen-set to the server (fire-and-forget). */
export function pushTwinState(store: Store | null): void {
  try {
    void fetch("/api/twin-state", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rituals: collectLocalRituals(store),
        milestonesSeen: loadSeen(store),
      }),
      keepalive: true,
    }).catch(() => {})
  } catch {
    /* offline — the next visit pushes again */
  }
}
