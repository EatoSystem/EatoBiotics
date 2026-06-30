/**
 * OrbitHub — "One Twin. Connected to everything." The Digital Twin sits at the
 * centre; capability nodes orbit around it on two counter-rotating rings, with
 * counter-spinning labels so they stay upright (the memory-ring pattern). Server
 * component; CSS-only motion (eb-orbit / eb-orbit-rev, reduced-motion gated).
 */

import {
  Utensils, Users, FileText, Mic, Bot, Watch, HeartPulse, Puzzle,
} from "lucide-react"
import { DigitalTwinFigure } from "./parts"

type Cap = { Icon: typeof Utensils; label: string }

const INNER: Cap[] = [
  { Icon: Utensils, label: "Meals" },
  { Icon: Users, label: "Family" },
  { Icon: FileText, label: "Reports" },
  { Icon: Mic, label: "Voice" },
]
const OUTER: Cap[] = [
  { Icon: Bot, label: "AI" },
  { Icon: Watch, label: "Wearables" },
  { Icon: HeartPulse, label: "Programmes" },
  { Icon: Puzzle, label: "Add-ons" },
]

function Ring({ caps, radius, reverse }: { caps: Cap[]; radius: number; reverse?: boolean }) {
  return (
    <div className={`absolute inset-0 ${reverse ? "eb-orbit-rev" : "eb-orbit"}`}>
      {caps.map((c, i) => {
        const a = (i / caps.length) * 2 * Math.PI - Math.PI / 2
        const x = 50 + radius * Math.cos(a)
        const y = 50 + radius * Math.sin(a)
        return (
          <div key={c.label} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${x}%`, top: `${y}%` }}>
            <div className={`${reverse ? "eb-orbit" : "eb-orbit-rev"} flex flex-col items-center gap-1`}>
              <span className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-card text-icon-green shadow-[0_4px_14px_rgba(26,46,18,0.10)]">
                <c.Icon className="h-5 w-5" />
              </span>
              <span className="whitespace-nowrap text-[11px] font-semibold text-foreground">{c.label}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function OrbitHub() {
  return (
    <div className="relative mx-auto aspect-square w-[min(520px,86vw)]">
      {/* orbit guide rings */}
      <div aria-hidden className="absolute inset-[18%] rounded-full" style={{ border: "1.5px dashed rgba(76,182,72,0.22)" }} />
      <div aria-hidden className="absolute inset-[2%] rounded-full" style={{ border: "1.5px dashed rgba(245,166,35,0.20)" }} />

      <Ring caps={INNER} radius={32} />
      <Ring caps={OUTER} radius={48} reverse />

      {/* the Twin core */}
      <div className="absolute left-1/2 top-1/2 z-10 w-[36%] -translate-x-1/2 -translate-y-1/2">
        <DigitalTwinFigure size={200} src="/images/couple-hero.png" showParticles={false} />
      </div>
    </div>
  )
}
