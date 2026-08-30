"use client"

import Link from "next/link"
import { ArrowRight, FileText, Zap } from "lucide-react"
import { MEMBER_PRICE_EUR } from "@/lib/membership-tiers"

/* ── Report Bridge Card ──────────────────────────────────────────────────
   Shown on the Overview tab when a user has a paid report but is on the free
   subscription tier. Bridges "I paid for a report" and "I should continue."

   This card used to branch three ways into a retired ladder — Grow €9.99,
   Restore €49, Transform €99 — chosen by which report the person holds. All
   three are legacy entitlements now, not offers, and "Restore — €49/mo" sat one
   card away from the €49 ONE-TIME Consultation the person had just bought.

   The continuation is a single product: EatoBiotics Member. The report a person
   already owns still keeps its delivered name in the receipt row above, because
   renaming a delivered artefact would misdescribe what they paid for.
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

const MEMBER_BRIDGE = {
  headline: "Your report showed you the system — now keep building it",
  body:     "You paid to understand how your Food System works. EatoBiotics Member keeps it moving: your Biotics Score™ tracked month by month, ongoing food guidance, and a new focus each month.",
  cta:      `Continue as an EatoBiotics Member — €${MEMBER_PRICE_EUR}/month`,
} as const

export function ReportBridgeCard({ reportTier, reportDate, profileType }: ReportBridgeCardProps) {
  const bridge = MEMBER_BRIDGE
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
          href="/pricing?feature=member"
          className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:opacity-90"
          style={{ background: "linear-gradient(135deg, var(--icon-lime), var(--icon-green), var(--icon-teal))" }}
        >
          {bridge.cta} <ArrowRight size={13} />
        </Link>
      </div>
    </div>
  )
}
