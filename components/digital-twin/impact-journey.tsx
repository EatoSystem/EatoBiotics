/**
 * ImpactJourney — the emotional payoff: from one person outward to the whole Food
 * System. A vertical cascade YOU → FAMILY → COMMUNITY → COUNTY → COUNTRY → THE
 * FOOD SYSTEM, each node a glowing orb that grows in scale + warmth down the
 * chain, linked by animated gradient flow-down connectors (eb-flow-down). Server
 * component; CSS-only motion (reduced-motion gated). Brand palette only.
 */

import { User, Users, Home, MapPin, Flag, Globe } from "lucide-react"

type Step = { Icon: typeof User; label: string; size: number; from: string; to: string }

const STEPS: Step[] = [
  { Icon: User, label: "You", size: 64, from: "#A8E063", to: "#4CB648" },
  { Icon: Users, label: "Your family", size: 72, from: "#4CB648", to: "#2DAA6E" },
  { Icon: Home, label: "Your community", size: 80, from: "#2DAA6E", to: "#5BB85C" },
  { Icon: MapPin, label: "Your county", size: 88, from: "#7DBE4E", to: "#F5C518" },
  { Icon: Flag, label: "Your country", size: 96, from: "#F5C518", to: "#F5A623" },
  { Icon: Globe, label: "The Food System", size: 108, from: "#F5C518", to: "#F5A623" },
]

export function ImpactJourney() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center">
      {STEPS.map((s, i) => (
        <div key={s.label} className="flex w-full flex-col items-center">
          <div className="flex flex-col items-center gap-2">
            <span
              className="flex items-center justify-center rounded-full text-white"
              style={{
                width: s.size,
                height: s.size,
                background: `linear-gradient(135deg, ${s.from}, ${s.to})`,
                boxShadow: `0 10px 30px color-mix(in srgb, ${s.to} 40%, transparent)`,
              }}
            >
              <s.Icon style={{ width: s.size * 0.42, height: s.size * 0.42 }} strokeWidth={1.8} />
            </span>
            <span className="text-sm font-semibold text-foreground">{s.label}</span>
          </div>
          {i < STEPS.length - 1 && (
            <span
              aria-hidden
              className="eb-flow-down my-2 h-9 w-1 rounded-full"
              style={{
                background:
                  "repeating-linear-gradient(180deg, #4CB648 0 6px, rgba(255,255,255,0) 6px 11px)",
                backgroundSize: "100% 11px",
              }}
            />
          )}
        </div>
      ))}
    </div>
  )
}
