import Image from "next/image"
import { ScrollReveal } from "@/components/scroll-reveal"
import { Eyebrow, Section, SectionHeading } from "./shared"

/**
 * Chapter 5 — Feed. Seed. Regenerate., and what it looks like on a real plate.
 *
 * This merges the previous concept's `feed-seed-heal.tsx` and `meal-map.tsx`,
 * which presented the food grid and the plate analysis as two separate
 * explanations of the same mechanism. They are now one chapter: the framework,
 * then its practical expression.
 *
 * Framework roles are kept distinct across the page — `process.tsx` is what the
 * *product* does (Assess → Score → Understand → Improve); this is what the
 * *person* does.
 *
 * ── Scientific accuracy ──────────────────────────────────────────────────────
 * Ordinary foods are never described as "postbiotics", and the page never says
 * "eat postbiotics". Postbiotics are compounds produced by microbial
 * fermentation, not a food group you buy. Feed/Seed/Regenerate are therefore
 * "informed by" the science, not synonyms for it. Regenerate is framed as
 * supporting the conditions and processes that let the system work, which is
 * also why it has no food list — unlike Feed and Seed, no single food does it.
 * No diagnostic, treatment or guaranteed-outcome claims anywhere.
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
      "Vegetables, fruits, whole grains, legumes, nuts and seeds give the system inside you the raw material it runs on. Variety matters as much as quantity.",
    scienceLine: "Informed by prebiotics — the fibres and plant compounds that nourish your gut's beneficial residents.",
  },
  {
    number: "02",
    title: "Seed",
    science: "Probiotics",
    color: "var(--icon-teal)",
    gradientFrom: "var(--icon-green)",
    gradientTo: "var(--icon-teal)",
    image: "/probiotics-1.png",
    line: "Support beneficial living cultures through fermented foods and food patterns.",
    description:
      "Yoghurt with live cultures, kefir, kimchi, sauerkraut, lassi, miso — every food culture has its own living foods. Small, regular amounts count.",
    scienceLine: "Informed by probiotics — the living cultures found in fermented foods.",
  },
  {
    number: "03",
    title: "Regenerate",
    science: "Postbiotics",
    color: "var(--icon-orange)",
    gradientFrom: "var(--icon-yellow)",
    gradientTo: "var(--icon-orange)",
    image: "/postbiotics-1.png",
    line: "Support the routines and rhythms that let your food system function, adapt and recover.",
    description:
      "Meal rhythm, eating pace, rest and the overall pattern of your days shape what your system can do with what you feed it. No single food does this on its own.",
    scienceLine: "Informed by postbiotics — the beneficial compounds produced when your gut bacteria ferment fibre. They are made by the system, not eaten directly.",
  },
]

/* How the three land on a plate. Each component is described by the job it does,
   never as a "good" or "bad" food — the brief is explicit about that, and it is
   also how the rest of the product talks. */
const PLATE_PARTS = [
  {
    label: "Fibre foundation",
    supports: "Feed",
    color: "var(--icon-green)",
    gradient: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))",
    examples: ["Leafy greens", "Broccoli", "Legumes", "Whole grains"],
  },
  {
    label: "Fermented element",
    supports: "Seed",
    color: "var(--icon-teal)",
    gradient: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))",
    examples: ["Yoghurt", "Kimchi", "Sauerkraut", "Kefir"],
  },
  {
    label: "Quality protein",
    supports: "Feed",
    color: "var(--icon-orange)",
    gradient: "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange))",
    examples: ["Eggs", "Salmon", "Beans", "Tempeh"],
  },
  {
    label: "Everyday fats",
    supports: "Regenerate",
    color: "var(--icon-yellow)",
    gradient: "linear-gradient(135deg, var(--icon-orange), var(--icon-yellow))",
    examples: ["Avocado", "Olive oil", "Nuts", "Seeds"],
  },
]

export function Foundation() {
  return (
    <Section>
      <ScrollReveal>
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <Eyebrow>The Foundation of EatoBiotics</Eyebrow>
          <SectionHeading>
            Feed. Seed. <span className="brand-gradient-text">Regenerate.</span>
          </SectionHeading>
          <p className="mx-auto mt-6 max-w-xl text-lg font-medium leading-relaxed text-foreground">
            Feed your body. Seed your microbiome. Regenerate the{" "}
            <span className="font-semibold text-icon-green">Food System Inside You</span>.
          </p>
          <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-muted-foreground">
            Three simple actions informed by the science of prebiotics, probiotics and
            postbiotics.
          </p>
        </div>
      </ScrollReveal>

      <div className="grid gap-8 md:grid-cols-3 md:gap-10">
        {PILLARS.map((p, index) => (
          <ScrollReveal key={p.number} delay={index * 150}>
            <div className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-background transition-all hover:shadow-lg">
              <div
                aria-hidden
                className="absolute left-0 right-0 top-0 z-10 h-1.5"
                style={{ background: `linear-gradient(90deg, ${p.gradientFrom}, ${p.gradientTo})` }}
              />
              <div className="w-full overflow-hidden">
                <Image
                  src={p.image}
                  alt=""
                  width={600}
                  height={360}
                  sizes="(max-width: 768px) 90vw, 380px"
                  className="h-auto w-full"
                />
              </div>
              <div className="flex flex-1 flex-col p-8">
                <span
                  className="font-serif text-5xl font-semibold md:text-6xl"
                  style={{ color: p.color }}
                >
                  {p.number}
                </span>
                <h3 className="mt-5 font-serif text-2xl font-semibold text-foreground">
                  {p.title}
                </h3>
                <p
                  className="mt-1 text-sm font-semibold uppercase tracking-wider"
                  style={{ color: p.color }}
                >
                  {p.science}
                </p>
                <p className="mt-4 text-base font-medium leading-relaxed text-foreground">
                  {p.line}
                </p>
                <p className="mt-3 flex-1 text-base leading-relaxed text-muted-foreground">
                  {p.description}
                </p>
                <p className="mt-5 border-t border-border/60 pt-4 text-sm leading-relaxed text-muted-foreground">
                  {p.scienceLine}
                </p>
              </div>
            </div>
          </ScrollReveal>
        ))}
      </div>

      {/* ── The practical expression ── */}
      <div className="mt-20 border-t border-border/60" />

      <ScrollReveal>
        <div className="mx-auto mt-16 max-w-2xl text-center">
          <h3 className="font-serif text-3xl font-semibold text-foreground sm:text-4xl text-balance">
            What does Feed. Seed. Regenerate.{" "}
            <span className="brand-gradient-text">look like on a real plate?</span>
          </h3>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-muted-foreground">
            Not a diet and not a rulebook — a way of seeing any plate, bowl, thali or shared
            meal. Each part does a different job for the system inside you.
          </p>
        </div>
      </ScrollReveal>

      <div className="mt-12 flex flex-col gap-10 lg:flex-row lg:items-center lg:gap-16">
        <div className="lg:w-[46%] lg:shrink-0">
          <ScrollReveal delay={100}>
            <div className="flex justify-center">
              <Image
                src="/images/eatobiotics/eatobiotics-plate.png"
                alt="The EatoBiotics plate, divided into a fibre foundation, a fermented element, quality protein and everyday fats"
                width={1000}
                height={1000}
                sizes="(max-width: 1024px) 85vw, 520px"
                className="h-auto w-full max-w-[520px] object-contain"
              />
            </div>
          </ScrollReveal>
        </div>

        {/* Annotations as full cards rather than labels pinned around the diagram.
            The brief forbids shrinking a labelled diagram into unreadable mobile
            text; stacking the annotations means they stay at body size on a 320px
            screen and simply reflow to two columns on desktop. */}
        <div className="flex-1">
          <ScrollReveal delay={180}>
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {PLATE_PARTS.map((q) => (
                <li
                  key={q.label}
                  className="relative overflow-hidden rounded-2xl border border-border bg-background p-5"
                >
                  <div
                    aria-hidden
                    className="absolute left-0 right-0 top-0 h-1"
                    style={{ background: q.gradient }}
                  />
                  <div className="flex items-baseline justify-between gap-3">
                    <h4 className="font-serif text-lg font-semibold text-foreground">
                      {q.label}
                    </h4>
                    <span
                      className="shrink-0 rounded-full px-2.5 py-1 text-xs font-bold"
                      style={{
                        background: `color-mix(in srgb, ${q.color} 15%, transparent)`,
                        color: `color-mix(in srgb, ${q.color} 78%, var(--foreground))`,
                      }}
                    >
                      {q.supports}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {q.examples.map((ex) => (
                      <span
                        key={ex}
                        className="rounded-full px-2.5 py-1 text-xs font-medium text-white"
                        style={{ background: q.gradient }}
                      >
                        {ex}
                      </span>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
              Balance and diversity matter more than any single ingredient, and every food
              culture assembles these parts differently.
            </p>
          </ScrollReveal>
        </div>
      </div>
    </Section>
  )
}
