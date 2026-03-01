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
import { Leaf, RotateCcw, PartyPopper } from "lucide-react"

function getFoodBySlug(slug: string): Food | undefined {
  return foods.find((f) => f.slug === slug)
}

export function PlantTracker() {
  const [tracker, setTracker] = useState<PlantTrackerState | null>(null)

  useEffect(() => {
    setTracker(loadPlantTracker())
  }, [])

  const updateTracker = useCallback((newTracker: PlantTrackerState) => {
    setTracker(newTracker)
    savePlantTracker(newTracker)
  }, [])

  function addPlant(food: Food) {
    if (!tracker) return
    if (tracker.plants.includes(food.slug)) return
    const updated = {
      ...tracker,
      plants: [...tracker.plants, food.slug],
    }
    updateTracker(updated)
  }

  function removePlant(slug: string) {
    if (!tracker) return
    const updated = {
      ...tracker,
      plants: tracker.plants.filter((s) => s !== slug),
    }
    updateTracker(updated)
  }

  function handleReset() {
    clearPlantTracker()
    setTracker(loadPlantTracker())
  }

  if (!tracker) return null // SSR guard

  const count = tracker.plants.length
  const goal = 30
  const pct = Math.min(Math.round((count / goal) * 100), 100)
  const isComplete = count >= goal

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="font-serif text-xl font-semibold text-foreground sm:text-2xl">
            30-Plant Tracker
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Track your plant diversity this week
          </p>
        </div>
        {count > 0 && (
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <RotateCcw size={12} />
            Reset
          </button>
        )}
      </div>

      {/* Counter */}
      <div className="mb-6 flex items-baseline gap-2">
        <span className="font-serif text-4xl font-semibold text-foreground">{count}</span>
        <span className="text-lg text-muted-foreground">/ {goal}</span>
        <span className="ml-1 text-sm text-muted-foreground">plants this week</span>
      </div>

      {/* Progress bar */}
      <div className="mb-6">
        <div className="h-3 overflow-hidden rounded-full bg-border">
          <div
            className="brand-gradient h-full rounded-full transition-all duration-500 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
        {isComplete ? (
          <div className="mt-3 flex items-center gap-2 text-sm font-medium text-icon-green">
            <PartyPopper size={16} />
            Amazing! You hit 30 plants this week!
          </div>
        ) : (
          <p className="mt-2 text-xs text-muted-foreground">
            {goal - count} more plant{goal - count !== 1 ? "s" : ""} to reach your weekly goal
          </p>
        )}
      </div>

      {/* Search */}
      <FoodSearch
        onSelect={addPlant}
        excludeSlugs={tracker.plants}
        plantsOnly
        placeholder="Add a plant…"
      />

      {/* Plant grid */}
      {count > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {tracker.plants.map((slug) => {
            const food = getFoodBySlug(slug)
            if (!food) return null
            return (
              <button
                key={slug}
                onClick={() => removePlant(slug)}
                className="group flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs transition-colors hover:border-red-300 hover:bg-red-50 dark:hover:border-red-800 dark:hover:bg-red-950/30"
              >
                <Leaf size={10} className="text-icon-green group-hover:text-red-400" />
                <span>{food.emoji}</span>
                <span className="text-foreground">{food.name}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
