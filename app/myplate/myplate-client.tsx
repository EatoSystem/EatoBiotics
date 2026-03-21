"use client"

import { useState, useEffect } from "react"
import { Utensils, Leaf, BookHeart } from "lucide-react"
import { PlateBuilder } from "@/components/app/plate-builder"
import { PlantTracker } from "@/components/app/plant-tracker"
import { JournalTracker } from "@/components/app/journal-tracker"
import { cn } from "@/lib/utils"
import { loadPlate, loadPlantTracker } from "@/lib/local-storage"
import { foods } from "@/lib/foods"
import { calculateBioticsScore, getScoreBand } from "@/lib/scoring"

type Tab = "plate" | "plants" | "journal"

const TABS: {
  key: Tab
  label: string
  shortLabel: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  color: string
}[] = [
  { key: "plate",   label: "My Plate",  shortLabel: "Plate",   icon: Utensils,   color: "var(--icon-lime)" },
  { key: "plants",  label: "Plants",    shortLabel: "Plants",  icon: Leaf,       color: "var(--icon-green)" },
  { key: "journal", label: "Journal",   shortLabel: "Journal", icon: BookHeart,  color: "var(--icon-orange)" },
]

function getTodayLabel() {
  return new Date().toLocaleDateString("en-IE", {
    weekday: "long",
    day: "numeric",
    month: "long",
  })
}

/* ── Mini score ring for the header ─────────────────────────────────── */

function MiniScoreRing({ score, color }: { score: number; color: string }) {
  const r = 22
  const circ = 2 * Math.PI * r
  const offset = circ - (score / 100) * circ
  return (
    <div className="relative flex shrink-0 items-center justify-center">
      <svg width="56" height="56" className="-rotate-90">
        <circle cx="28" cy="28" r={r} fill="none" stroke="currentColor" strokeWidth="4" className="text-border" />
        <circle
          cx="28" cy="28" r={r} fill="none"
          stroke={color} strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute text-center">
        <p className="text-sm font-bold tabular-nums leading-none" style={{ color }}>{score}</p>
      </div>
    </div>
  )
}

export function MyPlateClient() {
  const [activeTab, setActiveTab] = useState<Tab>("plate")
  const [headerScore, setHeaderScore] = useState(0)
  const [headerScoreColor, setHeaderScoreColor] = useState("var(--muted-foreground)")
  const [headerScoreLabel, setHeaderScoreLabel] = useState("Getting Started")
  const [plantCount, setPlantCount] = useState(0)

  // Load summary data for the Today header
  function refreshHeader() {
    const plate = loadPlate()
    const slugs = [...plate.fiber, ...plate.fermented, ...plate.protein, ...plate.fats]
    const foodObjects = slugs.map((s) => foods.find((f) => f.slug === s)).filter(Boolean) as typeof foods
    if (foodObjects.length > 0) {
      const result = calculateBioticsScore(foodObjects)
      setHeaderScore(result.score)
      setHeaderScoreColor(result.band.color)
      setHeaderScoreLabel(result.band.label)
    } else {
      setHeaderScore(0)
      setHeaderScoreColor("var(--muted-foreground)")
      setHeaderScoreLabel("No foods yet")
    }
    const tracker = loadPlantTracker()
    setPlantCount(tracker.plants.length)
  }

  useEffect(() => {
    refreshHeader()
  }, [])

  // Re-read header data whenever the tab changes (so switching back to Plate shows fresh score)
  function handleTabChange(tab: Tab) {
    setActiveTab(tab)
    refreshHeader()
  }

  return (
    <div className="min-h-screen bg-background">

      {/* ── Page header ─────────────────────────────────────────────── */}
      <div className="border-b border-border bg-background px-6 pt-24 pb-6">
        <div className="mx-auto max-w-2xl">

          {/* Date */}
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            {getTodayLabel()}
          </p>

          {/* Title row */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="font-serif text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                My Plate
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Your daily gut health toolkit
              </p>
              {/* Brand pills */}
              <div className="mt-3 flex gap-1.5">
                <div className="h-[5px] w-7 rounded-full bg-icon-lime" />
                <div className="h-[5px] w-7 rounded-full bg-icon-green" />
                <div className="h-[5px] w-7 rounded-full bg-icon-teal" />
                <div className="h-[5px] w-7 rounded-full bg-icon-yellow" />
                <div className="h-[5px] w-7 rounded-full bg-icon-orange" />
              </div>
            </div>

            {/* Today at a glance */}
            <div className="flex shrink-0 items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3">
              <MiniScoreRing score={headerScore} color={headerScoreColor} />
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Gut Score
                </p>
                <p className="mt-0.5 text-sm font-semibold" style={{ color: headerScoreColor }}>
                  {headerScoreLabel}
                </p>
                <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                  <Leaf size={10} className="text-icon-green" />
                  {plantCount} plant{plantCount !== 1 ? "s" : ""} this week
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Sticky tab bar ──────────────────────────────────────────── */}
      <div className="sticky top-[57px] z-40 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="mx-auto max-w-2xl px-6">
          <div className="flex gap-1 py-2">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.key
              return (
                <button
                  key={tab.key}
                  onClick={() => handleTabChange(tab.key)}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200",
                    isActive
                      ? "text-white shadow-sm"
                      : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                  )}
                  style={isActive ? { background: tab.color } : {}}
                >
                  <tab.icon size={14} />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.shortLabel}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Tab content ─────────────────────────────────────────────── */}
      <div className="mx-auto max-w-2xl px-6 py-8">
        {activeTab === "plate"   && <PlateBuilder onFoodsChange={refreshHeader} />}
        {activeTab === "plants"  && <PlantTracker onPlantsChange={refreshHeader} />}
        {activeTab === "journal" && <JournalTracker />}
      </div>

      {/* ── Footer hint ─────────────────────────────────────────────── */}
      <div className="mx-auto max-w-2xl px-6 pb-16 text-center">
        <p className="text-xs text-muted-foreground/50">
          Your data is saved locally in your browser.
        </p>
      </div>

    </div>
  )
}
