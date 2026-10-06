/**
 * EatoBiotics — Daily Ritual state (localStorage-first).
 *
 * Five one-tap daily check-ins that keep the Twin habit loop alive:
 * fermented food, plant variety, movement, sleep, and how you feel. One
 * record per day under `eb_ritual_<YYYY-MM-DD>`. Pure functions take an
 * injectable Store so they are SSR-safe and unit-testable; `browserStore()`
 * adapts localStorage. Signed-in members also sync cross-device via
 * `twin-state-sync.ts` (`/api/twin-state`, `twin_state` table) — local taps
 * stay instant and this file's storage remains the source of truth; the
 * sync layer just merges server state in and pushes local state out.
 */

export interface RitualDay {
  fermented: boolean
  plants: boolean
  moved: boolean
  slept: boolean
  feeling: boolean
}

/*
 * ══ 0R-5 · `P0-SCIENCE-05` — `node` AND `effect` ARE BOTH GONE ══════════════
 *
 * A `RitualCheck` carried two things it had not earned:
 *
 *   node: { x: 54, y: 56 }   a point on a picture of the member's BODY, lit
 *                            when they ticked a checkbox
 *   effect: "A fermented food lights up your probiotic network"
 *                            the same claim in words, with a Biotic in it
 *
 * The register named this file for the coordinates; `biotic-claims.test.ts`'s
 * derived ledger found it independently for the `effect` STRING beside them,
 * and recorded both halves as one repair. They are one repair because they are
 * one claim: the member reported eating something, and the product answered by
 * asserting which part of them responded and what happened there.
 *
 * Nothing in that chain is measured. The tap is real; everything downstream of
 * it was invented, and `daily-ritual.tsx` then said so out loud under the
 * heading "Your body just felt that".
 *
 * ── WHAT THE ACKNOWLEDGEMENTS SAY NOW ─────────────────────────────────────
 *
 * They acknowledge the RECORD, not a bodily effect. "Movement — I can feel the
 * energy flowing faster" and "Good rest — that's when I recover and rebuild"
 * were the Twin reporting a sensation from a checkbox; they are now the Twin
 * confirming what it has written down, which is the only thing it knows.
 */
export interface RitualCheck {
  key: keyof RitualDay
  label: string
  /** First-person acknowledgement OF THE RECORD from the Twin when ticked. */
  ack: string
  color: string
  /** Amber signals (poor sleep) buffer rather than glow. */
  strain?: boolean
}

export const RITUAL_CHECKS: RitualCheck[] = [
  { key: "fermented", label: "Fermented food", ack: "Noted — that's today's fermented food logged.", color: "#2DAA6E" },
  { key: "plants", label: "5+ plants", ack: "Noted — plant variety is one of the things I keep track of.", color: "#A8E063" },
  { key: "moved", label: "Moved today", ack: "Noted — movement is part of the daily picture.", color: "#4CB648" },
  { key: "slept", label: "Slept well", ack: "Noted — rest is part of the daily picture.", color: "#F5C518" },
  { key: "feeling", label: "Feeling good", ack: "Noted — I'll remember today's rhythm.", color: "#F5A623" },
]

export const EMPTY_RITUAL: RitualDay = { fermented: false, plants: false, moved: false, slept: false, feeling: false }

/*
 * `ritualSignals` is DELETED at 0R-5.
 *
 * Its whole return shape was the body-coordinate contract —
 * `Array<{ key; node: { x; y }; color }>` — and `twin-stage.tsx`'s matching
 * `signals` prop is the site this file's form guard found that the register
 * had not named. A function whose only output is a list of points on a person
 * is not repairable by changing its callers.
 *
 * What the stage legitimately responds to is HOW MUCH the member logged today,
 * which `ritualCount` below already answers, so `TwinStage` takes
 * `ritualCount: number` instead. The overall glow still brightens with the
 * day's activity; it no longer claims where.
 */

/** Minimal storage interface so the pure logic is testable without a browser. */
export interface Store {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

export function browserStore(): Store | null {
  try {
    if (typeof window === "undefined") return null
    return window.localStorage
  } catch {
    return null
  }
}

/** Local-date key (not UTC) — the ritual day should match the member's clock. */
export function dayKey(d: Date = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

const keyFor = (dateKey: string) => `eb_ritual_${dateKey}`

export function loadRitual(store: Store | null, dateKey: string): RitualDay {
  if (!store) return { ...EMPTY_RITUAL }
  try {
    const raw = store.getItem(keyFor(dateKey))
    if (!raw) return { ...EMPTY_RITUAL }
    const parsed = JSON.parse(raw) as Partial<RitualDay>
    return {
      fermented: parsed.fermented === true,
      plants: parsed.plants === true,
      moved: parsed.moved === true,
      slept: parsed.slept === true,
      feeling: parsed.feeling === true,
    }
  } catch {
    return { ...EMPTY_RITUAL }
  }
}

export function saveRitual(store: Store | null, dateKey: string, ritual: RitualDay): void {
  if (!store) return
  try {
    store.setItem(keyFor(dateKey), JSON.stringify(ritual))
  } catch {
    /* storage full/blocked — the tap still works for this session */
  }
}

export function ritualComplete(r: RitualDay): boolean {
  return r.fermented && r.plants && r.moved && r.slept && r.feeling
}

export function ritualCount(r: RitualDay): number {
  return Number(r.fermented) + Number(r.plants) + Number(r.moved) + Number(r.slept) + Number(r.feeling)
}

/** The last 7 day-keys, oldest → today. */
export function lastSevenDayKeys(today: Date = new Date()): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today)
    d.setDate(d.getDate() - (6 - i))
    return dayKey(d)
  })
}
