"use client"

/**
 * DailyRitual — three one-tap check-ins + the 7-day rhythm bar.
 *
 * The habit heartbeat of the account: tap "Fermented food / 5+ plants /
 * Feeling good" and the Twin acknowledges instantly (tick pop + first-person
 * line). localStorage-first (lib/account/ritual) — no backend, works in the
 * demo. The rhythm bar shows the last 7 days as glowing nodes (meal signal or
 * completed ritual), with today pulsing.
 */

import { useEffect, useMemo, useState } from "react"
import { Check, Flame } from "lucide-react"
import {
  RITUAL_CHECKS,
  EMPTY_RITUAL,
  browserStore,
  dayKey,
  lastSevenDayKeys,
  loadRitual,
  saveRitual,
  ritualCount,
  ritualComplete,
  type RitualDay,
} from "@/lib/account/ritual"
import { hydrateTwinState, pushTwinState } from "@/lib/account/twin-state-sync"
import type { FoodSystemDigitalTwin } from "@/lib/agent-loop/twin/twin-types"

export function DailyRitual({ twin, streak = 0, authed = false }: { twin: FoodSystemDigitalTwin; streak?: number; authed?: boolean }) {
  const [ritual, setRitual] = useState<RitualDay>(EMPTY_RITUAL)
  const [ack, setAck] = useState<string | null>(null)
  const today = dayKey()

  useEffect(() => {
    setRitual(loadRitual(browserStore(), today))
    // Signed-in members: pull server-side ritual/milestone state so streaks
    // survive across devices (localStorage stays the live source of truth).
    if (authed) {
      void hydrateTwinState(browserStore()).then((todayChanged) => {
        if (todayChanged) setRitual(loadRitual(browserStore(), today))
      })
    }
  }, [today, authed])

  const toggle = (key: keyof RitualDay) => {
    const next = { ...ritual, [key]: !ritual[key] }
    setRitual(next)
    saveRitual(browserStore(), today, next)
    if (authed) pushTwinState(browserStore())
    if (next[key]) {
      const check = RITUAL_CHECKS.find((c) => c.key === key)
      setAck(check?.ack ?? null)
    } else {
      setAck(null)
    }
  }

  /* Which of the last 7 days count as "alive": a meal signal or a done ritual. */
  const mealDays = useMemo(() => {
    const days = new Set<string>()
    for (const o of twin.observations) {
      if (o.kind === "meal_description" || o.kind === "meal_photo") days.add(dayKey(new Date(o.createdAt)))
    }
    return days
  }, [twin])
  const weekKeys = lastSevenDayKeys()
  const store = typeof window !== "undefined" ? browserStore() : null

  const done = ritualCount(ritual)

  return (
    <section className="mx-auto max-w-5xl px-4 pt-8 md:px-8">
      <div className="mb-4">
        <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--icon-green)" }}>Daily ritual</p>
        <h3 className="mt-1 font-serif text-xl font-bold" style={{ color: "var(--foreground)" }}>
          {ritualComplete(ritual) ? "All three — your Twin felt that." : "Three taps. That's the whole habit."}
        </h3>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5" style={{ boxShadow: "0 2px 12px rgba(26,46,18,0.05)" }}>
        {/* the three check-ins */}
        <div className="grid gap-2.5 sm:grid-cols-3">
          {RITUAL_CHECKS.map((c) => {
            const on = ritual[c.key]
            return (
              <button
                key={c.key}
                type="button"
                onClick={() => toggle(c.key)}
                aria-pressed={on}
                className="flex items-center gap-3 rounded-xl px-4 py-3.5 text-left transition-all"
                style={{
                  background: on ? `color-mix(in srgb, ${c.color} 14%, white)` : "var(--muted)",
                  border: `1.5px solid ${on ? c.color : "var(--border)"}`,
                  boxShadow: on ? `0 4px 16px ${c.color}33` : "none",
                }}
              >
                <span
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white transition-transform"
                  style={{ background: on ? c.color : "color-mix(in srgb, var(--muted-foreground) 30%, white)", transform: on ? "scale(1.05)" : undefined }}
                >
                  {on && <Check size={13} className="eb-pop-in" />}
                </span>
                <span className="text-sm font-semibold" style={{ color: on ? "var(--foreground)" : "var(--muted-foreground)" }}>
                  {c.label}
                </span>
              </button>
            )
          })}
        </div>

        {/* the Twin's acknowledgement */}
        {ack && (
          <p key={ack} className="eb-pop-in mt-3 rounded-xl px-4 py-2.5 text-sm" style={{ background: "color-mix(in srgb, var(--icon-green) 7%, white)", border: "1px solid var(--border)", color: "var(--foreground)" }}>
            <span className="font-semibold" style={{ color: "var(--icon-green)" }}>Your Twin: </span>
            &ldquo;{ack}&rdquo;
          </p>
        )}

        {/* rhythm bar */}
        <div className="mt-5 flex flex-wrap items-center gap-4 border-t border-border pt-4">
          <div className="flex items-center gap-2">
            {weekKeys.map((k, i) => {
              const isToday = i === 6
              const alive = mealDays.has(k) || (isToday ? done > 0 : ritualCount(loadRitual(store, k)) > 0)
              const initial = "SMTWTFS"[new Date(`${k}T12:00:00`).getDay()]
              return (
                <div key={k} className="flex flex-col items-center gap-1">
                  <span className="relative flex h-5 w-5 items-center justify-center">
                    {isToday && <span className="eb-ping absolute inline-flex h-full w-full rounded-full" style={{ background: "var(--icon-green)", opacity: 0.4 }} />}
                    <span
                      className="relative inline-flex h-3.5 w-3.5 rounded-full"
                      style={{
                        background: alive ? "linear-gradient(135deg, #A8E063, #4CB648)" : "var(--muted)",
                        border: `1.5px solid ${alive ? "#4CB648" : "var(--border)"}`,
                        boxShadow: alive ? "0 0 8px rgba(76,182,72,0.5)" : "none",
                      }}
                    />
                  </span>
                  <span className="text-[9px] font-bold uppercase" style={{ color: isToday ? "var(--icon-green)" : "var(--muted-foreground)" }}>{initial}</span>
                </div>
              )
            })}
          </div>
          <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>Your last 7 days of signals</p>
          {streak >= 2 && (
            <span className="ml-auto inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold" style={{ background: "rgba(245,166,35,0.12)", border: "1px solid rgba(245,166,35,0.3)", color: "#a05a0a" }}>
              <Flame size={11} /> {streak}-day streak
            </span>
          )}
        </div>
      </div>
    </section>
  )
}
