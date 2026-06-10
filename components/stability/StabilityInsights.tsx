"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Sparkles, TrendingUp, Database } from "lucide-react"
import { loadLogs, seedLogs } from "@/lib/stability/storage"
import { generateInsights } from "@/lib/stability/insights"
import { sampleLogs } from "@/lib/stability/sample-data"
import type { StabilityDailyLog, StoolType } from "@/lib/stability/types"

const toneColor: Record<string, string> = { positive: "var(--icon-green)", watch: "var(--icon-orange)", neutral: "var(--icon-teal)" }

function stat(logs: StabilityDailyLog[]) {
  let urgency = 0, accidents = 0
  const stool: Record<number, number> = {}
  for (const l of logs) for (const e of l.events) {
    if (e.urgency >= 3) urgency++
    if (e.accident) accidents++
    stool[e.stoolType] = (stool[e.stoolType] ?? 0) + 1
  }
  let common: StoolType | null = null, max = 0
  for (const [k, v] of Object.entries(stool)) if (v > max) { max = v; common = Number(k) as StoolType }
  const best = logs.reduce<StabilityDailyLog | null>((b, l) => (!b || l.overallStability > b.overallStability ? l : b), null)
  const worst = logs.reduce<StabilityDailyLog | null>((b, l) => (!b || l.overallStability < b.overallStability ? l : b), null)
  return { urgency, accidents, common, best, worst }
}

const fmt = (d: string) => new Date(d + "T00:00:00Z").toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" })

export function StabilityInsights() {
  const [logs, setLogs] = useState<StabilityDailyLog[]>(() => loadLogs())
  const ordered = useMemo(() => logs.slice().sort((a, b) => a.date.localeCompare(b.date)), [logs])
  const last14 = ordered.slice(-14)
  const insights = useMemo(() => generateInsights(logs, 14), [logs])
  const s = stat(last14)

  function loadSample() { const sample = sampleLogs(); seedLogs(sample); setLogs(sample) }

  if (logs.length < 3) {
    return (
      <div className="rounded-3xl border border-border bg-card p-8 text-center shadow-sm">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl text-white" style={{ background: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))" }}><TrendingUp size={24} /></span>
        <h2 className="mt-4 font-serif text-xl font-bold text-foreground">Insights need a few days of logs</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">Track your gut for 3+ days and we&apos;ll surface patterns — like which habits line up with your most stable days.</p>
        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/stability/tracker" className="brand-gradient inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white">Log today</Link>
          <button onClick={loadSample} className="inline-flex items-center gap-2 rounded-full border px-6 py-3 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground" style={{ borderColor: "var(--border)" }}>
            <Database size={14} /> Load sample data
          </button>
        </div>
      </div>
    )
  }

  const maxBar = Math.max(...last14.map((l) => l.overallStability), 10)

  return (
    <div className="space-y-6">
      {/* Trend */}
      <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Stability trend · last {last14.length} days</p>
        <div className="mt-4 flex h-24 items-end gap-1.5">
          {last14.map((l) => {
            const hit = l.overallStability >= 7
            return (
              <div key={l.date} className="group relative flex-1" title={`${fmt(l.date)} · ${l.overallStability}/10`}>
                <div className="w-full rounded-md" style={{ height: `${Math.max(6, Math.round((l.overallStability / maxBar) * 88))}px`, background: hit ? "var(--icon-green)" : l.overallStability >= 5 ? "var(--icon-yellow)" : "var(--icon-orange)" }} />
              </div>
            )
          })}
        </div>
        <div className="mt-2 flex justify-between text-[10px] text-muted-foreground"><span>{fmt(last14[0].date)}</span><span>{fmt(last14[last14.length - 1].date)}</span></div>
      </div>

      {/* Stat grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Urgency episodes", value: String(s.urgency), color: "var(--icon-orange)" },
          { label: "Accidents", value: String(s.accidents), color: "#ef4444" },
          { label: "Most common stool", value: s.common ? `Type ${s.common}` : "—", color: "var(--icon-teal)" },
          { label: "Best day", value: s.best ? `${s.best.overallStability}/10` : "—", color: "var(--icon-green)" },
        ].map((c) => (
          <div key={c.label} className="rounded-2xl border border-border bg-card p-4 text-center shadow-sm">
            <div className="font-serif text-2xl font-bold" style={{ color: c.color }}>{c.value}</div>
            <div className="mt-0.5 text-[11px] leading-tight text-muted-foreground">{c.label}</div>
          </div>
        ))}
      </div>

      {/* Best / worst */}
      {s.best && s.worst && (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border p-4" style={{ borderColor: "color-mix(in srgb, var(--icon-green) 30%, transparent)", background: "color-mix(in srgb, var(--icon-green) 5%, white)" }}>
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--icon-green)" }}>Most stable day</p>
            <p className="mt-1 text-sm font-semibold text-foreground">{fmt(s.best.date)} · {s.best.overallStability}/10</p>
          </div>
          <div className="rounded-2xl border p-4" style={{ borderColor: "color-mix(in srgb, var(--icon-orange) 30%, transparent)", background: "color-mix(in srgb, var(--icon-orange) 5%, white)" }}>
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--icon-orange)" }}>Least stable day</p>
            <p className="mt-1 text-sm font-semibold text-foreground">{fmt(s.worst.date)} · {s.worst.overallStability}/10</p>
          </div>
        </div>
      )}

      {/* Insights */}
      <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
        <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-muted-foreground"><Sparkles size={13} style={{ color: "var(--icon-yellow)" }} /> Possible patterns</p>
        {insights.length ? (
          <div className="mt-4 space-y-2.5">
            {insights.map((i) => (
              <div key={i.id} className="flex items-start gap-3 rounded-2xl bg-[#f7f9f4] p-3.5">
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ background: toneColor[i.tone] }} />
                <p className="text-sm leading-relaxed text-foreground">{i.text}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">Keep logging — clearer patterns appear with more days of data.</p>
        )}
        <p className="mt-4 text-[11px] text-muted-foreground/70">These are associations from your own logs, not medical conclusions. Discuss anything persistent with your GP.</p>
      </div>
    </div>
  )
}
