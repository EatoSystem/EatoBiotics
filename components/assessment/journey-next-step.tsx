"use client"

/**
 * Shown on a completed foundation (You/Family) result. If the user arrived via
 * an add-on (pendingAddon), it surfaces a prominent "continue" CTA; otherwise it
 * offers the four optional add-ons + a link to the foundation report.
 */

import { useEffect, useState } from "react"
import Link from "next/link"
import { Activity, ArrowRight, Sparkles, BarChart3, ShieldPlus, Brain } from "lucide-react"
import { getJourney } from "@/lib/assessment/journey"
import { ADDONS, type AddonKey } from "@/lib/assessment/registry"

const ADDON_CARDS: Array<{ key: AddonKey; icon: typeof Activity; blurb: string; accent: string }> = [
  { key: "stability", icon: Activity, blurb: "Digestive calm, consistency, and confidence.", accent: "var(--icon-teal)" },
  { key: "glucose", icon: BarChart3, blurb: "Steadier energy, cravings, and glucose rhythm.", accent: "var(--icon-orange)" },
  { key: "mind", icon: Brain, blurb: "Food, gut, mood, focus, and mental clarity.", accent: "var(--icon-green)" },
  { key: "performance", icon: ShieldPlus, blurb: "Energy, recovery, movement, and output.", accent: "var(--icon-yellow)" },
]

export function JourneyNextStep() {
  const [pendingAddon, setPendingAddon] = useState<AddonKey | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setPendingAddon(getJourney().pendingAddon)
    setReady(true)
  }, [])

  if (!ready) return null

  if (pendingAddon) {
    const label = ADDONS[pendingAddon].label
    return (
      <div className="mx-auto my-12 max-w-2xl rounded-[1.5rem] border p-6 text-center sm:p-8" style={{ borderColor: "color-mix(in srgb, var(--icon-green) 35%, transparent)", background: "color-mix(in srgb, var(--icon-green) 6%, transparent)" }}>
        <p className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-icon-green">
          <Sparkles size={13} /> Foundation complete
        </p>
        <h3 className="mt-3 font-serif text-2xl font-semibold text-foreground">
          Now add your {label} assessment
        </h3>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          Your {label} assessment creates a deeper report by combining your foundation score with focused insights.
        </p>
        <Link
          href={`/assessment/add/${pendingAddon}`}
          className="brand-gradient mt-6 inline-flex items-center gap-2 rounded-full px-8 py-4 text-base font-semibold text-white shadow-lg shadow-icon-green/20 transition-opacity hover:opacity-90"
        >
          Continue to {label} <ArrowRight size={18} />
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto my-12 max-w-3xl">
      <div className="text-center">
        <h3 className="font-serif text-2xl font-semibold text-foreground">Add a deeper focus</h3>
        <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">
          Add-ons build on your foundation. Layer on a focused assessment for a deeper combined report — or view your report now.
        </p>
      </div>
      <div className="mt-7 grid gap-4 sm:grid-cols-2">
        {ADDON_CARDS.map((c) => (
          <Link
            key={c.key}
            href={`/assessment/add/${c.key}`}
            className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl" style={{ background: `color-mix(in srgb, ${c.accent} 14%, transparent)` }}>
              <c.icon size={20} style={{ color: c.accent }} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-serif text-base font-semibold text-foreground">Add {ADDONS[c.key].label}</p>
              <p className="text-xs leading-relaxed text-muted-foreground">{c.blurb}</p>
            </div>
            <ArrowRight size={16} className="shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" style={{ color: c.accent }} />
          </Link>
        ))}
      </div>
      <div className="mt-8 text-center">
        <Link href="/assessment/results" className="text-sm font-semibold text-icon-green underline underline-offset-4 hover:text-icon-teal">
          View my Food System report →
        </Link>
      </div>
    </div>
  )
}
