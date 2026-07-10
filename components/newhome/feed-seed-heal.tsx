import Image from "next/image"
import { ScrollReveal } from "@/components/scroll-reveal"
import { Eyebrow, Section, SectionHeading } from "./shared"

/**
 * Section 3 — accessible language first, scientific foundation beneath.
 * Mirrors the production three-biotics card pattern (components/home/
 * the-framework.tsx): same images, top gradient bar, serif display numbers,
 * uppercase subtitle, stat pill, and bottom gradient strip.
 */
const PILLARS = [
  {
    number: "01",
    title: "Feed",
    science: "Prebiotics",
    color: "var(--icon-lime)",
    gradientFrom: "var(--icon-lime)",
    gradientTo: "var(--icon-green)",
    image: "/prebiotics-1.png",
    line: "Feed the system with diverse, fibre-rich foods.",
    description:
      "Vegetables, fruits, whole grains, legumes, nuts, and seeds give the system inside you the raw material it runs on. Variety matters as much as quantity.",
    scienceLine: "The fibres and plant compounds that nourish your gut's beneficial residents.",
  },
  {
    number: "02",
    title: "Seed",
    science: "Probiotics",
    color: "var(--icon-teal)",
    gradientFrom: "var(--icon-green)",
    gradientTo: "var(--icon-teal)",
    image: "/probiotics-1.png",
    line: "Support beneficial living cultures through appropriate fermented foods and food patterns.",
    description:
      "Yoghurt with live cultures, kefir, kimchi, sauerkraut, lassi, miso — every food culture has its own living foods. Small, regular amounts count.",
    scienceLine: "The living cultures found in fermented foods.",
  },
  {
    number: "03",
    title: "Heal",
    science: "Postbiotics",
    color: "var(--icon-orange)",
    gradientFrom: "var(--icon-yellow)",
    gradientTo: "var(--icon-orange)",
    image: "/postbiotics-1.png",
    line: "Support the environment, routines, and interactions that allow the internal food system to function well.",
    description:
      "Meal rhythm, eating pace, rest, and the overall pattern of your days shape what your food system can do with what you feed it. No single food does this on its own.",
    scienceLine: "The beneficial outcomes your system produces when it is fed and supported well.",
  },
]

export function FeedSeedHeal() {
  return (
    <Section>
      <ScrollReveal>
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <Eyebrow>The Foundation</Eyebrow>
          <SectionHeading>
            Feed. Seed. <span className="brand-gradient-text">Heal.</span>
          </SectionHeading>
          <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-muted-foreground">
            Three everyday words, built on the 3 Biotics — Prebiotics, Probiotics, and Postbiotics.
            The everyday language is how you act; the science is why it works.
          </p>
        </div>
      </ScrollReveal>

      <div className="grid gap-8 md:grid-cols-3 md:gap-10">
        {PILLARS.map((p, index) => (
          <ScrollReveal key={p.number} delay={index * 150}>
            <div className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-background transition-all hover:shadow-lg">
              {/* Top gradient bar */}
              <div
                className="absolute left-0 right-0 top-0 h-1.5"
                style={{ background: `linear-gradient(90deg, ${p.gradientFrom}, ${p.gradientTo})` }}
              />
              {/* Biotics image */}
              <div className="w-full overflow-hidden">
                <Image src={p.image} alt={p.science} width={600} height={360} className="h-auto w-full" />
              </div>
              <div className="flex flex-1 flex-col p-8">
                <span className="font-serif text-6xl font-semibold md:text-7xl" style={{ color: p.color }}>
                  {p.number}
                </span>
                <h3 className="mt-6 font-serif text-xl font-semibold text-foreground">{p.title}</h3>
                <p className="mt-1 text-sm font-semibold uppercase tracking-wider" style={{ color: p.color }}>
                  {p.science}
                </p>
                <p className="mt-4 text-sm font-medium leading-relaxed text-foreground">{p.line}</p>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">{p.description}</p>
                <span
                  className="mt-5 inline-flex w-fit items-center rounded-full px-3.5 py-1.5 text-sm font-bold"
                  style={{
                    background: `color-mix(in srgb, ${p.color} 15%, transparent)`,
                    color: `color-mix(in srgb, ${p.color} 78%, var(--foreground))`,
                  }}
                >
                  Scientific foundation: {p.science}
                </span>
                <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{p.scienceLine}</p>
                <div className="mt-6">
                  <div
                    className="h-2 w-20 rounded-full"
                    style={{ background: `linear-gradient(90deg, ${p.gradientFrom}, ${p.gradientTo})` }}
                  />
                </div>
              </div>
            </div>
          </ScrollReveal>
        ))}
      </div>
    </Section>
  )
}
