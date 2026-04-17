import { ScrollReveal } from "@/components/scroll-reveal"

const CONTRAST = [
  { no: "Calories", yes: "Your actual food diversity" },
  { no: "Diets",    yes: "Your daily food habits" },
  { no: "Macros",   yes: "Your biotics balance" },
]

export function StartSolution() {
  return (
    <section className="px-6 py-20 md:py-28">
      <div className="mx-auto max-w-[640px]">
        <ScrollReveal>
          <p className="mb-3 text-center text-xs font-semibold uppercase tracking-widest text-icon-green">
            The Solution
          </p>
          <h2 className="text-center font-serif text-3xl font-semibold text-foreground sm:text-4xl text-balance">
            The{" "}
            <span className="brand-gradient-text">Food System Score</span>
          </h2>
          <p className="mx-auto mt-5 max-w-md text-center text-base leading-relaxed text-muted-foreground">
            A simple way to understand how your food is actually supporting
            your body — not just what you eat, but how it all fits together.
          </p>
        </ScrollReveal>

        {/* Contrast table */}
        <ScrollReveal delay={100}>
          <div className="mt-10 overflow-hidden rounded-2xl border border-border">
            <div className="grid grid-cols-2 border-b border-border bg-secondary/40">
              <div className="px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Not this
                </p>
              </div>
              <div className="border-l border-border px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-widest text-icon-green">
                  This
                </p>
              </div>
            </div>
            {CONTRAST.map((row, i) => (
              <div
                key={row.no}
                className={`grid grid-cols-2 ${i < CONTRAST.length - 1 ? "border-b border-border" : ""}`}
              >
                <div className="flex items-center gap-2 px-4 py-3.5">
                  <span className="text-sm text-muted-foreground line-through">{row.no}</span>
                </div>
                <div className="flex items-center gap-2 border-l border-border px-4 py-3.5">
                  <span
                    className="h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ background: "var(--icon-green)" }}
                  />
                  <span className="text-sm font-medium text-foreground">{row.yes}</span>
                </div>
              </div>
            ))}
          </div>
        </ScrollReveal>

        {/* Description */}
        <ScrollReveal delay={180}>
          <p className="mt-8 text-center text-sm leading-relaxed text-muted-foreground">
            Your Food System Score measures four pillars —{" "}
            <strong className="text-foreground">Diversity, Biotics, Consistency, and Rhythm</strong>
            {" "}— giving you a clear picture of where your food life is strong and where
            the gaps are hiding.
          </p>
        </ScrollReveal>

      </div>
    </section>
  )
}
