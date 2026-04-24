"use client"

import Image from "next/image"
import Link from "next/link"
import { ScrollReveal } from "@/components/scroll-reveal"
import { ArrowUpRight, ArrowRight } from "lucide-react"

const WEEKLY_PLATES = [
  {
    number: "1.1",
    name: "The Food System Bowl",
    role: "Foundation",
    image: "/plate-bowl.png",
    accent: "var(--icon-lime)",
    accentClass: "text-icon-lime",
    borderColor: "border-icon-lime/20",
    // Solid — the simplest, clearest treatment
    topBar: "var(--icon-lime)",
  },
  {
    number: "1.2",
    name: "The Immunity, Mood & Energy Plate",
    role: "Function",
    image: "/plate-immunity.png",
    accent: "var(--icon-yellow)",
    accentClass: "text-icon-yellow",
    borderColor: "border-icon-yellow/20",
    // Brighter gradient — energised and vivid
    topBar: "linear-gradient(90deg, var(--icon-lime), var(--icon-yellow))",
  },
  {
    number: "1.3",
    name: "The Living Plate",
    role: "Richness",
    image: "/plate-living.png",
    accent: "var(--icon-teal)",
    accentClass: "text-icon-teal",
    borderColor: "border-icon-teal/20",
    // Full brand gradient — richest, most colourful
    topBar: "linear-gradient(90deg, var(--icon-lime), var(--icon-green), var(--icon-teal), var(--icon-yellow))",
  },
  {
    number: "1.4",
    name: "The Rebuild Plate",
    role: "Restoration",
    image: "/plate-rebuild.png",
    accent: "var(--icon-orange)",
    accentClass: "text-icon-orange",
    borderColor: "border-icon-orange/20",
    // Calm teal-to-green — grounded and restorative
    topBar: "linear-gradient(90deg, var(--icon-teal), var(--icon-green))",
  },
]

const quadrants = [
  {
    label: "Fiber Foundation",
    color: "var(--icon-lime)",
    gradient: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))",
    examples: ["Leafy greens", "Legumes", "Root vegetables", "Whole grains"],
    biotic: "PREBIOTIC",
  },
  {
    label: "Fermented Foods",
    color: "var(--icon-teal)",
    gradient: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))",
    examples: ["Yogurt", "Kimchi", "Sauerkraut", "Kefir"],
    biotic: "PROBIOTIC",
  },
  {
    label: "Quality Protein",
    color: "var(--icon-yellow)",
    gradient: "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange))",
    examples: ["Eggs", "Salmon", "Beans", "Tempeh"],
    biotic: "PROTEIN",
  },
  {
    label: "Healthy Fats",
    color: "var(--icon-orange)",
    gradient: "linear-gradient(135deg, var(--icon-teal), var(--icon-yellow))",
    examples: ["Olive oil", "Avocado", "Nuts", "Seeds"],
    biotic: "POSTBIOTIC",
  },
]

export function ThePlate() {
  return (
    <section className="bg-secondary/40 px-6 py-24 md:py-32">
      <div className="mx-auto max-w-[1200px]">
        <div className="flex flex-col gap-16 lg:flex-row lg:items-center lg:gap-20">

          {/* Left: text */}
          <div className="lg:w-[420px] lg:shrink-0">
            <ScrollReveal>
              <p className="text-xs font-semibold uppercase tracking-widest text-icon-teal">
                The Framework
              </p>
              <h2 className="mt-4 font-serif text-4xl font-semibold text-foreground sm:text-5xl text-balance">
                One plate.{" "}
                <span className="brand-gradient-text">Built once a week.</span>
              </h2>
              <p className="mt-6 text-base leading-relaxed text-muted-foreground">
                The EatoBiotics Plate is the practical model at the heart of the framework.
                Four quadrants — built once on Monday, eaten every day until Friday.
                One decision. Five days of consistency.
              </p>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                Each quadrant targets a different part of your microbiome — feeding it,
                adding to it, and giving it everything it needs to produce the compounds
                that make you feel better every day.
              </p>
            </ScrollReveal>
            <ScrollReveal delay={150}>
              <Link
                href="/biotics"
                className="mt-8 inline-flex items-center gap-2 rounded-full border-2 border-icon-green px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-icon-green hover:text-white"
              >
                Learn the framework
                <ArrowUpRight size={14} />
              </Link>
            </ScrollReveal>
          </div>

          {/* Right: plate image + quadrant cards */}
          <div className="flex-1">
            {/* Plate image */}
            <ScrollReveal delay={100}>
              <div className="flex justify-center">
                <Image
                  src="/eatobiotics-plate.png"
                  alt="The EatoBiotics Plate — divided into four sections: Prebiotic Base with leafy greens and vegetables, Probiotic Side with fermented foods, Postbiotic Builders with berries and dark chocolate, and Protein Balance with salmon, eggs and beans."
                  width={500}
                  height={500}
                  className="w-full max-w-[420px] drop-shadow-md"
                />
              </div>
              <p className="mt-2 text-center text-xs text-muted-foreground">
                A circular system where each biotic type supports the next.
              </p>
            </ScrollReveal>

            {/* Quadrant cards */}
            <ScrollReveal delay={200}>
              <div className="mt-8 grid grid-cols-2 gap-4">
                {quadrants.map((q, index) => (
                  <ScrollReveal key={q.label} delay={index * 80}>
                    <div className="relative overflow-hidden rounded-2xl border border-border bg-background p-5 transition-shadow hover:shadow-lg">
                      <div
                        className="absolute top-0 left-0 right-0 h-1"
                        style={{ background: q.gradient }}
                      />
                      <p
                        className="text-xs font-bold uppercase tracking-widest"
                        style={{ color: q.color }}
                      >
                        {q.biotic}
                      </p>
                      <h3 className="mt-1.5 font-serif text-base font-semibold text-foreground">
                        {q.label}
                      </h3>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {q.examples.map((ex) => (
                          <span
                            key={ex}
                            className="rounded-full px-2 py-0.5 text-xs font-medium text-white"
                            style={{ background: q.gradient }}
                          >
                            {ex}
                          </span>
                        ))}
                      </div>
                    </div>
                  </ScrollReveal>
                ))}
              </div>
              <p className="mt-4 text-center text-xs text-muted-foreground">
                Build this plate once. Eat it five days. Change it next week.
              </p>
            </ScrollReveal>
          </div>
        </div>

        {/* ── The Four Plates ───────────────────────────────────────────────── */}
        {/* Soft separator — same section, new chapter within it */}
        <div className="mt-20 border-t border-border/60" />

        <div className="mt-16">
          <ScrollReveal>
            {/* Bridge copy — connects the framework above to its weekly expressions */}
            <p className="text-center text-sm leading-relaxed text-muted-foreground max-w-xl mx-auto">
              Every week, the framework expresses itself through four distinct plates — each with
              its own role, emphasis, and character.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={60}>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-icon-teal">
                  The Four Plates
                </p>
                <h2 className="mt-3 font-serif text-3xl font-semibold text-foreground sm:text-4xl text-balance">
                  Four plates. Four jobs.{" "}
                  <span className="brand-gradient-text">One complete weekly system.</span>
                </h2>
              </div>
              <Link
                href="/weekly"
                className="flex shrink-0 items-center gap-1 text-sm font-medium text-icon-green transition-colors hover:text-icon-orange"
              >
                See this week&apos;s plates
                <ArrowUpRight size={14} />
              </Link>
            </div>
          </ScrollReveal>

          {/* Four plate cards */}
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {WEEKLY_PLATES.map((plate, i) => (
              <ScrollReveal key={plate.number} delay={i * 70}>
                <Link href="/weekly" className="group block h-full">
                  <div
                    className={`flex h-full flex-col overflow-hidden rounded-2xl border ${plate.borderColor} bg-background transition-all hover:shadow-lg`}
                  >
                    {/* Per-plate coloured top stripe */}
                    <div className="h-[5px] w-full shrink-0" style={{ background: plate.topBar }} />

                    {/* Plate image */}
                    <div className="relative overflow-hidden bg-muted/10">
                      <Image
                        src={plate.image}
                        alt={plate.name}
                        width={600}
                        height={338}
                        className="w-full h-auto transition-transform duration-500 group-hover:scale-[1.02]"
                      />
                      {/* Number badge */}
                      <div
                        className="absolute right-2.5 top-2.5 flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-white shadow-sm"
                        style={{ background: plate.accent }}
                      >
                        {plate.number}
                      </div>
                    </div>

                    {/* Card text — kept intentionally lean */}
                    <div className="flex flex-1 flex-col p-4">
                      <span className={`text-[11px] font-bold uppercase tracking-widest ${plate.accentClass}`}>
                        {plate.role}
                      </span>
                      <h3 className="mt-1.5 font-serif text-sm font-semibold text-foreground leading-snug">
                        {plate.name}
                      </h3>
                      <div className="mt-auto pt-4">
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-semibold ${plate.accentClass} opacity-0 transition-opacity group-hover:opacity-100`}
                        >
                          View plate <ArrowRight size={11} />
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </ScrollReveal>
            ))}
          </div>

          {/* Single centred CTA below the grid */}
          <ScrollReveal delay={200}>
            <div className="mt-10 text-center">
              <Link
                href="/weekly"
                className="inline-flex items-center gap-2 rounded-full border-2 border-icon-teal px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-icon-teal hover:text-white"
              >
                Explore the weekly system
                <ArrowUpRight size={14} />
              </Link>
            </div>
          </ScrollReveal>
        </div>

      </div>
    </section>
  )
}
