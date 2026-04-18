"use client"

import { Check, Lock, ArrowDown } from "lucide-react"
import type { AssessmentResult } from "@/lib/assessment-scoring"

/* ── Report Reframe ──────────────────────────────────────────────────────
   Shown between the free results content and the PaymentCTA.
   Makes the upgrade feel like "unlocking the rest of your report"
   not "buying something new."
────────────────────────────────────────────────────────────────────── */

const FREE_ITEMS = [
  "Your overall Food System Score",
  "All 5 pillar scores with what they mean",
  "Your personalised profile type",
  "Your key insight — the gap that matters most",
  "3 next actions from your weakest pillar",
  "Your gut starter pack (6 matched foods)",
]

const LOCKED_ITEMS = [
  "Pillar-by-pillar deep analysis — exactly why each score is where it is",
  "Your top 12 foods ranked by impact on your specific profile",
  "6 food recommendations per pillar (30 foods total)",
  "5 easy food swaps for your weakest pillar",
  "Your personalised 30-day rebuilding plan",
  "Food system habit tracker (print-ready)",
]

interface ReportReframeProps {
  result: AssessmentResult
}

export function ReportReframe({ result }: ReportReframeProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          You&apos;ve seen the what
        </p>
        <h3 className="mt-2 font-serif text-2xl font-semibold text-foreground sm:text-3xl text-balance">
          Now discover the{" "}
          <span style={{
            background: "linear-gradient(135deg, var(--icon-teal), var(--icon-green))",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}>
            why and exactly how
          </span>
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground max-w-md mx-auto">
          Your free score shows you where you stand. Your full report shows you what&apos;s driving each number — and precisely what to change.
        </p>
      </div>

      {/* Two columns: covered vs locked */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Free — what you got */}
        <div className="rounded-2xl border border-border bg-background p-5">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--icon-green)]/15">
              <Check size={13} style={{ color: "var(--icon-green)" }} />
            </div>
            <p className="text-xs font-bold uppercase tracking-widest text-[var(--icon-green)]">
              Your free report includes
            </p>
          </div>
          <ul className="space-y-2.5">
            {FREE_ITEMS.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-xs text-foreground/80">
                <Check size={12} className="mt-0.5 shrink-0 text-[var(--icon-green)]" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Locked — what's deeper */}
        <div className="rounded-2xl border border-dashed border-border bg-secondary/30 p-5">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted">
              <Lock size={12} className="text-muted-foreground" />
            </div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Full report unlocks
            </p>
          </div>
          <ul className="space-y-2.5">
            {LOCKED_ITEMS.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-xs text-muted-foreground/70">
                <Lock size={12} className="mt-0.5 shrink-0 text-muted-foreground/40" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Profile-specific hook */}
      <div
        className="rounded-2xl border p-5"
        style={{
          borderColor: `color-mix(in srgb, ${result.profile.color} 25%, transparent)`,
          background: `color-mix(in srgb, ${result.profile.color} 5%, transparent)`,
        }}
      >
        <div className="flex items-start gap-3">
          <div
            className="mt-0.5 h-2 w-2 shrink-0 rounded-full"
            style={{ backgroundColor: result.profile.color }}
          />
          <p className="text-sm leading-relaxed text-foreground">
            As a{" "}
            <span className="font-semibold" style={{ color: result.profile.color }}>
              {result.profile.type}
            </span>{" "}
            with a score of{" "}
            <span className="font-semibold" style={{ color: result.profile.color }}>
              {result.overall}/100
            </span>
            , your full report includes a 30-day plan built specifically around your
            weakest pillars — with the exact foods, in the right order, for your profile.
          </p>
        </div>
      </div>

      {/* Arrow down to tier cards */}
      <div className="flex justify-center">
        <div className="flex flex-col items-center gap-1 text-muted-foreground/40">
          <p className="text-xs font-medium">Choose your report below</p>
          <ArrowDown size={16} />
        </div>
      </div>
    </div>
  )
}
