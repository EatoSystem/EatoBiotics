/**
 * "Your Digital Twin" — homepage section introducing the Food System Digital Twin
 * as a core EatoBiotics pillar (evolved from the earlier "Food System Loop" section).
 *
 * Aspirational, not technical: your meals, symptoms, habits, sleep, activity and
 * assessments build a living representation of the Food System Inside You — your
 * Digital Twin — which learns continuously and surfaces your next best action. The
 * Agent Loop is shown as the quiet engine behind it.
 *
 * Centrepiece reuses the Remotion hero video (`HeroVideo`). Server-rendered;
 * CSS/SVG animation gated behind prefers-reduced-motion (see app/globals.css fsl-*).
 * Brand palette only — lime/green/teal inputs, yellow/orange outputs; no blue/purple.
 */

import Link from "next/link"
import { ArrowRight, Lock } from "lucide-react"
import { ScrollReveal } from "@/components/scroll-reveal"
import { HeroVideo } from "@/components/hero-video"

/** What you bring (inputs) — green. */
const INPUTS = ["Meals", "Symptoms", "Habits", "Sleep", "Activity", "Assessments"]
/** What your Twin produces (outputs) — orange. The Agent Loop is the quiet engine. */
const OUTPUTS = ["Food System Score", "Agent Loop", "Next Best Action"]

/** Evenly distribute n nodes down an edge as top-% positions. */
function fan(n: number): string[] {
  return Array.from({ length: n }, (_, i) => `${Math.round(((i + 1) / (n + 1)) * 100)}%`)
}

function NodePill({ label, side }: { label: string; side: "in" | "out" }) {
  const gradient =
    side === "in"
      ? "linear-gradient(135deg, var(--icon-lime), var(--icon-green))"
      : "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange))"
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-card px-3 py-1.5 text-xs font-semibold text-foreground shadow-[0_2px_10px_rgba(26,46,18,0.08)] ring-1 ring-border">
      <span aria-hidden className="h-2 w-2 shrink-0 rounded-full" style={{ background: gradient }} />
      {label}
    </span>
  )
}

export function DigitalTwinSection() {
  const inFan = fan(INPUTS.length)
  const outFan = fan(OUTPUTS.length)
  return (
    <section id="digital-twin" className="px-6 py-24 md:py-32">
      <div className="mx-auto grid max-w-[1200px] items-center gap-14 lg:grid-cols-2 lg:gap-10">
        {/* ── Left: storytelling + CTA ───────────────────────────────── */}
        <ScrollReveal>
          <div className="max-w-xl">
            <p className="mb-4 inline-flex items-center rounded-full bg-[color-mix(in_srgb,var(--icon-green)_12%,#fff)] px-3 py-1 text-xs font-semibold uppercase tracking-widest text-icon-green">
              Your Digital Twin
            </p>
            <h2 className="font-serif text-4xl font-semibold leading-tight text-foreground sm:text-5xl text-balance">
              Build Your <span className="brand-gradient-text">Digital Twin</span>.
            </h2>
            <p className="mt-4 text-xl font-medium text-foreground/90">
              Improve the Food System Inside You. Help build the Food System.
            </p>
            <div aria-hidden className="mt-6 h-1 w-16 rounded-full" style={{ background: "linear-gradient(90deg, var(--icon-green), var(--icon-teal))" }} />
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
              It starts with your baseline — a snapshot of the Food System Inside You.
              From there, every meal, symptom, habit and check-in builds a living
              representation of your Food System: your <span className="font-medium text-foreground">Digital Twin</span>.
            </p>
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
              It learns continuously, shows you what&rsquo;s changing, and gives you the one
              next best action that matters most. And as more people strengthen the Food
              System Inside Them, we help build the Food System — developing the EatoSystem
              from the inside out.
            </p>
            <div className="mt-8 flex flex-col items-start gap-3">
              <Link
                href="/assessment"
                className="inline-flex items-center gap-2 rounded-full px-7 py-4 text-base font-semibold text-white shadow-lg transition-transform hover:-translate-y-0.5"
                style={{ background: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))" }}
              >
                Build My Digital Twin
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link href="/digital-twin" className="inline-flex items-center gap-1.5 text-sm font-semibold text-icon-green hover:underline">
                See how your Digital Twin works <ArrowRight className="h-4 w-4" />
              </Link>
              <span className="mt-1 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <Lock className="h-3.5 w-3.5" /> Private to you. No spam, ever.
              </span>
            </div>
          </div>
        </ScrollReveal>

        {/* ── Right: animated digital-twin diagram ───────────────────── */}
        <ScrollReveal>
          <div className="relative mx-auto w-full max-w-[520px]">
            {/* Desktop: nodes fanned around the centrepiece */}
            <div className="relative mx-auto hidden aspect-square w-full lg:block">
              <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" aria-hidden preserveAspectRatio="none">
                <path d="M14,18 C40,30 40,70 14,82" fill="none" stroke="var(--icon-green)" strokeWidth="0.5" strokeDasharray="2 2" className="fsl-arc" opacity="0.5" />
                <path d="M86,22 C60,35 60,65 86,78" fill="none" stroke="var(--icon-orange)" strokeWidth="0.5" strokeDasharray="2 2" className="fsl-arc fsl-arc-rev" opacity="0.5" />
              </svg>

              <div className="absolute left-1/2 top-1/2 aspect-square w-[58%] -translate-x-1/2 -translate-y-1/2">
                <HeroVideo
                  posterSrc="/videos/food-system-hero-poster.jpg"
                  mp4Src="/videos/food-system-hero.mp4"
                  webmSrc="/videos/food-system-hero.webm"
                  alt="Your living Food System Digital Twin"
                  className="h-full w-full object-contain"
                />
              </div>

              <div className="absolute left-1/2 top-[1%] -translate-x-1/2 rounded-2xl bg-card px-4 py-2 text-center shadow-[0_4px_18px_rgba(26,46,18,0.12)] ring-1 ring-border">
                <div className="text-2xl font-bold leading-none tabular-nums" style={{ color: "var(--icon-green)" }}>74</div>
                <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">System Score</div>
              </div>

              {INPUTS.map((label, i) => (
                <div key={label} className="fsl-node absolute left-0 -translate-y-1/2" style={{ top: inFan[i], ["--d" as string]: `${i * 0.1}s` }}>
                  <NodePill label={label} side="in" />
                </div>
              ))}
              {OUTPUTS.map((label, i) => (
                <div key={label} className="fsl-node absolute right-0 -translate-y-1/2" style={{ top: outFan[i], ["--d" as string]: `${i * 0.12 + 0.3}s` }}>
                  <NodePill label={label} side="out" />
                </div>
              ))}
            </div>

            {/* Mobile: centrepiece + two labelled lists */}
            <div className="lg:hidden">
              <div className="relative mx-auto aspect-square w-[68%] max-w-[300px]">
                <HeroVideo
                  posterSrc="/videos/food-system-hero-poster.jpg"
                  mp4Src="/videos/food-system-hero.mp4"
                  webmSrc="/videos/food-system-hero.webm"
                  alt="Your living Food System Digital Twin"
                  className="h-full w-full object-contain"
                />
              </div>
              <div className="mt-6 grid grid-cols-2 gap-4">
                <div>
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--icon-green)" }}>You bring</p>
                  <div className="flex flex-wrap gap-1.5">{INPUTS.map((l) => <NodePill key={l} label={l} side="in" />)}</div>
                </div>
                <div>
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--icon-orange)" }}>Your Twin gives</p>
                  <div className="flex flex-wrap gap-1.5">{OUTPUTS.map((l) => <NodePill key={l} label={l} side="out" />)}</div>
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
