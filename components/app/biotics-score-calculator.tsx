"use client"

import { useState, useEffect } from "react"
import { type Food } from "@/lib/foods"
import { calculateBioticsScore, type ScoreResult } from "@/lib/scoring"
import { FoodSearch } from "./food-search"
import { X, Lightbulb, Sparkles } from "lucide-react"

const BIOTIC_LABELS: { key: keyof ScoreResult["breakdown"]; label: string; color: string }[] = [
  { key: "prebiotic", label: "Prebiotic", color: "var(--icon-lime)" },
  { key: "probiotic", label: "Probiotic", color: "var(--icon-teal)" },
  { key: "postbiotic", label: "Postbiotic", color: "var(--icon-orange)" },
  { key: "protein", label: "Protein", color: "var(--icon-yellow)" },
]

export function BioticsScoreCalculator() {
  const [selectedFoods, setSelectedFoods] = useState<Food[]>([])
  const [result, setResult] = useState<ScoreResult | null>(null)
  const [animatedScore, setAnimatedScore] = useState(0)

  useEffect(() => {
    const r = calculateBioticsScore(selectedFoods)
    setResult(r)

    // Animate score counter
    const target = r.score
    const duration = 800
    const steps = 40
    const increment = target / steps
    let current = 0
    const timer = setInterval(() => {
      current += increment
      if (current >= target) {
        setAnimatedScore(target)
        clearInterval(timer)
      } else {
        setAnimatedScore(Math.round(current))
      }
    }, duration / steps)
    return () => clearInterval(timer)
  }, [selectedFoods])

  function addFood(food: Food) {
    setSelectedFoods((prev) => [...prev, food])
  }

  function removeFood(slug: string) {
    setSelectedFoods((prev) => prev.filter((f) => f.slug !== slug))
  }

  function clearAll() {
    setSelectedFoods([])
  }

  const circumference = 2 * Math.PI * 58
  const progress = (animatedScore / 100) * circumference
  const maxBreakdown = result
    ? Math.max(result.breakdown.prebiotic, result.breakdown.probiotic, result.breakdown.postbiotic, result.breakdown.protein, 1)
    : 1

  return (
    <section className="px-6 py-20 md:py-28" id="score-calculator">
      <div className="mx-auto max-w-[1200px]">
        <p className="text-center text-xs font-semibold uppercase tracking-widest text-icon-lime">
          Try It Now
        </p>
        <h2 className="mt-4 text-center font-serif text-3xl font-semibold text-foreground sm:text-4xl md:text-5xl">
          Biotics Score Calculator
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-center text-sm leading-relaxed text-muted-foreground sm:text-base">
          Add the foods you ate today and see your live Biotics Score. Aim for 80+ by
          covering all three biotic types.
        </p>

        <div className="mt-12 grid gap-10 lg:grid-cols-2">
          {/* Left: search + selected foods */}
          <div>
            <FoodSearch
              onSelect={addFood}
              excludeSlugs={selectedFoods.map((f) => f.slug)}
              placeholder="Search and add foods…"
            />

            {/* Selected foods by biotic type */}
            <div className="mt-6 space-y-4">
              {selectedFoods.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                  <Sparkles size={20} className="mx-auto mb-2 text-icon-green" />
                  Add foods above to calculate your score
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-foreground">
                      {selectedFoods.length} food{selectedFoods.length !== 1 ? "s" : ""} selected
                    </p>
                    <button
                      onClick={clearAll}
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      Clear all
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedFoods.map((food) => (
                      <button
                        key={food.slug}
                        onClick={() => removeFood(food.slug)}
                        className="group flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-sm transition-colors hover:border-red-300 hover:bg-red-50 dark:hover:border-red-800 dark:hover:bg-red-950/30"
                      >
                        <span>{food.emoji}</span>
                        <span className="text-foreground">{food.name}</span>
                        <X
                          size={12}
                          className="text-muted-foreground group-hover:text-red-500"
                        />
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Suggestions */}
            {result && result.suggestions.length > 0 && selectedFoods.length > 0 && (
              <div className="mt-6 space-y-2">
                {result.suggestions.map((tip, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2.5 rounded-xl border border-border bg-muted/30 p-3"
                  >
                    <Lightbulb
                      size={14}
                      className="mt-0.5 flex-shrink-0 text-icon-yellow"
                    />
                    <p className="text-sm leading-relaxed text-muted-foreground">{tip}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: score ring + breakdown */}
          <div className="flex flex-col items-center">
            {/* Score ring */}
            <div className="relative h-44 w-44 sm:h-52 sm:w-52">
              <svg className="h-full w-full -rotate-90" viewBox="0 0 128 128">
                <circle
                  cx="64"
                  cy="64"
                  r="58"
                  fill="none"
                  stroke="var(--border)"
                  strokeWidth="5"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="58"
                  fill="none"
                  stroke={result?.band.color ?? "var(--border)"}
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference - progress}
                  className="transition-all duration-700 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-serif text-5xl font-semibold text-foreground">
                  {animatedScore}
                </span>
                <span className="text-xs text-muted-foreground">/ 100</span>
              </div>
            </div>

            {result && (
              <p
                className="mt-3 text-sm font-medium"
                style={{ color: result.band.color }}
              >
                {result.band.label}
              </p>
            )}

            {/* Breakdown bars */}
            <div className="mt-8 w-full max-w-xs space-y-3">
              {BIOTIC_LABELS.map(({ key, label, color }) => {
                const value = result?.breakdown[key] ?? 0
                const pct = maxBreakdown > 0 ? (value / maxBreakdown) * 100 : 0
                return (
                  <div key={key}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-foreground">{label}</span>
                      <span className="text-muted-foreground">{value} pts</span>
                    </div>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-border">
                      <div
                        className="h-full rounded-full transition-all duration-700 ease-out"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: color,
                        }}
                      />
                    </div>
                  </div>
                )
              })}

              {/* Bonuses */}
              {result && selectedFoods.length > 0 && (
                <div className="mt-4 flex gap-4 border-t border-border pt-4 text-xs text-muted-foreground">
                  <span>
                    Diversity{" "}
                    <span className="font-semibold text-foreground">
                      +{result.diversityBonus}
                    </span>
                  </span>
                  <span>
                    Plants{" "}
                    <span className="font-semibold text-foreground">
                      +{result.plantBonus}
                    </span>
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
