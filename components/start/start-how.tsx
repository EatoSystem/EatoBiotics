import { ScrollReveal } from "@/components/scroll-reveal"

const STEPS = [
  {
    number: "01",
    title: "Answer a few simple questions",
    detail: "15 questions about what you eat, how often, and how you feel. No food diary. No tracking.",
    color: "var(--icon-lime)",
    gradient: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))",
  },
  {
    number: "02",
    title: "Get your Food System Score",
    detail: "Instantly see your score across four pillars — with a breakdown of exactly where you stand.",
    color: "var(--icon-green)",
    gradient: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))",
  },
  {
    number: "03",
    title: "See exactly what to improve",
    detail: "Your free report shows the specific foods and habits that will move your score — starting this week.",
    color: "var(--icon-teal)",
    gradient: "linear-gradient(135deg, var(--icon-teal), var(--icon-green))",
  },
]

export function StartHow() {
  return (
    <section className="bg-secondary/40 px-6 py-20 md:py-28">
      <div className="mx-auto max-w-[640px]">
        <ScrollReveal>
          <p className="mb-3 text-center text-xs font-semibold uppercase tracking-widest text-icon-green">
            How it works
          </p>
          <h2 className="text-center font-serif text-3xl font-semibold text-foreground sm:text-4xl">
            Three steps. Two minutes.
          </h2>
        </ScrollReveal>

        <div className="mt-10 space-y-4">
          {STEPS.map((step, i) => (
            <ScrollReveal key={step.number} delay={i * 80}>
              <div className="flex gap-5 rounded-2xl border border-border bg-background p-5">
                {/* Number + connector */}
                <div className="flex flex-col items-center gap-1">
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-serif text-sm font-bold text-white"
                    style={{ background: step.gradient }}
                  >
                    {step.number}
                  </div>
                  {i < STEPS.length - 1 && (
                    <div
                      className="w-0.5 flex-1"
                      style={{ background: `linear-gradient(180deg, ${step.color}, transparent)`, minHeight: "20px" }}
                    />
                  )}
                </div>
                {/* Content */}
                <div className="flex-1 pb-2">
                  <h3 className="font-serif text-base font-semibold text-foreground">
                    {step.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    {step.detail}
                  </p>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>

      </div>
    </section>
  )
}
