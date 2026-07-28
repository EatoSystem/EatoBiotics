import { ScrollReveal } from "@/components/scroll-reveal"
import { Eyebrow, Section, SectionHeading, StatusBadge } from "./section-shared"

/**
 * Homepage section — global direction. The science is global; the food is local.
 *
 * The thesis is carried by the pairings themselves: two foods from different food
 * cultures, side by side, doing the same job. Those three pairs are the ones
 * already named in the section's approved copy, so this makes a signed-off claim
 * visible rather than introducing new ones.
 *
 * Built from the same idiom as feed-seed-heal.tsx and the-framework.tsx — rounded-2xl
 * card, h-1.5 top gradient bar, colour-mix tint pill, bottom gradient strip, radial
 * glow — so it reads as part of the page rather than a plain block of text.
 *
 * Stacked full-width cards rather than a 3-column grid: feed-seed-heal directly above
 * is already a three-card grid, and a wide card gives the pair room at display size.
 *
 * Deliberately has no photography. The version before this illustrated "not a Western
 * plate imposed on everyone" with six near-identical Western composed plates, which
 * argued against the copy it sat beneath; the biotic photos that would fit are already
 * used in the section directly above.
 *
 * Colours match the Feed/Seed/Heal pillars in feed-seed-heal.tsx exactly, so the two
 * sections read as one idea.
 */

/** Only Feed and Seed pair foods. See the note on Heal below PAIRINGS. */
const PAIRINGS = [
  {
    a: "Sauerkraut",
    b: "Kimchi",
    pillar: "Seed",
    science: "Probiotics",
    color: "var(--icon-teal)",
    gradient: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))",
    note: "Two fermented cabbages, two continents, the same live cultures.",
  },
  {
    a: "Kefir",
    b: "Lassi",
    pillar: "Seed",
    science: "Probiotics",
    color: "var(--icon-teal)",
    gradient: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))",
    note: "Two cultured milk drinks that arrived at the same answer separately.",
  },
  {
    a: "Oats",
    b: "Dal",
    pillar: "Feed",
    science: "Prebiotics",
    color: "var(--icon-lime)",
    gradient: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))",
    note: "A grain and a pulse, both feeding the same bacteria the same fibre.",
  },
]

/*
 * No Heal pairing, on purpose. Heal is defined in feed-seed-heal.tsx as meal
 * rhythm, eating pace and rest — "No single food does this on its own." Pairing
 * two foods under Heal would contradict the framework this section reinforces.
 */

/** Kept because they are specific and make the point; the abstract "adapts to"
    list (Country, Culture, Language, Budget…) was removed as a feature list. */
const EATING_STRUCTURES = ["Plate", "Bowl", "Thali", "Tiffin", "Mezze", "Mixed household meals"]

export function GlobalDirection() {
  return (
    <Section>
      <ScrollReveal>
        <div className="mx-auto max-w-2xl text-center">
          <Eyebrow>Global By Philosophy, Local By Practice</Eyebrow>
          <SectionHeading>
            The science is global. <span className="brand-gradient-text">The food is local.</span>
          </SectionHeading>
          <div className="mt-5 flex justify-center">
            <StatusBadge status="direction" />
          </div>
          <p className="mx-auto mt-5 max-w-lg text-base leading-relaxed text-muted-foreground">
            The Food System Inside You is universal. How you feed it is personal, local and
            cultural. The future EatoBiotics platform is designed to adapt to how people
            actually eat, wherever they are.
          </p>
        </div>
      </ScrollReveal>

      {/* The pairings — the thesis, made visible */}
      <div className="relative mx-auto mt-16 max-w-4xl">
        {/* Ambient glow behind the group, matching powers-everything.tsx */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 blur-3xl"
          style={{
            background:
              "radial-gradient(50% 45% at 50% 50%, rgba(45,170,110,0.16), rgba(168,224,99,0.10) 55%, transparent 78%)",
          }}
        />

        <div className="flex flex-col gap-6">
          {PAIRINGS.map((p, i) => (
            <ScrollReveal key={`${p.a}-${p.b}`} delay={i * 120}>
              <div className="relative overflow-hidden rounded-2xl border border-border bg-background transition-all hover:shadow-lg">
                {/* Top gradient bar */}
                <div
                  className="absolute left-0 right-0 top-0 h-1.5"
                  style={{ background: p.gradient }}
                />

                <div className="flex flex-col gap-6 p-8 sm:flex-row sm:items-center sm:gap-10 md:p-10">
                  {/* The pair, meeting at a glowing connector */}
                  <div className="flex-1">
                    <div className="flex items-center gap-4 sm:gap-6">
                      <p className="flex-1 text-right font-serif text-2xl font-semibold text-foreground sm:text-3xl md:text-4xl">
                        {p.a}
                      </p>

                      <span aria-hidden className="relative flex shrink-0 items-center">
                        <span
                          className="absolute -inset-3 -z-10 rounded-full blur-md"
                          style={{
                            background: `radial-gradient(circle, color-mix(in srgb, ${p.color} 40%, transparent), transparent 70%)`,
                          }}
                        />
                        <span
                          className="h-1 w-10 rounded-full sm:w-14"
                          style={{ background: p.gradient }}
                        />
                      </span>

                      <p className="flex-1 font-serif text-2xl font-semibold text-foreground sm:text-3xl md:text-4xl">
                        {p.b}
                      </p>
                    </div>

                    <p className="mt-4 text-center text-sm leading-relaxed text-muted-foreground">
                      {p.note}
                    </p>
                  </div>

                  {/* The job they share */}
                  <div className="flex shrink-0 flex-col items-center gap-3 sm:w-44 sm:items-start">
                    <span
                      className="inline-flex w-fit items-center rounded-full px-3.5 py-1.5 text-sm font-bold"
                      style={{
                        background: `color-mix(in srgb, ${p.color} 15%, transparent)`,
                        color: `color-mix(in srgb, ${p.color} 78%, var(--foreground))`,
                      }}
                    >
                      Same job — {p.pillar}
                    </span>
                    <p
                      className="text-xs font-semibold uppercase tracking-wider"
                      style={{ color: p.color }}
                    >
                      {p.science}
                    </p>
                    <div
                      className="h-2 w-20 rounded-full"
                      style={{ background: p.gradient }}
                    />
                  </div>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>

      {/* Meal structures */}
      <ScrollReveal delay={360}>
        <div className="relative mx-auto mt-8 max-w-4xl overflow-hidden rounded-2xl border border-border bg-background p-8 text-center md:p-10">
          <div
            className="absolute left-0 right-0 top-0 h-1.5"
            style={{
              background:
                "linear-gradient(90deg, var(--icon-lime), var(--icon-green), var(--icon-teal), var(--icon-yellow), var(--icon-orange))",
            }}
          />
          <p className="text-xs font-bold uppercase tracking-widest text-icon-teal">
            Every way the world eats
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            {EATING_STRUCTURES.map((s) => (
              <span
                key={s}
                className="inline-flex items-center rounded-full px-3.5 py-1.5 text-sm font-bold"
                style={{
                  background: "color-mix(in srgb, var(--icon-teal) 15%, transparent)",
                  color: "color-mix(in srgb, var(--icon-teal) 78%, var(--foreground))",
                }}
              >
                {s}
              </span>
            ))}
          </div>
          <p className="mx-auto mt-6 max-w-xl text-sm leading-relaxed text-muted-foreground">
            One science, expressed through the meal structures people already use — not a
            Western plate imposed on everyone.
          </p>
        </div>
      </ScrollReveal>
    </Section>
  )
}
