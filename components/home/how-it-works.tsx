import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { ScrollReveal } from "@/components/scroll-reveal"

const STEPS = [
  {
    number: "01",
    title: "Assess",
    line: "Answer a few questions.",
    color: "var(--icon-lime)",
    gradient: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))",
    bgGradient: "linear-gradient(160deg, color-mix(in srgb, var(--icon-lime) 10%, transparent), transparent 60%)",
  },
  {
    number: "02",
    title: "Score",
    line: "See your gut score instantly.",
    color: "var(--icon-green)",
    gradient: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))",
    bgGradient: "linear-gradient(160deg, color-mix(in srgb, var(--icon-green) 10%, transparent), transparent 60%)",
  },
  {
    number: "03",
    title: "Report",
    line: "Get your personal insight report.",
    color: "var(--icon-teal)",
    gradient: "linear-gradient(135deg, var(--icon-teal), var(--icon-yellow))",
    bgGradient: "linear-gradient(160deg, color-mix(in srgb, var(--icon-teal) 10%, transparent), transparent 60%)",
  },
  {
    number: "04",
    title: "30-Day Plan",
    line: "Follow your plan and improve weekly.",
    color: "var(--icon-orange)",
    gradient: "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange))",
    bgGradient: "linear-gradient(160deg, color-mix(in srgb, var(--icon-orange) 10%, transparent), transparent 60%)",
  },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="px-6 py-24 md:py-32">
      <div className="mx-auto max-w-[1200px]">
        <ScrollReveal>
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-icon-green">
              How It Works
            </p>
            <h2 className="font-serif text-4xl font-semibold text-foreground sm:text-5xl text-balance">
              From score to plan{" "}
              <span className="brand-gradient-text">in four steps</span>
            </h2>
          </div>
        </ScrollReveal>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, i) => (
            <ScrollReveal key={step.number} delay={i * 80}>
              <div
                className="relative flex h-full flex-col rounded-3xl p-7 transition-shadow hover:shadow-lg"
                style={{
                  background: step.bgGradient,
                  border: `1.5px solid color-mix(in srgb, ${step.color} 30%, transparent)`,
                  borderLeft: `4px solid ${step.color}`,
                }}
              >
                {/* Large step number */}
                <span
                  className="font-serif text-6xl font-bold leading-none md:text-7xl"
                  style={{ color: step.color }}
                >
                  {step.number}
                </span>

                <h3 className="mt-6 font-serif text-2xl font-semibold text-foreground">
                  {step.title}
                </h3>
                <p className="mt-2 text-base leading-relaxed text-muted-foreground">
                  {step.line}
                </p>

                {/* Connector (not on last) */}
                {i < STEPS.length - 1 && (
                  <div
                    className="absolute -right-3 top-1/2 hidden -translate-y-1/2 lg:block"
                    style={{ zIndex: 1 }}
                  >
                    <div
                      className="flex h-6 w-6 items-center justify-center rounded-full text-white"
                      style={{ background: step.gradient }}
                    >
                      <ArrowRight size={12} />
                    </div>
                  </div>
                )}
              </div>
            </ScrollReveal>
          ))}
        </div>

        {/* CTA */}
        <ScrollReveal delay={400}>
          <div className="mt-12 text-center">
            <Link
              href="/assessment"
              className="brand-gradient inline-flex items-center gap-2 rounded-full px-8 py-4 text-base font-semibold text-white shadow-lg shadow-icon-green/20 transition-all hover:shadow-xl hover:shadow-icon-green/30 hover:opacity-90"
            >
              Get my gut score free <ArrowRight size={16} />
            </Link>
            <p className="mt-3 text-xs text-muted-foreground">
              Takes about 3 minutes. No account required.
            </p>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
