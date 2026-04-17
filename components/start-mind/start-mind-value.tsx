import { ScrollReveal } from "@/components/scroll-reveal"

const DISCOVERIES = [
  {
    title: "Your Gut-Brain Score",
    detail: "A single number (0–100) showing how well your food habits are supporting your mood, focus, and mental clarity right now.",
    gradient: "linear-gradient(135deg, var(--icon-teal), var(--icon-green))",
  },
  {
    title: "Which gut-brain pillars are weakest",
    detail: "See exactly where your food system is letting your mind down — and which changes will have the biggest impact.",
    gradient: "linear-gradient(135deg, var(--icon-green), var(--icon-lime))",
  },
  {
    title: "The foods most likely affecting your mood",
    detail: "Specific, actionable food insights — not generic advice. Targeted to your actual score and your actual gaps.",
    gradient: "linear-gradient(135deg, var(--icon-lime), var(--icon-teal))",
  },
  {
    title: "Simple changes to feed your brain better",
    detail: "No elimination diets. No protocols. Targeted food additions that move your Gut-Brain Score — starting this week.",
    gradient: "linear-gradient(135deg, var(--icon-teal), var(--icon-lime))",
  },
]

export function StartMindValue() {
  return (
    <section className="px-6 py-20 md:py-28">
      <div className="mx-auto max-w-[640px]">

        <ScrollReveal>
          <p className="mb-3 text-center text-xs font-semibold uppercase tracking-widest text-icon-teal">What you&apos;ll discover</p>
          <h2 className="text-center font-serif text-3xl font-semibold text-foreground sm:text-4xl text-balance">
            What&apos;s in your free report
          </h2>
        </ScrollReveal>

        <div className="mt-10 space-y-4">
          {DISCOVERIES.map((item, i) => (
            <ScrollReveal key={item.title} delay={i * 70}>
              <div className="flex items-start gap-4">
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg" style={{ background: item.gradient }}>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-foreground">{item.title}</p>
                  <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">{item.detail}</p>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>

      </div>
    </section>
  )
}
