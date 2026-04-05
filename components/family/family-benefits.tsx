import { ScrollReveal } from "@/components/scroll-reveal"
import { Check, LayoutDashboard, Sprout, TrendingUp } from "lucide-react"

const benefits = [
  "Every family member gets their own personalised gut health score",
  "One weekly plate that works for all ages — toddlers to adults",
  "Log meals together and track improvement across the whole family",
  "AI advisor for family meal planning and food questions",
  "Build food habits that outlast any diet or short-term fix",
  "Understand the why behind every food — not just the what",
]

const roles = [
  {
    icon: LayoutDashboard,
    label: "Manage",
    color: "var(--icon-lime)",
    gradient: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))",
    bgGradient: "linear-gradient(160deg, color-mix(in srgb, var(--icon-lime) 10%, transparent), transparent 70%)",
    description:
      "See every family member's gut health score, track their meal logs, and understand where the family food system stands — all in one place.",
  },
  {
    icon: Sprout,
    label: "Develop",
    color: "var(--icon-teal)",
    gradient: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))",
    bgGradient: "linear-gradient(160deg, color-mix(in srgb, var(--icon-teal) 10%, transparent), transparent 70%)",
    description:
      "Build the weekly plate together. Create food habits that become part of family life — not a short-term fix or another diet that doesn't stick.",
  },
  {
    icon: TrendingUp,
    label: "Evolve",
    color: "var(--icon-orange)",
    gradient: "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange))",
    bgGradient: "linear-gradient(160deg, color-mix(in srgb, var(--icon-orange) 10%, transparent), transparent 70%)",
    description:
      "As children grow and needs change, the EatoBiotics system grows with you. One framework that works at every stage of family life.",
  },
]

export function FamilyBenefits() {
  return (
    <section className="bg-secondary/40 px-6 py-24 md:py-32">
      <div className="mx-auto max-w-[1200px]">
        <div className="flex flex-col gap-16 lg:flex-row lg:gap-20">

          {/* ── Left: heading + benefits list ─────────────────── */}
          <div className="lg:w-[480px] lg:shrink-0">
            <ScrollReveal>
              <p className="text-xs font-semibold uppercase tracking-widest text-icon-green">
                For Parents
              </p>
              <h2 className="mt-4 font-serif text-4xl font-semibold text-foreground sm:text-5xl text-balance">
                You&apos;re the architect of your{" "}
                <span className="brand-gradient-text">family&apos;s food system.</span>
              </h2>
              <p className="mt-6 text-base leading-relaxed text-muted-foreground">
                EatoBiotics gives parents the tools to understand, shape, and grow
                a food culture at home — one that improves every family member&apos;s
                gut health, energy, and wellbeing over time.
              </p>
            </ScrollReveal>

            <ScrollReveal delay={120}>
              <ul className="mt-8 flex flex-col gap-3">
                {benefits.map((benefit, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span
                      className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                      style={{ background: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))" }}
                    >
                      <Check size={11} className="text-white" strokeWidth={3} />
                    </span>
                    <span className="text-sm leading-relaxed text-foreground/80">
                      {benefit}
                    </span>
                  </li>
                ))}
              </ul>
            </ScrollReveal>
          </div>

          {/* ── Right: Manage / Develop / Evolve cards ────────── */}
          <div className="flex-1 flex flex-col gap-5">
            {roles.map((role, i) => {
              const Icon = role.icon
              return (
                <ScrollReveal key={role.label} delay={i * 100}>
                  <div
                    className="flex items-start gap-4 rounded-2xl p-6 transition-shadow hover:shadow-lg"
                    style={{
                      background: role.bgGradient,
                      border: `1.5px solid color-mix(in srgb, ${role.color} 25%, transparent)`,
                      borderLeft: `4px solid ${role.color}`,
                    }}
                  >
                    {/* Icon */}
                    <div
                      className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
                      style={{ background: `color-mix(in srgb, ${role.color} 15%, transparent)` }}
                    >
                      <Icon size={20} style={{ color: role.color }} />
                    </div>

                    {/* Text */}
                    <div>
                      <p
                        className="text-xs font-bold uppercase tracking-widest mb-1"
                        style={{ color: role.color }}
                      >
                        {role.label}
                      </p>
                      <p className="text-sm leading-relaxed text-foreground/80">
                        {role.description}
                      </p>
                    </div>
                  </div>
                </ScrollReveal>
              )
            })}
          </div>

        </div>
      </div>
    </section>
  )
}
