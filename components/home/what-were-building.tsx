import Image from "next/image"
import Link from "next/link"
import { ScrollReveal } from "@/components/scroll-reveal"
import { ArrowUpRight, Check } from "lucide-react"

const platforms = [
  {
    number: "01",
    title: "The Substack",
    label: "READ",
    accent: "var(--icon-lime)",
    gradient: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))",
    description:
      "Weekly writing on the foods, science, and habits that build a stronger microbiome. Free to subscribe. Published every week.",
    features: [
      "Food profiles — one ingredient, its full biotic story",
      "Plate builds — a complete weekly plate with commentary",
      "Science made practical — what the research means for your plate",
    ],
    cta: "Subscribe free",
    href: "https://eatobiotics.substack.com/",
    external: true,
    status: "Live now",
    featured: true,
  },
  {
    number: "02",
    title: "The Book",
    label: "LEARN",
    accent: "var(--icon-green)",
    gradient: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))",
    description:
      "EatoBiotics: The Food System Inside You. 25 chapters. The complete guide to building your microbiome through the 3 Biotics framework.",
    features: [
      "6 parts — from microbiome basics to a full 21-day rebuild",
      "Pre, Pro, and Postbiotic food guides with practical daily use",
      "The complete EatoBiotics plate system, explained in full",
    ],
    cta: "Explore the book",
    href: "/book",
    external: false,
    status: "Coming 2026",
    featured: false,
  },
  {
    number: "03",
    title: "The Podcast",
    label: "LISTEN",
    accent: "var(--icon-orange)",
    gradient: "linear-gradient(135deg, var(--icon-teal), var(--icon-yellow))",
    description:
      "Jason Curry sits down with the world's greatest minds in business, sport, and entertainment to ask the question no one else asks — what do you eat?",
    features: [
      "Long-form conversations about food, habits, and performance",
      "Guests from sport, science, business, and culture",
      "Coming to YouTube, Spotify, Apple Podcasts, and Substack",
    ],
    cta: "Learn more",
    href: "/podcast",
    external: false,
    status: "Coming 2026",
    featured: false,
  },
  {
    number: "04",
    title: "EatoSystem",
    label: "CHANGE",
    accent: "var(--icon-yellow)",
    gradient: "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange))",
    description:
      "Personal health only goes so far if the food system around you produces the wrong food. EatoSystem is Ireland's regenerative food transformation — county by county.",
    features: [
      "32 counties — one local food network per county",
      "Connecting growers, producers, and communities directly",
      "Seeded in Ireland. Licensed globally.",
    ],
    cta: "Explore EatoSystem",
    href: "/eatosystem",
    external: false,
    status: "In progress",
    featured: false,
  },
]

export function WhatWereBuilding() {
  return (
    <section className="px-6 py-24 md:py-32">
      <div className="mx-auto max-w-[1200px]">

        {/* ── Header ── */}
        <div className="flex flex-col gap-10 md:flex-row md:items-center md:gap-16 mb-16">
          <ScrollReveal className="flex-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-icon-green">
              What We&apos;re Building
            </p>
            <h2 className="mt-4 font-serif text-4xl font-semibold text-foreground sm:text-5xl md:text-6xl text-pretty">
              Go deeper.
              <br />
              <span className="brand-gradient-text">Four ways to engage.</span>
            </h2>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground">
              Beyond the platform — a book, a podcast, a weekly newsletter, and a national food
              system movement. Here&apos;s where to go next.
            </p>
          </ScrollReveal>
          <ScrollReveal delay={80} className="w-full md:w-[340px] lg:w-[400px] shrink-0">
            <Image
              src="/food-12.png"
              alt="Fresh ingredients that form the EatoBiotics food system"
              width={600}
              height={600}
              className="w-full h-auto"
            />
          </ScrollReveal>
        </div>

        {/* ── Featured card: Substack ── */}
        <ScrollReveal>
          {(() => {
            const p = platforms[0]
            const inner = (
              <div className="group relative overflow-hidden rounded-3xl border border-border bg-background transition-all hover:shadow-xl">
                <div className="absolute top-0 left-0 right-0 h-1" style={{ background: p.gradient }} />
                <div className="flex flex-col lg:flex-row">
                  {/* Left: content */}
                  <div className="flex-1 p-8 md:p-10">
                    <div className="flex items-center gap-3 mb-4">
                      <span
                        className="font-serif text-5xl font-bold"
                        style={{ color: p.accent }}
                      >
                        {p.number}
                      </span>
                      <div>
                        <span
                          className="block rounded-full px-2.5 py-1 text-xs font-semibold text-white w-fit"
                          style={{ background: p.gradient }}
                        >
                          {p.status}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: p.accent }}>
                      {p.label}
                    </p>
                    <h3 className="font-serif text-2xl font-semibold text-foreground md:text-3xl">
                      {p.title}
                    </h3>
                    <p className="mt-3 text-base leading-relaxed text-muted-foreground max-w-lg">
                      {p.description}
                    </p>

                    {/* Feature bullets */}
                    <ul className="mt-5 space-y-2">
                      {p.features.map((f) => (
                        <li key={f} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                          <Check size={14} className="mt-0.5 shrink-0" style={{ color: p.accent }} />
                          {f}
                        </li>
                      ))}
                    </ul>

                    <div
                      className="mt-8 inline-flex items-center gap-1.5 text-sm font-semibold transition-opacity group-hover:opacity-70"
                      style={{ color: p.accent }}
                    >
                      {p.cta}
                      <ArrowUpRight size={15} />
                    </div>
                  </div>

                  {/* Right: stacked post preview cards */}
                  <div className="hidden lg:flex lg:w-72 lg:shrink-0 lg:items-center lg:justify-center lg:p-8">
                    <div className="relative w-full" style={{ height: "170px" }}>

                      {/* Card 3 — back */}
                      <div
                        className="absolute inset-x-0 top-0 rounded-xl border border-border bg-background p-4 shadow-sm"
                        style={{ transform: "rotate(3deg) translateY(6px)" }}
                      >
                        <span
                          className="rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
                          style={{ background: "linear-gradient(135deg, var(--icon-teal), var(--icon-green))" }}
                        >
                          SCIENCE
                        </span>
                        <p className="mt-2 text-xs font-semibold text-foreground leading-snug">
                          Short-chain fatty acids — what they are and why they matter
                        </p>
                        <p className="mt-1 text-[10px] text-muted-foreground">3 min read</p>
                      </div>

                      {/* Card 2 — middle */}
                      <div
                        className="absolute inset-x-0 top-0 rounded-xl border border-border bg-background p-4 shadow-sm"
                        style={{ transform: "rotate(-1.5deg) translateY(3px)" }}
                      >
                        <span
                          className="rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
                          style={{ background: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))" }}
                        >
                          FOOD PROFILE
                        </span>
                        <p className="mt-2 text-xs font-semibold text-foreground leading-snug">
                          Kimchi — why it&apos;s the most powerful probiotic on your plate
                        </p>
                        <p className="mt-1 text-[10px] text-muted-foreground">4 min read</p>
                      </div>

                      {/* Card 1 — front (food image) */}
                      <div className="relative overflow-hidden rounded-xl shadow-md" style={{ height: "130px" }}>
                        <Image
                          src="/food-2.png"
                          alt="Latest from the Substack"
                          fill
                          className="object-cover"
                        />
                        {/* Gradient scrim */}
                        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 60%)" }} />
                        {/* Badges */}
                        <div className="absolute top-2.5 left-2.5">
                          <span
                            className="rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
                            style={{ background: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))" }}
                          >
                            PLATE BUILD
                          </span>
                        </div>
                        <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between">
                          <p className="text-[11px] font-semibold text-white leading-tight">
                            Plate 1.1 — The Food System Bowl
                          </p>
                          <span className="ml-2 shrink-0 text-[9px] font-semibold text-white/70">Latest</span>
                        </div>
                      </div>

                    </div>
                  </div>
                </div>
              </div>
            )
            return (
              <a href={p.href} target="_blank" rel="noopener noreferrer" className="block">
                {inner}
              </a>
            )
          })()}
        </ScrollReveal>

        {/* ── Remaining 3 cards ── */}
        <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {platforms.slice(1).map((p, index) => {
            const inner = (
              <div className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-background p-7 transition-all hover:shadow-lg">
                <div className="absolute top-0 left-0 right-0 h-1" style={{ background: p.gradient }} />

                <div className="flex items-start justify-between mb-4">
                  <span className="font-serif text-5xl font-bold" style={{ color: p.accent }}>
                    {p.number}
                  </span>
                  <span
                    className="mt-2 rounded-full px-2.5 py-1 text-xs font-semibold text-white"
                    style={{ background: p.gradient }}
                  >
                    {p.status}
                  </span>
                </div>

                <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: p.accent }}>
                  {p.label}
                </p>
                <h3 className="font-serif text-xl font-semibold text-foreground">
                  {p.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground flex-1">
                  {p.description}
                </p>

                {/* Feature bullets */}
                <ul className="mt-4 space-y-1.5">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <Check size={12} className="mt-0.5 shrink-0" style={{ color: p.accent }} />
                      {f}
                    </li>
                  ))}
                </ul>

                <div
                  className="mt-5 flex items-center gap-1 text-sm font-semibold transition-opacity group-hover:opacity-70"
                  style={{ color: p.accent }}
                >
                  {p.cta}
                  <ArrowUpRight size={14} />
                </div>
              </div>
            )

            return (
              <ScrollReveal key={p.number} delay={index * 100}>
                {p.external ? (
                  <a href={p.href} target="_blank" rel="noopener noreferrer" className="block h-full">
                    {inner}
                  </a>
                ) : (
                  <Link href={p.href} className="block h-full">
                    {inner}
                  </Link>
                )}
              </ScrollReveal>
            )
          })}
        </div>

      </div>
    </section>
  )
}
