import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { ScrollReveal } from "@/components/scroll-reveal"

const STEPS = [
  {
    number: "01",
    title: "Answer 15 questions about how you eat",
    detail: "Questions about your food habits, daily patterns, and how you feel — not a food diary, not a calorie count.",
    color: "var(--icon-teal)",
    gradient: "linear-gradient(135deg, var(--icon-teal), var(--icon-green))",
  },
  {
    number: "02",
    title: "Get your Gut-Brain Score",
    detail: "Instantly see your score across four gut-brain pillars — with a breakdown of exactly where your food-mood system stands.",
    color: "var(--icon-green)",
    gradient: "linear-gradient(135deg, var(--icon-green), var(--icon-lime))",
  },
  {
    number: "03",
    title: "See exactly what to change",
    detail: "Your free report shows the specific foods that shift your score — and support your mood, focus, and mental clarity starting this week.",
    color: "var(--icon-lime)",
    gradient: "linear-gradient(135deg, var(--icon-lime), var(--icon-teal))",
  },
]

export function StartMindHow() {
  return (
    <section className="bg-secondary/40 px-6 py-20 md:py-28">
      <div className="mx-auto max-w-[640px]">

        <ScrollReveal>
          <p className="mb-3 text-center text-xs font-semibold uppercase tracking-widest text-icon-teal">How it works</p>
          <h2 className="text-center font-serif text-3xl font-semibold text-foreground sm:text-4xl">
            Three steps. A clearer mind.
          </h2>
        </ScrollReveal>

        <div className="mt-10 space-y-4">
          {STEPS.map((step, i) => (
            <ScrollReveal key={step.number} delay={i * 80}>
              <div className="flex gap-5 rounded-2xl border border-border bg-background p-5">
                <div className="flex flex-col items-center gap-1">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-serif text-sm font-bold text-white" style={{ background: step.gradient }}>
                    {step.number}
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className="w-0.5 flex-1" style={{ background: `linear-gradient(180deg, ${step.color}, transparent)`, minHeight: "20px" }} />
                  )}
                </div>
                <div className="flex-1 pb-2">
                  <h3 className="font-serif text-base font-semibold text-foreground">{step.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{step.detail}</p>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal delay={320}>
          <div className="mt-10 flex flex-col items-center gap-3">
            <Link
              href="/assessment-mind"
              className="brand-gradient inline-flex w-full items-center justify-center gap-2 rounded-full px-8 py-4 text-base font-semibold text-white shadow-lg shadow-icon-green/25 transition-all hover:shadow-xl hover:opacity-90"
            >
              Check your Gut-Brain Score <ArrowRight size={18} />
            </Link>
            <p className="text-xs text-muted-foreground">Free report included &nbsp;·&nbsp; Takes 2 minutes</p>
          </div>
        </ScrollReveal>

      </div>
    </section>
  )
}
