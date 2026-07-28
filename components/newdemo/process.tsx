import { ScrollReveal } from "@/components/scroll-reveal"
import { display, text } from "./tokens"

/**
 * Section 2 — how EatoBiotics works. Derived from components/home/how-it-works.tsx
 * but compressed to a strip: understandable in one glance, roughly half the
 * vertical height of the production section.
 *
 * ── The rename matters ──────────────────────────────────────────────────────
 * Production reads Assess / Score / Report / 30-Day Plan. Step 03 becomes
 * "Understand" and step 04 becomes "Improve" so the four steps describe what
 * *EatoBiotics* does, leaving Feed/Seed/Regenerate as what the *user* does.
 * The two frameworks must not share vocabulary — that overlap is what made them
 * read as competing explanations of the same thing. "Regenerate" therefore
 * appears only in section 5, and nowhere here.
 *
 * Numbered because the sequence is real, and marked up as an ordered list so
 * assistive technology announces it as a sequence rather than four cards.
 */
const STEPS = [
  {
    number: "01",
    title: "Assess",
    line: "Tell us about your food, digestion, energy and habits.",
    color: display.lime,
    gradient: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))",
  },
  {
    number: "02",
    title: "Score",
    line: "Receive your personal Biotics Score.",
    color: display.green,
    gradient: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))",
  },
  {
    number: "03",
    title: "Understand",
    line: "See what is supporting and limiting your Food System.",
    color: display.teal,
    gradient: "linear-gradient(135deg, var(--icon-teal), var(--icon-yellow))",
  },
  {
    number: "04",
    title: "Improve",
    line: "Take practical next actions and watch your score change.",
    color: display.orange,
    gradient: "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange))",
  },
]

export function Process() {
  return (
    <section className="px-6 py-16 md:py-20">
      <div className="mx-auto max-w-[1200px]">
        <ScrollReveal>
          {/* The brief gives this section an eyebrow but no headline. A visible
              h2 would add weight the strip is meant to avoid, so the heading is
              screen-reader-only — without it the document jumps h1 → h3 and the
              step titles have no parent. */}
          <h2 className="sr-only">How EatoBiotics works</h2>
          <p aria-hidden className="text-center text-xs font-semibold uppercase tracking-widest" style={{ color: text.green }}>
            How It Works
          </p>
        </ScrollReveal>

        <ol className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <ScrollReveal key={s.number} delay={i * 80}>
              <li className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-background p-6">
                <div
                  aria-hidden
                  className="absolute inset-x-0 top-0 h-1"
                  style={{ background: s.gradient }}
                />
                <span
                  className="font-serif text-3xl font-bold leading-none"
                  style={{ color: s.color }}
                >
                  {s.number}
                </span>
                <h3 className="mt-3 font-serif text-xl font-semibold text-foreground">
                  {s.title}
                </h3>
                <p className="mt-2 text-base leading-relaxed text-muted-foreground">{s.line}</p>
              </li>
            </ScrollReveal>
          ))}
        </ol>

        {/* The bridge. This sentence is the only place the page states the
            relationship between the Score and the Digital Twin, so it gets its
            own space rather than being folded into a card. Echoed in §6. */}
        <ScrollReveal delay={340}>
          <p className="mx-auto mt-12 max-w-2xl text-center font-serif text-2xl font-medium leading-snug text-foreground sm:text-3xl text-balance">
            Your assessment creates your first{" "}
            <span style={{ color: display.green }}>Biotics Score</span> and begins your{" "}
            <span style={{ color: display.green }}>Digital Twin</span>.
          </p>
        </ScrollReveal>
      </div>
    </section>
  )
}
