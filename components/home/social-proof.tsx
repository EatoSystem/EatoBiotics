import { Star } from "lucide-react"
import { ScrollReveal } from "@/components/scroll-reveal"

/* PLACEHOLDER TESTIMONIALS — REPLACE WITH REAL, VERIFIED QUOTES BEFORE LAUNCH */
const TESTIMONIALS = [
  {
    quote: "I finally understood what was driving my bloating.",
    name: "Sarah",
    location: "Dublin",
    accent: "var(--icon-lime)",
  },
  {
    quote: "The score made gut health feel simple and actionable.",
    name: "James",
    location: "Cork",
    accent: "var(--icon-teal)",
  },
  {
    quote: "The 30-day plan helped me eat better without overthinking it.",
    name: "Emma",
    location: "Galway",
    accent: "var(--icon-orange)",
  },
]

export function SocialProof() {
  return (
    <section className="px-6 py-20 md:py-28">
      <div className="mx-auto max-w-[1100px]">
        <ScrollReveal>
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-icon-green">
              Real people. Real results.
            </p>
            <h2 className="mt-4 font-serif text-4xl font-semibold text-foreground sm:text-5xl text-balance">
              People are improving their gut score.
            </h2>
          </div>
        </ScrollReveal>

        <div className="grid gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((t, index) => (
            <ScrollReveal key={t.name} delay={index * 100}>
              <figure className="relative flex h-full flex-col rounded-3xl border border-border bg-card p-8 shadow-sm">
                <div
                  aria-hidden
                  className="absolute top-0 left-0 right-0 h-1.5 rounded-t-3xl"
                  style={{ background: `linear-gradient(90deg, ${t.accent}, color-mix(in srgb, ${t.accent} 40%, transparent))` }}
                />
                <div className="flex gap-0.5" aria-label="5 out of 5 stars">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={16} className="fill-current" style={{ color: "var(--icon-yellow)" }} />
                  ))}
                </div>
                <blockquote className="mt-5 flex-1 font-serif text-lg leading-relaxed text-foreground">
                  “{t.quote}”
                </blockquote>
                <figcaption className="mt-6 text-sm font-semibold text-muted-foreground">
                  {t.name}, {t.location}
                </figcaption>
              </figure>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal delay={320}>
          {/* PLACEHOLDER STAT — UPDATE WITH REAL USER COUNT BEFORE LAUNCH */}
          <p className="mt-12 text-center text-base font-semibold text-foreground">
            Join <span className="brand-gradient-text">12,000+</span> people improving their gut score.
          </p>
        </ScrollReveal>
      </div>
    </section>
  )
}
