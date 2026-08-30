"use client"

import Link from "next/link"
import { ArrowRight, Sparkles } from "lucide-react"
import { getIdentityLabel } from "@/lib/identity-labels"
import { getPercentile } from "@/lib/percentile"

/* ── Free Scan Upsell ────────────────────────────────────────────────────
   Shown at the bottom of meal analysis results when the user is on the free
   tier. This viewer is typically anonymous and has scored ONE MEAL — nothing
   here implies they have completed a Food System Assessment, let alone bought
   a Consultation.

   So the next step is the free Food System Assessment, not a subscription.
   This CTA used to read "Unlock daily tracking — €9.99/mo" and point at
   /pricing: a retired Grow price, sold to someone two whole steps earlier in
   the journey than the offer assumed. Gating is unchanged — this is copy and a
   destination, not entitlement.
────────────────────────────────────────────────────────────────────── */

interface FreeScanUpsellProps {
  score: number
}

export function FreeScanUpsell({ score }: FreeScanUpsellProps) {
  const rounded      = Math.round(score)
  const identityLabel = getIdentityLabel(rounded)
  const percentile    = getPercentile(rounded)

  return (
    <div
      className="rounded-3xl p-6 sm:p-8 space-y-5"
      style={{
        background: "color-mix(in srgb, var(--icon-lime) 5%, var(--card))",
        border: "1px solid color-mix(in srgb, var(--icon-lime) 25%, transparent)",
      }}
    >
      {/* Identity pill */}
      <div className="flex items-center gap-3">
        <span
          className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-2xl"
          style={{ background: "color-mix(in srgb, var(--icon-lime) 14%, transparent)" }}
        >
          {identityLabel.emoji}
        </span>
        <div>
          <p className="text-sm font-bold text-foreground">{identityLabel.word}</p>
          <p className="text-xs text-muted-foreground">
            Better gut health than <strong>{percentile}%</strong> of people
          </p>
        </div>
      </div>

      {/* Headline + body */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Sparkles size={14} style={{ color: "var(--icon-lime)" }} />
          <p className="text-sm font-bold uppercase tracking-widest" style={{ color: "var(--icon-lime)" }}>
            That&apos;s your Meal Biotics Score
          </p>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          That score is for this meal. Your Food System Assessment takes about two minutes and
          gives you your Biotics Score™ — the person-level picture, across Prebiotics, Probiotics
          and Postbiotics.
        </p>
      </div>

      {/* CTA */}
      <Link
        href="/assessment"
        className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        style={{ background: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))" }}
      >
        Understand My Food System <ArrowRight size={14} />
      </Link>

      <p className="text-xs text-muted-foreground/60">
        Free · About 2 minutes · No account needed
      </p>
    </div>
  )
}
