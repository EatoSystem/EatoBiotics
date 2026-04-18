"use client"

import Link from "next/link"
import { ArrowRight, FileText, Zap } from "lucide-react"

/* ── Report Bridge Card ──────────────────────────────────────────────────
   Shown on the Overview tab when a user has a paid deep-dive report
   but is on the free subscription tier. Bridges the gap between
   "I paid for a report" and "I should subscribe for ongoing support."
────────────────────────────────────────────────────────────────────── */

interface ReportBridgeCardProps {
  reportTier: string   // "starter" | "full" | "premium"
  reportDate: string   // ISO date
  profileType: string | null
}

const TIER_LABELS: Record<string, string> = {
  starter: "Starter",
  full:    "Full",
  premium: "Premium",
}

const SUBSCRIPTION_BRIDGE: Record<string, { headline: string; body: string; cta: string; tier: string }> = {
  starter: {
    headline: "Your report gave you the diagnosis — now build the habit",
    body:     "Your Starter report identified your key gaps. A Grow subscription turns that into a daily practice — meal tracking, score movement, and a streak to build on.",
    cta:      "See Grow — €9.99/mo",
    tier:     "grow",
  },
  full: {
    headline: "Your Full Report found the root cause — now fix it",
    body:     "You paid to understand your system. A Restore subscription gives you the monthly gut plan and pillar-specific protocols to act on what your report revealed.",
    cta:      "See Restore — €49/mo",
    tier:     "restore",
  },
  premium: {
    headline: "Your Premium Report is a blueprint — let's build on it",
    body:     "Your Premium deep-dive gave you a full picture. Transform membership adds unlimited EatoBiotic consultations and weekly check-ins — turning your report into a living, evolving plan.",
    cta:      "See Transform — €99/mo",
    tier:     "transform",
  },
}

export function ReportBridgeCard({ reportTier, reportDate, profileType }: ReportBridgeCardProps) {
  const bridge = SUBSCRIPTION_BRIDGE[reportTier] ?? SUBSCRIPTION_BRIDGE.starter
  const tierLabel = TIER_LABELS[reportTier] ?? "Paid"

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-IE", { day: "numeric", month: "long", year: "numeric" })
  }

  return (
    <div className="rounded-2xl border border-border bg-background overflow-hidden">
      <div
        className="h-1 w-full"
        style={{ background: "linear-gradient(90deg, var(--icon-teal), var(--icon-green), var(--icon-lime))" }}
      />

      <div className="p-5">
        {/* Report receipt row */}
        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-border">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
            style={{ background: "color-mix(in srgb, var(--icon-teal) 12%, transparent)" }}
          >
            <FileText size={16} style={{ color: "var(--icon-teal)" }} />
          </div>
          <div>
            <p className="text-xs font-bold text-foreground">
              {tierLabel} Report{profileType ? ` · ${profileType}` : ""}
            </p>
            <p className="text-[10px] text-muted-foreground">Purchased {formatDate(reportDate)}</p>
          </div>
          <div
            className="ml-auto rounded-full px-2.5 py-1 text-[10px] font-semibold text-white"
            style={{ background: "var(--icon-teal)" }}
          >
            Deep Dive ✓
          </div>
        </div>

        {/* Bridge message */}
        <div className="mb-4">
          <div className="flex items-center gap-1.5 mb-2">
            <Zap size={13} style={{ color: "var(--icon-yellow)" }} />
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">What&apos;s next</p>
          </div>
          <h3 className="font-serif text-base font-semibold text-foreground leading-snug mb-2">
            {bridge.headline}
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {bridge.body}
          </p>
        </div>

        {/* CTA */}
        <Link
          href={`/pricing?feature=${bridge.tier}`}
          className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:opacity-90"
          style={{ background: "linear-gradient(135deg, var(--icon-lime), var(--icon-green), var(--icon-teal))" }}
        >
          {bridge.cta} <ArrowRight size={13} />
        </Link>
      </div>
    </div>
  )
}
