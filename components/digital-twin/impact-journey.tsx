/**
 * ImpactJourney — the emotional payoff: from one person outward to the whole Food
 * System. A full-width vertical timeline with a glowing gradient "spine" (green at
 * the top → orange at the bottom = the inside-out idea) and six steps that
 * alternate left/right on md+ as premium cards, each with a growing, glowing orb
 * node on the spine and a one-line meaning. Stacks to a single left-spine column
 * on mobile. Server component; CSS-only motion (reduced-motion gated).
 */

import { User, Users, Home, MapPin, Flag, Globe } from "lucide-react"

type Step = {
  Icon: typeof User
  label: string
  line: string
  size: number
  from: string
  to: string
}

const STEPS: Step[] = [
  { Icon: User, label: "You", line: "The Food System Inside You.", size: 56, from: "#A8E063", to: "#4CB648" },
  { Icon: Users, label: "Your family", line: "Shared meals, shared health.", size: 62, from: "#4CB648", to: "#2DAA6E" },
  { Icon: Home, label: "Your community", line: "Local food, shared habits.", size: 70, from: "#2DAA6E", to: "#7DBE4E" },
  { Icon: MapPin, label: "Your county", line: "One of 32 county food networks.", size: 78, from: "#7DBE4E", to: "#F5C518" },
  { Icon: Flag, label: "Your country", line: "One national transformation.", size: 88, from: "#F5C518", to: "#F5A623" },
  { Icon: Globe, label: "The Food System", line: "Regenerative — from the inside out.", size: 100, from: "#F5C518", to: "#F5A623" },
]

function Orb({ s }: { s: Step }) {
  return (
    <span
      className="relative flex shrink-0 items-center justify-center rounded-full text-white"
      style={{
        width: s.size,
        height: s.size,
        background: `linear-gradient(135deg, ${s.from}, ${s.to})`,
        boxShadow: `0 10px 30px color-mix(in srgb, ${s.to} 45%, transparent)`,
      }}
    >
      <span
        aria-hidden
        className="eb-pulse-soft absolute inset-0 rounded-full"
        style={{ background: `radial-gradient(circle, color-mix(in srgb,${s.to} 40%, transparent) 0%, transparent 70%)` }}
      />
      <s.Icon style={{ width: s.size * 0.4, height: s.size * 0.4 }} strokeWidth={1.8} />
    </span>
  )
}

function Card({ s, align }: { s: Step; align: "left" | "right" }) {
  return (
    <div
      className={`rounded-2xl border border-border bg-card px-6 py-5 shadow-[0_2px_12px_rgba(26,46,18,0.06)] ${align === "right" ? "md:text-right" : "md:text-left"} text-left`}
    >
      <div className="font-serif text-xl font-semibold text-foreground">{s.label}</div>
      <p className="mt-1 text-sm leading-snug text-muted-foreground">{s.line}</p>
    </div>
  )
}

export function ImpactJourney() {
  return (
    <div className="relative mx-auto max-w-3xl">
      {/* glowing gradient spine */}
      <div
        aria-hidden
        className="absolute bottom-0 top-0 w-[3px] -translate-x-1/2 rounded-full left-[31px] md:left-1/2"
        style={{
          background: "linear-gradient(180deg,#A8E063,#4CB648,#2DAA6E,#7DBE4E,#F5C518,#F5A623)",
          boxShadow: "0 0 22px rgba(245,197,24,0.35)",
        }}
      />
      {/* travelling light overlay on the spine */}
      <div
        aria-hidden
        className="eb-spine-flow absolute bottom-0 top-0 w-[3px] -translate-x-1/2 rounded-full left-[31px] md:left-1/2"
        style={{
          background: "repeating-linear-gradient(180deg, rgba(255,255,255,0) 0 12px, rgba(255,255,255,0.85) 12px 20px, rgba(255,255,255,0) 20px 60px)",
          backgroundSize: "100% 240px",
        }}
      />

      <div className="flex flex-col gap-8 md:gap-10">
        {STEPS.map((s, i) => {
          const right = i % 2 === 1
          return (
            <div
              key={s.label}
              className={`relative grid grid-cols-[64px_1fr] items-center gap-5 md:grid-cols-[1fr_auto_1fr] md:gap-6`}
            >
              {/* md: left cell */}
              <div className="hidden md:block">
                {right ? null : <Card s={s} align="right" />}
              </div>
              {/* orb on the spine */}
              <div className="flex items-center justify-center">
                <Orb s={s} />
              </div>
              {/* md: right cell */}
              <div className="hidden md:block">
                {right ? <Card s={s} align="left" /> : null}
              </div>
              {/* mobile: single card to the right of the spine */}
              <div className="md:hidden">
                <Card s={s} align="left" />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
