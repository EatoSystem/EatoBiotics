"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Dumbbell, Check, Flame, TrendingUp, TrendingDown, Loader2, ArrowLeft, Settings2, Target } from "lucide-react"
import {
  type Activity,
  type Glp1Medication,
  ACTIVITY_LABELS,
  MEDICATIONS,
  SIDE_EFFECTS,
  medicationLabel,
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
  side_effects: string[] | null
}

export type Glp1Profile = {
  medication: string | null
  start_weight_kg: number | null
  goal_weight_kg: number | null
  started_at: string | null
}

type Unit = "kg" | "lb"

const today = () => new Date().toISOString().slice(0, 10)
const fmtDay = (ds: string) =>
  new Date(ds + "T00:00:00Z").toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" })

export function Glp1Client({
  memberName,
  initialLogs,
  latestWeightKg,
  initialProfile,
}: {
  memberName: string | null
  initialLogs: Glp1Log[]
  latestWeightKg: number | null
  initialProfile: Glp1Profile | null
}) {
  const [logs, setLogs] = useState<Glp1Log[]>(initialLogs)
  const [profile, setProfile] = useState<Glp1Profile | null>(initialProfile)
  const [editing, setEditing] = useState(false)
  const todayLog = logs.find((l) => l.log_date === today())

  const [unit, setUnit] = useState<Unit>("kg")
  const [weight, setWeight] = useState<string>(
    todayLog?.weight_kg != null
      ? String(todayLog.weight_kg)
      : latestWeightKg != null
        ? String(latestWeightKg)
        : initialProfile?.start_weight_kg != null
          ? String(initialProfile.start_weight_kg)
          : "",
  )
  const [activity, setActivity] = useState<Activity>("strength")
  const [protein, setProtein] = useState<string>(
    todayLog?.protein_grams != null ? String(todayLog.protein_grams) : "",
  )
  const [strength, setStrength] = useState<boolean>(todayLog?.strength_session ?? false)
  const [sideEffects, setSideEffects] = useState<string[]>(todayLog?.side_effects ?? [])
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

  // ── Protein adherence (last 14 days) ──
  const adherence = useMemo(() => {
    const out: { ds: string; frac: number; hit: boolean; has: boolean }[] = []
    for (let i = 13; i >= 0; i--) {
      const d = new Date()
      d.setUTCDate(d.getUTCDate() - i)
      const ds = d.toISOString().slice(0, 10)
      const log = logs.find((l) => l.log_date === ds)
      let frac = 0, hit = false, has = false
      if (log?.protein_grams != null && log.protein_target) {
        has = true
        frac = Math.min(1, log.protein_grams / log.protein_target)
        hit = log.protein_grams >= log.protein_target
      } else if (log?.protein_grams != null) {
        has = true
        frac = 0.5
      }
      out.push({ ds, frac, hit, has })
    }
    return out
  }, [logs])

  // ── Side-effects summary (last 14 days) ──
  const sideEffectSummary = useMemo(() => {
    const cutoff = new Date()
    cutoff.setUTCDate(cutoff.getUTCDate() - 13)
    const cutoffStr = cutoff.toISOString().slice(0, 10)
    const counts: Record<string, number> = {}
    for (const l of logs) {
      if (l.log_date >= cutoffStr && l.side_effects) {
        for (const k of l.side_effects) counts[k] = (counts[k] ?? 0) + 1
      }
    }
    return SIDE_EFFECTS.map((s) => ({ ...s, count: counts[s.key] ?? 0 })).filter((s) => s.count > 0)
  }, [logs])

  function toggleSideEffect(key: string) {
    setSideEffects((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]))
  }

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
          side_effects: sideEffects.length ? sideEffects : null,
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
        side_effects: sideEffects.length ? sideEffects : null,
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

  // ── First run (or editing): onboarding setup ──
  if (!profile || editing) {
    return (
      <Glp1Onboarding
        memberName={memberName}
        initial={profile}
        canCancel={!!profile}
        onCancel={() => setEditing(false)}
        onDone={(p) => { setProfile(p); setEditing(false) }}
      />
    )
  }

  const medLabel = medicationLabel(profile.medication)
  const subtitle = medLabel && profile.medication !== "not_started"
    ? `On ${medLabel} · protecting muscle while you lose weight.`
    : "Protect muscle while you lose weight."
  // Anchor the weight trend to the starting weight, if recorded before any log.
  const baseline = profile.start_weight_kg != null && profile.started_at
    ? { date: profile.started_at, kg: profile.start_weight_kg }
    : undefined

  return (
    <div className="mx-auto max-w-2xl px-5 py-10">
      <Link href="/account" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
        <ArrowLeft size={14} /> Account
      </Link>

      <div className="mt-4 flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl text-white shadow-sm" style={{ background: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))" }}>
          <Dumbbell size={20} />
        </span>
        <div className="flex-1">
          <h1 className="font-serif text-2xl font-bold tracking-tight text-foreground">
            {memberName ? `${memberName}'s ` : "Your "}GLP-1 Companion
          </h1>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
        <button
          onClick={() => setEditing(true)}
          className="shrink-0 self-start rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
        >
          <Settings2 size={13} className="mr-1 inline" /> Setup
        </button>
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

          {/* Side effects */}
          <p className="mt-4 text-sm font-medium text-foreground">Any side effects today?</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {SIDE_EFFECTS.map((s) => {
              const active = sideEffects.includes(s.key)
              return (
                <button
                  key={s.key}
                  onClick={() => toggleSideEffect(s.key)}
                  className="rounded-full border-2 px-3.5 py-1.5 text-xs font-semibold transition-all"
                  style={{ borderColor: active ? "var(--icon-orange)" : "var(--border)", background: active ? "color-mix(in srgb, var(--icon-orange) 10%, transparent)" : "transparent", color: active ? "var(--icon-orange)" : "var(--muted-foreground)" }}
                >
                  {s.label}
                </button>
              )
            })}
          </div>

          <input
            type="text" maxLength={500} placeholder="Notes (optional) — how you felt today…"
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
          {error && <p className="mt-2 text-center text-sm text-red-600">{error}</p>}
        </div>
      </div>

      {/* ── This week ── */}
      <div className="mt-6 grid grid-cols-3 gap-3">
        <SummaryStat icon={<Check size={16} />} value={`${weekly.hits}/${weekly.logged || 0}`} label="Protein days hit" />
        <SummaryStat icon={<Flame size={16} />} value={String(weekly.sessions)} label="Strength sessions" />
        <SummaryStat icon={<TrendingUp size={16} />} value={weekly.avgProtein ? `${weekly.avgProtein}g` : "—"} label="Avg protein/day" />
      </div>

      {/* ── Weight trend ── */}
      <WeightTrend logs={logs} unit={unit} baseline={baseline} goalKg={profile.goal_weight_kg} />

      {/* ── Protein adherence (14 days) ── */}
      {adherence.some((d) => d.has) && (
        <div className="mt-6 rounded-3xl border border-border bg-card p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Protein adherence · last 14 days</p>
          <div className="mt-4 flex h-14 items-end gap-1.5">
            {adherence.map((d) => (
              <div key={d.ds} className="group relative flex-1" title={`${fmtDay(d.ds)}${d.has ? ` · ${Math.round(d.frac * 100)}% of target` : " · no log"}`}>
                <div className="w-full rounded-md" style={{
                  height: `${d.has ? Math.max(6, Math.round(d.frac * 52)) : 4}px`,
                  background: d.has ? (d.hit ? "var(--icon-green)" : "var(--icon-yellow)") : "var(--border)",
                  opacity: d.has ? 1 : 0.5,
                }} />
              </div>
            ))}
          </div>
          <div className="mt-2 flex items-center gap-4 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm" style={{ background: "var(--icon-green)" }} /> Target hit</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm" style={{ background: "var(--icon-yellow)" }} /> Under target</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm" style={{ background: "var(--border)" }} /> No log</span>
          </div>
        </div>
      )}

      {/* ── Side effects (14 days) ── */}
      {sideEffectSummary.length > 0 && (
        <div className="mt-6 rounded-3xl border border-border bg-card p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Side effects · last 14 days</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {sideEffectSummary.map((s) => (
              <span key={s.key} className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold" style={{ borderColor: "color-mix(in srgb, var(--icon-orange) 35%, transparent)", color: "var(--icon-orange)" }}>
                {s.label}
                <span className="rounded-full px-1.5 py-0.5 text-[10px] font-bold text-white" style={{ background: "var(--icon-orange)" }}>{s.count}</span>
              </span>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">Spotting a pattern? Share it with the clinician managing your medication.</p>
        </div>
      )}

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
function WeightTrend({
  logs,
  unit,
  baseline,
  goalKg,
}: {
  logs: Glp1Log[]
  unit: Unit
  baseline?: { date: string; kg: number }
  goalKg?: number | null
}) {
  const toDisp = (kg: number) => (unit === "kg" ? kg : kg * 2.20462)
  const round1 = (n: number) => Math.round(n * 10) / 10

  const pts = useMemo(() => {
    const logged = logs
      .filter((l) => l.weight_kg != null)
      .map((l) => ({ date: l.log_date, v: round1(toDisp(l.weight_kg as number)) }))
      .sort((a, b) => a.date.localeCompare(b.date))
    // Anchor to the recorded starting weight when it predates the first log.
    if (baseline && (logged.length === 0 || baseline.date < logged[0].date)) {
      return [{ date: baseline.date, v: round1(toDisp(baseline.kg)) }, ...logged]
    }
    return logged
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [logs, unit, baseline?.date, baseline?.kg])

  if (pts.length < 2) return null

  const goalDisp = goalKg != null ? round1(toDisp(goalKg)) : null

  // Least-squares trend (display-unit per day) over the points' actual dates.
  const dayIdx = pts.map((p) => (Date.parse(p.date) - Date.parse(pts[0].date)) / 86_400_000)
  const vals = pts.map((p) => p.v)
  const n = pts.length
  const xm = dayIdx.reduce((s, v) => s + v, 0) / n
  const ym = vals.reduce((s, v) => s + v, 0) / n
  const denom = dayIdx.reduce((s, v) => s + (v - xm) ** 2, 0)
  const rate = denom > 0 ? dayIdx.reduce((s, v, i) => s + (v - xm) * (vals[i] - ym), 0) / denom : 0

  const last = pts[n - 1].v
  const first = pts[0].v
  const delta = round1(last - first)
  const down = delta < 0
  const days = Math.max(1, Math.round(dayIdx[n - 1]))

  // Projection: only when genuinely trending toward a goal that's still ahead.
  const onTrack = goalDisp != null && rate < -0.001 && goalDisp < last
  const daysToGoal = onTrack ? (goalDisp! - last) / rate : Infinity
  const projecting = onTrack && daysToGoal <= 180
  const projDate = isFinite(daysToGoal)
    ? new Date(Date.parse(pts[n - 1].date) + daysToGoal * 86_400_000)
    : null

  // Geometry — compress history to the left when we draw a forward projection.
  const W = 400, H = 140, padX = 14, padTop = 18, padBot = 26
  const innerW = W - padX * 2, innerH = H - padTop - padBot
  const histW = innerW * (projecting ? 0.62 : 1)

  let lo = Math.min(...vals), hi = Math.max(...vals)
  if (goalDisp != null) { lo = Math.min(lo, goalDisp); hi = Math.max(hi, goalDisp) }
  if (lo === hi) { lo -= 1; hi += 1 }
  const padV = (hi - lo) * 0.14 || 1
  lo -= padV; hi += padV

  const x = (i: number) => padX + (histW * i) / (n - 1)
  const y = (v: number) => padTop + innerH * (1 - (v - lo) / (hi - lo))
  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(p.v).toFixed(1)}`).join(" ")
  const area = `${line} L ${x(n - 1).toFixed(1)} ${(H - padBot).toFixed(1)} L ${x(0).toFixed(1)} ${(H - padBot).toFixed(1)} Z`
  const nowX = padX + histW
  const yGoal = goalDisp != null ? y(goalDisp) : 0

  const fmt = (d: string | Date) =>
    (typeof d === "string" ? new Date(d + "T00:00:00Z") : d).toLocaleDateString(undefined, {
      month: "short", day: "numeric", timeZone: "UTC",
    })

  return (
    <div className="mt-6 rounded-3xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Weight trend</p>
          {delta !== 0 && (
            <p className="mt-1 flex items-center gap-1 text-sm font-semibold" style={{ color: down ? "var(--icon-green)" : "var(--muted-foreground)" }}>
              {down ? <TrendingDown size={15} /> : <TrendingUp size={15} />}
              {down ? "−" : "+"}{Math.abs(delta)} {unit} {baseline ? "since starting" : `over ${days} day${days !== 1 ? "s" : ""}`}
            </p>
          )}
          {goalDisp != null && (() => {
            const toGo = round1(last - goalDisp)
            return (
              <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                <Target size={12} style={{ color: "var(--icon-orange)" }} />
                {toGo > 0 ? `Goal ${goalDisp} ${unit} · ${toGo} ${unit} to go` : `Goal ${goalDisp} ${unit} · reached 🎉`}
              </p>
            )
          })()}
          {projecting && projDate && (
            <p className="mt-1 text-xs font-medium" style={{ color: "var(--icon-green)" }}>
              On track to reach it around {fmt(projDate)}
            </p>
          )}
        </div>
        <div className="text-right">
          <span className="font-serif text-2xl font-bold text-foreground">{last}</span>
          <span className="ml-1 text-xs text-muted-foreground">{unit}</span>
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="mt-3 w-full" role="img" aria-label="Weight over time with goal and projection">
        <defs>
          <linearGradient id="weightTrendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--icon-green)" stopOpacity="0.22" />
            <stop offset="100%" stopColor="var(--icon-green)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Goal line */}
        {goalDisp != null && (
          <>
            <line x1={padX} y1={yGoal} x2={padX + innerW} y2={yGoal} stroke="var(--icon-orange)" strokeWidth="1.4" strokeDasharray="4 4" opacity="0.7" />
            <text x={padX + innerW} y={yGoal - 4} textAnchor="end" fontSize="9" fill="var(--icon-orange)" fontWeight="700">Goal {goalDisp}</text>
          </>
        )}

        {/* Projection segment + 'now' divider */}
        {projecting && (
          <>
            <line x1={nowX} y1={padTop} x2={nowX} y2={H - padBot} stroke="var(--border)" strokeWidth="1" strokeDasharray="2 3" />
            <path d={`M ${nowX.toFixed(1)} ${y(last).toFixed(1)} L ${(padX + innerW).toFixed(1)} ${yGoal.toFixed(1)}`} fill="none" stroke="var(--icon-green)" strokeWidth="2" strokeDasharray="5 4" opacity="0.55" strokeLinecap="round" />
            <circle cx={padX + innerW} cy={yGoal} r="3.2" fill="none" stroke="var(--icon-green)" strokeWidth="1.8" />
            <text x={nowX} y={H - padBot + 11} textAnchor="middle" fontSize="8.5" fill="var(--muted-foreground)">now</text>
          </>
        )}

        <path d={area} fill="url(#weightTrendFill)" />
        <path d={line} fill="none" stroke="var(--icon-green)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={x(n - 1)} cy={y(last)} r="3.6" fill="var(--icon-green)" />
      </svg>
      <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
        <span>{fmt(pts[0].date)}</span>
        <span>{projecting && projDate ? fmt(projDate) : fmt(pts[n - 1].date)}</span>
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

/* ── First-run onboarding / setup ──────────────────────────────────────── */

function Glp1Onboarding({
  memberName,
  initial,
  canCancel,
  onCancel,
  onDone,
}: {
  memberName: string | null
  initial: Glp1Profile | null
  canCancel: boolean
  onCancel: () => void
  onDone: (p: Glp1Profile) => void
}) {
  const [medication, setMedication] = useState<Glp1Medication | null>((initial?.medication as Glp1Medication) ?? null)
  const [unit, setUnit] = useState<Unit>("kg")
  const [startWeight, setStartWeight] = useState<string>(initial?.start_weight_kg != null ? String(initial.start_weight_kg) : "")
  const [goalWeight, setGoalWeight] = useState<string>(initial?.goal_weight_kg != null ? String(initial.goal_weight_kg) : "")
  const [startedAt, setStartedAt] = useState<string>(initial?.started_at ?? today())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const toKg = (s: string): number | null => {
    const n = parseFloat(s)
    if (isNaN(n) || n <= 0) return null
    return Math.round((unit === "kg" ? n : lbToKg(n)) * 10) / 10
  }

  async function submit(skip: boolean) {
    setSaving(true)
    setError(null)
    const startKg = skip ? null : toKg(startWeight)
    const goalKg = skip ? null : toKg(goalWeight)
    const payload: Glp1Profile = {
      medication: skip ? null : medication,
      start_weight_kg: startKg,
      goal_weight_kg: goalKg,
      started_at: skip ? null : startKg != null ? startedAt : null,
    }
    try {
      const res = await fetch("/api/glp1/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error ?? "Could not save")
      }
      const j = await res.json().catch(() => ({}))
      onDone((j.profile as Glp1Profile) ?? payload)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-xl px-5 py-12">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-sm" style={{ background: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))" }}>
        <Dumbbell size={24} />
      </span>
      <h1 className="mt-5 text-center font-serif text-2xl font-bold tracking-tight text-foreground">
        {canCancel ? "Update your setup" : memberName ? `Let's set up your Companion, ${memberName.split(" ")[0]}` : "Let's set up your Companion"}
      </h1>
      <p className="mx-auto mt-2 max-w-sm text-center text-sm text-muted-foreground">
        A few details so we can personalise your protein target and track your progress
        from day one. You can change these any time.
      </p>

      <div className="mt-8 space-y-7">
        {/* Medication */}
        <div>
          <label className="text-sm font-semibold text-foreground">Which medication are you on?</label>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {MEDICATIONS.map((m) => {
              const active = medication === m.value
              return (
                <button
                  key={m.value}
                  onClick={() => setMedication(m.value)}
                  className="rounded-xl border-2 px-4 py-3 text-left text-sm font-semibold transition-all"
                  style={{ borderColor: active ? "var(--icon-green)" : "var(--border)", background: active ? "color-mix(in srgb, var(--icon-green) 8%, transparent)" : "transparent", color: "var(--foreground)" }}
                >
                  {m.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Start weight */}
        <div>
          <label className="text-sm font-semibold text-foreground">Your starting weight</label>
          <div className="mt-2 flex gap-2">
            <input
              type="number" inputMode="decimal" min={0} placeholder="e.g. 84"
              value={startWeight} onChange={(e) => setStartWeight(e.target.value)}
              className="w-full rounded-xl border-2 border-border bg-background px-4 py-2.5 font-serif text-lg font-bold text-foreground outline-none focus:border-[color:var(--icon-green)]"
            />
            <div className="flex shrink-0 overflow-hidden rounded-xl border-2 border-border">
              {(["kg", "lb"] as Unit[]).map((u) => (
                <button key={u} onClick={() => setUnit(u)} className="px-4 text-sm font-semibold transition-colors"
                  style={{ background: unit === u ? "var(--icon-green)" : "transparent", color: unit === u ? "white" : "var(--muted-foreground)" }}>
                  {u}
                </button>
              ))}
            </div>
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">We use this to anchor your weight trend.</p>
        </div>

        {/* Goal weight + start date */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-semibold text-foreground">Goal weight <span className="font-normal text-muted-foreground">(optional)</span></label>
            <div className="mt-2 flex items-center gap-2">
              <input
                type="number" inputMode="decimal" min={0} placeholder="e.g. 76"
                value={goalWeight} onChange={(e) => setGoalWeight(e.target.value)}
                className="w-full rounded-xl border-2 border-border bg-background px-4 py-2.5 font-semibold text-foreground outline-none focus:border-[color:var(--icon-green)]"
              />
              <span className="text-sm text-muted-foreground">{unit}</span>
            </div>
          </div>
          <div>
            <label className="text-sm font-semibold text-foreground">When did you start? <span className="font-normal text-muted-foreground">(optional)</span></label>
            <input
              type="date" max={today()} value={startedAt} onChange={(e) => setStartedAt(e.target.value)}
              className="mt-2 w-full rounded-xl border-2 border-border bg-background px-3 py-2.5 text-sm font-medium text-foreground outline-none focus:border-[color:var(--icon-green)]"
            />
          </div>
        </div>
      </div>

      <button
        onClick={() => submit(false)} disabled={saving}
        className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
        style={{ background: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))" }}
      >
        {saving ? <><Loader2 size={15} className="animate-spin" /> Saving…</> : canCancel ? "Save setup" : "Start tracking"}
      </button>
      {error && <p className="mt-2 text-center text-sm text-red-600">{error}</p>}

      <div className="mt-3 text-center">
        {canCancel ? (
          <button onClick={onCancel} className="text-xs font-medium text-muted-foreground underline underline-offset-4 hover:text-foreground">Cancel</button>
        ) : (
          <button onClick={() => submit(true)} disabled={saving} className="text-xs font-medium text-muted-foreground underline underline-offset-4 hover:text-foreground">Skip for now</button>
        )}
      </div>
    </div>
  )
}
