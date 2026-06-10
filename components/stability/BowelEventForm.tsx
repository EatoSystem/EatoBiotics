"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import type { BowelEvent, StoolType } from "@/lib/stability/types"

const STOOL_LABELS: Record<StoolType, string> = {
  1: "1 · Hard lumps", 2: "2 · Lumpy firm", 3: "3 · Cracked", 4: "4 · Smooth soft",
  5: "5 · Soft blobs", 6: "6 · Mushy", 7: "7 · Watery",
}

function nowTime(): string {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
}

/** Inline form to add one bowel event to the day's log. */
export function BowelEventForm({ onAdd }: { onAdd: (e: BowelEvent) => void }) {
  const [time, setTime] = useState(nowTime())
  const [stoolType, setStoolType] = useState<StoolType>(4)
  const [urgency, setUrgency] = useState(1)
  const [accident, setAccident] = useState(false)
  const [pain, setPain] = useState(false)
  const [bloating, setBloating] = useState(false)
  const [notes, setNotes] = useState("")

  function add() {
    onAdd({ id: `e-${Date.now()}`, time, stoolType, urgency, accident, pain, bloating, notes: notes.trim() || undefined })
    // reset for the next event
    setTime(nowTime()); setStoolType(4); setUrgency(1); setAccident(false); setPain(false); setBloating(false); setNotes("")
  }

  const Toggle = ({ on, set, label }: { on: boolean; set: (v: boolean) => void; label: string }) => (
    <button type="button" onClick={() => set(!on)}
      className="rounded-full border-2 px-3 py-1.5 text-xs font-semibold transition-all"
      style={{ borderColor: on ? "var(--icon-orange)" : "var(--border)", background: on ? "color-mix(in srgb, var(--icon-orange) 10%, transparent)" : "transparent", color: on ? "var(--icon-orange)" : "var(--muted-foreground)" }}>
      {label}
    </button>
  )

  return (
    <div className="rounded-2xl border-2 border-dashed p-4" style={{ borderColor: "var(--border)" }}>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-xs font-semibold text-foreground">
          Time
          <input type="time" value={time} onChange={(e) => setTime(e.target.value)}
            className="mt-1 w-full rounded-lg border-2 border-border bg-background px-3 py-2 text-sm font-medium text-foreground outline-none focus:border-[color:var(--icon-green)]" />
        </label>
        <label className="text-xs font-semibold text-foreground">
          Stool type
          <select value={stoolType} onChange={(e) => setStoolType(Number(e.target.value) as StoolType)}
            className="mt-1 w-full rounded-lg border-2 border-border bg-background px-3 py-2 text-sm font-medium text-foreground outline-none focus:border-[color:var(--icon-green)]">
            {([1, 2, 3, 4, 5, 6, 7] as StoolType[]).map((t) => <option key={t} value={t}>{STOOL_LABELS[t]}</option>)}
          </select>
        </label>
      </div>
      <div className="mt-3">
        <div className="flex items-center justify-between text-xs font-semibold text-foreground">
          <span>Urgency</span><span className="tabular-nums" style={{ color: "var(--icon-orange)" }}>{urgency}/5</span>
        </div>
        <input type="range" min={0} max={5} value={urgency} onChange={(e) => setUrgency(Number(e.target.value))} className="mt-1 w-full accent-[color:var(--icon-orange)]" />
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Toggle on={accident} set={setAccident} label="Accident / leakage" />
        <Toggle on={pain} set={setPain} label="Pain" />
        <Toggle on={bloating} set={setBloating} label="Bloating / gas" />
      </div>
      <input type="text" maxLength={200} placeholder="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)}
        className="mt-3 w-full rounded-lg border-2 border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-[color:var(--icon-green)]" />
      <button type="button" onClick={add}
        className="mt-3 inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90"
        style={{ background: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))" }}>
        <Plus size={13} /> Add event
      </button>
    </div>
  )
}
