"use client"

import Image from "next/image"
import Link from "next/link"
import { ScrollReveal } from "@/components/scroll-reveal"
import { ArrowUpRight } from "lucide-react"

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
      </div>
    </section>
  )
}
