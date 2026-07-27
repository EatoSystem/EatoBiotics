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
 * Deliberately has no photography. The previous version illustrated "not a Western
 * plate imposed on everyone" with six near-identical Western composed plates, which
 * argued against the copy it sat beneath.
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
      <div className="mx-auto mt-16 max-w-3xl">
        {PAIRINGS.map((p, i) => (
          <ScrollReveal key={`${p.a}-${p.b}`} delay={i * 80}>
            <div
              className={`flex flex-col gap-5 py-9 sm:flex-row sm:items-center sm:gap-8 ${
                i > 0 ? "border-t border-border" : ""
              }`}
            >
              {/* The pair, with its explanation directly beneath it */}
              <div className="flex-1">
                <div className="flex items-center gap-4 sm:gap-6">
                  <p className="flex-1 text-right font-serif text-2xl font-semibold text-foreground sm:text-3xl">
                    {p.a}
                  </p>
                  <span
                    aria-hidden
                    className="h-px w-8 shrink-0 sm:w-12"
                    style={{ background: p.gradient }}
                  />
                  <p className="flex-1 font-serif text-2xl font-semibold text-foreground sm:text-3xl">
                    {p.b}
                  </p>
                </div>
                <p className="mt-3 text-center text-sm leading-relaxed text-muted-foreground">
                  {p.note}
                </p>
              </div>

              {/* The job they share */}
              <div className="shrink-0 text-center sm:w-36 sm:text-left">
                <p
                  className="text-xs font-bold uppercase tracking-widest"
                  style={{ color: p.color }}
                >
                  Same job — {p.pillar}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{p.science}</p>
              </div>
            </div>
          </ScrollReveal>
        ))}
      </div>

      {/* Meal structures */}
      <ScrollReveal delay={240}>
        <div className="mx-auto mt-16 max-w-3xl border-t border-border pt-10 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-icon-teal">
            Every way the world eats
          </p>
          {/* Separated by middots so multi-word entries ("Mixed household meals")
              don't run into their neighbours. */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
            {EATING_STRUCTURES.map((s, i) => (
              <span key={s} className="flex items-center gap-x-3">
                {i > 0 && (
                  <span aria-hidden className="text-muted-foreground/50">
                    ·
                  </span>
                )}
                <span className="font-serif text-lg text-foreground sm:text-xl">{s}</span>
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
