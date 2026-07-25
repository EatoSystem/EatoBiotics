"use client"

/**
 * components/eatobetics/protein-calculator.tsx
 *
 * Interactive daily protein-target estimator for people on (or considering)
 * a GLP-1 medication, where preserving muscle during weight loss matters most.
 * Educational estimate only — not medical or dietetic advice.
 */

import { useState } from "react"
import { Check, Dumbbell, Mail, Utensils } from "lucide-react"
import {
  type Activity,
  ACTIVITY_LABELS,
  PROTEIN_FACTORS,
  lbToKg,
  proteinTarget,
  perMealTarget,
} from "@/lib/glp1"

type Unit = "kg" | "lb"

export function ProteinCalculator() {
  const [weight, setWeight] = useState<string>("75")
  const [unit, setUnit] = useState<Unit>("kg")
  const [activity, setActivity] = useState<Activity>("strength")
  const [meals, setMeals] = useState<number>(3)
  const [email, setEmail] = useState("")
  const [leadState, setLeadState] = useState<"idle" | "sending" | "done" | "error">("idle")

  async function captureLead(e: React.FormEvent) {
    e.preventDefault()
    if (leadState === "sending" || leadState === "done") return
    setLeadState("sending")
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, mainGoal: "glp1" }),
      })
      setLeadState(res.ok ? "done" : "error")
    } catch {
      setLeadState("error")
    }
  }

  const w = parseFloat(weight)
  const valid = !isNaN(w) && w > 0
  const kg = unit === "kg" ? w : lbToKg(w)
  const daily = valid ? proteinTarget(kg, activity) : 0
  const perMeal = valid ? perMealTarget(daily, meals) : 0

  return (
    <div className="overflow-hidden rounded-[2rem] border border-black/[0.06] bg-white shadow-[0_18px_60px_-24px_rgba(26,46,18,0.28)]">
      <div className="h-1.5 w-full" style={{ background: "linear-gradient(90deg, var(--icon-yellow), var(--icon-orange), var(--icon-green))" }} />
      <div className="grid gap-0 md:grid-cols-2">
        {/* Inputs */}
        <div className="p-7 md:p-8">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest" style={{ color: "var(--icon-orange)" }}>
            <Dumbbell size={14} /> Protein target estimator
          </div>

          {/* Weight */}
          <label className="mt-6 block text-sm font-semibold" style={{ color: "var(--foreground)" }}>Your body weight</label>
          <div className="mt-2 flex gap-2">
            <input
              type="number"
              inputMode="decimal"
              min={0}
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="w-full rounded-xl border-2 px-4 py-3 font-serif text-lg font-bold outline-none transition-colors focus:border-[color:var(--icon-green)]"
              style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
              aria-label="Body weight"
            />
            <div className="flex shrink-0 overflow-hidden rounded-xl border-2" style={{ borderColor: "var(--border)" }}>
              {(["kg", "lb"] as Unit[]).map((u) => (
                <button
                  key={u}
                  onClick={() => setUnit(u)}
                  className="px-4 text-sm font-semibold transition-colors"
                  style={{ background: unit === u ? "var(--icon-green)" : "white", color: unit === u ? "white" : "var(--muted-foreground)" }}
                >
                  {u}
                </button>
              ))}
            </div>
          </div>

          {/* Activity */}
          <p className="mt-6 text-sm font-semibold" style={{ color: "var(--foreground)" }}>Activity & training</p>
          <div className="mt-2 space-y-2">
            {(Object.keys(ACTIVITY_LABELS) as Activity[]).map((a) => {
              const active = activity === a
              return (
                <button
                  key={a}
                  onClick={() => setActivity(a)}
                  className="flex w-full items-center justify-between rounded-xl border-2 px-4 py-3 text-left transition-all"
                  style={{ borderColor: active ? "var(--icon-green)" : "var(--border)", background: active ? "color-mix(in srgb, var(--icon-green) 8%, white)" : "white" }}
                >
                  <div>
                    <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>{ACTIVITY_LABELS[a].label}</p>
                    <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>{ACTIVITY_LABELS[a].sub}</p>
                  </div>
                  <span className="h-4 w-4 shrink-0 rounded-full border-2" style={{ borderColor: active ? "var(--icon-green)" : "var(--border)", background: active ? "var(--icon-green)" : "transparent" }} />
                </button>
              )
            })}
          </div>

          {/* Meals */}
          <p className="mt-6 text-sm font-semibold" style={{ color: "var(--foreground)" }}>Meals per day</p>
          <div className="mt-2 flex gap-2">
            {[2, 3, 4].map((m) => (
              <button
                key={m}
                onClick={() => setMeals(m)}
                className="flex-1 rounded-xl border-2 py-2.5 text-sm font-semibold transition-all"
                style={{ borderColor: meals === m ? "var(--icon-green)" : "var(--border)", background: meals === m ? "color-mix(in srgb, var(--icon-green) 8%, white)" : "white", color: "var(--foreground)" }}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Result */}
        <div className="flex flex-col justify-center p-7 text-center md:p-8" style={{ background: "linear-gradient(160deg, #14250F, #1A2E12)" }}>
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--icon-lime)" }}>Aim for roughly</p>
          <div className="mt-3 flex items-baseline justify-center gap-1">
            <span className="font-serif text-6xl font-bold text-white">{valid ? daily : "—"}</span>
            <span className="text-lg font-medium text-white/60">g/day</span>
          </div>
          <p className="mt-1 text-sm text-white/70">protein to help protect muscle</p>

          <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.06] p-5">
            <div className="flex items-center justify-center gap-2 text-white">
              <Utensils size={16} style={{ color: "var(--icon-yellow)" }} />
              <span className="font-serif text-3xl font-bold">{valid ? `~${perMeal}g` : "—"}</span>
            </div>
            <p className="mt-1 text-xs text-white/60">at each of your {meals} meals</p>
          </div>

          {/* Lead capture — keep the target + get the follow-up habits by email */}
          {leadState === "done" ? (
            <p className="mt-6 flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-semibold text-white">
              <Check size={15} style={{ color: "var(--icon-lime)" }} /> Sent — check your inbox.
            </p>
          ) : (
            <form onSubmit={captureLead} className="mt-6">
              <label htmlFor="glp1-lead-email" className="sr-only">Email address</label>
              <div className="flex gap-2">
                <input
                  id="glp1-lead-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-white/15 bg-white/[0.06] px-4 py-2.5 text-sm text-white outline-none placeholder:text-white/35 focus:border-white/40"
                />
                <button
                  type="submit"
                  disabled={leadState === "sending"}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                  style={{ background: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))" }}
                >
                  <Mail size={14} /> {leadState === "sending" ? "Sending…" : "Email me my target"}
                </button>
              </div>
              <p className="mt-2 text-[11px] text-white/45">
                {leadState === "error"
                  ? "That didn't send — please try again."
                  : "Get your target plus the muscle-protecting food habits that go with it. No spam."}
              </p>
            </form>
          )}

          <p className="mt-6 text-[11px] leading-relaxed text-white/45">
            An educational estimate (~{PROTEIN_FACTORS[activity]} g per kg). Protein needs vary —
            always follow the guidance of the clinician or dietitian managing your care.
          </p>
        </div>
      </div>
    </div>
  )
}
