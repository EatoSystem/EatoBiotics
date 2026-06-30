/**
 * FlowDiagram — "See the Food System Inside You." Everything you live (meals,
 * symptoms, sleep, activity, habits, progress) flows INTO the central Twin, which
 * streams back analysis → understanding → your next best action. Responsive SVG
 * (viewBox-matched aspect) with animated dashed connectors + traveling dots
 * (CSS dashes are reduced-motion gated; SMIL dots add richness). HTML chips are
 * overlaid at viewBox-derived percentages so they track the SVG as it scales. A
 * stacked fallback renders on small screens. Server component; brand palette only.
 */

import {
  Utensils, HeartPulse, Moon, Footprints, Brain,
  Search, Lightbulb, ArrowRight, TrendingUp, Infinity as InfinityIcon,
} from "lucide-react"
import { DigitalTwinFigure } from "./parts"

const VB_W = 1000
const VB_H = 600
const GREEN = "#4CB648"
const ORANGE = "#F5A623"

type Node = { Icon: typeof Utensils; label: string; sub: string; x: number; y: number }

const INPUTS: Node[] = [
  { Icon: Utensils, label: "Meals", sub: "What you eat", x: 150, y: 70 },
  { Icon: HeartPulse, label: "Symptoms", sub: "How you feel", x: 116, y: 164 },
  { Icon: Moon, label: "Sleep", sub: "How you rest", x: 104, y: 300 },
  { Icon: Footprints, label: "Activity", sub: "How you move", x: 116, y: 436 },
  { Icon: Brain, label: "Habits", sub: "How you live", x: 150, y: 530 },
]
const OUTPUTS: Node[] = [
  { Icon: Search, label: "Analyse", sub: "We find patterns", x: 850, y: 90 },
  { Icon: Lightbulb, label: "Understand", sub: "What it means", x: 884, y: 215 },
  { Icon: ArrowRight, label: "Recommend", sub: "Your next step", x: 896, y: 340 },
  { Icon: TrendingUp, label: "Improve", sub: "You feel better", x: 884, y: 460 },
  { Icon: InfinityIcon, label: "Learn", sub: "The loop continues", x: 850, y: 545 },
]

const CY = 300
const IN_EDGE = 420
const OUT_EDGE = 580

function inPath(n: Node) {
  const mx = (n.x + IN_EDGE) / 2
  return `M ${n.x} ${n.y} C ${mx} ${n.y}, ${mx} ${CY}, ${IN_EDGE} ${CY}`
}
function outPath(n: Node) {
  const mx = (OUT_EDGE + n.x) / 2
  return `M ${OUT_EDGE} ${CY} C ${mx} ${CY}, ${mx} ${n.y}, ${n.x} ${n.y}`
}

function pct(x: number, y: number) {
  return { left: `${(x / VB_W) * 100}%`, top: `${(y / VB_H) * 100}%` }
}

function Chip({ n, side }: { n: Node; side: "in" | "out" }) {
  const color = side === "in" ? GREEN : ORANGE
  return (
    <div
      className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
      style={pct(n.x, n.y)}
    >
      <div className={`flex items-center gap-2.5 rounded-2xl border border-border bg-card px-3 py-2 shadow-[0_4px_14px_rgba(26,46,18,0.08)] ${side === "out" ? "flex-row-reverse text-right" : ""}`}>
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full" style={{ background: `color-mix(in srgb, ${color} 12%, #fff)`, color }}>
          <n.Icon className="h-4 w-4" />
        </span>
        <span>
          <span className="block text-xs font-semibold leading-tight text-foreground">{n.label}</span>
          <span className="block text-[10px] leading-tight text-muted-foreground">{n.sub}</span>
        </span>
      </div>
    </div>
  )
}

export function FlowDiagram() {
  return (
    <>
      {/* desktop / tablet: the living flow */}
      <div className="relative mx-auto hidden aspect-[5/3] w-full max-w-[1000px] sm:block">
        <svg viewBox={`0 0 ${VB_W} ${VB_H}`} preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden>
          <defs>
            <linearGradient id="fdGreen" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#A8E063" /><stop offset="1" stopColor="#2DAA6E" /></linearGradient>
            <linearGradient id="fdOrange" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#F5C518" /><stop offset="1" stopColor="#F5A623" /></linearGradient>
          </defs>
          {INPUTS.map((n, i) => (
            <g key={`in${i}`}>
              <path id={`fin${i}`} d={inPath(n)} fill="none" stroke="url(#fdGreen)" strokeWidth="2" opacity="0.30" />
              <path d={inPath(n)} fill="none" stroke="url(#fdGreen)" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="2 12" className="eb-flow" opacity="0.7" />
              <circle r="4.5" fill={GREEN}>
                <animateMotion dur={`${3 + i * 0.4}s`} repeatCount="indefinite" begin={`${i * 0.5}s`}><mpath href={`#fin${i}`} /></animateMotion>
              </circle>
            </g>
          ))}
          {OUTPUTS.map((n, i) => (
            <g key={`out${i}`}>
              <path id={`fout${i}`} d={outPath(n)} fill="none" stroke="url(#fdOrange)" strokeWidth="2" opacity="0.30" />
              <path d={outPath(n)} fill="none" stroke="url(#fdOrange)" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="2 12" className="eb-flow" opacity="0.7" />
              <circle r="4.5" fill={ORANGE}>
                <animateMotion dur={`${3.2 + i * 0.4}s`} repeatCount="indefinite" begin={`${0.3 + i * 0.5}s`}><mpath href={`#fout${i}`} /></animateMotion>
              </circle>
            </g>
          ))}
        </svg>

        {INPUTS.map((n) => <Chip key={n.label} n={n} side="in" />)}
        {OUTPUTS.map((n) => <Chip key={n.label} n={n} side="out" />)}

        {/* central Twin */}
        <div className="absolute left-1/2 top-1/2 z-10 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center">
          <DigitalTwinFigure size={300} src="/images/couple-hero.png" />
        </div>
      </div>

      {/* mobile fallback: figure + two columns */}
      <div className="sm:hidden">
        <DigitalTwinFigure size={240} src="/images/couple-hero.png" className="mb-6" />
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-3">
            {INPUTS.map((n) => (
              <div key={n.label} className="flex items-center gap-2.5 rounded-2xl border border-border bg-card px-3 py-2">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full" style={{ background: `color-mix(in srgb, ${GREEN} 12%, #fff)`, color: GREEN }}><n.Icon className="h-4 w-4" /></span>
                <span className="text-xs font-semibold text-foreground">{n.label}</span>
              </div>
            ))}
          </div>
          <div className="space-y-3">
            {OUTPUTS.map((n) => (
              <div key={n.label} className="flex flex-row-reverse items-center gap-2.5 rounded-2xl border border-border bg-card px-3 py-2 text-right">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full" style={{ background: `color-mix(in srgb, ${ORANGE} 12%, #fff)`, color: ORANGE }}><n.Icon className="h-4 w-4" /></span>
                <span className="text-xs font-semibold text-foreground">{n.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
