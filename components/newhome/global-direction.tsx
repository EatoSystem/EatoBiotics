import { ScrollReveal } from "@/components/scroll-reveal"
import { Eyebrow, Section, SectionHeading, StatusBadge } from "./shared"

/**
 * Section 8 — global direction. Direction only; nothing here is live.
 * Cards mirror the quadrant card idiom (the-framework.tsx): rounded-2xl,
 * border-border, top gradient bar, gradient example chips.
 */
const EATING_STRUCTURES = ["Plate", "Bowl", "Thali", "Tiffin", "Mezze", "Mixed household meals"]

const ADAPTS_TO = [
  "Country", "Culture", "Language", "Budget", "Household", "Dietary pattern",
  "Religious requirements", "Food availability", "Meal structure", "Local terminology",
]

export function GlobalDirection() {
  return (
    <Section>
      <ScrollReveal>
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <Eyebrow>Global By Philosophy, Local By Practice</Eyebrow>
          <SectionHeading>
            The science is global. <span className="brand-gradient-text">The food is local.</span>
          </SectionHeading>
          <div className="mt-5 flex justify-center">
            <StatusBadge status="direction" />
          </div>
          <p className="mx-auto mt-5 max-w-lg text-base leading-relaxed text-muted-foreground">
            The Food System Inside You is universal. How you feed it is personal, local, and
            cultural. Kefir and lassi, sauerkraut and kimchi, oats and dal — different foods, same
            Feed, Seed, and Heal. The future EatoBiotics platform is designed to adapt to how
            people actually eat, wherever they are.
          </p>
        </div>
      </ScrollReveal>

      <div className="grid gap-6 md:grid-cols-2">
        <ScrollReveal delay={80}>
          <div className="relative h-full overflow-hidden rounded-2xl border border-border bg-background p-8 transition-shadow hover:shadow-lg">
            <div
              className="absolute left-0 right-0 top-0 h-1"
              style={{ background: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))" }}
            />
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--icon-green)" }}>
              Designed to adapt to
            </p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {ADAPTS_TO.map((a) => (
                <span
                  key={a}
                  className="inline-flex items-center rounded-full px-3.5 py-1.5 text-sm font-bold"
                  style={{
                    background: "color-mix(in srgb, var(--icon-green) 15%, transparent)",
                    color: "color-mix(in srgb, var(--icon-green) 78%, var(--foreground))",
                  }}
                >
                  {a}
                </span>
              ))}
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={160}>
          <div className="relative h-full overflow-hidden rounded-2xl border border-border bg-background p-8 transition-shadow hover:shadow-lg">
            <div
              className="absolute left-0 right-0 top-0 h-1"
              style={{ background: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))" }}
            />
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--icon-teal)" }}>
              Every way the world eats
            </p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {EATING_STRUCTURES.map((s) => (
                <span
                  key={s}
                  className="rounded-full px-3.5 py-1.5 text-sm font-medium text-white"
                  style={{ background: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))" }}
                >
                  {s}
                </span>
              ))}
            </div>
            <p className="mt-5 text-xs leading-relaxed text-muted-foreground">
              One science, expressed through the meal structures people already use — not a Western
              plate imposed on everyone.
            </p>
          </div>
        </ScrollReveal>
      </div>
    </Section>
  )
}
