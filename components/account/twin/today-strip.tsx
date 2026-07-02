"use client"

/**
 * TodayStrip — "Today with your Twin", the daily ritual bar.
 *
 * A slim dark bar that sits directly above the TwinStage and blends into it:
 * time-of-day greeting by name, streak flame, whether today's meal has reached
 * the Twin yet (derived from twin.observations), and a one-tap Add-meal action.
 * Turns the account from a report you read into a habit you keep.
 */

import Link from "next/link"
import { Flame, Plus, Check } from "lucide-react"
import { WeekStoryButton } from "./week-story"
import type { FoodSystemDigitalTwin } from "@/lib/agent-loop/twin/twin-types"

function greeting(): string {
  const h = new Date().getHours()
  if (h < 12) return "Good morning"
  if (h < 18) return "Good afternoon"
  return "Good evening"
}

function mealLoggedToday(twin: FoodSystemDigitalTwin): boolean {
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  return twin.observations.some(
    (o) => (o.kind === "meal_description" || o.kind === "meal_photo") && o.createdAt >= start.getTime(),
  )
}

export function TodayStrip({
  twin,
  firstName,
  streak = 0,
  addMealHref = "/analyse",
  showStory = false,
}: {
  twin: FoodSystemDigitalTwin
  firstName: string | null
  streak?: number
  addMealHref?: string
  /** Force the "Your Week Inside" chip (demo); otherwise it shows Mon–Wed. */
  showStory?: boolean
}) {
  const logged = mealLoggedToday(twin)
  const dow = new Date().getDay()
  const storyReady = showStory || (dow >= 1 && dow <= 3)

  return (
    <div style={{ background: "#0B1607", borderBottom: "1px solid rgba(253,251,247,0.08)" }}>
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 md:px-8">
        <p className="text-sm font-semibold" style={{ color: "rgba(253,251,247,0.9)" }}>
          {greeting()}{firstName ? `, ${firstName}` : ""}.
        </p>

        {streak >= 2 && (
          <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold" style={{ background: "rgba(245,166,35,0.14)", border: "1px solid rgba(245,166,35,0.35)", color: "#F5C518" }}>
            <Flame size={11} /> {streak}-day streak
          </span>
        )}

        <span className="inline-flex items-center gap-1.5 text-xs" style={{ color: logged ? "#A8E063" : "rgba(253,251,247,0.55)" }}>
          {logged ? (
            <>
              <Check size={12} /> Today&apos;s meal reached your Twin
            </>
          ) : (
            "Your Twin is waiting for today's first meal"
          )}
        </span>

        <span className="ml-auto flex shrink-0 items-center gap-2">
          {storyReady && <WeekStoryButton twin={twin} variant="dark" />}
          <Link
            href={addMealHref}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors hover:bg-white/10"
            style={{ border: "1px solid rgba(168,224,99,0.5)", color: "#A8E063" }}
          >
            <Plus size={12} /> Add meal
          </Link>
        </span>
      </div>
    </div>
  )
}
