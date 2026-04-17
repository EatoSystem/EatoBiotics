import Link from "next/link"
import { ArrowRight, CloudFog, TrendingDown, Zap } from "lucide-react"
import { ScrollReveal } from "@/components/scroll-reveal"

const SYMPTOMS = [
  { icon: CloudFog,     text: "Brain fog that arrives mid-morning and refuses to leave",         color: "var(--icon-teal)"   },
  { icon: TrendingDown, text: "Mood dips that feel random — but often follow your meals",        color: "var(--icon-yellow)" },
  { icon: Zap,          text: "Focus that works one day and disappears the next",                color: "var(--icon-teal)"   },
]

const GAPS = [
  { label: "Not enough diversity to feed serotonin production", sub: "Gut Diversity"   },
  { label: "Missing the fermented foods that feed your mood",   sub: "Serotonin Foods" },
  { label: "Chronic low-level inflammation affecting clarity",  sub: "Anti-Inflammatory"},
]

export function StartMindProblem() {
  return (
    <section className="bg-secondary/40 px-6 py-20 md:py-28">
      <div className="mx-auto max-w-[640px]">

        <ScrollReveal>
          <h2 className="font-serif text-3xl font-semibold text-foreground sm:text-4xl text-balance text-center">
            You&apos;re treating a gut problem{" "}
            <span className="text-muted-foreground font-normal">like a brain problem.</span>
          </h2>
        </ScrollReveal>

        <ScrollReveal delay={80}>
          <p className="mt-6 text-center text-base leading-relaxed text-muted-foreground">
            Most people dealing with brain fog, low mood, or inconsistent focus are looking in the wrong place.
            The real problem is often in the gut — and it starts with what you eat.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={140}>
          <div className="mt-8 overflow-hidden rounded-2xl border border-border bg-background">
            <div className="border-b border-border bg-secondary/40 px-5 py-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                The gut-brain gaps most people don&apos;t know they have
              </p>
            </div>
            <div className="divide-y divide-border">
              {GAPS.map((gap, i) => (
                <div key={gap.label} className="flex items-center gap-4 px-5 py-4">
                  <div
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                    style={{ background: i === 0 ? "var(--icon-teal)" : i === 1 ? "var(--icon-green)" : "linear-gradient(135deg, var(--icon-teal), var(--icon-green))" }}
                  >
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{gap.label}</p>
                  </div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{gap.sub}</span>
                </div>
              ))}
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={200}>
          <p className="mt-8 mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground text-center">The result</p>
          <div className="space-y-3">
            {SYMPTOMS.map((item, i) => {
              const Icon = item.icon
              return (
                <ScrollReveal key={item.text} delay={220 + i * 60}>
                  <div className="flex items-start gap-3 rounded-2xl border border-border bg-background p-4">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl" style={{ background: `color-mix(in srgb, ${item.color} 12%, transparent)` }}>
                      <Icon size={16} style={{ color: item.color }} />
                    </div>
                    <p className="text-sm leading-relaxed text-foreground">{item.text}</p>
                  </div>
                </ScrollReveal>
              )
            })}
          </div>
        </ScrollReveal>

        <ScrollReveal delay={420}>
          <div className="mt-10 text-center">
            <Link href="/assessment-mind" className="inline-flex items-center gap-1.5 text-sm font-semibold text-icon-teal transition-colors hover:text-foreground">
              Check your Gut-Brain Score <ArrowRight size={14} />
            </Link>
          </div>
        </ScrollReveal>

      </div>
    </section>
  )
}
