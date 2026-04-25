import Link from "next/link"
import Image from "next/image"
import { ArrowRight, Check, Star, Zap } from "lucide-react"
import { ScrollReveal } from "@/components/scroll-reveal"

/* ── Tier data ─────────────────────────────────────────────────────────── */

const TIERS = [
  {
    id:       "free",
    label:    "Free",
    price:    "Free",
    tagline:  "Understand your system",
    color:    "var(--icon-lime)",
    gradient: "linear-gradient(135deg, var(--icon-lime), #56C135)",
    features: [
      "Know your Biotics Score",
      "Understand what it means",
      "Get your food system baseline",
      "Access the full food library",
      "One free meal scan",
    ],
    cta:  "Start Free Assessment",
    href: "/assessment",
    badge: null,
    highlight: false,
  },
  {
    id:       "grow",
    label:    "Grow",
    price:    "€9.99",
    per:      "/month",
    tagline:  "Build daily habits",
    color:    "var(--icon-green)",
    gradient: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))",
    features: [
      "2 meal analyses per day",
      "Real-time score tracking",
      "Daily habit nudges + streaks",
      "30-day score history",
      "My Plate — AI meal plans",
    ],
    cta:  "Start Grow",
    href: "/pricing#tier-grow",
    badge: "Most popular",
    highlight: true,
  },
  {
    id:       "restore",
    label:    "Restore",
    price:    "€49",
    per:      "/month",
    tagline:  "Fix what's holding you back",
    color:    "var(--icon-teal)",
    gradient: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))",
    features: [
      "5 meal analyses per day",
      "AI-built monthly gut plan",
      "Deep-dive your weakest pillar",
      "Condition-specific guidance",
      "My Plate — AI meal plans",
    ],
    cta:  "Start Restore",
    href: "/pricing#tier-restore",
    badge: null,
    highlight: false,
  },
  {
    id:       "transform",
    label:    "Transform",
    price:    "€99",
    per:      "/month",
    tagline:  "Fully optimise your system",
    color:    "var(--icon-orange)",
    gradient: "linear-gradient(135deg, var(--icon-teal), var(--icon-yellow), var(--icon-orange))",
    features: [
      "Unlimited EatoBiotic consultations",
      "Weekly AI check-in report",
      "Full food system optimisation",
      "10 meal analyses per day",
      "Founding member status",
    ],
    cta:  "Start Transform",
    href: "/pricing#tier-transform",
    badge: "Founding member",
    highlight: false,
  },
]

/* ── One-time reports data ──────────────────────────────────────────────── */

const REPORTS = [
  {
    label:    "Starter",
    price:    "€20",
    color:    "var(--icon-lime)",
    desc:     "Your food system score, top 5 priority foods, and a 7-day starter plan.",
  },
  {
    label:    "Full Report",
    price:    "€40",
    color:    "var(--icon-green)",
    desc:     "Pillar-by-pillar recommendations, your top 12 foods ranked, and a 30-day rebuilding plan.",
    popular:  true,
  },
  {
    label:    "Premium",
    price:    "€50",
    color:    "var(--icon-teal)",
    desc:     "Everything in Full, plus meal timing, seasonal guide, shopping list, and 90-day tracker.",
  },
]

/* ── Component ────────────────────────────────────────────────────────── */

export function MembershipTeaser() {
  return (
    <section className="relative overflow-hidden px-6 py-24 md:py-32">

      <div className="relative mx-auto max-w-[1200px]">

        {/* ── Header ── */}
        <div className="flex flex-col gap-10 md:flex-row md:items-center md:gap-16 mb-14">
          <ScrollReveal className="flex-1">
            <div
              className="mb-4 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest"
              style={{ background: "color-mix(in srgb, var(--icon-lime) 15%, transparent)", color: "var(--icon-green)" }}
            >
              <Zap size={11} /> Membership
            </div>
            <h2 className="font-serif text-4xl font-semibold tracking-tight text-foreground sm:text-5xl text-balance">
              Start free.{" "}
              <span
                style={{
                  background: "linear-gradient(135deg, var(--icon-lime), var(--icon-green), var(--icon-teal))",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Grow with your system.
              </span>
            </h2>
            <p className="mt-4 max-w-lg text-base text-muted-foreground leading-relaxed">
              Every tier builds on the last — start with a free assessment, upgrade when
              you&apos;re ready. Cancel any time.
            </p>
          </ScrollReveal>
          <ScrollReveal delay={80} className="flex-1 md:max-w-[500px]">
            <Image
              src="/food-17.png"
              alt="EatoBiotics membership — nourish your system"
              width={700}
              height={500}
              className="w-full h-auto rounded-2xl"
            />
          </ScrollReveal>
        </div>

        {/* ── Tier cards ── */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {TIERS.map((tier, i) => (
            <ScrollReveal key={tier.id} delay={i * 70}>
              <div
                className="relative flex flex-col h-full rounded-3xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
                style={{
                  background: "var(--card)",
                  border: tier.highlight
                    ? `2px solid color-mix(in srgb, ${tier.color} 50%, transparent)`
                    : "1px solid var(--border)",
                  boxShadow: tier.highlight
                    ? `0 0 0 1px color-mix(in srgb, ${tier.color} 20%, transparent), 0 8px 32px color-mix(in srgb, ${tier.color} 12%, transparent)`
                    : undefined,
                }}
              >
                {/* Badge */}
                {tier.badge && (
                  <div
                    className="absolute right-4 top-4 flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white z-10"
                    style={{ background: tier.gradient }}
                  >
                    {tier.id === "grow" && <Star size={9} fill="currentColor" />}
                    {tier.badge}
                  </div>
                )}

                {/* Gradient accent bar */}
                <div
                  className="h-1.5 w-full shrink-0"
                  style={{ background: tier.gradient }}
                />

                {/* Card header */}
                <div className="px-6 pt-5 pb-4">
                  <p
                    className="text-[10px] font-bold uppercase tracking-widest mb-2"
                    style={{ color: tier.color }}
                  >
                    {tier.label}
                  </p>
                  <div className="flex items-baseline gap-0.5">
                    <span className="font-serif text-4xl font-bold text-foreground">
                      {tier.price}
                    </span>
                    {"per" in tier && (
                      <span className="text-sm text-muted-foreground ml-0.5">
                        {tier.per}
                      </span>
                    )}
                  </div>
                  <p className="mt-1.5 text-xs text-muted-foreground leading-snug">
                    {tier.tagline}
                  </p>
                </div>

                {/* Divider */}
                <div
                  className="mx-6 h-px"
                  style={{ background: `color-mix(in srgb, ${tier.color} 20%, var(--border))` }}
                />

                {/* Features */}
                <div className="flex flex-1 flex-col px-6 py-5">
                  <ul className="flex-1 space-y-2.5 mb-6">
                    {tier.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                        <Check
                          size={13}
                          className="mt-0.5 shrink-0"
                          style={{ color: tier.color }}
                        />
                        {f}
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <Link
                    href={tier.href}
                    className="flex items-center justify-center gap-1.5 rounded-full py-3 px-5 text-sm font-semibold text-white transition-all hover:opacity-90 hover:shadow-lg"
                    style={{ background: tier.gradient }}
                  >
                    {tier.cta} <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>

        {/* ── Compare all features link ── */}
        <ScrollReveal delay={350}>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            <Link
              href="/pricing"
              className="font-medium underline underline-offset-4 hover:text-foreground transition-colors"
            >
              Compare all plans in detail →
            </Link>
          </p>
        </ScrollReveal>

        {/* ── One-time reports callout ── */}
        <ScrollReveal delay={400}>
          <div
            className="mt-16 rounded-3xl overflow-hidden"
            style={{
              border: "1px solid var(--border)",
              background: "var(--card)",
            }}
          >
            {/* Strip header */}
            <div
              className="px-6 py-5 border-b border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
              style={{ background: "color-mix(in srgb, var(--icon-lime) 4%, var(--card))" }}
            >
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">
                  One-time deep dives
                </p>
                <p className="text-sm font-semibold text-foreground">
                  Already have your free Biotics Score?{" "}
                  <span
                    style={{
                      background: "linear-gradient(90deg, var(--icon-lime), var(--icon-green))",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    }}
                  >
                    Go deeper with a one-time report.
                  </span>
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  No subscription — pay once, yours forever. AI-generated from your personal assessment data.
                </p>
              </div>
              <Link
                href="/reports"
                className="shrink-0 inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-muted whitespace-nowrap"
              >
                See all reports <ArrowRight size={11} />
              </Link>
            </div>

            {/* Report tiers — each links to the reports page */}
            <div className="grid sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border">
              {REPORTS.map((report) => (
                <Link
                  key={report.label}
                  href="/reports"
                  className="group relative block px-6 py-5 transition-colors hover:bg-secondary/30"
                >
                  {report.popular && (
                    <div
                      className="absolute right-4 top-4 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white"
                      style={{ background: "var(--icon-green)" }}
                    >
                      Popular
                    </div>
                  )}
                  <p
                    className="text-[10px] font-bold uppercase tracking-widest mb-1"
                    style={{ color: report.color }}
                  >
                    {report.label}
                  </p>
                  <p className="font-serif text-2xl font-bold text-foreground mb-2">
                    {report.price}
                    <span className="text-sm font-normal text-muted-foreground ml-1">
                      one-time
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {report.desc}
                  </p>
                  <p
                    className="mt-2 text-[11px] font-semibold opacity-0 transition-opacity group-hover:opacity-100"
                    style={{ color: report.color }}
                  >
                    See full details →
                  </p>
                </Link>
              ))}
            </div>

            {/* Report footer */}
            <div
              className="px-6 py-3.5 border-t border-border flex items-center justify-between"
              style={{ background: "color-mix(in srgb, var(--icon-lime) 3%, var(--card))" }}
            >
              <p className="text-xs text-muted-foreground">
                Unlocked after your free assessment · PDF delivered by email
              </p>
              <Link
                href="/reports"
                className="text-xs font-semibold transition-colors hover:opacity-80"
                style={{ color: "var(--icon-green)" }}
              >
                View all reports →
              </Link>
            </div>
          </div>
        </ScrollReveal>

      </div>
    </section>
  )
}
