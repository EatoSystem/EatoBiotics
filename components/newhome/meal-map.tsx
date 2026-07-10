import Image from "next/image"
import { ScrollReveal } from "@/components/scroll-reveal"
import { Eyebrow, Section, StatusBadge } from "./shared"

/*
 * "Meal Map" is a provisional working name for the concept only — keep the
 * name isolated here so it can be changed in one place.
 */
const CONCEPT_NAME = "Meal Map"

/**
 * Section 7 — future signature interaction, presented as concept only.
 * Flow steps use the production tinted step-card idiom (how-it-works.tsx).
 */
const FLOW = [
  {
    number: "01",
    text: "Photograph a meal",
    color: "var(--icon-lime)",
    bgGradient: "linear-gradient(160deg, color-mix(in srgb, var(--icon-lime) 10%, transparent), transparent 60%)",
  },
  {
    number: "02",
    text: "Map it through Feed, Seed, and Heal",
    color: "var(--icon-green)",
    bgGradient: "linear-gradient(160deg, color-mix(in srgb, var(--icon-green) 10%, transparent), transparent 60%)",
  },
  {
    number: "03",
    text: "See one strength",
    color: "var(--icon-teal)",
    bgGradient: "linear-gradient(160deg, color-mix(in srgb, var(--icon-teal) 10%, transparent), transparent 60%)",
  },
  {
    number: "04",
    text: "Discover one practical opportunity",
    color: "var(--icon-yellow)",
    bgGradient: "linear-gradient(160deg, color-mix(in srgb, var(--icon-yellow) 10%, transparent), transparent 60%)",
  },
  {
    number: "05",
    text: "Add it to your journey",
    color: "var(--icon-orange)",
    bgGradient: "linear-gradient(160deg, color-mix(in srgb, var(--icon-orange) 10%, transparent), transparent 60%)",
  },
]

export function MealMap() {
  return (
    <Section>
      <ScrollReveal>
        <div className="max-w-2xl">
          <Eyebrow>A Future Signature Experience</Eyebrow>
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <h2 className="font-serif text-4xl font-semibold text-foreground sm:text-5xl text-balance">
              {CONCEPT_NAME}
            </h2>
            <StatusBadge status="in-development" />
          </div>
          <p className="mt-5 text-base font-medium leading-relaxed text-foreground sm:text-lg">
            See how this meal feeds the system inside you.
          </p>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            Today you can describe a plate in words and see how it feeds your system. {CONCEPT_NAME}{" "}
            is where that is going: point your camera at any meal — a plate, a bowl, a thali, a
            tiffin — and see its composition through Feed, Seed, and Heal. No calories, no
            &ldquo;good&rdquo; or &ldquo;bad&rdquo; meals, no judgement — one strength, one
            practical opportunity, and where uncertainty exists, you confirm what&apos;s on the
            plate.
          </p>
        </div>
      </ScrollReveal>

      {/* Illustrative analysis card — the future interaction, made visible */}
      <ScrollReveal delay={120}>
        <div className="relative mx-auto mt-14 max-w-2xl">
          <div
            aria-hidden
            className="pointer-events-none absolute -inset-6 -z-10 rounded-[2.5rem] opacity-70 blur-3xl"
            style={{ background: "radial-gradient(60% 60% at 50% 45%, color-mix(in srgb, var(--icon-teal) 26%, transparent), transparent 75%)" }}
          />
          <div
            className="relative overflow-hidden rounded-[2rem] border-2 bg-card shadow-[0_40px_80px_-32px_rgba(20,37,15,0.45)]"
            style={{ borderColor: "color-mix(in srgb, var(--icon-teal) 40%, transparent)" }}
          >
            <div
              className="h-1.5 w-full"
              style={{ background: "linear-gradient(90deg, var(--icon-lime), var(--icon-green), var(--icon-teal), var(--icon-orange))" }}
            />
            <div className="relative">
              <div className="relative h-72 w-full sm:h-80">
                <Image
                  src="/food-3.webp"
                  alt="A colourful meal of vegetables, legumes, fermented foods, and plant proteins"
                  fill
                  sizes="(max-width: 640px) 90vw, 672px"
                  className="object-cover"
                />
                <span
                  className="absolute left-4 top-4 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-white"
                  style={{ background: "linear-gradient(135deg, var(--icon-lime), var(--icon-teal))" }}
                >
                  Concept illustration — not a live feature
                </span>
              </div>
              <div className="px-7 py-6 sm:px-9">
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: "Feed · 9 plant foods", color: "var(--icon-green)" },
                    { label: "Seed · sauerkraut spotted", color: "var(--icon-teal)" },
                    { label: "Heal · unhurried, balanced", color: "var(--icon-orange)" },
                  ].map((chip) => (
                    <span
                      key={chip.label}
                      className="inline-flex items-center rounded-full px-3.5 py-1.5 text-sm font-bold"
                      style={{
                        background: `color-mix(in srgb, ${chip.color} 15%, transparent)`,
                        color: `color-mix(in srgb, ${chip.color} 78%, var(--foreground))`,
                      }}
                    >
                      {chip.label}
                    </span>
                  ))}
                </div>
                <div
                  className="mt-5 rounded-2xl px-5 py-4 text-base leading-relaxed text-muted-foreground"
                  style={{ background: "color-mix(in srgb, var(--icon-green) 7%, var(--card))" }}
                >
                  <span className="font-semibold text-foreground">One strength: </span>
                  Excellent plant variety — nine different plant foods in one meal.
                </div>
                <div
                  className="mt-4 rounded-2xl px-5 py-4 text-base leading-relaxed text-muted-foreground"
                  style={{ background: "color-mix(in srgb, var(--icon-orange) 7%, var(--card))" }}
                >
                  <span className="font-semibold text-foreground">One opportunity: </span>
                  A spoonful of live yoghurt or kefir alongside would add a living-culture element.
                </div>
              </div>
            </div>
          </div>
        </div>
      </ScrollReveal>

      <ol className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
        {FLOW.map((step, i) => (
          <ScrollReveal key={step.number} delay={i * 80}>
            <li
              className="flex h-full min-h-[150px] flex-col rounded-3xl p-6"
              style={{
                background: step.bgGradient,
                border: `1.5px solid color-mix(in srgb, ${step.color} 30%, transparent)`,
                borderLeft: `4px solid ${step.color}`,
              }}
            >
              <span className="font-serif text-4xl font-bold leading-none" style={{ color: step.color }}>
                {step.number}
              </span>
              <p className="mt-4 text-sm font-medium leading-relaxed text-foreground">{step.text}</p>
            </li>
          </ScrollReveal>
        ))}
      </ol>

      <ScrollReveal delay={200}>
        <p className="mt-6 text-xs leading-relaxed text-muted-foreground">
          Concept preview — composition guidance, not medical advice. Image recognition will not
          identify everything perfectly, so you stay in control of what counts.
        </p>
      </ScrollReveal>
    </Section>
  )
}
