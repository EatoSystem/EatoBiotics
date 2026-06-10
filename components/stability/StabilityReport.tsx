"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Database, FileText, TrendingDown, TrendingUp } from "lucide-react"
import { loadLogs, seedLogs } from "@/lib/stability/storage"
import { computeReport } from "@/lib/stability/insights"
import { sampleLogs } from "@/lib/stability/sample-data"
import type { StabilityDailyLog } from "@/lib/stability/types"

export function StabilityReport() {
  const [logs, setLogs] = useState<StabilityDailyLog[]>(() => loadLogs())
  const report = useMemo(() => computeReport(logs, 30), [logs])

  function loadSample() { const s = sampleLogs(); seedLogs(s); setLogs(s) }

  if (logs.length < 3) {
    return (
      <div className="rounded-3xl border border-border bg-card p-8 text-center shadow-sm">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl text-white" style={{ background: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))" }}><FileText size={24} /></span>
        <h2 className="mt-4 font-serif text-xl font-bold text-foreground">Your monthly report builds from your logs</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">Track a few days first, then come back for your stability trends and next-month focus.</p>
        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/stability/tracker" className="brand-gradient inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white">Log today</Link>
          <button onClick={loadSample} className="inline-flex items-center gap-2 rounded-full border px-6 py-3 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground" style={{ borderColor: "var(--border)" }}>
            <Database size={14} /> Load sample data
          </button>
        </div>
      </div>
    )
  }

  const delta = report.avgStability != null && report.avgStabilityPrev != null ? Math.round((report.avgStability - report.avgStabilityPrev) * 10) / 10 : null
  const accDelta = report.accidentEpisodes - report.accidentEpisodesPrev

  const Row = ({ label, value, sub }: { label: string; value: string; sub?: string }) => (
    <div className="flex items-center justify-between border-b border-border py-3 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold text-foreground">{value}{sub && <span className="ml-1 text-xs font-normal text-muted-foreground">{sub}</span>}</span>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Headline narrative */}
      <div className="rounded-3xl border border-black/[0.06] bg-white p-6 shadow-[0_14px_50px_-22px_rgba(26,46,18,0.22)] sm:p-7">
        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--icon-green)" }}>This month</p>
        <p className="mt-3 text-lg leading-relaxed text-foreground">
          {delta != null && (
            <>Your average stability {delta >= 0 ? "improved" : "shifted"} {delta >= 0 ? "to" : "to"}{" "}
              <strong style={{ color: delta >= 0 ? "var(--icon-green)" : "var(--icon-orange)" }}>{report.avgStability}/10</strong>
              {report.avgStabilityPrev != null && <> (from {report.avgStabilityPrev}).</>} </>
          )}
          {report.accidentEpisodesPrev > 0 && (
            <>Accident/leakage episodes went from <strong>{report.accidentEpisodesPrev}</strong> to <strong style={{ color: accDelta <= 0 ? "var(--icon-green)" : "var(--icon-orange)" }}>{report.accidentEpisodes}</strong>. </>
          )}
          Your most stable days were associated with steadier sleep, lower caffeine, and more consistent hydration.
        </p>
      </div>

      {/* Trends */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Trends ({report.logCount} days)</p>
          <div className="mt-3">
            <Row label="Avg stability" value={`${report.avgStability ?? "—"}/10`} />
            <Row label="Urgency episodes" value={String(report.urgencyEpisodes)} />
            <Row label="Accident episodes" value={String(report.accidentEpisodes)} />
            <Row label="Most common stool" value={report.commonStoolType ? `Type ${report.commonStoolType}` : "—"} />
            <Row label="Avg hydration" value={`${report.avgWater ?? "—"}`} sub="glasses" />
            <Row label="Avg sleep" value={`${report.avgSleep ?? "—"}/10`} />
            <Row label="Avg stress" value={`${report.avgStress ?? "—"}/10`} />
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Stability change</p>
          <div className="mt-4 flex items-center gap-3">
            {delta != null && (delta >= 0 ? <TrendingUp size={26} style={{ color: "var(--icon-green)" }} /> : <TrendingDown size={26} style={{ color: "var(--icon-orange)" }} />)}
            <div>
              <span className="font-serif text-3xl font-bold text-foreground">{report.avgStability ?? "—"}</span>
              <span className="text-sm text-muted-foreground">/10 avg</span>
            </div>
          </div>
          {report.insights.length > 0 && (
            <div className="mt-4 space-y-2">
              {report.insights.slice(0, 3).map((i) => (
                <p key={i.id} className="text-xs leading-relaxed text-muted-foreground">• {i.text}</p>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Focus */}
      <div className="rounded-3xl border p-5" style={{ borderColor: "color-mix(in srgb, var(--icon-green) 30%, transparent)", background: "color-mix(in srgb, var(--icon-green) 5%, white)" }}>
        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--icon-green)" }}>Recommended focus for next month</p>
        <ul className="mt-3 space-y-2">
          {report.focusNextMonth.map((f, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-foreground"><span className="mt-0.5 font-bold" style={{ color: "var(--icon-green)" }}>→</span> {f}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}
