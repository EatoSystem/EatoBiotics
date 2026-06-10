"use client"

import { useState } from "react"
import { Check, Loader2, Trash2 } from "lucide-react"
import type { BowelEvent, StabilityDailyLog } from "@/lib/stability/types"
import { loadLog, saveLog, todayKey } from "@/lib/stability/storage"
import { BowelEventForm } from "./BowelEventForm"

function blankLog(date: string): StabilityDailyLog {
  return {
    date, sleepQuality: 6, stress: 5, energy: 6,
    caffeine: 1, alcohol: 0, water: 5,
    dairy: false, spicy: false, richFatty: false, sweeteners: false, fibreRich: false, fermented: false,
    events: [], confidenceLeavingHouse: 6, overallStability: 6, updatedAt: "",
  }
}

function Slider({ label, value, onChange, color = "var(--icon-green)" }: { label: string; value: number; onChange: (v: number) => void; color?: string }) {
  return (
    <div>
      <div className="flex items-center justify-between text-sm font-medium text-foreground">
        <span>{label}</span><span className="tabular-nums" style={{ color }}>{value}/10</span>
      </div>
      <input type="range" min={1} max={10} value={value} onChange={(e) => onChange(Number(e.target.value))} className="mt-1 w-full" style={{ accentColor: color }} />
    </div>
  )
}

function Counter({ label, value, onChange, unit }: { label: string; value: number; onChange: (v: number) => void; unit: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border bg-background px-4 py-2.5">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => onChange(Math.max(0, value - 1))} className="h-7 w-7 rounded-full border border-border text-sm font-bold text-muted-foreground">−</button>
        <span className="w-10 text-center text-sm font-semibold tabular-nums text-foreground">{value}<span className="text-[10px] text-muted-foreground"> {unit}</span></span>
        <button type="button" onClick={() => onChange(value + 1)} className="h-7 w-7 rounded-full border border-border text-sm font-bold text-muted-foreground">+</button>
      </div>
    </div>
  )
}

const FOODS: { key: keyof StabilityDailyLog; label: string }[] = [
  { key: "fibreRich", label: "Fibre-rich" }, { key: "fermented", label: "Fermented" }, { key: "dairy", label: "Dairy" },
  { key: "spicy", label: "Spicy" }, { key: "richFatty", label: "Rich / fatty" }, { key: "sweeteners", label: "Sweeteners" },
]

export function StabilityTrackerForm({ date = todayKey() }: { date?: string }) {
  const [log, setLog] = useState<StabilityDailyLog>(() => loadLog(date) ?? blankLog(date))
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  function patch(p: Partial<StabilityDailyLog>) { setLog((l) => ({ ...l, ...p })) }
  function addEvent(e: BowelEvent) { setLog((l) => ({ ...l, events: [...l.events, e].sort((a, b) => a.time.localeCompare(b.time)) })) }
  function removeEvent(id: string) { setLog((l) => ({ ...l, events: l.events.filter((e) => e.id !== id) })) }

  function save() {
    setSaving(true)
    saveLog(log)
    setTimeout(() => { setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2500) }, 250)
  }

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-6">
      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{title}</p>
      <div className="mt-4">{children}</div>
    </div>
  )

  return (
    <div className="space-y-5">
      <Section title="Morning">
        <div className="space-y-4">
          <Slider label="Sleep quality" value={log.sleepQuality} onChange={(v) => patch({ sleepQuality: v })} color="var(--icon-teal)" />
          <Slider label="Stress level" value={log.stress} onChange={(v) => patch({ stress: v })} color="var(--icon-orange)" />
          <Slider label="Energy" value={log.energy} onChange={(v) => patch({ energy: v })} color="var(--icon-lime)" />
        </div>
      </Section>

      <Section title="Food & drink">
        <div className="grid gap-3 sm:grid-cols-3">
          <Counter label="Caffeine" value={log.caffeine} onChange={(v) => patch({ caffeine: v })} unit="cups" />
          <Counter label="Alcohol" value={log.alcohol} onChange={(v) => patch({ alcohol: v })} unit="units" />
          <Counter label="Water" value={log.water} onChange={(v) => patch({ water: v })} unit="glasses" />
        </div>
        <p className="mt-4 text-xs font-medium text-muted-foreground">What did you eat today?</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {FOODS.map((f) => {
            const on = log[f.key] as boolean
            return (
              <button key={f.key} type="button" onClick={() => patch({ [f.key]: !on } as Partial<StabilityDailyLog>)}
                className="rounded-full border-2 px-3.5 py-1.5 text-sm font-semibold transition-all"
                style={{ borderColor: on ? "var(--icon-green)" : "var(--border)", background: on ? "color-mix(in srgb, var(--icon-green) 8%, white)" : "white", color: "var(--foreground)" }}>
                {f.label}
              </button>
            )
          })}
        </div>
        <input type="text" maxLength={300} placeholder="Main meals (optional)" value={log.meals ?? ""} onChange={(e) => patch({ meals: e.target.value })}
          className="mt-3 w-full rounded-xl border-2 border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-[color:var(--icon-green)]" />
      </Section>

      <Section title={`Bowel events${log.events.length ? ` · ${log.events.length}` : ""}`}>
        {log.events.length > 0 && (
          <div className="mb-4 divide-y divide-border">
            {log.events.map((e) => (
              <div key={e.id} className="flex items-center justify-between py-2.5 text-sm">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-muted-foreground">{e.time}</span>
                  <span className="font-semibold text-foreground">Type {e.stoolType}</span>
                  <span className="text-xs text-muted-foreground">urgency {e.urgency}/5</span>
                  {e.accident && <span className="rounded-full px-2 py-0.5 text-[10px] font-bold text-white" style={{ background: "#ef4444" }}>accident</span>}
                  {e.bloating && <span className="text-xs text-muted-foreground">· bloating</span>}
                </div>
                <button type="button" onClick={() => removeEvent(e.id)} className="text-muted-foreground/60 hover:text-red-500" aria-label="Remove event"><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
        )}
        <BowelEventForm onAdd={addEvent} />
      </Section>

      <Section title="Daily summary">
        <div className="space-y-4">
          <Slider label="Confidence leaving the house" value={log.confidenceLeavingHouse} onChange={(v) => patch({ confidenceLeavingHouse: v })} color="var(--icon-green)" />
          <Slider label="Overall gut stability today" value={log.overallStability} onChange={(v) => patch({ overallStability: v })} color="var(--icon-teal)" />
          <input type="text" maxLength={400} placeholder="Notes (optional)" value={log.notes ?? ""} onChange={(e) => patch({ notes: e.target.value })}
            className="w-full rounded-xl border-2 border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-[color:var(--icon-green)]" />
        </div>
      </Section>

      <button type="button" onClick={save} disabled={saving}
        className="brand-gradient inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60">
        {saving ? <><Loader2 size={15} className="animate-spin" /> Saving…</> : saved ? <><Check size={15} /> Saved</> : "Save today's log"}
      </button>
    </div>
  )
}
