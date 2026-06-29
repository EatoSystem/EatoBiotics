/**
 * "The Food System Loop" — homepage section framing EatoBiotics as an ongoing,
 * living improvement loop rather than a one-time assessment.
 *
 * Two columns: a copy/CTA column and an animated digital-twin diagram. The
 * centrepiece reuses the existing Remotion hero video (`HeroVideo`); around it,
 * five green "input" nodes (what you observe) feed in and five orange "output"
 * nodes (what the loop does) flow out, with animated connecting arcs. Below sit a
 * static "Next Best Action" card and a 4-up feature strip.
 *
 * Presentational + server-rendered (CSS/SVG animation only). Brand palette only:
 * lime/green/teal for inputs, yellow/orange for outputs — no blue/purple. Motion
 * is gated behind prefers-reduced-motion (see app/globals.css additions).
 */

import Link from "next/link"
import { ArrowRight, Lock, FlaskConical, UserRound, TrendingUp, Sparkles } from "lucide-react"
import { ScrollReveal } from "@/components/scroll-reveal"
import { HeroVideo } from "@/components/hero-video"

/** What the loop observes (inputs) — green. */
const INPUTS = ["Meals", "Symptoms", "Sleep", "Activity", "Progress"]
/** What the loop produces (stages) — orange. */
const OUTPUTS = ["Analyse", "Understand", "Recommend", "Improve", "Learn"]

const FEATURES = [
  { icon: FlaskConical, title: "Built on science", line: "Grounded in microbiome research and your three biotics." },
  { icon: UserRound, title: "Personal to you", line: "Everything is shaped by your own Food System baseline." },
  { icon: TrendingUp, title: "Designed to improve", line: "One clear next step at a time — never overwhelming." },
  { icon: Sparkles, title: "Always learning", line: "Each meal and check-in makes the next suggestion sharper." },
]

/** Vertical fan offsets (% of stage height) for the 5 nodes down each edge. */
const FAN = ["8%", "27%", "46%", "65%", "84%"]

function NodePill({ label, side }: { label: string; side: "in" | "out" }) {
  const gradient =
    side === "in"
      ? "linear-gradient(135deg, var(--icon-lime), var(--icon-green))"
      : "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange))"
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full bg-card px-3 py-1.5 text-xs font-semibold text-foreground shadow-[0_2px_10px_rgba(26,46,18,0.08)] ring-1 ring-border"
      style={{ ["--dot" as string]: side === "in" ? "var(--icon-green)" : "var(--icon-orange)" }}
    >
      <span aria-hidden className="h-2 w-2 rounded-full" style={{ background: gradient }} />
      {label}
    </span>
  )
}

export function FoodSystemLoopSection() {
  return (
    <section id="food-system-loop" className="px-6 py-24 md:py-32">
      <div className="mx-auto grid max-w-[1200px] items-center gap-14 lg:grid-cols-2 lg:gap-10">
        {/* ── Left: copy + CTA ───────────────────────────────────────── */}
        <ScrollReveal>
          <div className="max-w-xl">
            <p className="mb-4 inline-flex items-center rounded-full bg-[color-mix(in_srgb,var(--icon-green)_12%,#fff)] px-3 py-1 text-xs font-semibold uppercase tracking-widest text-icon-green">
              The Food System Loop
            </p>
            <h2 className="font-serif text-4xl font-semibold leading-tight text-foreground sm:text-5xl text-balance">
              Your Food System improves through a{" "}
              <span className="brand-gradient-text">living loop</span>.
            </h2>
            <div aria-hidden className="mt-6 h-1 w-16 rounded-full" style={{ background: "linear-gradient(90deg, var(--icon-green), var(--icon-teal))" }} />
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
              EatoBiotics doesn&rsquo;t stop at a single score. Your meals, symptoms,
              sleep, activity and progress feed an ongoing loop — your living digital
              twin — that learns what changes, why it matters, and the one thing to
              improve next.
            </p>
            <div className="mt-8 flex flex-col items-start gap-3">
              <Link
                href="/assessment"
                className="inline-flex items-center gap-2 rounded-full px-7 py-4 text-base font-semibold text-white shadow-lg transition-transform hover:-translate-y-0.5"
                style={{ background: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))" }}
              >
                Start My Food System Baseline
                <ArrowRight className="h-5 w-5" />
              </Link>
              <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <Lock className="h-3.5 w-3.5" /> Private to you. No spam, ever.
              </span>
            </div>
          </div>
        </ScrollReveal>

        {/* ── Right: animated digital-twin diagram ───────────────────── */}
        <ScrollReveal>
          <div className="fsl-diagram relative mx-auto w-full max-w-[520px]">
            {/* Desktop fan: absolutely-positioned nodes around the centrepiece */}
            <div className="relative mx-auto hidden aspect-square w-full lg:block">
              {/* Connecting arcs */}
              <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" aria-hidden preserveAspectRatio="none">
                <path d="M14,20 C40,30 40,70 14,80" fill="none" stroke="var(--icon-green)" strokeWidth="0.5" strokeDasharray="2 2" className="fsl-arc" opacity="0.5" />
                <path d="M86,20 C60,30 60,70 86,80" fill="none" stroke="var(--icon-orange)" strokeWidth="0.5" strokeDasharray="2 2" className="fsl-arc fsl-arc-rev" opacity="0.5" />
              </svg>

              {/* Centrepiece — the existing Remotion hero (digital twin) */}
              <div className="absolute left-1/2 top-1/2 aspect-square w-[58%] -translate-x-1/2 -translate-y-1/2">
                <HeroVideo
                  posterSrc="/videos/food-system-hero-poster.jpg"
                  mp4Src="/videos/food-system-hero.mp4"
                  webmSrc="/videos/food-system-hero.webm"
                  alt="Your living Food System — an animated digital twin"
                  className="h-full w-full object-contain"
                />
              </div>

              {/* System score card */}
              <div className="absolute left-1/2 top-[2%] -translate-x-1/2 rounded-2xl bg-card px-4 py-2 text-center shadow-[0_4px_18px_rgba(26,46,18,0.12)] ring-1 ring-border">
                <div className="text-2xl font-bold leading-none tabular-nums" style={{ color: "var(--icon-green)" }}>74</div>
                <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">System Score</div>
              </div>

              {/* Input nodes (left, green) */}
              {INPUTS.map((label, i) => (
                <div key={label} className="fsl-node absolute left-0 -translate-y-1/2" style={{ top: FAN[i], ["--d" as string]: `${i * 0.12}s` }}>
                  <NodePill label={label} side="in" />
                </div>
              ))}
              {/* Output nodes (right, orange) */}
              {OUTPUTS.map((label, i) => (
                <div key={label} className="fsl-node absolute right-0 -translate-y-1/2" style={{ top: FAN[i], ["--d" as string]: `${i * 0.12 + 0.3}s` }}>
                  <NodePill label={label} side="out" />
                </div>
              ))}
            </div>

            {/* Mobile / small: stacked, legible — centrepiece + two labelled lists */}
            <div className="lg:hidden">
              <div className="relative mx-auto aspect-square w-[68%] max-w-[300px]">
                <HeroVideo
                  posterSrc="/videos/food-system-hero-poster.jpg"
                  mp4Src="/videos/food-system-hero.mp4"
                  webmSrc="/videos/food-system-hero.webm"
                  alt="Your living Food System — an animated digital twin"
                  className="h-full w-full object-contain"
                />
              </div>
              <div className="mt-6 grid grid-cols-2 gap-4">
                <div>
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--icon-green)" }}>You observe</p>
                  <div className="flex flex-wrap gap-1.5">
                    {INPUTS.map((l) => <NodePill key={l} label={l} side="in" />)}
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--icon-orange)" }}>The loop does</p>
                  <div className="flex flex-wrap gap-1.5">
                    {OUTPUTS.map((l) => <NodePill key={l} label={l} side="out" />)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>

      {/* ── Next Best Action (static showcase) ───────────────────────── */}
      <ScrollReveal>
        <div className="mx-auto mt-16 max-w-[760px]">
          <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-[0_2px_14px_rgba(26,46,18,0.06)]">
            <div aria-hidden className="absolute inset-x-0 top-0 h-1" style={{ background: "linear-gradient(90deg, var(--icon-green), var(--icon-yellow), var(--icon-orange))" }} />
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--icon-green)" }}>
              <ArrowRight className="h-3.5 w-3.5" /> Your next best action
            </p>
            <p className="mt-2 text-lg font-semibold leading-snug text-foreground">
              Add one prebiotic-rich food to two meals this week.
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Why: </span>
              your fibre diversity looks lower than your fermented-food consistency —
              small, repeatable changes here move your Food System Score the most.
            </p>
            <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
              Supports general wellbeing through food patterns — not medical advice.
            </p>
          </div>
        </div>
      </ScrollReveal>

      {/* ── Feature strip ────────────────────────────────────────────── */}
      <ScrollReveal>
        <div className="mx-auto mt-12 grid max-w-[1100px] gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ icon: Icon, title, line }) => (
            <div key={title} className="rounded-2xl border border-border bg-card p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl text-white" style={{ background: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))" }}>
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-3 text-sm font-semibold text-foreground">{title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{line}</p>
            </div>
          ))}
        </div>
      </ScrollReveal>
    </section>
  )
}
