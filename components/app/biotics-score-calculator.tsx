"use client"

import { useState, useEffect } from "react"
import { type Food } from "@/lib/foods"
import { calculateBioticsScore, type ScoreResult } from "@/lib/scoring"
import { FoodSearch } from "./food-search"
import { X, Lightbulb, Sparkles, Leaf, Zap } from "lucide-react"

const BIOTIC_LABELS: {
  key: keyof ScoreResult["breakdown"]
  label: string
  color: string
  gradient: string
  emoji: string
}[] = [
  {
    key: "prebiotic",
    label: "Prebiotic",
    color: "var(--icon-lime)",
    gradient: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))",
    emoji: "🌱",
  },
  {
    key: "probiotic",
    label: "Probiotic",
    color: "var(--icon-teal)",
    gradient: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))",
    emoji: "🦠",
  },
  {
    key: "postbiotic",
    label: "Postbiotic",
    color: "var(--icon-orange)",
    gradient: "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange))",
    emoji: "✨",
  },
  {
    key: "protein",
    label: "Protein",
    color: "var(--icon-yellow)",
    gradient: "linear-gradient(135deg, var(--icon-orange), var(--icon-yellow))",
    emoji: "💪",
  },
]

const BIOTIC_COLOR_MAP: Record<string, string> = {
  prebiotic: "border-icon-lime/40 bg-icon-lime/5",
  probiotic: "border-icon-teal/40 bg-icon-teal/5",
  postbiotic: "border-icon-orange/40 bg-icon-orange/5",
  protein: "border-icon-yellow/40 bg-icon-yellow/5",
  all: "border-border bg-muted/30",
}

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

  return (
    <section className="relative overflow-hidden px-6 py-20 md:py-28" id="score-calculator">
      {/* ── Floating decorative elements ─────────────────────────── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* Gradient pills */}
        <div
          className="absolute -top-4 left-[3%] h-5 w-40 rotate-[-30deg] rounded-full opacity-15"
          style={{ background: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))" }}
        />
        <div
          className="absolute top-[12%] right-[5%] h-5 w-32 rotate-[20deg] rounded-full opacity-12"
          style={{ background: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))" }}
        />
        <div
          className="absolute bottom-[15%] left-[1%] h-5 w-36 rotate-[45deg] rounded-full opacity-15"
          style={{ background: "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange))" }}
        />
        <div
          className="absolute right-[3%] bottom-[8%] h-5 w-44 rotate-[-15deg] rounded-full opacity-12"
          style={{ background: "linear-gradient(135deg, var(--icon-orange), var(--icon-yellow))" }}
        />
        <div
          className="absolute top-[45%] left-[8%] h-6 w-24 rotate-[60deg] rounded-full opacity-10"
          style={{ background: "linear-gradient(135deg, var(--icon-teal), var(--icon-green))" }}
        />
        <div
          className="absolute top-[30%] right-[12%] h-5 w-28 rotate-[-40deg] rounded-full opacity-10"
          style={{ background: "linear-gradient(135deg, var(--icon-lime), var(--icon-teal))" }}
        />
        {/* Circles */}
        <div className="absolute top-[10%] left-[14%] h-7 w-7 rounded-full bg-icon-lime opacity-12" />
        <div className="absolute top-[25%] right-[8%] h-5 w-5 rounded-full bg-icon-orange opacity-12" />
        <div className="absolute bottom-[25%] right-[18%] h-8 w-8 rounded-full bg-icon-yellow opacity-8" />
        <div className="absolute bottom-[12%] left-[16%] h-4 w-4 rounded-full bg-icon-teal opacity-12" />
        <div className="absolute top-[60%] left-[6%] h-6 w-6 rounded-full bg-icon-green opacity-8" />
      </div>

      <div className="relative z-10 mx-auto max-w-[1200px]">
        {/* ── Header with gradient accent ─────────────────────────── */}
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{ background: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))" }}
          >
            <Zap size={26} className="text-white" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-widest text-icon-lime">
            Try It Now
          </p>
          <h2 className="mt-4 font-serif text-3xl font-semibold text-foreground sm:text-4xl md:text-5xl">
            Biotics Score Calculator
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Add the foods you ate today and see your live Biotics Score. Aim for 80+ by
            covering all three biotic types.
          </p>
          {/* Biotic pills */}
          <div className="mt-5 flex items-center justify-center gap-1 sm:gap-1.5">
            <span className="biotic-pill bg-icon-lime" />
            <span className="biotic-pill bg-icon-green" />
            <span className="biotic-pill bg-icon-teal" />
            <span className="biotic-pill bg-icon-yellow" />
            <span className="biotic-pill bg-icon-orange" />
          </div>
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-5 lg:gap-10">
          {/* ── Left: search + selected foods (3 cols) ─────────── */}
          <div className="lg:col-span-3">
            <div className="rounded-2xl border border-border bg-background p-5 shadow-sm sm:p-6">
              {/* Search with gradient top bar */}
              <div className="relative">
                <div
                  className="absolute -top-5 left-4 right-4 h-1.5 rounded-full sm:-top-6 sm:left-6 sm:right-6"
                  style={{
                    background:
                      "linear-gradient(90deg, var(--icon-lime), var(--icon-green), var(--icon-teal), var(--icon-yellow), var(--icon-orange))",
                  }}
                />
                <FoodSearch
                  onSelect={addFood}
                  excludeSlugs={selectedFoods.map((f) => f.slug)}
                  placeholder="Search and add foods…"
                />
              </div>

              {/* Selected foods */}
              <div className="mt-6">
                {selectedFoods.length === 0 ? (
                  <div className="relative overflow-hidden rounded-xl border border-dashed border-border p-8 text-center">
                    {/* Subtle gradient bg */}
                    <div
                      className="absolute inset-0 opacity-[0.03]"
                      style={{
                        background:
                          "radial-gradient(ellipse at center, var(--icon-green), transparent 70%)",
                      }}
                    />
                    <div className="relative">
                      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-icon-green/10">
                        <Sparkles size={22} className="text-icon-green" />
                      </div>
                      <p className="text-sm font-medium text-foreground">
                        Start building your score
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Search for foods above — try &ldquo;garlic&rdquo;, &ldquo;yoghurt&rdquo;, or &ldquo;salmon&rdquo;
                      </p>
                      {/* Quick-start food emojis */}
                      <div className="mt-4 flex items-center justify-center gap-2 text-xl">
                        <span className="opacity-40">🧄</span>
                        <span className="opacity-30">🫐</span>
                        <span className="opacity-40">🥛</span>
                        <span className="opacity-30">🐟</span>
                        <span className="opacity-40">🫒</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-foreground">
                        {selectedFoods.length} food{selectedFoods.length !== 1 ? "s" : ""}{" "}
                        selected
                      </p>
                      <button
                        onClick={clearAll}
                        className="rounded-full px-3 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      >
                        Clear all
                      </button>
                    </div>

                    {/* Food chips — colour-coded by biotic type */}
                    <div className="mt-3 flex flex-wrap gap-2">
                      {selectedFoods.map((food) => {
                        const bioticClass =
                          BIOTIC_COLOR_MAP[food.biotic] ?? BIOTIC_COLOR_MAP.all
                        return (
                          <button
                            key={food.slug}
                            onClick={() => removeFood(food.slug)}
                            className={`group flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-all hover:border-red-300 hover:bg-red-50 dark:hover:border-red-800 dark:hover:bg-red-950/30 ${bioticClass}`}
                          >
                            <span>{food.emoji}</span>
                            <span className="font-medium text-foreground">{food.name}</span>
                            <X
                              size={12}
                              className="text-muted-foreground group-hover:text-red-500"
                            />
                          </button>
                        )
                      })}
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
                      className="flex items-start gap-2.5 rounded-xl border border-icon-yellow/20 bg-icon-yellow/5 p-3"
                    >
                      <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-icon-yellow/20">
                        <Lightbulb size={11} className="text-icon-yellow" />
                      </div>
                      <p className="text-sm leading-relaxed text-muted-foreground">{tip}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Right: score ring + breakdown (2 cols) ─────────── */}
          <div className="lg:col-span-2">
            <div className="relative overflow-hidden rounded-2xl border border-border bg-background p-6 shadow-sm">
              {/* Gradient top bar */}
              <div
                className="absolute top-0 right-0 left-0 h-1.5"
                style={{
                  background:
                    "linear-gradient(90deg, var(--icon-lime), var(--icon-green), var(--icon-teal), var(--icon-yellow), var(--icon-orange))",
                }}
              />

              {/* Radial glow behind score ring */}
              <div
                className="absolute top-8 right-1/2 h-48 w-48 translate-x-1/2 rounded-full opacity-[0.06]"
                style={{
                  background: `radial-gradient(circle, ${result?.band.color ?? "var(--icon-green)"}, transparent 70%)`,
                }}
              />

              <div className="relative flex flex-col items-center pt-4">
                {/* Score ring */}
                <div className="relative h-44 w-44 sm:h-48 sm:w-48">
                  <svg className="h-full w-full -rotate-90" viewBox="0 0 128 128">
                    {/* Track */}
                    <circle
                      cx="64"
                      cy="64"
                      r="58"
                      fill="none"
                      stroke="var(--border)"
                      strokeWidth="5"
                    />
                    {/* Progress — gradient stroke */}
                    <circle
                      cx="64"
                      cy="64"
                      r="58"
                      fill="none"
                      stroke="url(#calcScoreGradient)"
                      strokeWidth="5"
                      strokeLinecap="round"
                      strokeDasharray={circumference}
                      strokeDashoffset={circumference - progress}
                      className="transition-all duration-700 ease-out"
                    />
                    <defs>
                      <linearGradient
                        id="calcScoreGradient"
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="100%"
                      >
                        <stop offset="0%" stopColor="var(--icon-lime)" />
                        <stop offset="33%" stopColor="var(--icon-teal)" />
                        <stop offset="66%" stopColor="var(--icon-yellow)" />
                        <stop offset="100%" stopColor="var(--icon-orange)" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="font-serif text-5xl font-semibold text-foreground">
                      {animatedScore}
                    </span>
                    <span className="text-xs text-muted-foreground">/ 100</span>
                  </div>
                </div>

                {/* Band label */}
                {result && (
                  <div className="mt-3 flex items-center gap-2">
                    <div
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: result.band.color }}
                    />
                    <p
                      className="text-sm font-semibold"
                      style={{ color: result.band.color }}
                    >
                      {result.band.label}
                    </p>
                  </div>
                )}

                {/* Breakdown bars */}
                <div className="mt-8 w-full space-y-3">
                  {BIOTIC_LABELS.map(({ key, label, color, gradient, emoji }) => {
                    const value = result?.breakdown[key] ?? 0
                    // Scale bars relative to a reasonable max (e.g. 20pts)
                    const pct = Math.min((value / 20) * 100, 100)
                    return (
                      <div key={key}>
                        <div className="flex items-center justify-between text-xs">
                          <span className="flex items-center gap-1.5 font-medium text-foreground">
                            <span className="text-sm">{emoji}</span>
                            {label}
                          </span>
                          <span
                            className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                            style={{
                              backgroundColor: `color-mix(in srgb, ${color} 15%, transparent)`,
                              color,
                            }}
                          >
                            {value} pts
                          </span>
                        </div>
                        <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-border/60">
                          <div
                            className="h-full rounded-full transition-all duration-700 ease-out"
                            style={{
                              width: `${pct}%`,
                              background: gradient,
                            }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Bonus badges */}
                {result && selectedFoods.length > 0 && (
                  <div className="mt-6 flex w-full gap-3">
                    <div className="flex flex-1 items-center gap-2 rounded-xl border border-icon-green/20 bg-icon-green/5 p-3">
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-icon-green/15">
                        <Sparkles size={14} className="text-icon-green" />
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground">Diversity</p>
                        <p className="text-sm font-bold text-icon-green">
                          +{result.diversityBonus}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-1 items-center gap-2 rounded-xl border border-icon-teal/20 bg-icon-teal/5 p-3">
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-icon-teal/15">
                        <Leaf size={14} className="text-icon-teal" />
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground">Plants</p>
                        <p className="text-sm font-bold text-icon-teal">
                          +{result.plantBonus}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
