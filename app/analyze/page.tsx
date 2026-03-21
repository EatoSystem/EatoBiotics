import type { Metadata } from "next"
import { Suspense } from "react"
import { Camera } from "lucide-react"
import { AnalyzeClient } from "./analyze-client"
import { GradientText } from "@/components/gradient-text"

export const metadata: Metadata = {
  title: "Meal Analysis",
  description: "Upload a photo of your meal and EatoBiotics identifies every food and scores it against the 3 biotics framework.",
}

export default function AnalysePage() {
  return (
    <div className="min-h-screen bg-background">

      {/* Hero section */}
      <div className="relative overflow-hidden border-b border-border bg-background pt-24 pb-12">

        {/* Subtle background gradient wash */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{ background: "radial-gradient(ellipse 80% 60% at 50% 0%, var(--icon-green), transparent)" }}
        />

        <div className="relative mx-auto max-w-2xl px-6">

          {/* Decorative biotic pill strip */}
          <div className="mb-6 flex items-center gap-2">
            <div className="h-1.5 w-10 rounded-full" style={{ background: "var(--icon-lime)" }} />
            <div className="h-1.5 w-6 rounded-full" style={{ background: "var(--icon-green)" }} />
            <div className="h-1.5 w-4 rounded-full" style={{ background: "var(--icon-teal)" }} />
          </div>

          {/* Badge */}
          <div className="mb-4 flex items-center gap-2">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-xl"
              style={{ background: "color-mix(in srgb, var(--icon-teal) 15%, transparent)" }}
            >
              <Camera size={15} style={{ color: "var(--icon-teal)" }} />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              EatoBiotics — Meal Analysis
            </span>
          </div>

          {/* Heading */}
          <h1 className="font-serif text-4xl font-semibold tracking-tight sm:text-5xl">
            <GradientText>Analyse your meal</GradientText>
          </h1>

          {/* Description */}
          <p className="mt-3 max-w-lg text-base text-muted-foreground leading-relaxed">
            Upload a photo and EatoBiotics identifies every food on your plate, scores your meal
            against the 3 biotics framework, and suggests how to boost it.
          </p>

          {/* Feature chips */}
          <div className="mt-5 flex flex-wrap gap-2">
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold"
              style={{
                background: "color-mix(in srgb, var(--icon-lime) 15%, transparent)",
                color: "var(--icon-lime)",
              }}
            >
              🌱 Identifies every food
            </span>
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold"
              style={{
                background: "color-mix(in srgb, var(--icon-green) 15%, transparent)",
                color: "var(--icon-green)",
              }}
            >
              📊 Scores vs the 3 biotics
            </span>
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold"
              style={{
                background: "color-mix(in srgb, var(--icon-teal) 15%, transparent)",
                color: "var(--icon-teal)",
              }}
            >
              💡 Suggests improvements
            </span>
          </div>
        </div>
      </div>

      {/* Section divider */}
      <div className="section-divider" />

      {/* Main content */}
      <div className="mx-auto max-w-2xl px-6 py-10">
        <Suspense fallback={<div className="h-64 rounded-2xl border border-dashed border-border animate-pulse" />}>
          <AnalyzeClient />
        </Suspense>

        <p className="mt-6 text-center text-xs text-muted-foreground/60">
          Photos are not stored
        </p>
      </div>
    </div>
  )
}
