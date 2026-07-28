import Image from "next/image"
import { ScrollReveal } from "@/components/scroll-reveal"
import { Eyebrow, Section, SectionHeading } from "./section-shared"

/**
 * Feed. Seed. Regenerate. — the homepage's foundation section.
 *
 * The third pillar reads "Regenerate" here, positioning the brand around continuous
 * biological renewal rather than healing. NOTE: "Heal" remains the label of the third
 * *scoring* dimension elsewhere (app/api/score-card, lib/pillars.ts, lib/cms/taxonomy.ts,
 * lib/email/paid-report-email.ts). Renaming those touches the score model, emails and
 * CMS taxonomy, so it is deliberately out of scope for this copy change.
 *
 * Accessible language first, scientific foundation beneath. Replaced
 * `the-framework.tsx` ("Three biotics. One plate.") on the homepage; that
 * component is still rendered by /c/[country] and /enter, so both remain.
 *
 * Shares the-framework's exact four images and its card idiom — top gradient
 * bar, serif display numbers, uppercase subtitle, stat pill, bottom gradient
 * strip — so this swap is page-weight neutral.
 */
/* How the three biotics land on a plate — mirrors the production framework's
   plate sub-section (the-framework.tsx quadrants), reusing its exact copy. */
const QUADRANTS = [
  {
    label: "Fiber Foundation",
    color: "var(--icon-green)",
    gradient: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))",
    examples: ["Leafy greens", "Broccoli", "Legumes", "Whole grains"],
    biotic: "PREBIOTIC BASE",
  },
  {
    label: "Fermented Foods",
    color: "var(--icon-teal)",
    gradient: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))",
    examples: ["Yogurt", "Kimchi", "Sauerkraut", "Kefir"],
    biotic: "PROBIOTIC SIDE",
  },
  {
    label: "Quality Protein",
    color: "var(--icon-orange)",
    gradient: "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange))",
    examples: ["Eggs", "Salmon", "Beans", "Tempeh"],
    biotic: "PROTEIN BALANCE",
  },
  {
    label: "Daily Support",
    color: "var(--icon-yellow)",
    gradient: "linear-gradient(135deg, var(--icon-orange), var(--icon-yellow))",
    examples: ["Avocado", "Olive oil", "Nuts", "Seeds"],
    biotic: "HEALTHY FATS",
  },
]

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
    title: "Regenerate",
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
          <Eyebrow>The Foundation of EatoBiotics</Eyebrow>
          <SectionHeading>
            Feed. Seed. <span className="brand-gradient-text">Regenerate.</span>
          </SectionHeading>
          {/* Primary explanatory sentence — carries the progression. */}
          <p className="mx-auto mt-6 max-w-xl text-lg font-medium leading-relaxed text-foreground">
            Feed your body. Seed your microbiome. Regenerate the{" "}
            <span className="font-semibold text-icon-green">Food System Inside You</span>.
          </p>
          {/* Scientific foundation — quieter, supporting line. */}
          <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-muted-foreground">
            Three simple actions inspired by the science of Prebiotics, Probiotics, and
            Postbiotics.
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

      {/* ── How it lands on a plate ── */}
      <div className="mt-20 border-t border-border/60" />
      <div className="mt-16 flex flex-col gap-12 lg:flex-row lg:items-center lg:gap-16">
        <div className="lg:w-[420px] lg:shrink-0">
          <ScrollReveal>
            <Eyebrow>From Words To Plate</Eyebrow>
            <h3 className="mt-4 font-serif text-3xl font-semibold text-foreground sm:text-4xl text-balance">
              One plate.{" "}
              <span className="brand-gradient-text">Feed, Seed, and Regenerate together.</span>
            </h3>
            <p className="mt-6 text-base leading-relaxed text-muted-foreground">
              Feed, Seed, and Regenerate are not a diet — they are a way of seeing any plate,
              bowl, or shared meal. Each part of the plate supports a different part of the food
              system inside you.
            </p>
          </ScrollReveal>
        </div>
        <div className="flex-1">
          <ScrollReveal delay={100}>
            <div className="flex justify-center">
              <Image
                src="/images/eatobiotics/eatobiotics-plate.png"
                alt="The EatoBiotics Plate showing prebiotic base, probiotic side, protein balance, and healthy fats"
                width={1000}
                height={1000}
                sizes="(max-width: 1024px) 90vw, 600px"
                className="h-auto w-full max-w-[560px] object-contain"
              />
            </div>
          </ScrollReveal>
          <ScrollReveal delay={200}>
            <div className="mt-10 grid grid-cols-2 gap-4">
              {QUADRANTS.map((q) => (
                <div key={q.label} className="relative overflow-hidden rounded-2xl border border-border bg-background p-5 transition-shadow hover:shadow-lg">
                  <div className="absolute left-0 right-0 top-0 h-1" style={{ background: q.gradient }} />
                  <p className="text-xs font-bold uppercase tracking-widest" style={{ color: q.color }}>
                    {q.biotic}
                  </p>
                  <h4 className="mt-1.5 font-serif text-base font-semibold text-foreground">{q.label}</h4>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {q.examples.map((ex) => (
                      <span key={ex} className="rounded-full px-2 py-0.5 text-xs font-medium text-white" style={{ background: q.gradient }}>
                        {ex}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </div>
    </Section>
  )
}
