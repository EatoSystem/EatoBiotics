import Link from "next/link"
import { ArrowRight, AlertCircle, TrendingDown, Zap } from "lucide-react"
import { ScrollReveal } from "@/components/scroll-reveal"

const SYMPTOMS = [
  {
    icon: TrendingDown,
    text: "Energy stays low — even after a full night's sleep",
    color: "var(--icon-orange)",
  },
  {
    icon: Zap,
    text: "Focus is inconsistent — brain fog that keeps coming back",
    color: "var(--icon-yellow)",
  },
  {
    icon: AlertCircle,
    text: "Progress stalls — despite genuinely trying to eat well",
    color: "var(--icon-orange)",
  },
]

const GAPS = [
  { label: "Not enough variety in what you eat", sub: "Diversity" },
  { label: "Inconsistent habits that reset your progress", sub: "Consistency" },
  { label: "Missing the three food types your gut depends on", sub: "Biotics" },
]

export function StartProblem() {
  return (
    <section className="bg-secondary/40 px-6 py-20 md:py-28">
      <div className="mx-auto max-w-[640px]">
        <ScrollReveal>
          <h2 className="font-serif text-3xl font-semibold text-foreground sm:text-4xl text-balance text-center">
            You eat every day.{" "}
            <span className="text-muted-foreground font-normal">
              But is it actually improving your health?
            </span>
          </h2>
        </ScrollReveal>

        <ScrollReveal delay={80}>
          <p className="mt-6 text-center text-base leading-relaxed text-muted-foreground">
            You don&apos;t have a discipline problem. You may have a system problem.
            Most people aren&apos;t improving because they&apos;re not measuring what matters.
          </p>
        </ScrollReveal>

        {/* Gaps */}
        <ScrollReveal delay={140}>
          <div className="mt-8 overflow-hidden rounded-2xl border border-border bg-background">
            <div className="border-b border-border bg-secondary/40 px-5 py-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                The gaps most people don&apos;t know they have
              </p>
            </div>
            <div className="divide-y divide-border">
              {GAPS.map((gap, i) => (
                <div key={gap.label} className="flex items-center gap-4 px-5 py-4">
                  <div
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                    style={{
                      background: i === 0
                        ? "var(--icon-orange)"
                        : i === 1
                          ? "var(--icon-yellow)"
                          : "linear-gradient(135deg, var(--icon-orange), var(--icon-yellow))",
                    }}
                  >
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{gap.label}</p>
                  </div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {gap.sub}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </ScrollReveal>

        {/* Consequences */}
        <ScrollReveal delay={200}>
          <p className="mt-8 mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground text-center">
            The result
          </p>
          <div className="space-y-3">
            {SYMPTOMS.map((item, i) => {
              const Icon = item.icon
              return (
                <ScrollReveal key={item.text} delay={220 + i * 60}>
                  <div className="flex items-start gap-3 rounded-2xl border border-border bg-background p-4">
                    <div
                      className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
                      style={{ background: `color-mix(in srgb, ${item.color} 12%, transparent)` }}
                    >
                      <Icon size={16} style={{ color: item.color }} />
                    </div>
                    <p className="text-sm leading-relaxed text-foreground">{item.text}</p>
                  </div>
                </ScrollReveal>
              )
            })}
          </div>
        </ScrollReveal>

        {/* Inline CTA */}
        <ScrollReveal delay={400}>
          <div className="mt-10 text-center">
            <Link
              href="/assessment"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-icon-green transition-colors hover:text-foreground"
            >
              Check your Food System Score
              <ArrowRight size={14} />
            </Link>
          </div>
        </ScrollReveal>

      </div>
    </section>
  )
}
