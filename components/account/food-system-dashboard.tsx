/**
 * FoodSystemDashboard — the primary product surface at the top of the Account
 * overview. On sign-in this is the first thing a customer sees: the current state
 * of their living Food System, with one clear Next Best Action.
 *
 * It consumes the Food System Digital Twin (via the existing `useFoodSystemLoop`
 * hook over a server-derived baseline) — the single read model. Atomic widgets
 * are fed by the Twin through the composed cards. Deterministic, no persistence.
 */

"use client"

import Link from "next/link"
import { ArrowRight, Sparkles } from "lucide-react"
import type { FoodSystemBaseline } from "@/lib/agent-loop"
import {
  useFoodSystemLoop,
  FoodSystemLoopCard,
  FoodSystemMemoryPanel,
} from "@/components/agent-loop"

function NoBaselinePrompt() {
  return (
    <section className="overflow-hidden rounded-3xl border border-border bg-card">
      <div aria-hidden className="h-1.5 w-full" style={{ background: "linear-gradient(90deg, var(--icon-lime), var(--icon-green), var(--icon-teal), var(--icon-yellow), var(--icon-orange))" }} />
      <div className="p-6 text-center sm:p-10">
        <p className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-icon-green">
          <Sparkles className="h-3.5 w-3.5" /> Your Food System
        </p>
        <h2 className="font-serif text-2xl font-semibold text-foreground sm:text-3xl">
          Start your living Food System
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
          Complete your Food System assessment to set your baseline. From there, every
          meal, check-in, and update keeps improving your Food System over time.
        </p>
        <Link
          href="/assessment"
          className="mt-6 inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-base font-semibold text-white shadow-lg transition-transform hover:-translate-y-0.5"
          style={{ background: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))" }}
        >
          Start My Food System Baseline
          <ArrowRight className="h-5 w-5" />
        </Link>
      </div>
    </section>
  )
}

export function FoodSystemDashboard({
  baseline,
  firstName,
  className = "",
}: {
  baseline: FoodSystemBaseline | null
  firstName?: string | null
  className?: string
}) {
  const { twin, recordAndRefresh } = useFoodSystemLoop(baseline)

  if (!baseline) {
    return (
      <div className={className}>
        <NoBaselinePrompt />
      </div>
    )
  }

  return (
    <div className={className}>
      <div className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-icon-green">
          {firstName ? `${firstName}, this is your` : "This is your"} Food System
        </p>
        <h2 className="font-serif text-2xl font-semibold text-foreground sm:text-3xl">
          The current state of your Food System
        </h2>
      </div>

      {twin ? (
        <>
          <FoodSystemLoopCard
            twin={twin}
            onComplete={(id) => recordAndRefresh(id, "completed")}
            onSkip={(id) => recordAndRefresh(id, "ignored")}
          />
          {twin.progress.loopsCompleted > 0 && (
            <FoodSystemMemoryPanel className="mt-4" twin={twin} />
          )}
        </>
      ) : (
        <div className="rounded-3xl border border-border bg-card p-8 text-center text-muted-foreground">
          Loading your Food System…
        </div>
      )}
    </div>
  )
}
