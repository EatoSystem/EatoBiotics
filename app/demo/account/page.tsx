import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

export const metadata: Metadata = {
  title: "Account Preview — EatoBiotics",
  description: "Preview what your EatoBiotics account dashboard looks like on each membership tier.",
  robots: "noindex",
}

const TIERS = [
  {
    key: "free",
    label: "Free",
    price: "Free",
    tagline: "Your foundation — assessment score, history, and food library.",
    color: "var(--icon-lime)",
    gradient: "linear-gradient(135deg, var(--icon-lime), #56C135)",
    features: ["Purchased report access", "Today's Biotics Score", "Food library"],
  },
  {
    key: "grow",
    label: "Grow",
    price: "€9.99/mo",
    tagline: "Daily habits and meal tracking with full biotic breakdowns.",
    color: "var(--icon-green)",
    gradient: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))",
    features: ["2 meal analyses/day", "30-day score history", "Plate builder"],
  },
  {
    key: "restore",
    label: "Restore",
    price: "€49/mo",
    tagline: "Deep insight, condition calibration, and a monthly gut plan.",
    color: "var(--icon-teal)",
    gradient: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))",
    features: ["5 meal analyses/day + AI context", "Monthly food system plan", "90-day history"],
  },
  {
    key: "transform",
    label: "Transform",
    price: "€99/mo",
    tagline: "Unlimited AI consultations, weekly check-ins, and full personalisation.",
    color: "var(--icon-orange)",
    gradient: "linear-gradient(135deg, var(--icon-teal), var(--icon-yellow), var(--icon-orange))",
    features: ["10 meal analyses/day + full context", "Unlimited AI consultations", "Weekly AI check-in"],
  },
]

export default function DemoAccountPage() {
  return (
    <div className="min-h-screen bg-background pt-24 pb-16">
      <div className="mx-auto max-w-3xl px-6">
        {/* Header */}
        <div className="mb-10 text-center">
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Demo Preview
          </p>
          <h1 className="font-serif text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Account Dashboard
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Select a membership tier to preview what the dashboard looks like with sample data.
          </p>
        </div>

        {/* Tier cards */}
        <div className="grid gap-4 sm:grid-cols-2">
          {TIERS.map((t) => (
            <Link
              key={t.key}
              href={`/demo/account/${t.key}`}
              className="group flex flex-col rounded-2xl border bg-card p-6 transition-all hover:shadow-lg hover:-translate-y-0.5"
              style={{ borderTop: `3px solid ${t.color}` }}
            >
              {/* Header */}
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest" style={{ color: t.color }}>
                    {t.label}
                  </p>
                  <p className="mt-0.5 font-serif text-2xl font-bold text-foreground">{t.price}</p>
                </div>
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-full transition-transform group-hover:translate-x-0.5"
                  style={{ background: `color-mix(in srgb, ${t.color} 15%, transparent)` }}
                >
                  <ArrowRight size={14} style={{ color: t.color }} />
                </div>
              </div>

              <p className="mb-4 text-sm leading-relaxed text-muted-foreground">{t.tagline}</p>

              {/* Feature list */}
              <ul className="mt-auto space-y-1.5">
                {t.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: t.color }} />
                    {f}
                  </li>
                ))}
              </ul>
            </Link>
          ))}
        </div>

        {/* Footer note */}
        <p className="mt-8 text-center text-xs text-muted-foreground">
          All previews use sample data for Sarah M. —{" "}
          <Link href="/assessment" className="underline hover:text-foreground transition-colors">
            take the real assessment
          </Link>{" "}
          to see your own scores.
        </p>
      </div>
    </div>
  )
}
