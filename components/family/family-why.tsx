import Link from "next/link"
import { ArrowRight, ClipboardList, UtensilsCrossed, GraduationCap, TrendingUp } from "lucide-react"
import { ScrollReveal } from "@/components/scroll-reveal"

const STEPS = [
  {
    number: "01",
    icon: ClipboardList,
    title: "Assess",
    description: "Each family member answers 15 questions. Get a personalised gut health score for everyone at the table.",
    color: "var(--icon-lime)",
    gradient: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))",
    bgGradient: "linear-gradient(160deg, color-mix(in srgb, var(--icon-lime) 10%, transparent), transparent 60%)",
  },
  {
    number: "02",
    icon: UtensilsCrossed,
    title: "Build",
    description: "Use the EatoBiotics Plate to plan one weekly shop and one weekly cook that covers the whole family.",
    color: "var(--icon-green)",
    gradient: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))",
    bgGradient: "linear-gradient(160deg, color-mix(in srgb, var(--icon-green) 10%, transparent), transparent 60%)",
  },
  {
    number: "03",
    icon: GraduationCap,
    title: "Teach",
    description: "Kids who build the plate learn why food matters — without lectures. Real food. Real habits.",
    color: "var(--icon-teal)",
    gradient: "linear-gradient(135deg, var(--icon-teal), var(--icon-yellow))",
    bgGradient: "linear-gradient(160deg, color-mix(in srgb, var(--icon-teal) 10%, transparent), transparent 60%)",
  },
  {
    number: "04",
    icon: TrendingUp,
    title: "Track",
    description: "Log meals together. Watch scores improve. Build a gut health culture that lasts a lifetime.",
    color: "var(--icon-orange)",
    gradient: "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange))",
    bgGradient: "linear-gradient(160deg, color-mix(in srgb, var(--icon-orange) 10%, transparent), transparent 60%)",
  },
]

export function FamilyWhy() {
  return (
    <section id="how-it-works" className="px-6 py-24 md:py-32">
      <div className="mx-auto max-w-[1200px]">
        <ScrollReveal>
          <div className="text-center mb-16">
            <p className="text-xs font-semibold uppercase tracking-widest text-icon-green mb-3">
              For Families
            </p>
            <h2 className="font-serif text-4xl font-semibold text-foreground sm:text-5xl text-balance">
              One framework.{" "}
              <span className="brand-gradient-text">Every member.</span>
            </h2>
            <p className="mt-4 mx-auto max-w-lg text-base text-muted-foreground leading-relaxed">
              From a first family assessment to a weekly routine everyone can stick to — here&apos;s how EatoBiotics works for families.
            </p>
          </div>
        </ScrollReveal>

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

                  {/* Connector arrow (not on last) */}
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
              href="/assessment-family"
              className="brand-gradient inline-flex items-center gap-2 rounded-full px-8 py-4 text-base font-semibold text-white shadow-lg shadow-icon-green/20 transition-all hover:shadow-xl hover:shadow-icon-green/30 hover:opacity-90"
            >
              Start Your Family Assessment <ArrowRight size={16} />
            </Link>
            <p className="mt-3 text-xs text-muted-foreground">
              Free to start. Each family member gets their own score.
            </p>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
