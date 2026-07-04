/**
 * EatoBiotics — Daily Ritual state (localStorage-first, no backend).
 *
 * Three one-tap daily check-ins that keep the Twin habit loop alive:
 * fermented food, plant variety, and how you feel. One record per day under
 * `eb_ritual_<YYYY-MM-DD>`. Pure functions take an injectable Store so they
 * are SSR-safe and unit-testable; `browserStore()` adapts localStorage.
 */

export interface RitualDay {
  fermented: boolean
  plants: boolean
  moved: boolean
  slept: boolean
  feeling: boolean
}

export interface RitualCheck {
  key: keyof RitualDay
  label: string
  /** First-person acknowledgement from the Twin when ticked. */
  ack: string
  color: string
  /** One-line biology lesson — what this does inside you (shown on the body pulse). */
  effect: string
  /** Where on the figure this signal lands (% of the mini-stage) so the body reacts. */
  node: { x: number; y: number }
  /** Amber signals (poor sleep) buffer rather than glow. */
  strain?: boolean
}

export const RITUAL_CHECKS: RitualCheck[] = [
  { key: "fermented", label: "Fermented food", ack: "Lovely — live cultures on their way to me.", color: "#2DAA6E", effect: "Live cultures light up your probiotic network", node: { x: 54, y: 56 } },
  { key: "plants", label: "5+ plants", ack: "Variety noted — that's what I thrive on.", color: "#A8E063", effect: "Plant variety expands your fibre pathways", node: { x: 47, y: 62 } },
  { key: "moved", label: "Moved today", ack: "Movement — I can feel the energy flowing faster.", color: "#4CB648", effect: "Movement helps energy flow and recovery brighten", node: { x: 48, y: 46 } },
  { key: "slept", label: "Slept well", ack: "Good rest — that's when I recover and rebuild.", color: "#F5C518", effect: "Deep rest is when your system recovers and rebuilds", node: { x: 48, y: 30 } },
  { key: "feeling", label: "Feeling good", ack: "Good to hear — I'll remember today's rhythm.", color: "#F5A623", effect: "How you feel is your system talking back to you", node: { x: 50, y: 20 } },
]

export const EMPTY_RITUAL: RitualDay = { fermented: false, plants: false, moved: false, slept: false, feeling: false }

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
