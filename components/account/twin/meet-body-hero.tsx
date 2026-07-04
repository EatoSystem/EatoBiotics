"use client"

/**
 * MeetBodyHero — the first 60 seconds for a brand-new member.
 *
 * Before any score or number, a first-time member (no meals logged yet, so no
 * Twin) meets the living body: the figure breathing inside a luminous orb with
 * drifting microbes/nutrients, a warm welcome, and one CTA that frames the first
 * meal as *waking it up*. No data, no dashboard — just "that's me". Reuses the
 * orb/aura/ambient-life language from the TwinStage. Reduced-motion-safe (eb-*).
 */

import { ArrowDown } from "lucide-react"
import { DigitalTwinFigure } from "@/components/digital-twin/parts"

const STAGE_BG = "linear-gradient(175deg, #0B1607 0%, #122208 55%, #16290F 100%)"
const CREAM = "#FDFBF7"

/* Calm ambient life inside the orb (same language as the stage). */
const MICROBES = [
  { x: 32, y: 36, s: 9, c: "#4CB648", d: 0, dur: 13 },
  { x: 66, y: 42, s: 7, c: "#2DAA6E", d: 2200, dur: 15 },
  { x: 44, y: 62, s: 10, c: "#A8E063", d: 1200, dur: 12 },
  { x: 60, y: 68, s: 6, c: "#4CB648", d: 3400, dur: 16 },
]
const NUTRIENTS = [
  { x: 47, s: 5, c: "#A8E063", d: 0, dur: 7.5 },
  { x: 53, s: 4, c: "#F5C518", d: 2600, dur: 8.5 },
]

export function MeetBodyHero({
  firstName,
  figureSrc = "/images/couple-hero.png",
  loggerAnchor = "first-meal-logger",
}: {
  firstName?: string | null
  figureSrc?: string
  loggerAnchor?: string
}) {
  return (
    <section className="relative overflow-hidden" style={{ background: STAGE_BG }}>
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 -top-28 h-[380px] w-[380px] rounded-full" style={{ background: "radial-gradient(circle, rgba(168,224,99,0.12) 0%, transparent 65%)" }} />
        <div className="absolute -right-28 top-8 h-[440px] w-[440px] rounded-full" style={{ background: "radial-gradient(circle, rgba(245,166,35,0.08) 0%, transparent 65%)" }} />
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at center, transparent 55%, rgba(5,10,3,0.5) 100%)" }} />
      </div>

      <div className="relative mx-auto grid max-w-5xl items-center gap-8 px-4 py-12 md:grid-cols-[minmax(0,380px)_1fr] md:gap-12 md:px-8 md:py-16">
        {/* the living body in its orb */}
        <div className="relative mx-auto aspect-square w-full max-w-[360px]">
          <div className="eb-orb-bloom absolute left-1/2 top-1/2 h-[92%] w-[92%] -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ background: `radial-gradient(circle, ${CREAM} 0%, ${CREAM} 42%, rgba(253,251,247,0.55) 58%, rgba(253,251,247,0.12) 70%, transparent 78%)`, boxShadow: "0 0 120px 30px rgba(168,224,99,0.14)" }} />
          <div aria-hidden className="eb-aura pointer-events-none absolute left-1/2 top-1/2 h-full w-full rounded-full" style={{ transform: "translate(-50%,-50%)", background: "radial-gradient(circle, rgba(168,224,99,0.45) 0%, rgba(245,197,24,0.28) 48%, transparent 72%)", mixBlendMode: "screen" }} />
          <div className="eb-orb-bloom absolute left-1/2 top-1/2 h-[84%] w-[84%] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-full" style={{ animationDelay: "150ms" }}>
            <div className="flex h-full w-full items-center justify-center" style={{ background: CREAM }}>
              <DigitalTwinFigure size={280} src={figureSrc} alt="The Food System inside you" showParticles />
            </div>
          </div>
          {/* ambient life */}
          <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-full">
            {MICROBES.map((m, i) => (
              <span key={`m-${i}`} className="eb-float-big absolute rounded-full" style={{ left: `${m.x}%`, top: `${m.y}%`, width: m.s, height: m.s, background: `radial-gradient(circle, ${m.c} 0%, ${m.c}66 55%, transparent 72%)`, boxShadow: `0 0 10px ${m.c}66`, animationDelay: `${m.d}ms`, animationDuration: `${m.dur}s` }} />
            ))}
            {NUTRIENTS.map((n, i) => (
              <span key={`n-${i}`} className="eb-rise absolute rounded-full" style={{ left: `${n.x}%`, top: "72%", width: n.s, height: n.s, background: n.c, boxShadow: `0 0 8px ${n.c}aa`, animationDelay: `${n.d}ms`, animationDuration: `${n.dur}s` }} />
            ))}
          </div>
          {/* live pill */}
          <div className="absolute -top-1 left-0 flex items-center gap-2 rounded-full px-3 py-1.5 backdrop-blur" style={{ background: "rgba(253,251,247,0.08)", border: "1px solid rgba(253,251,247,0.18)" }}>
            <span className="relative flex h-2 w-2">
              <span className="eb-ping absolute inline-flex h-full w-full rounded-full" style={{ background: "#A8E063" }} />
              <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: "#A8E063" }} />
            </span>
            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#A8E063" }}>Alive &amp; waiting</span>
          </div>
        </div>

        {/* the welcome */}
        <div className="min-w-0 text-center md:text-left">
          <p className="eb-reveal text-[11px] font-bold uppercase tracking-[0.22em]" style={{ color: "#A8E063" }}>
            {firstName ? `Welcome, ${firstName}` : "Welcome"}
          </p>
          <h1 className="eb-reveal mt-2 font-serif text-3xl font-bold leading-tight md:text-4xl" style={{ color: CREAM, animationDelay: "80ms" }}>
            Meet the Food System inside you.
          </h1>
          <p className="eb-reveal mx-auto mt-3 max-w-md text-base leading-relaxed md:mx-0" style={{ color: "rgba(253,251,247,0.7)", animationDelay: "160ms" }}>
            This is your living Food System — the trillions of microbes that turn what you eat into
            how you feel. It&apos;s ready. Log your first meal and watch it wake up.
          </p>
          <div className="eb-reveal mt-6 flex flex-col items-center gap-3 sm:flex-row md:items-start" style={{ animationDelay: "240ms" }}>
            <a
              href={`#${loggerAnchor}`}
              onClick={(e) => {
                e.preventDefault()
                const el = document.getElementById(loggerAnchor)
                el?.scrollIntoView({ behavior: "smooth", block: "center" })
                el?.querySelector("textarea, input")?.dispatchEvent(new Event("focus"))
              }}
              className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-bold text-white transition-transform hover:-translate-y-0.5"
              style={{ background: "linear-gradient(135deg, #4CB648, #2DAA6E)", boxShadow: "0 8px 28px rgba(76,182,72,0.4)" }}
            >
              Wake it up — log your first meal <ArrowDown className="h-4 w-4" />
            </a>
          </div>
          <p className="eb-reveal mt-4 text-[11px] leading-relaxed" style={{ color: "rgba(253,251,247,0.4)", animationDelay: "320ms" }}>
            EatoBiotics provides food-first guidance for general wellbeing and is not medical advice.
          </p>
        </div>
      </div>
    </section>
  )
}
