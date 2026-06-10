"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowRight, AlertTriangle, Check, ListChecks } from "lucide-react"
import { loadAssessment, hydrateFromServer } from "@/lib/stability/storage"
import type { StabilityAssessment } from "@/lib/stability/types"
import { StabilityScoreCard } from "./StabilityScoreCard"
import { RedFlagWarning } from "./RedFlagWarning"

/** Build a gentle 7-day plan from the recommendations (padded with steady defaults). */
function sevenDayPlan(steps: string[]): string[] {
  const base = [...steps]
  const fillers = [
    "Keep meals at roughly the same times.",
    "Add one new plant food to your day.",
    "Take a 10-minute walk after a meal.",
    "Notice one trigger and log it.",
    "Wind down 30 minutes before bed.",
    "Drink a glass of water with each meal.",
    "Review your logs and pick one thing that helped.",
  ]
  const plan: string[] = []
  for (let i = 0; i < 7; i++) plan.push(base[i] ?? fillers[i % fillers.length])
  return plan
}

export function StabilityResults() {
  const [data, setData] = useState<StabilityAssessment | null | undefined>(undefined)

  useEffect(() => { hydrateFromServer().finally(() => setData(loadAssessment())) }, [])

  if (data === undefined) {
    return <div className="py-20 text-center text-sm text-muted-foreground">Loading your results…</div>
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-md rounded-3xl border border-border bg-card p-8 text-center shadow-sm">
        <h2 className="font-serif text-xl font-bold text-foreground">No results yet</h2>
        <p className="mt-2 text-sm text-muted-foreground">Take the Stability Assessment to see your score and plan.</p>
        <Link href="/stability/assessment" className="brand-gradient mt-5 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white">
          Start Stability Assessment <ArrowRight size={15} />
        </Link>
      </div>
    )
  }

  const { score } = data
  const plan = sevenDayPlan(score.recommendedNextSteps)

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {score.redFlags.length > 0 && <RedFlagWarning matched={score.redFlags} />}

      <StabilityScoreCard score={score} />

      {/* Contributors + actions */}
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
          <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest" style={{ color: "var(--icon-orange)" }}>
            <AlertTriangle size={13} /> Possible contributors
          </p>
          <ul className="mt-3 space-y-2">
            {(score.topRiskFactors.length ? score.topRiskFactors.slice(0, 3) : ["No notable risk factors flagged"]).map((r) => (
              <li key={r} className="flex items-start gap-2 text-sm text-foreground"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: "var(--icon-orange)" }} /> {r}</li>
            ))}
          </ul>
          {score.positiveFactors.length > 0 && (
            <>
              <p className="mt-4 text-xs font-bold uppercase tracking-widest" style={{ color: "var(--icon-green)" }}>Working in your favour</p>
              <ul className="mt-2 space-y-1.5">
                {score.positiveFactors.slice(0, 3).map((p) => (
                  <li key={p} className="flex items-start gap-2 text-sm text-muted-foreground"><Check size={14} className="mt-0.5 shrink-0" style={{ color: "var(--icon-green)" }} /> {p}</li>
                ))}
              </ul>
            </>
          )}
        </div>

        <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
          <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest" style={{ color: "var(--icon-green)" }}>
            <ListChecks size={13} /> Top recommended actions
          </p>
          <ul className="mt-3 space-y-2.5">
            {score.recommendedNextSteps.slice(0, 3).map((s) => (
              <li key={s} className="flex items-start gap-2.5 text-sm text-foreground">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-white" style={{ background: "var(--icon-green)" }}><Check size={12} /></span> {s}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* 7-day plan */}
      <div className="rounded-3xl border border-black/[0.06] bg-white p-6 shadow-[0_14px_50px_-22px_rgba(26,46,18,0.22)]">
        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--icon-teal)" }}>Your 7-day Stability Plan</p>
        <div className="mt-4 space-y-2.5">
          {plan.map((p, i) => (
            <div key={i} className="flex items-start gap-3 rounded-2xl bg-[#f7f9f4] p-3.5">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white" style={{ background: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))" }}>{i + 1}</span>
              <p className="text-sm leading-relaxed text-foreground">{p}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-[11px] text-muted-foreground/70">A gentle guide, not medical advice. Change one thing at a time, and speak to your GP about anything new, severe, or worsening.</p>
      </div>

      <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Link href="/stability/tracker" className="brand-gradient inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold text-white">Start tracking daily <ArrowRight size={15} /></Link>
        <Link href="/stability/assessment" className="inline-flex items-center gap-2 rounded-full border px-7 py-3.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground" style={{ borderColor: "var(--border)" }}>Retake assessment</Link>
      </div>
    </div>
  )
}
