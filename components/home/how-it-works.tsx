import Image from "next/image"
import Link from "next/link"
import { ArrowRight, ClipboardList, BarChart2, Utensils, TrendingUp } from "lucide-react"
import { ScrollReveal } from "@/components/scroll-reveal"

const STEPS = [
  {
    number: "01",
    icon: ClipboardList,
    title: "Assess",
    description: "Answer 15 questions about what you eat. Get your personalised food system score.",
    color: "var(--icon-lime)",
    gradient: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))",
    bgGradient: "linear-gradient(160deg, color-mix(in srgb, var(--icon-lime) 10%, transparent), transparent 60%)",
  },
  {
    number: "02",
    icon: BarChart2,
    title: "Score",
    description: "See your Biotics Score across 5 pillars — Diversity, Feeding, Live Foods, Consistency, and Feeling.",
    color: "var(--icon-green)",
    gradient: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))",
    bgGradient: "linear-gradient(160deg, color-mix(in srgb, var(--icon-green) 10%, transparent), transparent 60%)",
  },
  {
    number: "03",
    icon: Utensils,
    title: "Log",
    description: "Photograph or describe your meals. EatoBiotics scores them for Pre, Pro, and Post biotics in seconds.",
    color: "var(--icon-teal)",
    gradient: "linear-gradient(135deg, var(--icon-teal), var(--icon-yellow))",
    bgGradient: "linear-gradient(160deg, color-mix(in srgb, var(--icon-teal) 10%, transparent), transparent 60%)",
  },
  {
    number: "04",
    icon: TrendingUp,
    title: "Improve",
    description: "Track your streak, get personalised meal plans, and consult EatoBiotic — your AI food system advisor.",
    color: "var(--icon-orange)",
    gradient: "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange))",
    bgGradient: "linear-gradient(160deg, color-mix(in srgb, var(--icon-orange) 10%, transparent), transparent 60%)",
  },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="px-6 py-24 md:py-32">
      <div className="mx-auto max-w-[1200px]">
        <div className="flex flex-col gap-10 md:flex-row md:items-center md:gap-16 mb-16">
          <ScrollReveal className="flex-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-icon-green mb-3">
              How It Works
            </p>
            <h2 className="font-serif text-4xl font-semibold text-foreground sm:text-5xl text-balance">
              Four steps to a stronger{" "}
              <span className="brand-gradient-text">food system</span>
            </h2>
            <p className="mt-4 max-w-lg text-base text-muted-foreground leading-relaxed">
              From your first free assessment to a fully personalised daily practice — here&apos;s how EatoBiotics works.
            </p>
          </ScrollReveal>
          <ScrollReveal delay={80} className="w-full md:w-[340px] lg:w-[400px] shrink-0">
            <Image
              src="/food-5.png"
              alt="Colourful fresh ingredients arranged as a food system"
              width={600}
              height={600}
              className="w-full h-auto"
            />
          </ScrollReveal>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, i) => {
            const Icon = step.icon
            return (
              <ScrollReveal key={step.number} delay={i * 80}>
                <div
                  className="relative flex flex-col rounded-3xl p-6 transition-shadow hover:shadow-lg h-full"
                  style={{
                    background: step.bgGradient,
                    border: `1.5px solid color-mix(in srgb, ${step.color} 30%, transparent)`,
                    borderLeft: `4px solid ${step.color}`,
                  }}
                >
                  {/* Step number */}
                  <p
                    className="text-xs font-bold uppercase tracking-widest mb-4"
                    style={{ color: step.color }}
                  >
                    {step.number}
                  </p>

                  {/* Icon */}
                  <div
                    className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl"
                    style={{ background: `color-mix(in srgb, ${step.color} 15%, transparent)` }}
                  >
                    <Icon size={20} style={{ color: step.color }} />
                  </div>

                  {/* Content */}
                  <h3 className="font-serif text-xl font-semibold text-foreground mb-2">
                    {step.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed flex-1">
                    {step.description}
                  </p>

                  {/* Connector line (not on last) */}
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
            )
          })}
        </div>

        {/* CTA */}
        <ScrollReveal delay={400}>
          <div className="mt-12 text-center">
            <Link
              href="/assessment"
              className="brand-gradient inline-flex items-center gap-2 rounded-full px-8 py-4 text-base font-semibold text-white shadow-lg shadow-icon-green/20 transition-all hover:shadow-xl hover:shadow-icon-green/30 hover:opacity-90"
            >
              Start Free Assessment <ArrowRight size={16} />
            </Link>
            <p className="mt-3 text-xs text-muted-foreground">
              Free to start. No card needed. Takes about 3 minutes.
            </p>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
