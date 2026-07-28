import { ScrollReveal } from "@/components/scroll-reveal"

/**
 * Section 4 — "The science is global. The food is local." Dark band #1 of 2.
 *
 * Moved from ~85% scroll (production runs it ninth) to position four: it is the
 * strongest differentiator on the page and now lands while the visitor is still
 * reading. Derived from components/home/global-direction.tsx, which on `main`
 * carries the pairings only as one prose sentence — they are structured into
 * cards here.
 *
 * ── Colour on dark ──────────────────────────────────────────────────────────
 * The light-mode tint pill idiom (`color-mix(… 78%, var(--foreground))` on a
 * 15% tint) inverts badly: --foreground is #1A2E12, so the text goes darker
 * than the forest-green ground. These accents are hand-tuned lighter values
 * from the same brand hues, checked against WCAG AA rather than assumed. No new
 * palette — they are tints of the existing lime and teal.
 *
 * ── Deliberately no food photography ────────────────────────────────────────
 * The brief describes food imagery here. The only photography available is the
 * generic /food-N.webp ingredient flat-lays, which read as Western composed
 * plates — illustrating "not a Western plate imposed on everyone" with exactly
 * that would argue against the copy it sits beneath. The pairings themselves
 * carry the point. Flagged in the PR as a deviation; culturally-specific
 * photography of kimchi, lassi and dal would change this decision.
 */
const PAIRINGS = [
  {
    a: "Sauerkraut",
    b: "Kimchi",
    tag: "Same job — Seed",
    accent: "#7FD4A8",
    gradient: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))",
    line: "Two ferments, both introducing live cultures.",
  },
  {
    a: "Kefir",
    b: "Lassi",
    tag: "Same job — Seed",
    accent: "#7FD4A8",
    gradient: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))",
    line: "Two cultured drinks, same microbial work.",
  },
  {
    a: "Oats",
    b: "Dal",
    tag: "Same job — Feed",
    accent: "#C4E88A",
    gradient: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))",
    line: "A grain and a pulse, both feeding the same bacteria the same fibre.",
  },
]

const STRUCTURES = ["Plate", "Bowl", "Thali", "Tiffin", "Mezze", "Mixed household meals"]

export function GlobalLocal() {
  return (
    <section className="px-6 py-8">
      <div
        className="relative mx-auto max-w-[1200px] overflow-hidden rounded-[2.5rem] px-6 py-20 md:px-12 md:py-28"
        style={{ background: "linear-gradient(135deg, #14250F 0%, #1A2E12 45%, #2C3A12 100%)" }}
      >
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
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#C4E88A" }}>
                Every Way The World Eats
              </p>
              <h2 className="mt-4 font-serif text-4xl font-bold leading-tight text-white sm:text-5xl text-balance">
                The science is global.
                <br />
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
              <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-white/80">
                Human biology shares common foundations. The foods that support it differ
                across cultures, communities and countries.
              </p>
            </div>
          </ScrollReveal>

          <div className="mt-14 flex flex-col gap-5">
            {PAIRINGS.map((p, i) => (
              <ScrollReveal key={`${p.a}-${p.b}`} delay={i * 120}>
                <div className="relative overflow-hidden rounded-2xl border border-white/15 bg-white/[0.05] transition-colors hover:bg-white/[0.08]">
                  <div
                    aria-hidden
                    className="absolute inset-x-0 top-0 h-1"
                    style={{ background: p.gradient }}
                  />
                  <div className="flex flex-col gap-6 p-7 sm:flex-row sm:items-center sm:gap-10 md:p-9">
                    <div className="flex-1">
                      {/* text-xl at base so the longest pair (Sauerkraut —
                          Kimchi) still fits a 320px viewport without the row
                          pushing the page wider than the screen. */}
                      <div className="flex items-center gap-2 sm:gap-6">
                        <p className="flex-1 break-words text-right font-serif text-xl font-semibold text-white sm:text-3xl md:text-4xl">
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
                            className="h-1 w-8 rounded-full sm:w-14"
                            style={{ background: p.gradient }}
                          />
                        </span>
                        <p className="flex-1 break-words font-serif text-xl font-semibold text-white sm:text-3xl md:text-4xl">
                          {p.b}
                        </p>
                      </div>
                      <p className="mt-4 text-center text-base leading-relaxed text-white/70">
                        {p.line}
                      </p>
                    </div>

                    <div className="flex shrink-0 justify-center sm:w-44 sm:justify-start">
                      <span
                        className="inline-flex w-fit items-center rounded-full px-3.5 py-1.5 text-sm font-bold"
                        style={{
                          background: `color-mix(in srgb, ${p.accent} 18%, transparent)`,
                          color: p.accent,
                        }}
                      >
                        {p.tag}
                      </span>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>

          <ScrollReveal delay={380}>
            <div className="mt-12 text-center">
              <div className="flex flex-wrap items-center justify-center gap-2">
                {STRUCTURES.map((s) => (
                  <span
                    key={s}
                    className="inline-flex items-center rounded-full border border-white/20 bg-white/[0.08] px-4 py-2 text-sm font-semibold text-white"
                  >
                    {s}
                  </span>
                ))}
              </div>
              <p className="mx-auto mt-8 max-w-2xl text-base leading-relaxed text-white/75">
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
