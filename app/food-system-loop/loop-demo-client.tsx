"use client"

import { useMemo, useState } from "react"
import { ArrowRight, Sparkles } from "lucide-react"
import {
  buildBaseline,
  liveSpecialisedSystems,
  plannedSpecialisedSystems,
  LOOP_DISCLAIMER,
  type AddOnSystem,
} from "@/lib/agent-loop"
import {
  FoodSystemLoopCard,
  FoodSystemMemoryPanel,
  useFoodSystemLoop,
} from "@/components/agent-loop"

function SystemCard({ system }: { system: AddOnSystem }) {
  const planned = system.status === "planned"
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <span className="font-semibold text-foreground">{system.label}</span>
        <span
          className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
          style={
            planned
              ? { backgroundColor: "var(--muted, #F3F3F3)", color: "var(--muted-foreground)" }
              : { backgroundColor: "color-mix(in srgb, var(--icon-green) 14%, #fff)", color: "var(--icon-green)" }
          }
        >
          {planned ? "Coming soon" : "Live"}
        </span>
      </div>
      <p className="mt-1.5 text-sm text-muted-foreground">{system.blurb}</p>
      <p className="mt-2 text-[11px] uppercase tracking-wide text-muted-foreground">
        Inherits your foundation
      </p>
    </div>
  )
}

export function LoopDemoClient() {
  const baseline = useMemo(
    () =>
      buildBaseline({
        foundationKey: "you",
        score: 58,
        scoreLabel: "Building Momentum",
        biotics: { prebiotics: 42, probiotics: 71, postbiotics: 55 },
        strengths: ["Fermented foods are a real strength"],
        priorities: ["Add more plant diversity"],
      }),
    [],
  )

  const { twin, busy, addMeal, recordAndRefresh } = useFoodSystemLoop(baseline)
  const [meal, setMeal] = useState("")

  const live = liveSpecialisedSystems()
  const planned = plannedSpecialisedSystems()

  return (
    <div className="mx-auto max-w-[1000px] px-6 py-16">
      <div className="mb-10 text-center">
        <p className="mb-3 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-icon-green">
          <Sparkles className="h-3.5 w-3.5" /> Interactive demo
        </p>
        <h1 className="font-serif text-4xl font-semibold text-foreground sm:text-5xl">
          The Food System Loop
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
          A living loop, not a static report. This demo runs entirely on
          deterministic logic — no AI required — using a sample baseline.
        </p>
      </div>

      {twin ? (
        <FoodSystemLoopCard
          twin={twin}
          onComplete={(id) => recordAndRefresh(id, "completed")}
          onSkip={(id) => recordAndRefresh(id, "ignored")}
        />
      ) : (
        <div className="rounded-3xl border border-border bg-card p-8 text-center text-muted-foreground">
          Starting your loop…
        </div>
      )}

      {/* Observe: add a meal to run another loop */}
      <form
        className="mt-4 flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-card p-4"
        onSubmit={(e) => {
          e.preventDefault()
          if (!meal.trim() || busy) return
          addMeal(meal.trim())
          setMeal("")
        }}
      >
        <label htmlFor="meal" className="text-sm font-medium text-foreground">
          Observe a meal:
        </label>
        <input
          id="meal"
          value={meal}
          onChange={(e) => setMeal(e.target.value)}
          placeholder="e.g. Lentil soup with sourdough"
          className="min-w-[200px] flex-1 rounded-full border border-border px-4 py-2 text-sm outline-none focus:border-icon-green"
        />
        <button
          type="submit"
          disabled={busy || !meal.trim()}
          className="inline-flex items-center gap-1.5 rounded-full px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
          style={{ background: "linear-gradient(90deg, var(--icon-green), var(--icon-teal))" }}
        >
          Run loop <ArrowRight className="h-4 w-4" />
        </button>
      </form>

      {twin && twin.progress.loopsCompleted > 0 && (
        <FoodSystemMemoryPanel className="mt-4" twin={twin} />
      )}

      {/* Specialised systems — all inherit the foundation baseline */}
      <div className="mt-14">
        <h2 className="font-serif text-2xl font-semibold text-foreground">
          Specialised loops
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Each layers onto your You or Family baseline — none runs on its own.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {[...live, ...planned].map((s) => (
            <SystemCard key={s.key} system={s} />
          ))}
        </div>
      </div>

      <p className="mt-10 text-center text-xs leading-relaxed text-muted-foreground">
        {LOOP_DISCLAIMER}
      </p>
    </div>
  )
}
