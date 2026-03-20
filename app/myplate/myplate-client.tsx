"use client"

import { useState } from "react"
import { Utensils, Leaf, BarChart3 } from "lucide-react"
import { PlateBuilder } from "@/components/app/plate-builder"
import { PlantTracker } from "@/components/app/plant-tracker"
import { BioticsScoreCalculator } from "@/components/app/biotics-score-calculator"
import { cn } from "@/lib/utils"

type Tab = "plate" | "plants" | "score"

const TABS: {
  key: Tab
  label: string
  shortLabel: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  color: string
  dotColor: string
}[] = [
  {
    key: "plate",
    label: "Plate Builder",
    shortLabel: "Plate",
    icon: Utensils,
    color: "var(--icon-lime)",
    dotColor: "bg-icon-lime",
  },
  {
    key: "plants",
    label: "Plant Tracker",
    shortLabel: "Plants",
    icon: Leaf,
    color: "var(--icon-green)",
    dotColor: "bg-icon-green",
  },
  {
    key: "score",
    label: "Biotics Score",
    shortLabel: "Score",
    icon: BarChart3,
    color: "var(--icon-teal)",
    dotColor: "bg-icon-teal",
  },
]

function getTodayLabel() {
  return new Date().toLocaleDateString("en-IE", {
    weekday: "long",
    day: "numeric",
    month: "long",
  })
}

export function MyPlateClient() {
  const [activeTab, setActiveTab] = useState<Tab>("plate")

  const activeTabData = TABS.find((t) => t.key === activeTab)!

  return (
    <div className="min-h-screen bg-background">

      {/* ── Page header ─────────────────────────────────────────────── */}
      <div className="px-6 pt-24 pb-6">
        <div className="mx-auto max-w-2xl">

          {/* Date pill */}
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/40 px-3 py-1">
            <div
              className="h-1.5 w-1.5 rounded-full transition-all duration-500"
              style={{ backgroundColor: activeTabData.color }}
            />
            <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              {getTodayLabel()}
            </span>
          </div>

          {/* Title */}
          <h1 className="mt-3 font-serif text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            My Plate
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Your daily gut health toolkit — persists across visits.
          </p>

          {/* Brand pills */}
          <div className="mt-4 flex gap-2">
            <div className="h-[6px] w-9 rounded-full bg-icon-lime" />
            <div className="h-[6px] w-9 rounded-full bg-icon-green" />
            <div className="h-[6px] w-9 rounded-full bg-icon-teal" />
            <div className="h-[6px] w-9 rounded-full bg-icon-yellow" />
            <div className="h-[6px] w-9 rounded-full bg-icon-orange" />
          </div>
        </div>
      </div>

      {/* ── Sticky tab bar ──────────────────────────────────────────── */}
      <div className="sticky top-[57px] z-40 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="mx-auto max-w-2xl px-6">
          <div className="flex gap-1 py-2.5">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.key
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-foreground text-background shadow-sm"
                      : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                  )}
                >
                  <tab.icon size={13} />
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
        {activeTab === "plate" && <PlateBuilder />}
        {activeTab === "plants" && <PlantTracker />}
        {activeTab === "score" && <BioticsScoreCalculator />}
      </div>

      {/* ── Footer hint ─────────────────────────────────────────────── */}
      <div className="mx-auto max-w-2xl px-6 pb-16 text-center">
        <p className="text-xs text-muted-foreground/60">
          Your plate and plant data is saved locally in your browser.
        </p>
      </div>

    </div>
  )
}
