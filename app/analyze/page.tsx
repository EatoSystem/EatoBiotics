import type { Metadata } from "next"
import { Suspense } from "react"
import { Camera } from "lucide-react"
import { AnalyzeClient } from "./analyze-client"

export const metadata: Metadata = {
  title: "Meal Analysis",
  description: "Upload a photo of your meal and EatoBiotics identifies every food and scores it against the 3 biotics framework.",
}

export default function AnalysePage() {
  return (
    <div className="min-h-screen bg-background pt-24 pb-16">
      <div className="mx-auto max-w-xl px-6">

        {/* Header */}
        <div className="mb-8">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl" style={{ background: "color-mix(in srgb, var(--icon-teal) 15%, transparent)" }}>
              <Camera size={15} style={{ color: "var(--icon-teal)" }} />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              EatoBiotics — Meal Analysis
            </span>
          </div>
          <h1 className="font-serif text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Analyse your meal
          </h1>
          <p className="mt-2 text-base text-muted-foreground">
            Upload a photo and EatoBiotics identifies every food, scores your meal against the 3 biotics framework.
          </p>
        </div>

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
