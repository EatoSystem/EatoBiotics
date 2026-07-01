"use client"

/**
 * TwinLenses — "one Twin, many lenses."
 *
 * A chip row (Foundation + the live specialised systems) that lets a member view
 * their single Living Twin through each lens. Selecting a lens re-tints the Twin
 * (handled by the parent via onSelect) and shows that system's framing: what it
 * watches, the member's current standing on its focus biotic, and a link to the
 * system. Presentational + non-diagnostic. Phase 2 re-frames the foundation twin;
 * deep per-system data is Phase 3.
 */

import Link from "next/link"
import { ArrowRight } from "lucide-react"
import type { BioticKey, BioticsScore } from "@/lib/agent-loop/types"

export interface LensDef {
  key: string
  label: string
  focusBiotic: BioticKey
  observes: string[]
  blurb: string
  href: string | null
}

const BIOTIC_LABEL: Record<BioticKey, string> = {
  prebiotics: "Prebiotics",
  probiotics: "Probiotics",
  postbiotics: "Postbiotics",
}

export function TwinLenses({
  lenses,
  selected,
  onSelect,
  biotics,
}: {
  lenses: LensDef[]
  selected: string
  onSelect: (key: string) => void
  biotics: BioticsScore
}) {
  const active = lenses.find((l) => l.key === selected) ?? lenses[0]
  const focus = biotics[active.focusBiotic]

  return (
    <div>
      {/* chips */}
      <div className="flex flex-wrap gap-2">
        {lenses.map((l) => {
          const on = l.key === selected
          return (
            <button
              key={l.key}
              onClick={() => onSelect(l.key)}
              className="rounded-full px-4 py-2 text-sm font-semibold transition-all"
              style={
                on
                  ? { background: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))", color: "#fff", boxShadow: "0 3px 10px rgba(45,170,110,0.28)" }
                  : { background: "var(--muted)", color: "var(--muted-foreground)" }
              }
            >
              {l.label}
            </button>
          )
        })}
      </div>

      {/* active lens panel */}
      <div className="mt-5 rounded-2xl border border-border bg-card p-5" style={{ boxShadow: "0 4px 20px rgba(26,46,18,0.06)" }}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-serif text-lg font-semibold text-foreground">
              Through the {active.label} lens
            </h3>
            <p className="mt-1 max-w-md text-sm leading-relaxed text-muted-foreground">{active.blurb}</p>
          </div>
          <div className="shrink-0 text-right">
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              {BIOTIC_LABEL[active.focusBiotic]}
            </div>
            <div className="font-serif text-2xl font-bold" style={{ color: "var(--icon-green)" }}>{focus.score}</div>
            <div className="text-[10px] font-semibold" style={{ color: "var(--muted-foreground)" }}>{focus.label}</div>
          </div>
        </div>

        {/* what this lens watches */}
        <div className="mt-4 flex flex-wrap gap-1.5">
          {active.observes.map((o) => (
            <span key={o} className="rounded-full px-3 py-1 text-xs font-medium" style={{ background: "color-mix(in srgb, var(--icon-green) 8%, white)", color: "var(--foreground)", border: "1px solid var(--border)" }}>
              {o}
            </span>
          ))}
        </div>

        {active.href && (
          <Link href={active.href} className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold" style={{ color: "var(--icon-green)" }}>
            Explore {active.label} <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>
    </div>
  )
}
