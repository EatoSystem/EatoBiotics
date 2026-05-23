"use client"

import { useState } from "react"
import { Zap, Loader2, Leaf, ChevronDown, ChevronUp, RotateCcw, ArrowRight, AlertCircle, FlaskConical } from "lucide-react"
import { cn } from "@/lib/utils"

/* ── Types ──────────────────────────────────────────────────────────── */

type BioticsEmphasis = "balanced" | "prebiotic" | "probiotic" | "postbiotic"
type PlanPeriod = "single_day" | "full_week"
type PageState = "idle" | "loading" | "result" | "error"

interface Nutrition {
  calories: number
  fibre_g: number
  protein_g: number
  carbs_g: number
  fat_g: number
}

interface Meal {
  time: string
  name: string
  foods: string[]
  biotics: Array<"prebiotic" | "probiotic" | "postbiotic">
  tip?: string
  nutrition: Nutrition
}

interface DayData {
  day: string
  dailyTotals: Nutrition
  meals: Meal[]
}

interface SingleDayPlate {
  dayLabel: string
  bioticsEmphasis: BioticsEmphasis
  dailyTotals: Nutrition
  meals: Meal[]
  gutHealthInsight: string
  shoppingList: Record<string, string[]>
}

interface FullWeekPlate {
  weekLabel: string
  bioticsEmphasis: BioticsEmphasis
  days: DayData[]
  weeklyGutInsight: string
  shoppingList: Record<string, string[]>
}

/* ── Constants ──────────────────────────────────────────────────────── */

const BIOTIC_COLORS: Record<string, string> = {
  prebiotic: "var(--icon-green)",
  probiotic: "var(--icon-teal)",
  postbiotic: "var(--icon-orange)",
}

const BIOTIC_LABELS: Record<string, string> = {
  prebiotic: "Prebiotic",
  probiotic: "Probiotic",
  postbiotic: "Postbiotic",
}

const GOALS = [
  { id: "Gut Reset", emoji: "🔄", description: "Flush & rebalance your microbiome" },
  { id: "Immunity Boost", emoji: "🛡️", description: "Strengthen your gut-immune axis" },
  { id: "Energy & Mood", emoji: "⚡", description: "Feed your gut-brain connection" },
  { id: "Digestive Comfort", emoji: "🌿", description: "Ease bloating & improve transit" },
  { id: "Skin & Inflammation", emoji: "✨", description: "Calm inflammation from within" },
  { id: "General Wellness", emoji: "🌱", description: "Balanced everyday gut support" },
]

const DIETS = ["Omnivore", "Vegetarian", "Vegan", "Gluten-Free", "Dairy-Free"]

const EMPHASIS_OPTIONS: Array<{ id: BioticsEmphasis; label: string; color: string }> = [
  { id: "balanced", label: "Balanced", color: "var(--icon-green)" },
  { id: "prebiotic", label: "Prebiotic", color: "var(--icon-green)" },
  { id: "probiotic", label: "Probiotic", color: "var(--icon-teal)" },
  { id: "postbiotic", label: "Postbiotic", color: "var(--icon-orange)" },
]

const SHOPPING_ICONS: Record<string, string> = {
  "Fresh Produce": "🥦",
  "Proteins": "🍗",
  "Fermented & Dairy": "🥛",
  "Grains & Legumes": "🌾",
  "Pantry & Spices": "🫙",
}

const GRAD = "linear-gradient(135deg, var(--icon-lime), var(--icon-green))"
const GRAD_BORDER = `linear-gradient(var(--background), var(--background)) padding-box, linear-gradient(135deg, var(--icon-lime), var(--icon-green), var(--icon-teal), var(--icon-yellow)) border-box`

/* ── Sub-components ─────────────────────────────────────────────────── */

function MealCard({ meal }: { meal: Meal }) {
  const primary = meal.biotics[0] ?? "prebiotic"
  const color = BIOTIC_COLORS[primary]

  return (
    <div
      className="overflow-hidden rounded-2xl border-2"
      style={{
        borderColor: `color-mix(in srgb, ${color} 30%, transparent)`,
        boxShadow: `0 2px 16px color-mix(in srgb, ${color} 8%, transparent)`,
      }}
    >
      {/* Top stripe */}
      <div className="h-[3px] w-full" style={{ background: color }} />

      <div className="p-4">
        {/* Time badge + biotics pills */}
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span
            className="rounded-full px-2.5 py-0.5 text-[11px] font-bold"
            style={{
              background: `color-mix(in srgb, ${color} 15%, transparent)`,
              color,
            }}
          >
            {meal.time}
          </span>
          {meal.biotics.map((b) => (
            <span
              key={b}
              className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
              style={{
                background: `color-mix(in srgb, ${BIOTIC_COLORS[b]} 12%, transparent)`,
                color: BIOTIC_COLORS[b],
              }}
            >
              {BIOTIC_LABELS[b]}
            </span>
          ))}
        </div>

        {/* Meal name */}
        <h3 className="font-serif text-base font-semibold text-foreground">{meal.name}</h3>

        {/* Food pills */}
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {meal.foods.map((food) => (
            <span key={food} className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
              {food}
            </span>
          ))}
        </div>

        {/* Nutrition row */}
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
          <span>🔥 <strong className="text-foreground">{meal.nutrition.calories}</strong> kcal</span>
          <span style={{ color: "var(--icon-green)" }}>🌿 <strong>{meal.nutrition.fibre_g}g</strong> fibre</span>
          <span>💪 <strong className="text-foreground">{meal.nutrition.protein_g}g</strong> protein</span>
          <span>🌾 <strong className="text-foreground">{meal.nutrition.carbs_g}g</strong> carbs</span>
          <span>🥑 <strong className="text-foreground">{meal.nutrition.fat_g}g</strong> fat</span>
        </div>

        {/* Tip */}
        {meal.tip && (
          <div
            className="mt-3 rounded-xl border-l-2 py-2 pl-3 pr-2 text-[11px] leading-relaxed text-muted-foreground"
            style={{
              borderColor: "var(--icon-green)",
              background: "color-mix(in srgb, var(--icon-green) 6%, transparent)",
            }}
          >
            {meal.tip}
          </div>
        )}
      </div>
    </div>
  )
}

function DailyTotalsCard({ totals }: { totals: Nutrition }) {
  return (
    <div
      className="rounded-2xl border-2 border-transparent p-4"
      style={{ background: GRAD_BORDER }}
    >
      <p className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">Daily Totals</p>
      <div className="grid grid-cols-5 gap-2 text-center">
        {[
          { label: "Calories", value: `${totals.calories}`, unit: "kcal", color: "var(--foreground)" },
          { label: "Fibre", value: `${totals.fibre_g}g`, unit: "key metric", color: "var(--icon-green)", highlight: true },
          { label: "Protein", value: `${totals.protein_g}g`, unit: "", color: "var(--foreground)" },
          { label: "Carbs", value: `${totals.carbs_g}g`, unit: "", color: "var(--foreground)" },
          { label: "Fat", value: `${totals.fat_g}g`, unit: "", color: "var(--foreground)" },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-xl py-2.5"
            style={{
              background: s.highlight
                ? "color-mix(in srgb, var(--icon-green) 10%, transparent)"
                : "color-mix(in srgb, var(--foreground) 4%, transparent)",
            }}
          >
            <p className="font-serif text-base font-bold" style={{ color: s.color }}>
              {s.value}
            </p>
            <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">{s.label}</p>
            {s.highlight && (
              <p className="text-[8px] font-bold uppercase" style={{ color: "var(--icon-green)" }}>Gut Key</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function BioticsCompositionBar({ meals }: { meals: Meal[] }) {
  const counts = { prebiotic: 0, probiotic: 0, postbiotic: 0 }
  for (const meal of meals) {
    for (const b of meal.biotics) {
      if (b in counts) counts[b as keyof typeof counts]++
    }
  }
  const total = counts.prebiotic + counts.probiotic + counts.postbiotic || 1
  const pcts = {
    prebiotic: Math.round((counts.prebiotic / total) * 100),
    probiotic: Math.round((counts.probiotic / total) * 100),
    postbiotic: Math.round((counts.postbiotic / total) * 100),
  }

  return (
    <div className="rounded-2xl border bg-card p-4">
      <p className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">Biotics Composition</p>
      <div className="flex h-3 w-full overflow-hidden rounded-full">
        {(["prebiotic", "probiotic", "postbiotic"] as const).map((b) => (
          <div
            key={b}
            className="h-full transition-all duration-500"
            style={{ width: `${pcts[b]}%`, background: BIOTIC_COLORS[b] }}
          />
        ))}
      </div>
      <div className="mt-2 flex gap-4">
        {(["prebiotic", "probiotic", "postbiotic"] as const).map((b) => (
          <div key={b} className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: BIOTIC_COLORS[b] }} />
            <span className="text-[10px] font-medium text-muted-foreground">
              {BIOTIC_LABELS[b]} <strong className="text-foreground">{pcts[b]}%</strong>
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function GutHealthInsight({ insight }: { insight: string }) {
  return (
    <div
      className="flex gap-3 rounded-2xl border-l-4 p-4"
      style={{
        borderColor: "var(--icon-green)",
        background: "color-mix(in srgb, var(--icon-green) 6%, transparent)",
      }}
    >
      <Leaf size={16} className="mt-0.5 shrink-0" style={{ color: "var(--icon-green)" }} />
      <div>
        <p className="mb-1 text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--icon-green)" }}>
          Food System Insight
        </p>
        <p className="text-sm leading-relaxed text-foreground">{insight}</p>
      </div>
    </div>
  )
}

function ShoppingList({ list }: { list: Record<string, string[]> }) {
  const [open, setOpen] = useState(false)
  const totalItems = Object.values(list).reduce((acc, arr) => acc + arr.length, 0)

  return (
    <div
      className="rounded-2xl border-2 border-transparent"
      style={{ background: GRAD_BORDER }}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3.5"
      >
        <div className="flex items-center gap-2">
          <span className="text-base">🛒</span>
          <span className="font-serif text-sm font-semibold text-foreground">Shopping List</span>
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-bold"
            style={{
              background: "color-mix(in srgb, var(--icon-green) 15%, transparent)",
              color: "var(--icon-green)",
            }}
          >
            {totalItems} items
          </span>
        </div>
        {open ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
      </button>

      {open && (
        <div className="border-t border-border px-4 pb-4 pt-3">
          {Object.entries(list).map(([category, items]) => (
            items.length > 0 && (
              <div key={category} className="mb-4 last:mb-0">
                <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                  {SHOPPING_ICONS[category] ?? "📦"} {category}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {items.map((item) => (
                    <span key={item} className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )
          ))}
        </div>
      )}
    </div>
  )
}

/* ── Demo mock data ─────────────────────────────────────────────────── */

const DEMO_DATA: SingleDayPlate = {
  dayLabel: "Gut Reset — Omnivore (Demo)",
  bioticsEmphasis: "balanced",
  dailyTotals: { calories: 1920, fibre_g: 36, protein_g: 82, carbs_g: 225, fat_g: 65 },
  meals: [
    {
      time: "8:00am",
      name: "Gut-Friendly Overnight Oats",
      foods: ["Overnight oats", "Kefir", "Banana", "Flaxseeds"],
      biotics: ["prebiotic", "probiotic"],
      tip: "Kefir delivers live cultures — stir in cold, never heat it.",
      nutrition: { calories: 420, fibre_g: 9, protein_g: 18, carbs_g: 62, fat_g: 11 },
    },
    {
      time: "1:00pm",
      name: "Prebiotic Grain Bowl",
      foods: ["Brown rice", "Roasted garlic chickpeas", "Leek", "Kimchi"],
      biotics: ["prebiotic", "probiotic", "postbiotic"],
      tip: "Cooled brown rice develops resistant starch — a postbiotic powerhouse.",
      nutrition: { calories: 560, fibre_g: 14, protein_g: 22, carbs_g: 78, fat_g: 16 },
    },
    {
      time: "7:00pm",
      name: "Miso-Glazed Salmon with Asparagus",
      foods: ["Salmon fillet", "Miso paste", "Asparagus", "Quinoa"],
      biotics: ["probiotic", "prebiotic"],
      tip: "Add miso after removing from heat — boiling kills the live cultures.",
      nutrition: { calories: 640, fibre_g: 9, protein_g: 38, carbs_g: 52, fat_g: 28 },
    },
    {
      time: "3:30pm",
      name: "Gut Boost Snack",
      foods: ["Live yogurt", "Blueberries", "Dark chocolate 70%"],
      biotics: ["probiotic", "postbiotic"],
      tip: "Dark chocolate polyphenols feed Bifidobacterium — a true postbiotic boost.",
      nutrition: { calories: 300, fibre_g: 4, protein_g: 4, carbs_g: 33, fat_g: 10 },
    },
  ],
  gutHealthInsight:
    "A Gut Reset plate centres on diversity and fermentation. Today's meals hit all 3 biotics — kefir, kimchi, and miso deliver live cultures while oats, asparagus, and leeks nourish the microbiome with prebiotic fibres.",
  shoppingList: {
    "Fresh Produce": ["Bananas", "Asparagus", "Leeks", "Blueberries"],
    "Proteins": ["Salmon fillet", "Chickpeas"],
    "Fermented & Dairy": ["Kefir", "Kimchi", "Miso paste", "Live yogurt"],
    "Grains & Legumes": ["Oats", "Brown rice", "Quinoa"],
    "Pantry & Spices": ["Flaxseeds", "Dark chocolate 70%", "Olive oil"],
  },
}

/* ── Main component ─────────────────────────────────────────────────── */

export default function PlateCreatorClient({ demoMode = false }: { demoMode?: boolean }) {
  const [goal, setGoal] = useState("")
  const [diet, setDiet] = useState("Omnivore")
  const [period, setPeriod] = useState<PlanPeriod>("single_day")
  const [emphasis, setEmphasis] = useState<BioticsEmphasis>("balanced")
  const [pageState, setPageState] = useState<PageState>(demoMode ? "result" : "idle")
  const [result, setResult] = useState<SingleDayPlate | FullWeekPlate | null>(demoMode ? DEMO_DATA : null)
  const [error, setError] = useState("")
  const [activeDay, setActiveDay] = useState(0)

  /* ── Generate ─────────────────────────────────────────────── */

  async function handleGenerate() {
    if (!goal) return
    setPageState("loading")
    setError("")
    setActiveDay(0)

    try {
      const res = await fetch("/api/create-plate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goal,
          dietaryPreference: diet,
          bioticsEmphasis: emphasis,
          planPeriod: period,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error((data as { error?: string }).error ?? "Failed to generate plate")
      }

      const data = await res.json()
      setResult(data as SingleDayPlate | FullWeekPlate)
      setPageState("result")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
      setPageState("error")
    }
  }

  /* ── Loading ──────────────────────────────────────────────── */

  if (pageState === "loading") {
    return (
      <div className="flex flex-col items-center gap-5 py-20 text-center">
        <div
          className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-transparent"
          style={{ background: GRAD_BORDER }}
        >
          <Loader2 size={28} className="animate-spin" style={{ color: "var(--icon-green)" }} />
        </div>
        <div>
          <p className="font-serif text-lg font-semibold text-foreground">Building your plate…</p>
          <p className="mt-1 text-sm text-muted-foreground">Creating {goal} plan</p>
        </div>
      </div>
    )
  }

  /* ── Error ────────────────────────────────────────────────── */

  if (pageState === "error") {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <div
          className="flex h-14 w-14 items-center justify-center rounded-2xl"
          style={{ background: "color-mix(in srgb, var(--destructive) 10%, transparent)" }}
        >
          <AlertCircle size={24} style={{ color: "var(--destructive)" }} />
        </div>
        <div>
          <p className="font-serif text-base font-semibold text-foreground">Something went wrong</p>
          <p className="mt-1 text-sm text-muted-foreground">{error}</p>
        </div>
        <button
          onClick={() => setPageState("idle")}
          className="rounded-full border border-border px-5 py-2 text-sm font-semibold text-foreground transition hover:bg-secondary"
        >
          Try Again
        </button>
      </div>
    )
  }

  /* ── Results ──────────────────────────────────────────────── */

  if (pageState === "result" && result) {
    const isFull = "days" in result
    const fullResult = isFull ? (result as FullWeekPlate) : null
    const singleResult = !isFull ? (result as SingleDayPlate) : null

    const currentDayData = fullResult ? fullResult.days[activeDay] : null
    const mealsToShow = singleResult ? singleResult.meals : currentDayData?.meals ?? []
    const totalsToShow = singleResult ? singleResult.dailyTotals : currentDayData?.dailyTotals

    return (
      <div className="space-y-5">
        {/* Demo banner */}
        {demoMode && (
          <div
            className="flex items-start gap-3 rounded-2xl border px-4 py-3.5"
            style={{
              background: "color-mix(in srgb, var(--icon-teal) 8%, transparent)",
              borderColor: "color-mix(in srgb, var(--icon-teal) 30%, transparent)",
            }}
          >
            <FlaskConical size={16} className="mt-0.5 shrink-0" style={{ color: "var(--icon-teal)" }} />
            <div>
              <p className="text-xs font-bold" style={{ color: "var(--icon-teal)" }}>Demo Mode</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                This is a sample Gut Reset plate. Sign up for a paid EatoBiotics plan to generate your own personalised plates.
              </p>
            </div>
            <a
              href="/pricing"
              className="ml-auto shrink-0 rounded-full px-3 py-1 text-[11px] font-bold text-white"
              style={{ background: "var(--icon-teal)" }}
            >
              Get Access
            </a>
          </div>
        )}

        {/* Header */}
        <div className="text-center">
          <p className="font-serif text-xl font-bold text-foreground">
            {isFull ? fullResult!.weekLabel : singleResult!.dayLabel}
          </p>
        </div>

        {/* Full-week day tabs */}
        {isFull && fullResult && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {fullResult.days.map((d, i) => (
              <button
                key={d.day}
                onClick={() => setActiveDay(i)}
                className={cn(
                  "flex-shrink-0 rounded-full border-2 px-3 py-1.5 text-xs font-semibold transition-all",
                  activeDay === i ? "border-transparent text-foreground" : "border-border text-muted-foreground hover:border-border/80"
                )}
                style={
                  activeDay === i
                    ? { background: GRAD_BORDER }
                    : {}
                }
              >
                {d.day.slice(0, 3)}
              </button>
            ))}
          </div>
        )}

        {/* Meal cards */}
        <div className="space-y-4">
          {mealsToShow.map((meal, i) => (
            <MealCard key={`${meal.name}-${i}`} meal={meal} />
          ))}
        </div>

        {/* Daily totals */}
        {totalsToShow && <DailyTotalsCard totals={totalsToShow} />}

        {/* Biotics composition bar */}
        {mealsToShow.length > 0 && <BioticsCompositionBar meals={mealsToShow} />}

        {/* Food system insight */}
        {singleResult && <GutHealthInsight insight={singleResult.gutHealthInsight} />}
        {fullResult && activeDay === 0 && (
          <GutHealthInsight insight={fullResult.weeklyGutInsight} />
        )}

        {/* Shopping list */}
        <ShoppingList list={result.shoppingList} />

        {/* Weekly insight (below shopping list for subsequent days) */}
        {fullResult && activeDay > 0 && (
          <GutHealthInsight insight={fullResult.weeklyGutInsight} />
        )}

        {/* CTAs */}
        <div className="flex flex-col gap-3 pt-2 sm:flex-row">
          {demoMode ? (
            <a
              href="/pricing"
              className="flex flex-1 items-center justify-center gap-2 rounded-full py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
              style={{ background: GRAD }}
            >
              Get a Paid Plan to Generate Your Plate
              <ArrowRight size={14} />
            </a>
          ) : (
            <>
              <button
                onClick={() => { setPageState("idle"); setResult(null) }}
                className="flex flex-1 items-center justify-center gap-2 rounded-full border border-border py-2.5 text-sm font-semibold text-foreground transition hover:bg-secondary"
              >
                <RotateCcw size={14} />
                Create Another Plate
              </button>
              <a
                href="/analyse"
                className="flex flex-1 items-center justify-center gap-2 rounded-full py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
                style={{ background: GRAD }}
              >
                Analyse a Meal
                <ArrowRight size={14} />
              </a>
            </>
          )}
        </div>
      </div>
    )
  }

  /* ── Form (idle) ──────────────────────────────────────────── */

  return (
    <div className="space-y-8">
      {/* 1. Goal */}
      <div>
        <p className="mb-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">Step 1</p>
        <h2 className="font-serif text-lg font-semibold text-foreground">What&apos;s your goal?</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {GOALS.map((g) => {
            const selected = goal === g.id
            return (
              <button
                key={g.id}
                onClick={() => setGoal(g.id)}
                className={cn(
                  "rounded-2xl border p-4 text-left transition-all duration-150",
                  selected ? "shadow-sm" : "hover:shadow-sm hover:scale-[1.01]"
                )}
                style={{
                  background: selected
                    ? "color-mix(in srgb, var(--icon-green) 8%, var(--card))"
                    : "var(--card)",
                  borderColor: selected
                    ? "color-mix(in srgb, var(--icon-green) 45%, transparent)"
                    : "var(--border)",
                }}
              >
                <span className="mb-2 block text-2xl">{g.emoji}</span>
                <p className="text-sm font-semibold text-foreground">{g.id}</p>
                <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{g.description}</p>
              </button>
            )
          })}
        </div>
      </div>

      {/* 2. Dietary preference */}
      <div>
        <p className="mb-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">Step 2</p>
        <h2 className="font-serif text-lg font-semibold text-foreground">Dietary preference</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {DIETS.map((d) => {
            const selected = diet === d
            return (
              <button
                key={d}
                onClick={() => setDiet(d)}
                className="rounded-full border px-4 py-1.5 text-sm font-medium transition-all"
                style={{
                  background: selected
                    ? "color-mix(in srgb, var(--icon-lime) 15%, transparent)"
                    : "transparent",
                  borderColor: selected
                    ? "color-mix(in srgb, var(--icon-green) 50%, transparent)"
                    : "var(--border)",
                  color: selected ? "var(--icon-green)" : "var(--muted-foreground)",
                  fontWeight: selected ? 600 : 400,
                }}
              >
                {d}
              </button>
            )
          })}
        </div>
      </div>

      {/* 3. Plan period */}
      <div>
        <p className="mb-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">Step 3</p>
        <h2 className="font-serif text-lg font-semibold text-foreground">How long?</h2>
        <div className="mt-3 grid grid-cols-2 gap-3">
          {[
            { id: "single_day" as PlanPeriod, emoji: "📅", label: "Today's Plate", sub: "Single optimised day" },
            { id: "full_week" as PlanPeriod, emoji: "🗓️", label: "Full Week", sub: "7-day rolling plan" },
          ].map((opt) => {
            const selected = period === opt.id
            return (
              <button
                key={opt.id}
                onClick={() => setPeriod(opt.id)}
                className="rounded-2xl border-2 border-transparent p-4 text-left transition-all duration-150"
                style={
                  selected
                    ? { background: GRAD_BORDER }
                    : {
                        background: "var(--card)",
                        border: "2px solid var(--border)",
                      }
                }
              >
                <span className="mb-2 block text-2xl">{opt.emoji}</span>
                <p className="text-sm font-semibold text-foreground">{opt.label}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">{opt.sub}</p>
              </button>
            )
          })}
        </div>
      </div>

      {/* 4. Biotics emphasis */}
      <div>
        <p className="mb-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">Step 4 — Optional</p>
        <h2 className="font-serif text-lg font-semibold text-foreground">Biotics emphasis</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {EMPHASIS_OPTIONS.map((opt) => {
            const selected = emphasis === opt.id
            return (
              <button
                key={opt.id}
                onClick={() => setEmphasis(opt.id)}
                className="rounded-full border px-4 py-1.5 text-sm transition-all"
                style={{
                  background: selected
                    ? `color-mix(in srgb, ${opt.color} 12%, transparent)`
                    : "transparent",
                  borderColor: selected
                    ? `color-mix(in srgb, ${opt.color} 50%, transparent)`
                    : "var(--border)",
                  color: selected ? opt.color : "var(--muted-foreground)",
                  fontWeight: selected ? 600 : 400,
                }}
              >
                {opt.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Generate button */}
      <button
        onClick={handleGenerate}
        disabled={!goal}
        className={cn(
          "flex w-full items-center justify-center gap-2 rounded-full py-3.5 text-sm font-semibold text-white transition-all",
          goal ? "hover:opacity-90" : "cursor-not-allowed opacity-40"
        )}
        style={{ background: GRAD }}
      >
        <Zap size={16} />
        Build My Gut Plate →
      </button>
    </div>
  )
}
