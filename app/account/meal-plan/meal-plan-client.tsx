"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, ChevronDown, ShoppingCart, Sparkles, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"

/* ── Types ───────────────────────────────────────────────────────────── */

interface MealItem {
  name: string
  description: string
  score: number
}

interface DayPlan {
  day: string
  breakfast: MealItem
  lunch: MealItem
  dinner: MealItem
  snack: MealItem
}

interface ShoppingCategory {
  category: string
  items: string[]
}

interface MealPlan {
  meals: DayPlan[]
  shopping_list: ShoppingCategory[]
  summary: string
  biotics_score_avg: number
  week_starting: string
}

/* ── Score badge ─────────────────────────────────────────────────────── */

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 70 ? "var(--icon-green)" : score >= 50 ? "var(--icon-yellow)" : "var(--icon-orange)"
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums"
      style={{
        background: `color-mix(in srgb, ${color} 15%, transparent)`,
        color,
        border: `1px solid color-mix(in srgb, ${color} 30%, transparent)`,
      }}
    >
      {score}
    </span>
  )
}

/* ── Meal row ────────────────────────────────────────────────────────── */

function MealRow({
  label,
  meal,
}: {
  label: string
  meal: MealItem
}) {
  return (
    <div className="flex items-start justify-between gap-3 py-2.5 border-b last:border-0 border-border/50">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</span>
          <ScoreBadge score={meal.score} />
        </div>
        <p className="text-sm font-semibold text-foreground">{meal.name}</p>
        <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{meal.description}</p>
      </div>
    </div>
  )
}

/* ── Day card ────────────────────────────────────────────────────────── */

function DayCard({ day }: { day: DayPlan }) {
  const [open, setOpen] = useState(false)
  const avg = Math.round(
    (day.breakfast.score + day.lunch.score + day.dinner.score + day.snack.score) / 4
  )

  return (
    <div className="overflow-hidden rounded-2xl border bg-card">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between p-4 text-left hover:bg-muted/20 transition-colors"
      >
        <div className="flex items-center gap-3">
          <ScoreBadge score={avg} />
          <p className="font-semibold text-foreground">{day.day}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden sm:flex gap-1 text-xs text-muted-foreground">
            {[day.breakfast, day.lunch, day.dinner].map((m, i) => (
              <span key={i} className="truncate max-w-[80px]">{m.name.split(" ").slice(0, 2).join(" ")}</span>
            ))}
          </span>
          <ChevronDown
            size={16}
            className={cn("shrink-0 text-muted-foreground transition-transform", open && "rotate-180")}
          />
        </div>
      </button>

      {open && (
        <div className="border-t border-border px-4 pb-2">
          <MealRow label="Breakfast" meal={day.breakfast} />
          <MealRow label="Lunch" meal={day.lunch} />
          <MealRow label="Dinner" meal={day.dinner} />
          <MealRow label="Snack" meal={day.snack} />
        </div>
      )}
    </div>
  )
}

/* ── Shopping list ───────────────────────────────────────────────────── */

function ShoppingList({ categories }: { categories: ShoppingCategory[] }) {
  const [open, setOpen] = useState(false)
  const totalItems = categories.reduce((acc, c) => acc + c.items.length, 0)

  return (
    <div className="overflow-hidden rounded-2xl border bg-card">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between p-4 text-left hover:bg-muted/20 transition-colors"
      >
        <div className="flex items-center gap-2">
          <ShoppingCart size={16} style={{ color: "var(--icon-teal)" }} />
          <p className="font-semibold text-foreground">Shopping List</p>
          <span className="text-xs text-muted-foreground">({totalItems} items)</span>
        </div>
        <ChevronDown
          size={16}
          className={cn("shrink-0 text-muted-foreground transition-transform", open && "rotate-180")}
        />
      </button>

      {open && (
        <div className="border-t border-border p-4 grid gap-4 sm:grid-cols-2">
          {categories.filter((c) => c.items.length > 0).map((cat) => (
            <div key={cat.category}>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                {cat.category}
              </p>
              <ul className="space-y-1">
                {cat.items.map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-foreground">
                    <span
                      className="h-1.5 w-1.5 rounded-full shrink-0"
                      style={{ background: "var(--icon-lime)" }}
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ── Main component ──────────────────────────────────────────────────── */

export function MealPlanClient({
  initialPlan,
  membershipTier,
}: {
  initialPlan: MealPlan | null
  membershipTier: string
}) {
  const [plan, setPlan] = useState<MealPlan | null>(initialPlan)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function generatePlan() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/meal-plan/generate", { method: "POST" })
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Request failed" })) as { error?: string }
        throw new Error(data.error ?? "Failed to generate plan")
      }
      const data = await res.json() as MealPlan
      setPlan(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  const weekLabel = plan?.week_starting
    ? new Date(plan.week_starting + "T00:00:00").toLocaleDateString("en-IE", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      {/* Back */}
      <Link
        href="/account"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft size={14} /> My Account
      </Link>

      {/* Header */}
      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "var(--icon-lime)" }}>
          {membershipTier === "transform" ? "Transform" : "Restore"} Feature
        </p>
        <h1 className="font-serif text-3xl font-semibold text-foreground mb-2">
          Weekly Meal Plan
        </h1>
        <p className="text-muted-foreground leading-relaxed text-sm">
          Your personalised 7-day food system plan, built around your scores and designed to strengthen your weakest pillar.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div
          className="mb-4 rounded-2xl p-4 text-sm"
          style={{
            background: "color-mix(in srgb, var(--icon-orange) 10%, var(--card))",
            border: "1px solid color-mix(in srgb, var(--icon-orange) 30%, transparent)",
            color: "var(--icon-orange)",
          }}
        >
          {error}
        </div>
      )}

      {/* No plan yet */}
      {!plan && !loading && (
        <div className="rounded-2xl border bg-card p-8 text-center">
          <div
            className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{ background: "color-mix(in srgb, var(--icon-lime) 15%, transparent)" }}
          >
            <Sparkles size={24} style={{ color: "var(--icon-lime)" }} />
          </div>
          <h2 className="font-serif text-xl font-semibold text-foreground mb-2">
            No plan for this week yet
          </h2>
          <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
            Generate your personalised 7-day meal plan based on your Biotics Score and health goals.
          </p>
          <button
            onClick={generatePlan}
            className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))" }}
          >
            <Sparkles size={14} /> Generate this week&apos;s plan
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="rounded-2xl border bg-card p-8 text-center">
          <div
            className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-muted border-t-transparent"
            style={{ borderTopColor: "var(--icon-green)" }}
          />
          <p className="text-sm text-muted-foreground">Building your personalised plan…</p>
          <p className="text-xs text-muted-foreground/60 mt-1">This takes about 15 seconds</p>
        </div>
      )}

      {/* Plan exists */}
      {plan && !loading && (
        <div className="space-y-4">
          {/* Summary */}
          <div
            className="rounded-2xl p-4"
            style={{
              background: "color-mix(in srgb, var(--icon-lime) 8%, var(--card))",
              border: "1px solid color-mix(in srgb, var(--icon-lime) 20%, var(--border))",
            }}
          >
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-0.5">
                  Week of {weekLabel}
                </p>
                <div className="flex items-center gap-2">
                  <span className="font-serif text-3xl font-bold" style={{ color: "var(--icon-green)" }}>
                    {plan.biotics_score_avg}
                  </span>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                      Avg Score
                    </p>
                    <p className="text-[10px] text-muted-foreground/60">/100</p>
                  </div>
                </div>
              </div>
              <button
                onClick={generatePlan}
                className="flex items-center gap-1.5 text-xs font-semibold rounded-full px-3 py-1.5 border transition-colors hover:bg-muted/30"
                style={{ color: "var(--icon-green)" }}
              >
                <RefreshCw size={11} /> Regenerate
              </button>
            </div>
            <p className="text-sm text-foreground leading-relaxed">{plan.summary}</p>
          </div>

          {/* Day cards */}
          <div className="space-y-2">
            {plan.meals.map((day) => (
              <DayCard key={day.day} day={day} />
            ))}
          </div>

          {/* Shopping list */}
          {plan.shopping_list && plan.shopping_list.length > 0 && (
            <ShoppingList categories={plan.shopping_list} />
          )}
        </div>
      )}
    </div>
  )
}
