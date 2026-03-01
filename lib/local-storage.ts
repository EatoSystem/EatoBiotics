/* ── Type-safe localStorage helpers for the EatoBiotics app tools ────── */

/* ── Plate Builder State ──────────────────────────────────────────────── */

export interface PlateState {
  fiber: string[] // food slugs
  fermented: string[]
  protein: string[]
  fats: string[]
  updatedAt: number // Date.now()
}

const PLATE_KEY = "eatobiotics-plate"

export function loadPlate(): PlateState {
  if (typeof window === "undefined") return emptyPlate()
  try {
    const raw = localStorage.getItem(PLATE_KEY)
    if (!raw) return emptyPlate()
    const parsed = JSON.parse(raw) as PlateState
    // Validate shape
    if (
      Array.isArray(parsed.fiber) &&
      Array.isArray(parsed.fermented) &&
      Array.isArray(parsed.protein) &&
      Array.isArray(parsed.fats)
    ) {
      return parsed
    }
    return emptyPlate()
  } catch {
    return emptyPlate()
  }
}

export function savePlate(state: PlateState): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(PLATE_KEY, JSON.stringify({ ...state, updatedAt: Date.now() }))
  } catch {
    // Storage full or unavailable — fail silently
  }
}

export function clearPlate(): void {
  if (typeof window === "undefined") return
  localStorage.removeItem(PLATE_KEY)
}

function emptyPlate(): PlateState {
  return { fiber: [], fermented: [], protein: [], fats: [], updatedAt: 0 }
}

/* ── Plant Tracker State ──────────────────────────────────────────────── */

export interface PlantTrackerState {
  weekStart: string // ISO date string (Monday)
  plants: string[] // food slugs
  updatedAt: number
}

const TRACKER_KEY = "eatobiotics-plant-tracker"

export function getCurrentWeekStart(): string {
  const now = new Date()
  const day = now.getDay()
  // Shift to Monday = 0
  const diff = day === 0 ? 6 : day - 1
  const monday = new Date(now)
  monday.setDate(now.getDate() - diff)
  monday.setHours(0, 0, 0, 0)
  return monday.toISOString().slice(0, 10)
}

export function loadPlantTracker(): PlantTrackerState {
  if (typeof window === "undefined") return emptyTracker()
  try {
    const raw = localStorage.getItem(TRACKER_KEY)
    if (!raw) return emptyTracker()
    const parsed = JSON.parse(raw) as PlantTrackerState
    // Auto-reset if week has changed
    const currentWeek = getCurrentWeekStart()
    if (parsed.weekStart !== currentWeek) {
      const fresh = emptyTracker()
      savePlantTracker(fresh)
      return fresh
    }
    if (Array.isArray(parsed.plants)) return parsed
    return emptyTracker()
  } catch {
    return emptyTracker()
  }
}

export function savePlantTracker(state: PlantTrackerState): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(
      TRACKER_KEY,
      JSON.stringify({ ...state, updatedAt: Date.now() })
    )
  } catch {
    // Storage full or unavailable
  }
}

export function clearPlantTracker(): void {
  if (typeof window === "undefined") return
  localStorage.removeItem(TRACKER_KEY)
}

function emptyTracker(): PlantTrackerState {
  return { weekStart: getCurrentWeekStart(), plants: [], updatedAt: 0 }
}
