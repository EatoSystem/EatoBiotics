"use client"

import { useRef } from "react"
import { ScrollReveal } from "@/components/scroll-reveal"
import { IPhoneCarousel } from "@/components/app/iphone-carousel"
import { BarChart3, Utensils, Activity, Apple, ArrowRight, Zap } from "lucide-react"
import Link from "next/link"

const FEATURES = [
  {
    icon: BarChart3,
    title: "Biotics Score",
    description: "A 0–100 score across Pre, Pro, and Post — see exactly how your meals perform across every pillar.",
    color: "var(--icon-lime)",
    gradient: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))",
    href: "/analyse",
  },
  {
    icon: Utensils,
    title: "Meal Analysis",
    description: "Photograph or describe any meal — get instant Pre, Pro, and Post biotic scores with actionable swaps.",
    color: "var(--icon-teal)",
    gradient: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))",
    href: "/analyse",
  },
  {
    icon: Activity,
    title: "Progress Tracking",
    description: "Track your streak, trend direction, and weekly arc — your entire food system, visible over time.",
    color: "var(--icon-orange)",
    gradient: "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange))",
    href: "/account",
  },
  {
    icon: Apple,
    title: "Food Library",
    description: "50+ foods with full Pre, Pro, and Post biotic breakdowns, scores, and pairing recommendations.",
    color: "var(--icon-yellow)",
    gradient: "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange))",
    href: "/food",
  },
]

const STATS = [
  { num: "50+", label: "Foods tracked" },
  { num: "5",   label: "Pillars scored" },
  { num: "3",   label: "Biotics analysed" },
  { num: "Free", label: "To start" },
]

export function AppShowcase() {
  const sectionRef = useRef<HTMLElement>(null)

  function handleMouseMove(e: React.MouseEvent) {
    const rect = sectionRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    sectionRef.current?.style.setProperty("--mouse-x", `${x}%`)
    sectionRef.current?.style.setProperty("--mouse-y", `${y}%`)
  }

  return (
    <section
      ref={sectionRef}
      onMouseMove={handleMouseMove}
      className="group/glow relative overflow-hidden bg-foreground px-6 py-24 md:py-32"
    >

      {/* Cursor-follow glow */}
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover/glow:opacity-100"
        style={{
          background:
            "radial-gradient(700px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(86,193,53,0.07), transparent 60%)",
        }}
      />

      {/* Ambient gradient blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -top-48 -right-48 h-[500px] w-[500px] rounded-full opacity-[0.07]"
          style={{ background: "radial-gradient(circle, var(--icon-lime), transparent 70%)" }}
        />
        <div
          className="absolute -bottom-48 -left-48 h-[500px] w-[500px] rounded-full opacity-[0.07]"
          style={{ background: "radial-gradient(circle, var(--icon-teal), transparent 70%)" }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full opacity-[0.04]"
          style={{ background: "radial-gradient(circle, var(--icon-orange), transparent 70%)" }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-[1200px]">

        {/* ── Header ──────────────────────────────────────────────────── */}
        <ScrollReveal>
          <div className="text-center">
            {/* Live badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 mb-6">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-icon-lime opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-icon-lime" />
              </span>
              <span className="text-xs font-semibold uppercase tracking-widest text-white/70">
                The Platform — Live Now
              </span>
            </div>

            <h2 className="font-serif text-4xl font-bold text-white sm:text-5xl md:text-6xl text-balance leading-tight">
              Your Personal Food
              <br />
              <span
                style={{
                  background: "linear-gradient(135deg, var(--icon-lime), var(--icon-green), var(--icon-teal))",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                System Platform
              </span>
            </h2>

            <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-white/60">
              Assess your microbiome diet, score every meal, track your progress, and get
              personalised guidance — all in one place.
            </p>

            {/* Stats strip */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
              {STATS.map((s, i) => (
                <div key={s.label} className="flex items-center gap-3">
                  {i > 0 && <div className="h-5 w-px bg-white/10 hidden sm:block" />}
                  <div className="text-center">
                    <p className="font-serif text-2xl font-bold text-white">{s.num}</p>
                    <p className="text-[11px] uppercase tracking-wide text-white/40">{s.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ScrollReveal>

        {/* ── Phone + Feature grid ─────────────────────────────────────── */}
        <div className="mt-16 flex flex-col items-center gap-12 lg:flex-row lg:items-start lg:gap-16">

          {/* Left: iPhone carousel */}
          <ScrollReveal className="lg:sticky lg:top-24 lg:shrink-0">
            <div className="relative">
              {/* Glow behind phone */}
              <div
                className="absolute inset-0 -z-10 blur-3xl opacity-30 scale-75"
                style={{ background: "linear-gradient(135deg, var(--icon-lime), var(--icon-teal))" }}
              />
              <IPhoneCarousel />
            </div>
          </ScrollReveal>

          {/* Right: 2×2 feature cards */}
          <div className="flex-1 grid gap-4 sm:grid-cols-2">
            {FEATURES.map((feature, i) => (
              <ScrollReveal key={feature.title} delay={i * 80}>
                <Link href={feature.href} className="group block h-full">
                  <div className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-6 transition-all hover:bg-white/[0.08] hover:border-white/20">
                    {/* Top accent line */}
                    <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: feature.gradient }} />

                    {/* Icon */}
                    <div
                      className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl"
                      style={{ background: feature.gradient }}
                    >
                      <feature.icon size={22} className="text-white" />
                    </div>

                    <h3 className="font-serif text-lg font-semibold text-white">
                      {feature.title}
                    </h3>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-white/55">
                      {feature.description}
                    </p>

                    <div
                      className="mt-5 flex items-center gap-1 text-xs font-semibold opacity-0 transition-opacity group-hover:opacity-100"
                      style={{ color: feature.color }}
                    >
                      Explore <ArrowRight size={12} />
                    </div>
                  </div>
                </Link>
              </ScrollReveal>
            ))}
          </div>
        </div>

        {/* ── CTA strip ───────────────────────────────────────────────── */}
        <ScrollReveal delay={200}>
          <div className="mt-16 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/assessment"
              className="brand-gradient inline-flex items-center gap-2 rounded-full px-8 py-4 text-base font-semibold text-white shadow-lg shadow-icon-green/20 transition-all hover:opacity-90 hover:shadow-xl hover:shadow-icon-green/30"
            >
              <Zap size={16} />
              Get My Free Biotics Score
            </Link>
            <Link
              href="/account"
              className="inline-flex items-center gap-2 rounded-full border border-white/20 px-8 py-4 text-base font-semibold text-white/80 transition-all hover:border-white/40 hover:text-white"
            >
              Go to Dashboard
            </Link>
          </div>
          <p className="mt-3 text-center text-xs text-white/30">
            Free to start. No card required. Takes about 3 minutes.
          </p>
        </ScrollReveal>

      </div>
    </section>
  )
}
