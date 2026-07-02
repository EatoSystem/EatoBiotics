"use client"

/**
 * SystemMap — the interactive Digital Twin figure.
 *
 * Pulsing hotspots (Mind, Defence, Digestion, Energy) sit on the living figure;
 * tapping one re-tints the aura toward that system's feeding biotic and opens an
 * educational panel: what happens here → which biotic feeds it → the member's
 * live level → one concrete food action. With nothing selected, the panel area
 * renders `defaultPanel` (the score/next-action hero content). Educational,
 * non-medical copy throughout (disclaimer is rendered by the parent section).
 */

import { useMemo, useState } from "react"
import { X, Leaf, Target } from "lucide-react"
import { DigitalTwinFigure } from "@/components/digital-twin/parts"
import { systemMapState, type SystemHotspotKey } from "@/lib/account/system-map"
import { auraGradientForBiotic } from "@/lib/account/twin-visual"
import type { TwinVisualState } from "@/lib/account/twin-visual"
import type { FoodSystemDigitalTwin } from "@/lib/agent-loop/twin/twin-types"

const HOTSPOT_COLOR: Record<SystemHotspotKey, string> = {
  mind: "#2DAA6E",
  defence: "#F5A623",
  digestion: "#4CB648",
  energy: "#F5C518",
}

export function SystemMap({
  twin,
  visual,
  figureSrc,
  baseAura,
  defaultPanel,
  figureSize = 300,
  overlay,
}: {
  twin: FoodSystemDigitalTwin
  visual: TwinVisualState
  figureSrc: string
  /** Aura when no hotspot is selected (e.g. the active lens tint). */
  baseAura: string
  /** Rendered in the panel area when no hotspot is open. */
  defaultPanel?: React.ReactNode
  figureSize?: number
  /** Extra layer over the figure stage (e.g. the meal-reaction burst). */
  overlay?: React.ReactNode
}) {
  const [selected, setSelected] = useState<SystemHotspotKey | null>(null)
  const hotspots = useMemo(() => systemMapState(twin), [twin])
  const active = hotspots.find((h) => h.key === selected) ?? null
  const aura = active ? auraGradientForBiotic(active.biotic, visual.confidence) : baseAura

  return (
    <div className="flex flex-col items-center gap-6 md:flex-row md:items-center md:gap-10">
      {/* figure + hotspots */}
      <div className="relative shrink-0" style={{ width: figureSize, height: figureSize }}>
        <div
          aria-hidden
          className="eb-aura pointer-events-none absolute left-1/2 top-1/2 h-[115%] w-[115%] -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{ background: aura, opacity: 0.55 + 0.45 * visual.confidence, animationDuration: `${visual.pulseSec}s` }}
        />
        <DigitalTwinFigure
          size={figureSize}
          src={figureSrc}
          alt="Your Food System Digital Twin"
          showParticles={visual.particleDensity > 0.35}
        />
        {hotspots.map((h) => {
          const isActive = h.key === selected
          const c = HOTSPOT_COLOR[h.key]
          return (
            <button
              key={h.key}
              type="button"
              onClick={() => setSelected(isActive ? null : h.key)}
              aria-pressed={isActive}
              aria-label={`${h.label} — ${h.level}`}
              className="group absolute z-10 -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${h.x}%`, top: `${h.y}%` }}
            >
              <span className="relative flex h-7 w-7 items-center justify-center">
                <span
                  className="eb-ping absolute inline-flex h-full w-full rounded-full opacity-60"
                  style={{ background: c }}
                />
                <span
                  className="relative inline-flex h-4 w-4 rounded-full border-2 border-white transition-transform group-hover:scale-125"
                  style={{ background: c, boxShadow: `0 0 12px ${c}aa`, transform: isActive ? "scale(1.3)" : undefined }}
                />
              </span>
              <span
                className={`absolute left-1/2 top-full mt-0.5 -translate-x-1/2 whitespace-nowrap rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider transition-opacity ${isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
                style={{ background: "rgba(255,255,255,0.92)", color: c, border: `1px solid ${c}55` }}
              >
                {h.label}
              </span>
            </button>
          )
        })}
        {overlay}
      </div>

      {/* panel */}
      <div className="min-w-0 flex-1">
        {active ? (
          <div className="rounded-2xl p-5" style={{ background: `color-mix(in srgb, ${HOTSPOT_COLOR[active.key]} 7%, white)`, border: `1px solid color-mix(in srgb, ${HOTSPOT_COLOR[active.key]} 30%, transparent)` }}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: HOTSPOT_COLOR[active.key] }}>
                  Inside you · {active.label}
                </p>
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <span className="rounded-full px-2.5 py-1 text-xs font-bold text-white" style={{ background: HOTSPOT_COLOR[active.key] }}>
                    {active.level} · {active.score}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold" style={{ background: "white", border: "1px solid var(--border)", color: "var(--icon-green)" }}>
                    <Leaf size={11} /> Fed by {active.bioticLabel}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                aria-label="Close"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-white"
                style={{ color: "var(--muted-foreground)", border: "1px solid var(--border)", background: "rgba(255,255,255,0.7)" }}
              >
                <X size={13} />
              </button>
            </div>
            {/* live level bar */}
            <div className="mt-3 h-2 overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.8)", border: "1px solid var(--border)" }}>
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${Math.max(4, Math.min(100, active.score))}%`, background: `linear-gradient(90deg, ${HOTSPOT_COLOR[active.key]}88, ${HOTSPOT_COLOR[active.key]})` }}
              />
            </div>
            <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--foreground)" }}>{active.what}</p>
            <div className="mt-3 flex items-start gap-2.5 rounded-xl px-3.5 py-3" style={{ background: "rgba(255,255,255,0.85)", border: "1px solid var(--border)" }}>
              <Target size={13} style={{ color: "var(--icon-orange)", flexShrink: 0, marginTop: 2 }} />
              <p className="text-sm leading-snug" style={{ color: "var(--foreground)" }}>
                <span className="font-semibold">Try this: </span>
                {active.action}
              </p>
            </div>
          </div>
        ) : (
          defaultPanel ?? null
        )}
      </div>
    </div>
  )
}
