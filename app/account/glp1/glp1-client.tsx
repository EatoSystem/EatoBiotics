"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Dumbbell, Check, Flame, TrendingUp, TrendingDown, Loader2, ArrowLeft } from "lucide-react"
import {
  type Activity,
  ACTIVITY_LABELS,
  lbToKg,
  proteinTarget,
} from "@/lib/glp1"

export type Glp1Log = {
  log_date: string
  protein_grams: number | null
  protein_target: number | null
  weight_kg: number | null
  strength_session: boolean
  notes: string | null
}

type Unit = "kg" | "lb"

const today = () => new Date().toISOString().slice(0, 10)

export function Glp1Client({
  memberName,
  initialLogs,
  latestWeightKg,
}: {
  memberName: string | null
  initialLogs: Glp1Log[]
  latestWeightKg: number | null
}) {
  const [logs, setLogs] = useState<Glp1Log[]>(initialLogs)
  const todayLog = logs.find((l) => l.log_date === today())

  const [unit, setUnit] = useState<Unit>("kg")
  const [weight, setWeight] = useState<string>(
    todayLog?.weight_kg != null ? String(todayLog.weight_kg) : latestWeightKg != null ? String(latestWeightKg) : "",
  )
  const [activity, setActivity] = useState<Activity>("strength")
  const [protein, setProtein] = useState<string>(
    todayLog?.protein_grams != null ? String(todayLog.protein_grams) : "",
  )
  const [strength, setStrength] = useState<boolean>(todayLog?.strength_session ?? false)
  const [notes, setNotes] = useState<string>(todayLog?.notes ?? "")
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const kg = useMemo(() => {
    const w = parseFloat(weight)
    if (isNaN(w) || w <= 0) return 0
    return unit === "kg" ? w : lbToKg(w)
  }, [weight, unit])

  const target = proteinTarget(kg, activity)
  const eaten = parseInt(protein, 10)
  const eatenValid = !isNaN(eaten) && eaten >= 0
  const pct = target > 0 && eatenValid ? Math.min(100, Math.round((eaten / target) * 100)) : 0

  // ── Weekly summary (last 7 days) ──
  const weekly = useMemo(() => {
    const cutoff = new Date()
    cutoff.setUTCDate(cutoff.getUTCDate() - 6)
    const cutoffStr = cutoff.toISOString().slice(0, 10)
    const recent = logs.filter((l) => l.log_date >= cutoffStr)
    const hits = recent.filter(
      (l) => l.protein_grams != null && l.protein_target != null && l.protein_grams >= l.protein_target,
    ).length
    const sessions = recent.filter((l) => l.strength_session).length
    const proteinDays = recent.filter((l) => l.protein_grams != null)
    const avgProtein = proteinDays.length
      ? Math.round(proteinDays.reduce((s, l) => s + (l.protein_grams ?? 0), 0) / proteinDays.length)
      : 0
    return { hits, sessions, avgProtein, logged: recent.length }
  }, [logs])

  async function save() {
    setSaving(true)
    setError(null)
    setSaved(false)
    try {
      const res = await fetch("/api/glp1/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          log_date: today(),
          protein_grams: eatenValid ? eaten : null,
          protein_target: target > 0 ? target : null,
          weight_kg: kg > 0 ? Math.round(kg * 10) / 10 : null,
          strength_session: strength,
          notes: notes.trim() || null,
        }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error ?? "Could not save")
      }
      // Upsert today's log into local state
      const updated: Glp1Log = {
        log_date: today(),
        protein_grams: eatenValid ? eaten : null,
        protein_target: target > 0 ? target : null,
        weight_kg: kg > 0 ? Math.round(kg * 10) / 10 : null,
        strength_session: strength,
        notes: notes.trim() || null,
      }
      setLogs((prev) => [updated, ...prev.filter((l) => l.log_date !== today())])
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save")
    } finally {
      setSaving(false)
    }
  }

  const ringColor = pct >= 100 ? "var(--icon-green)" : pct >= 60 ? "var(--icon-lime)" : "var(--icon-yellow)"

  return (
    <div className="mx-auto max-w-2xl px-5 py-10">
      <Link href="/account" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
        <ArrowLeft size={14} /> Account
      </Link>

      <div className="mt-4 flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl text-white shadow-sm" style={{ background: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))" }}>
          <Dumbbell size={20} />
        </span>
        <div>
          <h1 className="font-serif text-2xl font-bold tracking-tight text-foreground">
            {memberName ? `${memberName}'s ` : "Your "}GLP-1 Companion
          </h1>
          <p className="text-sm text-muted-foreground">Protect muscle while you lose weight.</p>
        </div>
      </div>

      {/* ── Today's target + log ── */}
      <div className="mt-6 overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
        <div className="h-1.5 w-full" style={{ background: "linear-gradient(90deg, var(--icon-yellow), var(--icon-orange), var(--icon-green))" }} />
        <div className="grid gap-6 p-6 sm:grid-cols-[auto_1fr] sm:items-center">
          {/* Progress ring */}
          <div className="mx-auto">
            <svg width="132" height="132" viewBox="0 0 132 132" className="-rotate-90">
              <circle cx="66" cy="66" r="58" fill="none" stroke="var(--border)" strokeWidth="11" />
              <circle
                cx="66" cy="66" r="58" fill="none" stroke={ringColor} strokeWidth="11" strokeLinecap="round"
                strokeDasharray={`${(pct / 100) * 2 * Math.PI * 58} ${2 * Math.PI * 58}`}
                style={{ transition: "stroke-dasharray 0.5s ease, stroke 0.3s ease" }}
              />
            </svg>
            <div className="-mt-[92px] mb-[60px] text-center">
              <div className="font-serif text-3xl font-bold text-foreground">{eatenValid ? eaten : 0}</div>
              <div className="text-xs text-muted-foreground">of {target || "—"} g</div>
            </div>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--icon-green)" }}>Today&apos;s protein</p>
            <label className="mt-2 block text-sm font-medium text-foreground">How much protein have you eaten? (g)</label>
            <input
              type="number" inputMode="numeric" min={0} placeholder="e.g. 120"
              value={protein} onChange={(e) => setProtein(e.target.value)}
              className="mt-1.5 w-full rounded-xl border-2 border-border bg-background px-4 py-2.5 font-serif text-lg font-bold text-foreground outline-none focus:border-[color:var(--icon-green)]"
            />
            {target > 0 && eatenValid && (
              <p className="mt-2 text-sm text-muted-foreground">
                {eaten >= target
                  ? <span className="font-semibold" style={{ color: "var(--icon-green)" }}>Target hit — muscle protected. 💪</span>
                  : <>{target - eaten} g to go to protect muscle today.</>}
              </p>
            )}
          </div>
        </div>

        {/* Target inputs */}
        <div className="border-t border-border p-6">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Your target</p>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-foreground">Body weight</label>
              <div className="mt-1.5 flex gap-2">
                <input
                  type="number" inputMode="decimal" min={0} value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="w-full rounded-xl border-2 border-border bg-background px-4 py-2.5 font-semibold text-foreground outline-none focus:border-[color:var(--icon-green)]"
                />
                <div className="flex shrink-0 overflow-hidden rounded-xl border-2 border-border">
                  {(["kg", "lb"] as Unit[]).map((u) => (
                    <button key={u} onClick={() => setUnit(u)} className="px-3 text-sm font-semibold transition-colors"
                      style={{ background: unit === u ? "var(--icon-green)" : "transparent", color: unit === u ? "white" : "var(--muted-foreground)" }}>
                      {u}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground">Activity</label>
              <select
                value={activity} onChange={(e) => setActivity(e.target.value as Activity)}
                className="mt-1.5 w-full rounded-xl border-2 border-border bg-background px-3 py-2.5 text-sm font-medium text-foreground outline-none focus:border-[color:var(--icon-green)]"
              >
                {(Object.keys(ACTIVITY_LABELS) as Activity[]).map((a) => (
                  <option key={a} value={a}>{ACTIVITY_LABELS[a].label} — {ACTIVITY_LABELS[a].sub}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Strength toggle */}
          <button
            onClick={() => setStrength((s) => !s)}
            className="mt-4 flex w-full items-center justify-between rounded-xl border-2 px-4 py-3 text-left transition-all"
            style={{ borderColor: strength ? "var(--icon-green)" : "var(--border)", background: strength ? "color-mix(in srgb, var(--icon-green) 8%, transparent)" : "transparent" }}
          >
            <span className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Dumbbell size={16} style={{ color: "var(--icon-green)" }} /> Did a strength session today
            </span>
            <span className="flex h-5 w-5 items-center justify-center rounded-md border-2" style={{ borderColor: strength ? "var(--icon-green)" : "var(--border)", background: strength ? "var(--icon-green)" : "transparent" }}>
              {strength && <Check size={13} className="text-white" />}
            </span>
          </button>

          <input
            type="text" maxLength={500} placeholder="Notes (optional) — how you felt, side effects…"
            value={notes} onChange={(e) => setNotes(e.target.value)}
            className="mt-3 w-full rounded-xl border-2 border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-[color:var(--icon-green)]"
          />

          <button
            onClick={save} disabled={saving}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
            style={{ background: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))" }}
          >
            {saving ? <><Loader2 size={15} className="animate-spin" /> Saving…</> : saved ? <><Check size={15} /> Saved</> : "Save today's log"}
          </button>
          {error && <p className="mt-2 text-center text-sm text-red-500">{error}</p>}
        </div>
      </div>

      {/* ── This week ── */}
      <div className="mt-6 grid grid-cols-3 gap-3">
        <SummaryStat icon={<Check size={16} />} value={`${weekly.hits}/${weekly.logged || 0}`} label="Protein days hit" />
        <SummaryStat icon={<Flame size={16} />} value={String(weekly.sessions)} label="Strength sessions" />
        <SummaryStat icon={<TrendingUp size={16} />} value={weekly.avgProtein ? `${weekly.avgProtein}g` : "—"} label="Avg protein/day" />
      </div>

      {/* ── Weight trend ── */}
      <WeightTrend logs={logs} unit={unit} />

      {/* ── History ── */}
      {logs.length > 0 && (
        <div className="mt-6 rounded-3xl border border-border bg-card p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Recent days</p>
          <div className="mt-3 divide-y divide-border">
            {logs.slice(0, 14).map((l) => {
              const hit = l.protein_grams != null && l.protein_target != null && l.protein_grams >= l.protein_target
              return (
                <div key={l.log_date} className="flex items-center justify-between py-2.5 text-sm">
                  <span className="font-medium text-foreground">
                    {new Date(l.log_date + "T00:00:00Z").toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" })}
                  </span>
                  <div className="flex items-center gap-3">
                    {l.protein_grams != null && (
                      <span className="tabular-nums" style={{ color: hit ? "var(--icon-green)" : "var(--muted-foreground)" }}>
                        {l.protein_grams}{l.protein_target ? `/${l.protein_target}` : ""}g
                      </span>
                    )}
                    {l.strength_session && <Dumbbell size={14} style={{ color: "var(--icon-green)" }} aria-label="Strength session" />}
                    {hit && <Check size={14} style={{ color: "var(--icon-green)" }} />}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <p className="mt-6 text-center text-xs leading-relaxed text-muted-foreground/70">
        Educational tracking, not medical advice. Protein needs are individual — follow the
        guidance of the clinician or dietitian managing your care.
      </p>
    </div>
  )
}

/** 30-day weight trend line chart, drawn from logged weights (in the chosen unit). */
function WeightTrend({ logs, unit }: { logs: Glp1Log[]; unit: Unit }) {
  const pts = useMemo(() => {
    const toDisp = (kg: number) => (unit === "kg" ? kg : kg * 2.20462)
    return logs
      .filter((l) => l.weight_kg != null)
      .map((l) => ({ date: l.log_date, v: Math.round(toDisp(l.weight_kg as number) * 10) / 10 }))
      .sort((a, b) => a.date.localeCompare(b.date))
  }, [logs, unit])

  if (pts.length < 2) return null

  const W = 400, H = 130, padX = 14, padTop = 20, padBot = 24
  const innerW = W - padX * 2, innerH = H - padTop - padBot
  const vals = pts.map((p) => p.v)
  let min = Math.min(...vals), max = Math.max(...vals)
  if (min === max) { min -= 1; max += 1 }
  const x = (i: number) => padX + (innerW * i) / (pts.length - 1)
  const y = (v: number) => padTop + innerH * (1 - (v - min) / (max - min))
  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(p.v).toFixed(1)}`).join(" ")
  const area = `${line} L ${x(pts.length - 1).toFixed(1)} ${(H - padBot).toFixed(1)} L ${x(0).toFixed(1)} ${(H - padBot).toFixed(1)} Z`

  const first = pts[0].v, last = pts[pts.length - 1].v
  const delta = Math.round((last - first) * 10) / 10
  const days = Math.max(
    1,
    Math.round((Date.parse(pts[pts.length - 1].date) - Date.parse(pts[0].date)) / 86_400_000),
  )
  const down = delta < 0
  const fmt = (d: string) =>
    new Date(d + "T00:00:00Z").toLocaleDateString(undefined, { month: "short", day: "numeric", timeZone: "UTC" })

  return (
    <div className="mt-6 rounded-3xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Weight trend</p>
          {delta !== 0 && (
            <p className="mt-1 flex items-center gap-1 text-sm font-semibold" style={{ color: down ? "var(--icon-green)" : "var(--muted-foreground)" }}>
              {down ? <TrendingDown size={15} /> : <TrendingUp size={15} />}
              {down ? "−" : "+"}{Math.abs(delta)} {unit} over {days} day{days !== 1 ? "s" : ""}
            </p>
          )}
        </div>
        <div className="text-right">
          <span className="font-serif text-2xl font-bold text-foreground">{last}</span>
          <span className="ml-1 text-xs text-muted-foreground">{unit}</span>
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="mt-3 w-full" role="img" aria-label="Weight over time">
        <defs>
          <linearGradient id="weightTrendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--icon-green)" stopOpacity="0.22" />
            <stop offset="100%" stopColor="var(--icon-green)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#weightTrendFill)" />
        <path d={line} fill="none" stroke="var(--icon-green)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={x(pts.length - 1)} cy={y(last)} r="3.6" fill="var(--icon-green)" />
      </svg>
      <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
        <span>{fmt(pts[0].date)}</span>
        <span>{fmt(pts[pts.length - 1].date)}</span>
      </div>
    </div>
  )
}

function SummaryStat({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 text-center shadow-sm">
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl" style={{ background: "color-mix(in srgb, var(--icon-green) 12%, transparent)", color: "var(--icon-green)" }}>
        {icon}
      </span>
      <div className="mt-2 font-serif text-xl font-bold text-foreground">{value}</div>
      <div className="text-[11px] leading-tight text-muted-foreground">{label}</div>
    </div>
  )
}
