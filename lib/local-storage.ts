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

/* ── Journal State ────────────────────────────────────────────────────── */

export interface JournalEntry {
  date: string             // YYYY-MM-DD
  energy: 1 | 2 | 3 | 4 | 5
  digestion: 1 | 2 | 3 | 4 | 5
  mood: 1 | 2 | 3 | 4 | 5
  notes?: string
  plants_this_week?: number
}

const JOURNAL_KEY = "eatobiotics-journal"

export function loadJournalEntries(): JournalEntry[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(JOURNAL_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (e: unknown) =>
        e !== null &&
        typeof e === "object" &&
        typeof (e as JournalEntry).date === "string" &&
        typeof (e as JournalEntry).energy === "number" &&
        typeof (e as JournalEntry).digestion === "number" &&
        typeof (e as JournalEntry).mood === "number"
    ) as JournalEntry[]
  } catch {
    return []
  }
}

export function saveJournalEntry(entry: JournalEntry): void {
  if (typeof window === "undefined") return
  try {
    const entries = loadJournalEntries()
    const idx = entries.findIndex((e) => e.date === entry.date)
    if (idx >= 0) {
      entries[idx] = entry
    } else {
      entries.push(entry)
    }
    // Keep last 365 days, sorted newest first
    entries.sort((a, b) => b.date.localeCompare(a.date))
    const trimmed = entries.slice(0, 365)
    localStorage.setItem(JOURNAL_KEY, JSON.stringify(trimmed))
  } catch {
    // Storage full or unavailable
  }
}

export function clearJournalEntries(): void {
  if (typeof window === "undefined") return
  localStorage.removeItem(JOURNAL_KEY)
}

export function getTodayIso(): string {
  return new Date().toISOString().slice(0, 10)
}
