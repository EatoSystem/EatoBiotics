import { ScrollReveal } from "@/components/scroll-reveal"
import { AlertCircle, TrendingDown, Zap } from "lucide-react"

const SYMPTOMS = [
  {
    icon: TrendingDown,
    text: "Energy stays low — even after a good night's sleep",
    color: "var(--icon-orange)",
  },
  {
    icon: Zap,
    text: "Focus is inconsistent — brain fog that comes and goes",
    color: "var(--icon-yellow)",
  },
  {
    icon: AlertCircle,
    text: "Progress doesn't happen — despite eating what feels right",
    color: "var(--icon-orange)",
  },
]

const GAPS = ["Diversity", "Consistency", "The right balance of biotics"]

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
            Most people think they eat well. But without a clear picture of
            their food system, there are invisible gaps holding them back.
          </p>
        </ScrollReveal>

        {/* Gaps */}
        <ScrollReveal delay={140}>
          <div className="mt-8 rounded-2xl border border-border bg-background p-6">
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Common gaps most people don&apos;t know they have
            </p>
            <div className="space-y-3">
              {GAPS.map((gap, i) => (
                <div key={gap} className="flex items-center gap-3">
                  <div
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                    style={{
                      background: i === 0
                        ? "var(--icon-orange)"
                        : i === 1
                          ? "var(--icon-yellow)"
                          : "var(--icon-orange)",
                    }}
                  >
                    {i + 1}
                  </div>
                  <p className="text-sm font-medium text-foreground">{gap}</p>
                </div>
              ))}
            </div>
          </div>
        </ScrollReveal>

        {/* Consequences */}
        <ScrollReveal delay={200}>
          <p className="mt-8 mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground text-center">
            That&apos;s why
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

      </div>
    </section>
  )
}
