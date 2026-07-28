import { ScrollReveal } from "@/components/scroll-reveal"

/**
 * Chapter 4 — "The science is global. The food is local."
 *
 * Moved into the upper half of the page: this is a core differentiator, not an
 * afterthought, and it is the page's major contrast moment — a deep forest-green
 * band between white chapters.
 *
 * The thesis is carried by the pairings themselves: two foods from different
 * food cultures, side by side, doing the same job.
 *
 * Deliberately no photography. The previous version illustrated "not a Western
 * plate imposed on everyone" with a six-tile mosaic of near-identical Western
 * ingredient flat-lays, which argued against the copy it sat beneath. It also
 * dropped the "adapts to" chip list (Country, Culture, Language, Budget…) —
 * that read as an abstract feature list rather than a point.
 *
 * Colours are the Feed/Seed pillar colours from foundation.tsx, tuned lighter
 * for legibility on dark: on a #14250F ground the un-tuned --icon-green fails
 * contrast for body text.
 */
const PAIRINGS = [
  {
    a: "Sauerkraut",
    b: "Kimchi",
    pillar: "Seed",
    science: "Probiotics",
    accent: "#7FD4A8",
    gradient: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))",
    note: "Two fermented cabbages, two continents, the same live cultures.",
  },
  {
    a: "Kefir",
    b: "Lassi",
    pillar: "Seed",
    science: "Probiotics",
    accent: "#7FD4A8",
    gradient: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))",
    note: "Two cultured milk drinks that arrived at the same answer separately.",
  },
  {
    a: "Oats",
    b: "Dal",
    pillar: "Feed",
    science: "Prebiotics",
    accent: "#C4E88A",
    gradient: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))",
    note: "A grain and a pulse, both feeding the same bacteria the same fibre.",
  },
]

/*
 * No Regenerate pairing, on purpose. The third pillar is about rhythm, pace and
 * rest rather than a specific food — "no single food does this on its own" —
 * so pairing two foods under it would contradict the framework this reinforces.
 */

const EATING_STRUCTURES = ["Plate", "Bowl", "Thali", "Tiffin", "Mezze", "Mixed household meals"]

export function GlobalDirection() {
  return (
    <section className="px-6 py-8">
      <div
        className="relative mx-auto max-w-[1200px] overflow-hidden rounded-[2.5rem] px-6 py-20 md:px-12 md:py-28"
        style={{ background: "linear-gradient(135deg, #14250F 0%, #1A2E12 45%, #2C3A12 100%)" }}
      >
        {/* Ambient glows — same idiom as the production dark panels */}
        <div
          aria-hidden
          className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full opacity-40 blur-3xl"
          style={{ background: "radial-gradient(circle, var(--icon-green), transparent 70%)" }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-24 -right-16 h-80 w-80 rounded-full opacity-30 blur-3xl"
          style={{ background: "radial-gradient(circle, var(--icon-yellow), transparent 70%)" }}
        />
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-1"
          style={{
            background:
              "linear-gradient(90deg, var(--icon-lime), var(--icon-green), var(--icon-teal), var(--icon-yellow), var(--icon-orange))",
          }}
        />

        <div className="relative z-10">
          <ScrollReveal>
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-xs font-semibold uppercase tracking-widest text-icon-lime">
                Global By Philosophy, Local By Practice
              </p>
              <h2 className="mt-4 font-serif text-4xl font-semibold leading-tight text-white sm:text-5xl text-balance">
                The science is global.{" "}
                <span
                  style={{
                    background: "linear-gradient(90deg, var(--icon-lime), var(--icon-yellow))",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  The food is local.
                </span>
              </h2>
              <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-white/75 sm:text-lg">
                Human biology shares common foundations. The foods that support it differ
                across cultures, communities and countries — so EatoBiotics works with the
                way you already eat, not against it.
              </p>
            </div>
          </ScrollReveal>

          {/* The pairings — the thesis, made visible */}
          <div className="mt-14 flex flex-col gap-5">
            {PAIRINGS.map((p, i) => (
              <ScrollReveal key={`${p.a}-${p.b}`} delay={i * 120}>
                <div className="relative overflow-hidden rounded-2xl border border-white/12 bg-white/[0.04] transition-colors hover:bg-white/[0.07]">
                  <div
                    aria-hidden
                    className="absolute inset-x-0 top-0 h-1"
                    style={{ background: p.gradient }}
                  />
                  <div className="flex flex-col gap-6 p-7 sm:flex-row sm:items-center sm:gap-10 md:p-9">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 sm:gap-6">
                        <p className="flex-1 text-right font-serif text-2xl font-semibold text-white sm:text-3xl md:text-4xl">
                          {p.a}
                        </p>
                        <span aria-hidden className="relative flex shrink-0 items-center">
                          <span
                            className="absolute -inset-3 -z-10 rounded-full blur-md"
                            style={{
                              background: `radial-gradient(circle, color-mix(in srgb, ${p.accent} 45%, transparent), transparent 70%)`,
                            }}
                          />
                          <span
                            className="h-1 w-10 rounded-full sm:w-14"
                            style={{ background: p.gradient }}
                          />
                        </span>
                        <p className="flex-1 font-serif text-2xl font-semibold text-white sm:text-3xl md:text-4xl">
                          {p.b}
                        </p>
                      </div>
                      <p className="mt-4 text-center text-sm leading-relaxed text-white/65">
                        {p.note}
                      </p>
                    </div>

                    <div className="flex shrink-0 flex-col items-center gap-3 sm:w-44 sm:items-start">
                      <span
                        className="inline-flex w-fit items-center rounded-full px-3.5 py-1.5 text-sm font-bold"
                        style={{
                          background: `color-mix(in srgb, ${p.accent} 18%, transparent)`,
                          color: p.accent,
                        }}
                      >
                        Same job — {p.pillar}
                      </span>
                      <p
                        className="text-xs font-semibold uppercase tracking-wider"
                        style={{ color: p.accent }}
                      >
                        {p.science}
                      </p>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>

          {/* Meal structures */}
          <ScrollReveal delay={380}>
            <div className="mt-10 text-center">
              <p className="text-xs font-bold uppercase tracking-widest text-icon-lime">
                Every way the world eats
              </p>
              <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                {EATING_STRUCTURES.map((s) => (
                  <span
                    key={s}
                    className="inline-flex items-center rounded-full border border-white/15 bg-white/[0.06] px-3.5 py-1.5 text-sm font-semibold text-white/85"
                  >
                    {s}
                  </span>
                ))}
              </div>
              <p className="mx-auto mt-6 max-w-xl text-sm leading-relaxed text-white/60">
                One science, expressed through the meal structures people already use — not a
                Western plate imposed on everyone.
              </p>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  )
}
