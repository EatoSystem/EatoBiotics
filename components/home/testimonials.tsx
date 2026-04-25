import { ScrollReveal } from "@/components/scroll-reveal"

const TESTIMONIALS = [
  {
    quote:
      "I went from a Biotics Score of 23 to 71 in six weeks. I didn't change everything — I just finally understood what actually mattered on my plate.",
    name: "Sarah M.",
    role: "Nurse, Dublin",
    score: 71,
    avatar: "SM",
    color: "var(--icon-lime)",
    gradient: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))",
  },
  {
    quote:
      "The 3 Biotics framework clicked immediately. Within a month my digestion had completely changed. I wasn't expecting such a fast difference.",
    name: "Conor B.",
    role: "Personal Trainer, Cork",
    score: 84,
    avatar: "CB",
    color: "var(--icon-teal)",
    gradient: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))",
  },
  {
    quote:
      "I've tried every wellness trend going. EatoBiotics is the first thing that felt like actual science, not guesswork. The meal analysis alone changed how I shop.",
    name: "Aoife R.",
    role: "UX Designer, Galway",
    score: 79,
    avatar: "AR",
    color: "var(--icon-orange)",
    gradient: "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange))",
  },
]

export function Testimonials() {
  return (
    <section className="px-6 py-24 md:py-32">
      <div className="mx-auto max-w-[1200px]">
        {/* Header */}
        <ScrollReveal className="text-center mb-14">
          <p className="text-xs font-semibold uppercase tracking-widest text-icon-green">
            Real Results
          </p>
          <h2 className="mt-4 font-serif text-4xl font-semibold text-foreground sm:text-5xl text-balance">
            The system works.
          </h2>
          <p className="mt-4 mx-auto max-w-xl text-base leading-relaxed text-muted-foreground">
            When you understand your microbiome, the changes come naturally. Here&apos;s what
            members say after their first few weeks.
          </p>
        </ScrollReveal>

        {/* Cards */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <ScrollReveal key={t.name} delay={i * 90}>
              <div className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-background p-7">
                {/* Gradient top bar */}
                <div
                  className="absolute top-0 left-0 right-0 h-1"
                  style={{ background: t.gradient }}
                />

                {/* Score badge */}
                <div className="mb-5 flex items-center justify-between">
                  <div
                    className="flex items-center gap-2 rounded-full px-3 py-1.5"
                    style={{ background: `color-mix(in srgb, ${t.color} 12%, var(--background))` }}
                  >
                    <span
                      className="text-xs font-bold"
                      style={{ color: t.color }}
                    >
                      Biotics Score
                    </span>
                    <span
                      className="font-serif text-lg font-bold"
                      style={{ color: t.color }}
                    >
                      {t.score}
                    </span>
                  </div>
                  {/* Stars */}
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, j) => (
                      <span key={j} className="text-xs" style={{ color: t.color }}>★</span>
                    ))}
                  </div>
                </div>

                {/* Quote */}
                <p className="flex-1 text-sm leading-relaxed text-muted-foreground">
                  &ldquo;{t.quote}&rdquo;
                </p>

                {/* Author */}
                <div className="mt-6 flex items-center gap-3">
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                    style={{ background: t.gradient }}
                  >
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}
