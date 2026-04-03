import Link from "next/link"
import { ArrowRight, Check } from "lucide-react"
import { ScrollReveal } from "@/components/scroll-reveal"

const TIERS = [
  {
    label: "Free",
    price: "Free",
    color: "var(--icon-lime)",
    gradient: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))",
    feature: "Biotics Score + assessment",
    href: "/assessment",
    cta: "Start Free",
  },
  {
    label: "Grow",
    price: "€9.99/mo",
    color: "var(--icon-green)",
    gradient: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))",
    feature: "Daily meal logging + streak tracking",
    href: "/pricing",
    cta: "See Plan",
    highlight: true,
  },
  {
    label: "Transform",
    price: "€99/mo",
    color: "var(--icon-orange)",
    gradient: "linear-gradient(135deg, var(--icon-teal), var(--icon-orange))",
    feature: "Unlimited EatoBiotic consultations",
    href: "/pricing",
    cta: "See Plan",
  },
]

export function MembershipTeaser() {
  return (
    <section className="px-6 py-24 md:py-32">
      <div className="mx-auto max-w-[1200px]">
        <ScrollReveal>
          <div className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-widest text-icon-green mb-3">
              Membership
            </p>
            <h2 className="font-serif text-4xl font-semibold text-foreground sm:text-5xl text-balance">
              Start free.<br />
              <span className="brand-gradient-text">Grow with your system.</span>
            </h2>
            <p className="mt-4 mx-auto max-w-lg text-base text-muted-foreground leading-relaxed">
              Every tier builds on the last. Start with your free assessment — upgrade when you&apos;re ready.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid gap-4 sm:grid-cols-3 max-w-3xl mx-auto">
          {TIERS.map((tier, i) => (
            <ScrollReveal key={tier.label} delay={i * 80}>
              <div
                className="relative flex flex-col rounded-3xl border bg-card p-6 h-full transition-shadow hover:shadow-lg"
                style={tier.highlight ? { borderColor: `color-mix(in srgb, ${tier.color} 40%, var(--border))`, borderWidth: "2px" } : {}}
              >
                {/* Top accent */}
                <div className="h-1 w-full rounded-full mb-5" style={{ background: tier.gradient }} />

                <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: tier.color }}>
                  {tier.label}
                </p>
                <p className="font-serif text-2xl font-bold text-foreground mb-4">
                  {tier.price}
                </p>
                <div className="flex items-start gap-2 mb-6 flex-1">
                  <Check size={14} className="mt-0.5 shrink-0" style={{ color: tier.color }} />
                  <p className="text-sm text-muted-foreground leading-relaxed">{tier.feature}</p>
                </div>
                <Link
                  href={tier.href}
                  className="inline-flex items-center justify-center gap-1.5 rounded-full py-2.5 px-5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                  style={{ background: tier.gradient }}
                >
                  {tier.cta} <ArrowRight size={13} />
                </Link>
              </div>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal delay={300}>
          <p className="mt-8 text-center text-sm text-muted-foreground">
            <Link href="/pricing" className="font-medium underline underline-offset-4 hover:text-foreground transition-colors">
              See all plans and features →
            </Link>
          </p>
        </ScrollReveal>
      </div>
    </section>
  )
}
