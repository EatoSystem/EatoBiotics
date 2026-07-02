"use client"

/**
 * MeetTwinChecklist — the day-one experience, in the Twin's voice.
 *
 * Shown inside the TwinStage cockpit (via its `sparse` slot) when the Twin has
 * fewer than 3 observations: a guided "help me get to know you" first-week
 * path instead of a sparkline it can't draw yet. States derive from the twin +
 * today's ritual (localStorage) — no backend.
 */

import { useEffect, useState } from "react"
import Link from "next/link"
import { Check } from "lucide-react"
import { browserStore, dayKey, loadRitual, ritualCount } from "@/lib/account/ritual"
import type { FoodSystemDigitalTwin } from "@/lib/agent-loop/twin/twin-types"

export function MeetTwinChecklist({ twin, addMealHref = "/analyse" }: { twin: FoodSystemDigitalTwin; addMealHref?: string }) {
  const [ritualDone, setRitualDone] = useState(false)
  useEffect(() => {
    setRitualDone(ritualCount(loadRitual(browserStore(), dayKey())) > 0)
  }, [])

  const hasMeal = twin.observations.some((o) => o.kind === "meal_description" || o.kind === "meal_photo")

  const steps: { label: string; done: boolean; href?: string }[] = [
    { label: "I've read your assessment — we've met", done: true },
    { label: "Show me a meal — any meal", done: hasMeal, href: addMealHref },
    { label: "Tell me about today (the three taps below)", done: ritualDone },
    { label: "Come back tomorrow — that's when I start seeing patterns", done: false },
  ]

  return (
    <div className="eb-reveal max-w-sm rounded-xl p-4 backdrop-blur" style={{ background: "rgba(253,251,247,0.06)", border: "1px solid rgba(253,251,247,0.16)", animationDelay: "650ms" }}>
      <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#A8E063" }}>Help me get to know you</p>
      <ul className="mt-2.5 space-y-2">
        {steps.map((s) => {
          const row = (
            <span className="flex items-start gap-2.5">
              <span
                className="mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full"
                style={{
                  background: s.done ? "linear-gradient(135deg, #A8E063, #4CB648)" : "rgba(253,251,247,0.1)",
                  border: s.done ? "none" : "1px solid rgba(253,251,247,0.3)",
                }}
              >
                {s.done && <Check size={11} color="#0B1607" strokeWidth={3} />}
              </span>
              <span className="text-[13px] leading-snug" style={{ color: s.done ? "rgba(253,251,247,0.55)" : "rgba(253,251,247,0.9)", textDecoration: s.done ? "line-through" : "none" }}>
                {s.label}
              </span>
            </span>
          )
          return (
            <li key={s.label}>
              {s.href && !s.done ? (
                <Link href={s.href} className="block rounded-lg transition-colors hover:bg-white/5">{row}</Link>
              ) : (
                row
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
