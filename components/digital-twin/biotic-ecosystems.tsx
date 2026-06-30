/**
 * BioticEcosystems — the three biotics as living, glowing ecosystems (not a
 * documentation table). Each is a layered radial-gradient orb that breathes
 * (eb-pulse-soft) with orbiting particles (eb-orbit), a sparse rising-glint field
 * (eb-rise), an icon core, title, one line and a "Feed · Add · Harvest" tag.
 * Server component; CSS-only motion (reduced-motion gated). Brand palette only.
 */

import { Sprout, FlaskConical, Sparkles } from "lucide-react"

type Eco = {
  Icon: typeof Sprout
  title: string
  tag: string
  line: string
  core: string
  glow: string
  ring: string
  orbit: string[]
}

const ECOS: Eco[] = [
  {
    Icon: Sprout,
    title: "Prebiotics",
    tag: "Feed",
    line: "The fibres that feed your good bacteria.",
    core: "#4CB648",
    glow: "rgba(168,224,99,0.55)",
    ring: "rgba(76,182,72,0.30)",
    orbit: ["#A8E063", "#4CB648", "#2DAA6E"],
  },
  {
    Icon: FlaskConical,
    title: "Probiotics",
    tag: "Add",
    line: "The live cultures that strengthen your gut.",
    core: "#2DAA6E",
    glow: "rgba(45,170,110,0.5)",
    ring: "rgba(45,170,110,0.30)",
    orbit: ["#2DAA6E", "#4CB648", "#A8E063"],
  },
  {
    Icon: Sparkles,
    title: "Postbiotics",
    tag: "Harvest",
    line: "The beneficial compounds your bacteria create.",
    core: "#F5A623",
    glow: "rgba(245,197,24,0.55)",
    ring: "rgba(245,166,35,0.30)",
    orbit: ["#F5C518", "#F5A623", "#A8E063"],
  },
]

function Orb({ eco }: { eco: Eco }) {
  return (
    <div className="relative mx-auto h-[210px] w-[210px]">
      {/* breathing glow */}
      <div
        aria-hidden
        className="eb-pulse-soft absolute left-1/2 top-1/2 h-full w-full -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ background: `radial-gradient(circle, ${eco.glow} 0%, rgba(255,255,255,0) 68%)` }}
      />
      {/* orbit ring + orbiting particles */}
      <div aria-hidden className="absolute inset-[14%] rounded-full" style={{ border: `1.5px dashed ${eco.ring}` }} />
      <div aria-hidden className="eb-orbit absolute inset-0">
        {eco.orbit.map((c, i) => {
          const a = (i / eco.orbit.length) * 2 * Math.PI
          const R = 42
          const x = 50 + R * Math.cos(a)
          const y = 50 + R * Math.sin(a)
          return (
            <span
              key={i}
              className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{ left: `${x}%`, top: `${y}%`, background: c, boxShadow: `0 0 10px 2px ${c}` }}
            />
          )
        })}
      </div>
      {/* rising glints */}
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          aria-hidden
          className="eb-rise absolute h-1.5 w-1.5 rounded-full"
          style={{
            left: `${42 + i * 8}%`,
            bottom: "30%",
            background: eco.core,
            boxShadow: `0 0 8px 2px ${eco.glow}`,
            animationDuration: `${4.4 + i}s`,
            animationDelay: `${i * 0.9}s`,
          }}
        />
      ))}
      {/* core */}
      <div
        className="absolute left-1/2 top-1/2 flex h-[42%] w-[42%] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-white"
        style={{ background: `radial-gradient(circle at 35% 30%, #fff 0%, ${eco.core} 60%)`, boxShadow: `0 8px 26px ${eco.glow}` }}
      >
        <eco.Icon className="h-8 w-8" strokeWidth={1.8} />
      </div>
    </div>
  )
}

export function BioticEcosystems() {
  return (
    <div className="grid gap-10 sm:grid-cols-3">
      {ECOS.map((eco) => (
        <div key={eco.title} className="flex flex-col items-center text-center">
          <Orb eco={eco} />
          <span
            className="mt-5 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-white"
            style={{ background: `linear-gradient(135deg, ${eco.core}, color-mix(in srgb, ${eco.core} 60%, #F5A623))` }}
          >
            {eco.tag}
          </span>
          <div className="mt-3 text-xl font-semibold text-foreground">{eco.title}</div>
          <p className="mt-1 max-w-[15rem] text-sm leading-snug text-muted-foreground">{eco.line}</p>
        </div>
      ))}
    </div>
  )
}
