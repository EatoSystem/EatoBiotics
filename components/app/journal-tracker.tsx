"use client"

import { useState, useEffect, useCallback } from "react"
import { BookHeart, ChevronDown, ChevronUp, Loader2, Check, Sparkles } from "lucide-react"
import {
  JournalEntry,
  loadJournalEntries,
  saveJournalEntry,
  getTodayIso,
  getCurrentWeekStart,
} from "@/lib/local-storage"
import { getSupabaseBrowser } from "@/lib/supabase-browser"
import { cn } from "@/lib/utils"

/* ── Score data ──────────────────────────────────────────────────────── */

const ENERGY_EMOJIS    = ["", "😴", "😕", "😐", "🙂", "⚡"]
const DIGESTION_EMOJIS = ["", "😖", "😕", "😐", "🙂", "🌿"]
const MOOD_EMOJIS      = ["", "😔", "😕", "😐", "🙂", "😊"]

const ENERGY_LABELS    = ["", "Drained",       "Low",      "Okay",    "Good",  "Great"]
const DIGESTION_LABELS = ["", "Uncomfortable", "Sluggish", "Okay",    "Good",  "Smooth"]
const MOOD_LABELS      = ["", "Low",           "Meh",      "Neutral", "Good",  "Lifted"]

const SCORE_COLORS = [
  "",
  "var(--icon-orange)",
  "var(--icon-yellow)",
  "#A0A0A0",
  "var(--icon-lime)",
  "var(--icon-green)",
]

/* ── Large emoji score picker ───────────────────────────────────────── */

function EmojiScorePicker({
  label,
  icon,
  emojis,
  textLabels,
  value,
  onChange,
}: {
  label: string
  icon: string
  emojis: string[]
  textLabels: string[]
  value: number | null
  onChange: (v: 1 | 2 | 3 | 4 | 5) => void
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-semibold text-foreground">
          {icon} {label}
        </span>
        {value && (
          <span className="text-xs font-medium" style={{ color: SCORE_COLORS[value] }}>
            {textLabels[value]}
          </span>
        )}
      </div>
      <div className="flex gap-2">
        {([1, 2, 3, 4, 5] as const).map((n) => {
          const active = value === n
          return (
            <button
              key={n}
              onClick={() => onChange(n)}
              title={textLabels[n]}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-1 rounded-2xl border-2 py-3 transition-all duration-150",
                active
                  ? "border-transparent scale-105 shadow-sm"
                  : "border-border bg-secondary/20 hover:bg-secondary/50 hover:scale-[1.02]"
              )}
              style={active ? { background: `color-mix(in srgb, ${SCORE_COLORS[n]} 15%, var(--background))`, borderColor: SCORE_COLORS[n] } : {}}
            >
              <span className="text-xl leading-none">{emojis[n]}</span>
              <span className="text-[9px] font-semibold uppercase tracking-wide" style={{ color: active ? SCORE_COLORS[n] : undefined }}>
                {n}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ── 7-day history strip ─────────────────────────────────────────────── */

function DayStrip({ entries }: { entries: JournalEntry[] }) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return d.toISOString().slice(0, 10)
  })

  return (
    <div className="mt-6">
      <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
        Last 7 days
      </h3>
      <div className="flex gap-1.5">
        {days.map((date) => {
          const entry = entries.find((e) => e.date === date)
          const isToday = date === getTodayIso()
          const avg = entry ? (entry.energy + entry.digestion + entry.mood) / 3 : null
          const colorIdx = avg ? Math.round(avg) : 0

          return (
            <div key={date} className="flex flex-1 flex-col items-center gap-1.5">
              <div
                className={cn(
                  "h-16 w-full rounded-xl border transition-all",
                  entry ? "border-transparent" : "border-border/40 bg-secondary/20"
                )}
                style={
                  entry
                    ? {
                        background: `color-mix(in srgb, ${SCORE_COLORS[colorIdx]} 18%, transparent)`,
                        borderColor: `color-mix(in srgb, ${SCORE_COLORS[colorIdx]} 35%, transparent)`,
                      }
                    : {}
                }
              >
                {entry && (
                  <div className="flex h-full flex-col items-center justify-center gap-1">
                    <div className="flex gap-0.5">
                      {[entry.energy, entry.digestion, entry.mood].map((s, i) => (
                        <div key={i} className="h-1 w-1 rounded-full" style={{ background: SCORE_COLORS[s] }} />
                      ))}
                    </div>
                    <span className="text-sm font-bold" style={{ color: SCORE_COLORS[colorIdx] }}>
                      {avg!.toFixed(1)}
                    </span>
                  </div>
                )}
              </div>
              <span className={cn("text-[10px] font-medium", isToday ? "text-foreground" : "text-muted-foreground")}>
                {isToday
                  ? "Today"
                  : new Date(date + "T12:00:00").toLocaleDateString("en-IE", { weekday: "short" })}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ── Insights panel ──────────────────────────────────────────────────── */

interface WeeklyAvg {
  weekStart: string
  energy: number
  digestion: number
  mood: number
  plantsThisWeek: number | null
  count: number
}

function getIsoWeekStart(date: string): string {
  const d = new Date(date + "T12:00:00")
  const day = d.getDay()
  const diff = day === 0 ? 6 : day - 1
  d.setDate(d.getDate() - diff)
  return d.toISOString().slice(0, 10)
}

function computeWeeklyAverages(entries: JournalEntry[]): WeeklyAvg[] {
  const map = new Map<string, JournalEntry[]>()
  for (const e of entries) {
    const ws = getIsoWeekStart(e.date)
    if (!map.has(ws)) map.set(ws, [])
    map.get(ws)!.push(e)
  }
  return Array.from(map.entries())
    .map(([weekStart, items]) => ({
      weekStart,
      energy: items.reduce((s, e) => s + e.energy, 0) / items.length,
      digestion: items.reduce((s, e) => s + e.digestion, 0) / items.length,
      mood: items.reduce((s, e) => s + e.mood, 0) / items.length,
      plantsThisWeek: items[0].plants_this_week ?? null,
      count: items.length,
    }))
    .sort((a, b) => b.weekStart.localeCompare(a.weekStart))
}

/* ── 14-day mood trend strip ─────────────────────────────────────────── */

function MoodTrendStrip({ entries }: { entries: JournalEntry[] }) {
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (13 - i))
    return d.toISOString().slice(0, 10)
  })

  const filledDays = days.filter((date) => entries.find((e) => e.date === date))
  if (filledDays.length < 3) return null

  return (
    <div className="mt-6">
      <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
        14-day mood trend
      </h3>
      <div className="flex gap-1">
        {days.map((date) => {
          const entry = entries.find((e) => e.date === date)
          const isToday = date === getTodayIso()
          const moodScore = entry?.mood ?? null

          return (
            <div key={date} className="flex flex-1 flex-col items-center gap-1">
              <div
                className={cn(
                  "h-8 w-full rounded-lg border transition-all",
                  entry ? "border-transparent" : "border-border/30 bg-secondary/10"
                )}
                title={entry ? `Mood: ${moodScore}/5` : undefined}
                style={
                  entry && moodScore
                    ? {
                        background: `color-mix(in srgb, ${SCORE_COLORS[moodScore]} 22%, transparent)`,
                        borderColor: `color-mix(in srgb, ${SCORE_COLORS[moodScore]} 40%, transparent)`,
                      }
                    : {}
                }
              >
                {entry && moodScore && (
                  <div className="flex h-full items-center justify-center">
                    <span className="text-[10px] font-bold" style={{ color: SCORE_COLORS[moodScore] }}>
                      {moodScore}
                    </span>
                  </div>
                )}
              </div>
              <span className={cn("text-[8px] font-medium", isToday ? "text-foreground" : "text-muted-foreground/50")}>
                {isToday
                  ? "T"
                  : new Date(date + "T12:00:00").toLocaleDateString("en-IE", { weekday: "narrow" })}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function InsightsPanel({ entries }: { entries: JournalEntry[] }) {
  if (entries.length < 14) {
    return (
      <div className="mt-6 space-y-4">
        {/* Mood trend unlocks after 7 entries */}
        {entries.length >= 7 && <MoodTrendStrip entries={entries} />}

        <div className="rounded-2xl border border-dashed border-border bg-secondary/10 p-6 text-center">
          <Sparkles size={20} className="mx-auto mb-2 text-muted-foreground/40" />
          <p className="text-sm font-semibold text-foreground/70">
            Weekly insights unlock after 14 check-ins
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {14 - entries.length} more {14 - entries.length === 1 ? "entry" : "entries"} to go
          </p>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-border/40">
            <div
              className="h-1.5 rounded-full brand-gradient transition-all duration-500"
              style={{ width: `${(entries.length / 14) * 100}%` }}
            />
          </div>
        </div>
      </div>
    )
  }

  const weeks = computeWeeklyAverages(entries)
  const thisWeek = weeks[0]
  const lastWeek = weeks[1]

  const delta = (a: number, b: number) => {
    const diff = a - b
    const sign = diff > 0 ? "▲" : "▼"
    const color = diff > 0 ? "var(--icon-green)" : "var(--icon-orange)"
    return { sign, color, abs: Math.abs(diff).toFixed(1) }
  }

  const highPlantWeeks = weeks.filter((w) => w.count >= 3 && (w.plantsThisWeek ?? 0) >= 8)
  const lowPlantWeeks = weeks.filter((w) => w.count >= 3 && (w.plantsThisWeek ?? 0) < 8 && w.plantsThisWeek !== null)
  const showCorrelation = highPlantWeeks.length >= 2 && lowPlantWeeks.length >= 2
  const avgOf = (arr: WeeklyAvg[], key: "energy" | "digestion" | "mood") =>
    arr.reduce((s, w) => s + w[key], 0) / arr.length

  // Gut-brain correlation: mood avg < 3 AND digestion avg < 3 in the same week
  const recentWeek = weeks[0]
  const showGutBrainNote =
    recentWeek &&
    recentWeek.count >= 3 &&
    recentWeek.mood < 3 &&
    recentWeek.digestion < 3

  return (
    <div className="mt-6 space-y-4">
      <MoodTrendStrip entries={entries} />

      <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
        Weekly insights
      </h3>

      {lastWeek && (
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            This week vs last week
          </p>
          <div className="grid grid-cols-3 gap-3">
            {(["energy", "digestion", "mood"] as const).map((key) => {
              const d = delta(thisWeek[key], lastWeek[key])
              return (
                <div key={key} className="text-center">
                  <p className="text-2xl font-bold tabular-nums" style={{ color: SCORE_COLORS[Math.round(thisWeek[key])] }}>
                    {thisWeek[key].toFixed(1)}
                  </p>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground capitalize">{key}</p>
                  <p className="text-xs font-semibold" style={{ color: d.color }}>
                    {d.sign} {d.abs}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {showCorrelation && (
        <div
          className="rounded-2xl border p-4"
          style={{
            borderColor: "color-mix(in srgb, var(--icon-green) 30%, transparent)",
            background: "color-mix(in srgb, var(--icon-green) 5%, transparent)",
          }}
        >
          <p className="mb-2 text-xs font-bold uppercase tracking-widest" style={{ color: "var(--icon-green)" }}>
            🌱 Plant diversity effect
          </p>
          <p className="text-sm text-foreground/80">
            On weeks you hit 8+ plants, your energy averaged{" "}
            <span className="font-bold text-foreground">{avgOf(highPlantWeeks, "energy").toFixed(1)}</span>{" "}
            vs{" "}
            <span className="font-bold text-foreground">{avgOf(lowPlantWeeks, "energy").toFixed(1)}</span>{" "}
            on lower plant weeks.
          </p>
          {avgOf(highPlantWeeks, "digestion") > avgOf(lowPlantWeeks, "digestion") && (
            <p className="mt-1.5 text-sm text-foreground/80">
              Digestion also averages{" "}
              <span className="font-bold text-foreground">
                {(avgOf(highPlantWeeks, "digestion") - avgOf(lowPlantWeeks, "digestion")).toFixed(1)} points higher
              </span>{" "}
              in high-plant weeks.
            </p>
          )}
        </div>
      )}

      {showGutBrainNote && (
        <div
          className="rounded-2xl border p-4"
          style={{
            borderColor: "color-mix(in srgb, var(--icon-teal) 30%, transparent)",
            background: "color-mix(in srgb, var(--icon-teal) 5%, transparent)",
          }}
        >
          <p className="mb-2 text-xs font-bold uppercase tracking-widest" style={{ color: "var(--icon-teal)" }}>
            🧠 Gut-brain connection
          </p>
          <p className="text-sm text-foreground/80">
            Your gut and your mood have been moving together this week. Both your digestion and mood
            scores are below average — this is a pattern the gut-brain axis commonly drives.
          </p>
          <a
            href="/gut-brain"
            className="mt-2 block text-xs font-semibold underline underline-offset-2 transition-colors hover:text-foreground"
            style={{ color: "var(--icon-teal)" }}
          >
            Learn why this connection matters →
          </a>
        </div>
      )}
    </div>
  )
}

/* ── Main JournalTracker ─────────────────────────────────────────────── */

export function JournalTracker() {
  const today = getTodayIso()
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [energy, setEnergy] = useState<1 | 2 | 3 | 4 | 5 | null>(null)
  const [digestion, setDigestion] = useState<1 | 2 | 3 | 4 | 5 | null>(null)
  const [mood, setMood] = useState<1 | 2 | 3 | 4 | 5 | null>(null)
  const [notes, setNotes] = useState("")
  const [notesOpen, setNotesOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [isAuthed, setIsAuthed] = useState(false)

  useEffect(() => {
    const loaded = loadJournalEntries()
    setEntries(loaded)
    const todayEntry = loaded.find((e) => e.date === today)
    if (todayEntry) {
      setEnergy(todayEntry.energy)
      setDigestion(todayEntry.digestion)
      setMood(todayEntry.mood)
      setNotes(todayEntry.notes ?? "")
    }
  }, [today])

  useEffect(() => {
    getSupabaseBrowser().auth.getUser().then(({ data }) => {
      setIsAuthed(!!data.user)
    })
  }, [])

  const getPlantsThisWeek = useCallback((): number | undefined => {
    try {
      const raw = localStorage.getItem("eatobiotics-plant-tracker")
      if (!raw) return undefined
      const parsed = JSON.parse(raw)
      if (parsed.weekStart === getCurrentWeekStart() && Array.isArray(parsed.plants)) {
        return parsed.plants.length
      }
    } catch { /* ignore */ }
    return undefined
  }, [])

  async function handleSave() {
    if (!energy || !digestion || !mood) return
    setSaving(true)

    const entry: JournalEntry = {
      date: today,
      energy,
      digestion,
      mood,
      notes: notes.trim() || undefined,
      plants_this_week: getPlantsThisWeek(),
    }

    saveJournalEntry(entry)
    const updated = loadJournalEntries()
    setEntries(updated)

    if (isAuthed) {
      try {
        await fetch("/api/journal", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(entry),
        })
      } catch { /* non-blocking */ }
    }

    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const canSave = energy !== null && digestion !== null && mood !== null

  return (
    <div className="space-y-5">

      {/* ── Today's check-in card ────────────────────────────────────── */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookHeart size={16} style={{ color: "var(--icon-orange)" }} />
            <h2 className="font-serif text-lg font-semibold text-foreground">
              How are you feeling today?
            </h2>
          </div>
          {saved && (
            <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: "var(--icon-green)" }}>
              <Check size={12} /> Saved
            </span>
          )}
        </div>

        <div className="space-y-5">
          <EmojiScorePicker
            label="Energy"
            icon="🔋"
            emojis={ENERGY_EMOJIS}
            textLabels={ENERGY_LABELS}
            value={energy}
            onChange={setEnergy}
          />
          <EmojiScorePicker
            label="Digestion"
            icon="🌿"
            emojis={DIGESTION_EMOJIS}
            textLabels={DIGESTION_LABELS}
            value={digestion}
            onChange={setDigestion}
          />
          <EmojiScorePicker
            label="Mood"
            icon="😊"
            emojis={MOOD_EMOJIS}
            textLabels={MOOD_LABELS}
            value={mood}
            onChange={setMood}
          />

          {/* Optional notes */}
          <div>
            <button
              onClick={() => setNotesOpen(!notesOpen)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              {notesOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              {notesOpen ? "Hide note" : "Add a note (optional)"}
            </button>
            {notesOpen && (
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Anything notable today? A new food, poor sleep, extra stress…"
                rows={3}
                className="mt-2 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-[var(--icon-orange)] focus:outline-none focus:ring-1 focus:ring-[var(--icon-orange)]/30 resize-none"
              />
            )}
          </div>

          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={!canSave || saving}
            className={cn(
              "w-full rounded-2xl py-3.5 text-sm font-semibold transition-all",
              canSave && !saving
                ? "text-white shadow-sm hover:opacity-90"
                : "bg-secondary/40 text-muted-foreground cursor-not-allowed"
            )}
            style={
              canSave && !saving
                ? { background: "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange))" }
                : {}
            }
          >
            {saving ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={14} className="animate-spin" /> Saving…
              </span>
            ) : saved ? (
              <span className="flex items-center justify-center gap-2">
                <Check size={14} /> Saved for today ✓
              </span>
            ) : (
              "Save today's check-in →"
            )}
          </button>
        </div>
      </div>

      {/* ── 7-day history ────────────────────────────────────────────── */}
      {entries.length > 0 && <DayStrip entries={entries} />}

      {/* ── Insights ─────────────────────────────────────────────────── */}
      <InsightsPanel entries={entries} />

      {/* Auth nudge */}
      {!isAuthed && entries.length >= 3 && (
        <div className="rounded-2xl border border-border bg-secondary/20 p-4 text-center">
          <p className="text-xs text-muted-foreground">
            Your journal is saved locally.{" "}
            <a
              href="/account/signin"
              className="font-semibold text-foreground underline underline-offset-2 hover:text-[var(--icon-orange)]"
            >
              Create an account
            </a>{" "}
            to back it up and sync across devices.
          </p>
        </div>
      )}
    </div>
  )
}
