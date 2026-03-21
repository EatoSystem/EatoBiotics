"use client"

import { useState, useEffect, useCallback } from "react"
import { foods, type Food } from "@/lib/foods"
import {
  loadPlantTracker,
  savePlantTracker,
  clearPlantTracker,
  type PlantTrackerState,
} from "@/lib/local-storage"
import { FoodSearch } from "./food-search"
import { RotateCcw, PartyPopper, Plus, X } from "lucide-react"

function getFoodBySlug(slug: string): Food | undefined {
  return foods.find((f) => f.slug === slug)
}

export function PlantTracker({ onPlantsChange }: { onPlantsChange?: () => void }) {
  const [tracker, setTracker] = useState<PlantTrackerState | null>(null)
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    setTracker(loadPlantTracker())
  }, [])

  const updateTracker = useCallback(
    (newTracker: PlantTrackerState) => {
      setTracker(newTracker)
      savePlantTracker(newTracker)
      onPlantsChange?.()
    },
    [onPlantsChange]
  )

  function addPlant(food: Food) {
    if (!tracker) return
    if (tracker.plants.includes(food.slug)) return
    updateTracker({ ...tracker, plants: [...tracker.plants, food.slug] })
    setSearching(false)
  }

  function removePlant(slug: string) {
    if (!tracker) return
    updateTracker({ ...tracker, plants: tracker.plants.filter((s) => s !== slug) })
  }

  function handleReset() {
    clearPlantTracker()
    setTracker(loadPlantTracker())
    onPlantsChange?.()
  }

  if (!tracker) return null

  const count = tracker.plants.length
  const goal = 30
  const pct = Math.min((count / goal) * 100, 100)
  const isComplete = count >= goal

  return (
    <div>

      {/* ── Hero counter ──────────────────────────────────────────────── */}
      <div
        className="mb-6 rounded-2xl border-2 border-transparent p-6"
        style={{
          background:
            "linear-gradient(var(--background), var(--background)) padding-box, linear-gradient(135deg, var(--icon-lime), var(--icon-green)) border-box",
        }}
      >
        <div className="flex items-end justify-between gap-4 mb-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">
              Weekly Plant Challenge
            </p>
            <div className="flex items-baseline gap-2">
              <span
                className="font-serif text-7xl font-bold leading-none tabular-nums"
                style={{ color: isComplete ? "var(--icon-green)" : "var(--foreground)" }}
              >
                {count}
              </span>
              <span className="font-serif text-2xl text-muted-foreground">/ {goal}</span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">plants this week</p>
          </div>

          {count > 0 && (
            <button
              onClick={handleReset}
              className="flex shrink-0 items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
            >
              <RotateCcw size={11} />
              Reset
            </button>
          )}
        </div>

        {/* Progress bar */}
        <div className="h-3 overflow-hidden rounded-full bg-border/50">
          <div
            className="brand-gradient h-full rounded-full transition-all duration-700 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>

        {/* Status line */}
        <div className="mt-2">
          {isComplete ? (
            <div className="flex items-center gap-1.5 text-sm font-semibold" style={{ color: "var(--icon-green)" }}>
              <PartyPopper size={14} />
              Amazing! You hit 30 plants this week!
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              {goal - count} more plant{goal - count !== 1 ? "s" : ""} to reach your weekly goal
            </p>
          )}
        </div>
      </div>

      {/* ── Add plant section ─────────────────────────────────────────── */}
      {searching ? (
        <div className="mb-4">
          <FoodSearch
            onSelect={addPlant}
            excludeSlugs={tracker.plants}
            plantsOnly
            placeholder="Search plant foods…"
          />
        </div>
      ) : (
        <button
          onClick={() => setSearching(true)}
          className="mb-4 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[var(--icon-green)]/40 py-3.5 text-sm font-semibold transition-all hover:border-[var(--icon-green)] hover:bg-[var(--icon-green)]/5"
          style={{ color: "var(--icon-green)" }}
        >
          <Plus size={16} />
          Add a plant food
        </button>
      )}

      {/* ── Plant grid ───────────────────────────────────────────────── */}
      {count > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {tracker.plants.map((slug) => {
            const food = getFoodBySlug(slug)
            if (!food) return null
            return (
              <div
                key={slug}
                className="group relative flex flex-col items-center gap-1 rounded-2xl border border-border bg-card px-2 py-3 text-center transition-all hover:border-red-200 hover:bg-red-50/50"
              >
                <span className="text-2xl leading-none">{food.emoji}</span>
                <span className="text-[11px] font-medium leading-tight text-foreground/80">{food.name}</span>
                <button
                  onClick={() => removePlant(slug)}
                  className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full border border-border bg-background opacity-0 transition-opacity group-hover:opacity-100 hover:border-red-300 hover:bg-red-50"
                  aria-label={`Remove ${food.name}`}
                >
                  <X size={9} className="text-muted-foreground" />
                </button>
              </div>
            )
          })}
        </div>
      )}

      {count === 0 && !searching && (
        <div className="rounded-2xl border border-dashed border-border bg-secondary/10 p-8 text-center">
          <p className="text-2xl mb-2">🌱</p>
          <p className="text-sm font-medium text-foreground/70">No plants added yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Aim for 30 different plant foods each week to support a diverse microbiome.
          </p>
        </div>
      )}
    </div>
  )
}
