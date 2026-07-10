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
