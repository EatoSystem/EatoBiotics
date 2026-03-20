import { ArrowRight, Clock, Leaf, Wheat, FlaskConical, Timer, Heart } from "lucide-react"
import { ScrollReveal } from "@/components/scroll-reveal"
import { GradientText } from "@/components/gradient-text"
import { MissionNote } from "./mission-note"

interface AssessmentIntroProps {
  onStart: () => void
}

const PILLARS = [
  {
    icon: Leaf,
    label: "Diversity",
    description: "How varied your plant intake is each week",
    color: "var(--icon-lime)",
    gradient: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))",
  },
  {
    icon: Wheat,
    label: "Feeding",
    description: "How often you eat fibre-rich whole foods",
    color: "var(--icon-green)",
    gradient: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))",
  },
  {
    icon: FlaskConical,
    label: "Adding",
    description: "How regularly you include fermented foods",
    color: "var(--icon-teal)",
    gradient: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))",
  },
  {
    icon: Timer,
    label: "Consistency",
    description: "How stable and repeatable your eating habits are",
    color: "var(--icon-yellow)",
    gradient: "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange))",
  },
  {
    icon: Heart,
    label: "Feeling",
    description: "How your body responds — energy, comfort, clarity",
    color: "var(--icon-orange)",
    gradient: "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange))",
  },
]

const STEPS = [
  {
    number: "01",
    title: "Answer 15 questions",
    description: "Honest, thoughtful questions about how you actually eat — no judgment.",
  },
  {
    number: "02",
    title: "Get your 5-pillar score",
    description: "See exactly where your food system is strong and where it needs support.",
  },
  {
    number: "03",
    title: "See your personalised actions",
    description: "3 specific, practical things you can do in the next 7 days.",
  },
]

export function AssessmentIntro({ onStart }: AssessmentIntroProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden px-6 pb-24 pt-28 sm:pt-32">
        {/* Decorative brand pills */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div
            className="absolute -top-6 left-[8%] h-4 w-32 rotate-[-20deg] rounded-full opacity-10"
            style={{ background: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))" }}
          />
          <div
            className="absolute top-[15%] right-[4%] h-4 w-28 rotate-[15deg] rounded-full opacity-10"
            style={{ background: "linear-gradient(135deg, var(--icon-teal), var(--icon-green))" }}
          />
          <div
            className="absolute bottom-[10%] left-[2%] h-4 w-36 rotate-[40deg] rounded-full opacity-8"
            style={{ background: "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange))" }}
          />
        </div>

        <div className="relative mx-auto max-w-2xl text-center">
          <ScrollReveal>
            {/* Overline */}
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--icon-green)]" />
              Free Assessment
            </div>

            {/* Headline */}
            <h1 className="mt-6 font-serif text-4xl font-semibold leading-tight text-foreground sm:text-5xl md:text-6xl">
              Understand the <GradientText>Food System</GradientText>{" "}
              Inside You
            </h1>

            <p className="mx-auto mt-6 max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg">
              A 15-question assessment revealing where your food system is strong, where it&rsquo;s holding you back, and what to do about it — scored across five pillars.
            </p>

            {/* Brand pills decoration */}
            <div className="mt-6 flex items-center justify-center gap-1.5">
              <span className="biotic-pill bg-icon-lime" />
              <span className="biotic-pill bg-icon-green" />
              <span className="biotic-pill bg-icon-teal" />
              <span className="biotic-pill bg-icon-yellow" />
              <span className="biotic-pill bg-icon-orange" />
            </div>

            {/* CTA */}
            <div className="mt-8 flex flex-col items-center gap-3">
              <button
                onClick={onStart}
                className="brand-gradient flex items-center gap-2 rounded-full px-8 py-3.5 text-base font-semibold text-white transition-opacity hover:opacity-90"
              >
                Begin Assessment
                <ArrowRight size={18} />
              </button>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock size={12} />
                Takes about 5 minutes &middot; Free &middot; No sign-up required
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ── 5 Pillars ────────────────────────────────────────────────── */}
      <section className="px-6 pb-20">
        <div className="mx-auto max-w-3xl">
          <ScrollReveal>
            <h2 className="text-center font-serif text-2xl font-semibold text-foreground sm:text-3xl">
              Your score across 5 pillars
            </h2>
            <p className="mx-auto mt-3 max-w-md text-center text-sm leading-relaxed text-muted-foreground">
              Each pillar measures a different aspect of how you&rsquo;re building your internal food system.
            </p>
          </ScrollReveal>

          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {PILLARS.map((pillar, i) => (
              <ScrollReveal key={pillar.label} delay={i * 60}>
                <div className="flex items-start gap-3 rounded-2xl border border-border bg-background p-4">
                  <div
                    className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                    style={{ background: pillar.gradient }}
                  >
                    <pillar.icon size={17} className="text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{pillar.label}</p>
                    <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
                      {pillar.description}
                    </p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────── */}
      <section className="border-t border-border bg-secondary/20 px-6 py-20">
        <div className="mx-auto max-w-2xl">
          <ScrollReveal>
            <h2 className="text-center font-serif text-2xl font-semibold text-foreground sm:text-3xl">
              How it works
            </h2>
          </ScrollReveal>

          <div className="mt-10 space-y-4">
            {STEPS.map((step, i) => (
              <ScrollReveal key={step.number} delay={i * 80}>
                <div className="flex items-start gap-5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full brand-gradient text-sm font-bold text-white">
                    {step.number}
                  </div>
                  <div className="pt-1.5">
                    <p className="text-sm font-semibold text-foreground">{step.title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Mission ──────────────────────────────────────────────────── */}
      <section className="border-t border-border px-6 py-16">
        <ScrollReveal>
          <MissionNote variant="quote" />
        </ScrollReveal>
      </section>

      {/* ── Bottom CTA ───────────────────────────────────────────────── */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-xl text-center">
          <ScrollReveal>
            <p className="font-serif text-2xl font-semibold text-foreground sm:text-3xl">
              Ready to see where your food system stands?
            </p>
            <div className="mt-6 flex flex-col items-center gap-3">
              <button
                onClick={onStart}
                className="brand-gradient flex items-center gap-2 rounded-full px-8 py-3.5 text-base font-semibold text-white transition-opacity hover:opacity-90"
              >
                Begin Assessment
                <ArrowRight size={18} />
              </button>
              <p className="text-xs text-muted-foreground/60 max-w-sm">
                This assessment is for educational purposes and is not medical advice or a diagnosis.
              </p>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </div>
  )
}
