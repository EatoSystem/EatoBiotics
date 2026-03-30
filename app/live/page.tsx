import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Lock } from "lucide-react"

export const metadata: Metadata = {
  title: "Live Preview — EatoBiotics",
  description:
    "Walk through the full EatoBiotics experience from free assessment to personalised report and membership.",
  robots: "noindex",
}

const STEPS = [
  {
    number: 1,
    color: "var(--icon-lime)",
    label: "Free Assessment",
    description:
      "Answer 15 honest questions about what you eat and how you feel. No account needed, takes about 5 minutes. Your score is calculated live across 5 food system pillars.",
    locked: false,
    primaryHref: "/assessment",
    primaryLabel: "Start free assessment",
    secondaryHref: "/demo/assessment",
    secondaryLabel: "See demo results first",
  },
  {
    number: 2,
    color: "var(--icon-green)",
    label: "Your Score + Gut Profile",
    description:
      "At the end of the assessment you'll see your score (0–100), your gut profile type, pillar breakdown, and a personalised 7-day action plan sent to your inbox.",
    locked: false,
    primaryHref: "/demo/assessment",
    primaryLabel: "Preview demo results",
    secondaryHref: null,
    secondaryLabel: null,
  },
  {
    number: 3,
    color: "var(--icon-teal)",
    label: "Choose Your Report",
    description:
      "Below your results you'll see three report tiers — Starter (€20), Full (€40), and Premium (€50). Pick one and pay via Stripe to unlock your deep consultation.",
    locked: false,
    stripe: true,
    primaryHref: "/assessment",
    primaryLabel: "Go to assessment",
    secondaryHref: "/assessment/demo?tier=full",
    secondaryLabel: "Preview a Full Report",
  },
  {
    number: 4,
    color: "var(--icon-teal)",
    label: "Deep Consultation",
    description:
      "After payment you'll answer 15–25 tailored follow-up questions across four sections: Your Symptoms, Your Gut History, Your Lifestyle, and Your Goals.",
    locked: true,
    lockedNote: "Unlocked after completing step 3",
    primaryHref: "/assessment/demo?tier=full",
    primaryLabel: "Preview the report output",
    secondaryHref: null,
    secondaryLabel: null,
  },
  {
    number: 5,
    color: "var(--icon-orange)",
    label: "Your Personalised Report",
    description:
      "Claude analyses your answers and generates a full report in ~2 minutes — gut triggers, score projection, 90-day roadmap, pillar deep-dives, and a membership action plan.",
    locked: true,
    lockedNote: "Generated after completing step 4",
    primaryHref: "/assessment/demo?tier=full",
    primaryLabel: "Preview a sample report",
    secondaryHref: null,
    secondaryLabel: null,
  },
  {
    number: 6,
    color: "var(--icon-yellow)",
    label: "Account + Membership",
    description:
      "Preview all four membership tiers — Free, Grow, Restore, and Transform — with real dashboard UI and sample data. Or sign in to your own account to see your actual reports and progress.",
    locked: false,
    primaryHref: "/demo/account",
    primaryLabel: "Preview all 4 account tiers",
    secondaryHref: "/account",
    secondaryLabel: "Sign in to my account",
  },
]

export default function LivePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden px-6 pb-12 pt-28 sm:pt-36">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 70% 50% at 50% 0%, color-mix(in srgb, var(--icon-green) 10%, transparent), transparent 70%)",
          }}
        />
        <div className="relative mx-auto max-w-2xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--icon-green)]/40 bg-[var(--icon-green)]/8 px-3 py-1.5 text-xs font-semibold text-[var(--icon-green)]">
            <Lock size={10} />
            Live Preview
          </div>

          <div className="mt-6 flex justify-center">
            <Image
              src="/eatobiotics-icon.webp"
              alt=""
              width={64}
              height={64}
              className="h-14 w-14 md:h-16 md:w-16"
            />
          </div>

          <h1 className="mt-5 font-serif text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
            The Full EatoBiotics Journey
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-muted-foreground">
            Follow the path below — or jump straight to any stage. Each step links to the real,
            live page.
          </p>
        </div>
      </section>

      {/* Stripe test callout */}
      <section className="px-6 pb-6">
        <div className="mx-auto max-w-2xl">
          <div
            className="rounded-2xl border px-5 py-4 text-sm"
            style={{
              borderColor: "color-mix(in srgb, var(--icon-teal) 30%, transparent)",
              background: "color-mix(in srgb, var(--icon-teal) 5%, transparent)",
            }}
          >
            <p className="font-semibold text-foreground mb-1.5">Stripe test card details</p>
            <p className="text-muted-foreground leading-relaxed">
              Use card number{" "}
              <code className="rounded bg-secondary px-1.5 py-0.5 font-mono text-xs text-foreground">
                4242 4242 4242 4242
              </code>{" "}
              with any future expiry date and any 3-digit CVC. No real charge will be made in test
              mode.
            </p>
          </div>
        </div>
      </section>

      {/* Journey steps */}
      <section className="px-6 pb-20">
        <div className="mx-auto max-w-2xl">
          <div className="relative space-y-4">
            {/* Connecting line */}
            <div
              className="absolute left-[22px] top-12 bottom-12 w-px"
              style={{ background: "var(--border)" }}
            />

            {STEPS.map((step) => (
              <div key={step.number} className="relative flex gap-5">
                {/* Step circle */}
                <div
                  className="relative z-10 mt-5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                  style={{ background: step.color }}
                >
                  {step.number}
                </div>

                {/* Card */}
                <div
                  className="flex-1 rounded-2xl border p-5"
                  style={
                    step.locked
                      ? {
                          borderStyle: "dashed",
                          borderColor: "var(--border)",
                          background: "color-mix(in srgb, var(--muted) 30%, transparent)",
                        }
                      : { borderColor: "var(--border)", background: "var(--card)" }
                  }
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <p
                      className="text-xs font-bold uppercase tracking-widest"
                      style={{ color: step.color }}
                    >
                      Step {step.number}
                    </p>
                    {step.locked && step.lockedNote && (
                      <span className="text-[10px] font-medium text-muted-foreground bg-secondary rounded-full px-2 py-0.5 shrink-0">
                        {step.lockedNote}
                      </span>
                    )}
                    {"stripe" in step && step.stripe && (
                      <span
                        className="text-[10px] font-semibold rounded-full px-2 py-0.5 shrink-0"
                        style={{
                          color: "var(--icon-teal)",
                          background: "color-mix(in srgb, var(--icon-teal) 12%, transparent)",
                        }}
                      >
                        Stripe payment
                      </span>
                    )}
                  </div>

                  <p className="font-serif text-lg font-semibold text-foreground mb-1.5">
                    {step.label}
                  </p>
                  <p className="text-sm leading-relaxed text-muted-foreground mb-4">
                    {step.description}
                  </p>

                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={step.primaryHref}
                      className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90"
                      style={{ background: step.color }}
                    >
                      {step.primaryLabel} <ArrowRight size={11} />
                    </Link>
                    {step.secondaryHref && (
                      <Link
                        href={step.secondaryHref}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-border px-4 py-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground hover:border-foreground/30"
                      >
                        {step.secondaryLabel}
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Explore more */}
      <section className="border-t border-border bg-secondary/10 px-6 py-12">
        <div className="mx-auto max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-5">
            Explore individual features
          </p>
          <div className="flex flex-wrap gap-3">
            {[
              { href: "/analyse", label: "Meal Analysis" },
              { href: "/myplate", label: "My Plate Builder" },
              { href: "/food", label: "Food Library" },
              { href: "/pricing", label: "Membership Plans" },
              { href: "/demo", label: "Demo Hub" },
              { href: "/share", label: "Share a Meal" },
            ].map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="rounded-full border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-foreground/30 hover:bg-secondary/50"
              >
                {l.label} →
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
