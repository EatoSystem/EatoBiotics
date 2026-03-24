"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Check, Loader2 } from "lucide-react"

const GOALS = [
  "Digestive health and IBS management",
  "Immune system support",
  "Energy and fatigue reduction",
  "Mood and mental clarity",
  "Weight management",
  "Sleep improvement",
  "Skin health",
  "General gut health maintenance",
] as const

type Goal = (typeof GOALS)[number]

interface GoalsClientProps {
  initialGoals: string[]
}

export function GoalsClient({ initialGoals }: GoalsClientProps) {
  const [selected, setSelected] = useState<Set<Goal>>(
    new Set(initialGoals.filter((g): g is Goal => GOALS.includes(g as Goal)))
  )
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function toggle(goal: Goal) {
    setSaved(false)
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(goal)) {
        next.delete(goal)
      } else {
        next.add(goal)
      }
      return next
    })
  }

  async function save() {
    setSaving(true)
    setError(null)
    setSaved(false)

    try {
      const res = await fetch("/api/profile/goals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goals: Array.from(selected) }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { error?: string }
        throw new Error(data.error ?? "Failed to save")
      }

      setSaved(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Back */}
      <Link
        href="/account"
        className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft size={13} /> My Account
      </Link>

      {/* Header */}
      <div>
        <p className="mb-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Condition Calibration
        </p>
        <h1 className="font-serif text-3xl font-semibold tracking-tight text-foreground">
          Your health goals
        </h1>
        <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
          Select the areas you want to focus on. Your goals are injected into every meal analysis
          and AI consultation to give you personalised recommendations calibrated to your needs.
        </p>
      </div>

      {/* Goal grid */}
      <div className="grid gap-3 sm:grid-cols-2">
        {GOALS.map((goal) => {
          const isSelected = selected.has(goal)
          return (
            <button
              key={goal}
              onClick={() => toggle(goal)}
              className="flex items-center gap-3 rounded-2xl border p-4 text-left text-sm transition-all"
              style={{
                background: isSelected
                  ? "color-mix(in srgb, var(--icon-green) 8%, var(--card))"
                  : "var(--card)",
                borderColor: isSelected
                  ? "color-mix(in srgb, var(--icon-green) 40%, transparent)"
                  : "var(--border)",
              }}
            >
              <span
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-all"
                style={{
                  background: isSelected ? "var(--icon-green)" : "transparent",
                  borderColor: isSelected ? "var(--icon-green)" : "var(--border)",
                }}
              >
                {isSelected && <Check size={12} className="text-white" strokeWidth={3} />}
              </span>
              <span className="font-medium text-foreground">{goal}</span>
            </button>
          )
        })}
      </div>

      {/* Hint */}
      <p className="text-xs text-muted-foreground">
        You can select multiple goals. These are used to calibrate your analysis output and
        AI consultation responses. You can update them any time.
      </p>

      {/* Save */}
      <div className="flex items-center gap-4">
        <button
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          style={{ background: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))" }}
        >
          {saving ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              Saving…
            </>
          ) : (
            "Save Goals"
          )}
        </button>

        {saved && (
          <p className="flex items-center gap-1.5 text-sm font-medium" style={{ color: "var(--icon-green)" }}>
            <Check size={14} strokeWidth={3} />
            Saved
          </p>
        )}

        {error && (
          <p className="text-sm text-red-400">{error}</p>
        )}
      </div>
    </div>
  )
}
