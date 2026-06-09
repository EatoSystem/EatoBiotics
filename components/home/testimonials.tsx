import { ScrollReveal } from "@/components/scroll-reveal"
import { Star, Quote } from "lucide-react"

const TESTIMONIALS = [
  {
    quote:
      "I went from a Biotics Score of 23 to 71 in six weeks. I didn't change everything — I just finally understood what actually mattered on my plate.",
    name: "Sarah M.",
    role: "Nurse, Dublin",
    from: 23,
    to: 71,
    weeks: 6,
    avatar: "SM",
    color: "var(--icon-lime)",
    gradient: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))",
  },
  {
    quote:
      "The 3 Biotics framework clicked immediately. Within a month my digestion had completely changed. I wasn't expecting such a fast difference.",
    name: "Conor B.",
    role: "Personal Trainer, Cork",
    from: 41,
    to: 84,
    weeks: 4,
    avatar: "CB",
    color: "var(--icon-teal)",
    gradient: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))",
  },
  {
    quote:
      "I've tried every wellness trend going. EatoBiotics is the first thing that felt like actual science, not guesswork. The meal analysis alone changed how I shop.",
    name: "Aoife R.",
    role: "UX Designer, Galway",
    from: 52,
    to: 79,
    weeks: 5,
    avatar: "AR",
    color: "var(--icon-orange)",
    gradient: "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange))",
  },
]

export function Testimonials() {
  return (
    <section
      className="relative overflow-hidden px-6 py-24 md:py-32"
      style={{ background: "linear-gradient(180deg, #F4F9EF 0%, #FFFFFF 100%)" }}
    >
      {/* Soft ambient glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-0 h-[420px]"
        style={{
          background:
            "radial-gradient(60% 70% at 50% 0%, color-mix(in srgb, var(--icon-green) 14%, transparent), transparent 70%)",
        }}
      />

      <div className="relative z-10 mx-auto max-w-[1200px]">
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
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {TESTIMONIALS.map((t, i) => {
            const gain = t.to - t.from
            return (
              <ScrollReveal key={t.name} delay={i * 90}>
                <div className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-white bg-white p-7 shadow-[0_10px_40px_-12px_rgba(26,46,18,0.18)] ring-1 ring-black/[0.03] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_24px_60px_-18px_rgba(26,46,18,0.28)]">
                  {/* Gradient top bar */}
                  <div
                    className="absolute inset-x-0 top-0 h-1.5"
                    style={{ background: t.gradient }}
                  />
                  {/* Decorative quote glyph */}
                  <Quote
                    size={56}
                    className="pointer-events-none absolute -right-2 -top-1 opacity-[0.06]"
                    style={{ color: t.color }}
                    fill="currentColor"
                  />

                  {/* Stars */}
                  <div className="mb-4 flex gap-0.5">
                    {[...Array(5)].map((_, j) => (
                      <Star key={j} size={15} style={{ color: t.color }} fill="currentColor" strokeWidth={0} />
                    ))}
                  </div>

                  {/* Quote */}
                  <p className="flex-1 text-[15px] leading-relaxed text-foreground/85">
                    &ldquo;{t.quote}&rdquo;
                  </p>

                  {/* Before → After progress */}
                  <div className="mt-6 rounded-2xl bg-secondary/60 p-4">
                    <div className="mb-2 flex items-center justify-between text-xs font-semibold">
                      <span className="text-muted-foreground">
                        Biotics Score · {t.weeks} weeks
                      </span>
                      <span style={{ color: t.color }}>+{gain} points</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-serif text-sm font-bold text-muted-foreground">{t.from}</span>
                      <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-muted">
                        <div
                          className="absolute inset-y-0 left-0 rounded-full transition-all duration-700 group-hover:brightness-105"
                          style={{ width: `${t.to}%`, background: t.gradient }}
                        />
                      </div>
                      <span className="font-serif text-lg font-bold" style={{ color: t.color }}>{t.to}</span>
                    </div>
                  </div>

                  {/* Author */}
                  <div className="mt-5 flex items-center gap-3">
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ring-2 ring-white"
                      style={{ background: t.gradient, boxShadow: `0 4px 12px -2px color-mix(in srgb, ${t.color} 50%, transparent)` }}
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
            )
          })}
        </div>
        <p className="mt-8 text-center text-xs text-muted-foreground/80">
          Illustrative results based on the EatoBiotics framework. Individual results vary.
        </p>
      </div>
    </section>
  )
}
