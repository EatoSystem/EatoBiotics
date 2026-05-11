import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, CheckCircle2 } from "lucide-react"

export const metadata: Metadata = {
  title: "Your EatoBiotics Account — See It In Action",
  description:
    "Explore the EatoBiotics membership dashboard with live sample data. See your gut score, meal analysis, monthly plan, AI consultations, and more.",
}

const TIERS = [
  {
    key: "free",
    label: "Free",
    price: "Free",
    tagline: "Your foundation — assessment score, history, and food library.",
    color: "var(--icon-lime)",
    gradient: "linear-gradient(135deg, var(--icon-lime), #56C135)",
    features: [
      "Gut Biotics Score",
      "Assessment history",
      "Purchased report access",
      "Food library & plate tools",
      "Referral programme",
    ],
  },
  {
    key: "grow",
    label: "Grow",
    price: "€9.99/mo",
    tagline: "Daily habits, meal tracking, and 30-day score history.",
    color: "var(--icon-green)",
    gradient: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))",
    badge: null,
    features: [
      "2 meal analyses per day",
      "Full biotic breakdowns",
      "30-day score history",
      "My Plate builder",
      "Saved meals library",
    ],
  },
  {
    key: "restore",
    label: "Restore",
    price: "€49/mo",
    tagline: "Deep insight, condition calibration, and a monthly gut plan.",
    color: "var(--icon-teal)",
    gradient: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))",
    badge: "Popular",
    features: [
      "5 meal analyses per day",
      "Monthly AI gut plan",
      "90-day trend analysis",
      "Intelligence deep-dive",
      "Your food system Story",
    ],
  },
  {
    key: "transform",
    label: "Transform",
    price: "€99/mo",
    tagline: "Unlimited AI consultations, weekly check-ins, full personalisation.",
    color: "var(--icon-orange)",
    gradient: "linear-gradient(135deg, var(--icon-teal), var(--icon-yellow), var(--icon-orange))",
    badge: "Full experience",
    features: [
      "10 meal analyses per day",
      "Unlimited AI consultations",
      "Weekly AI check-in report",
      "Monthly review & coaching",
      "Founding member pricing",
    ],
  },
]

export default function AccountYouPage() {
  return (
    <div className="min-h-screen bg-background">

      {/* ── Hero ── */}
      <div className="pt-28 pb-16 px-6 text-center">
        <div className="mx-auto max-w-2xl">
          <p className="mb-3 text-xs font-bold uppercase tracking-widest" style={{ color: "var(--icon-green)" }}>
            Your EatoBiotics Account
          </p>
          <h1 className="font-serif text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            See everything inside, before you sign up
          </h1>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
            Explore the full dashboard with real sample data — your gut score, meal analyses, monthly gut plan, AI consultations, and more. No account needed.
          </p>
        </div>
      </div>

      {/* ── Tier cards ── */}
      <div className="px-6 pb-20">
        <div className="mx-auto max-w-4xl">
          <div className="grid gap-5 sm:grid-cols-2">
            {TIERS.map((t) => (
              <Link
                key={t.key}
                href={`/account-you/${t.key}`}
                className="group relative flex flex-col rounded-3xl border bg-card p-7 transition-all hover:shadow-xl hover:-translate-y-0.5"
                style={{ borderTop: `3px solid ${t.color}` }}
              >
                {/* Badge */}
                {"badge" in t && t.badge && (
                  <span
                    className="absolute right-5 top-5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white"
                    style={{ background: t.color }}
                  >
                    {t.badge}
                  </span>
                )}

                {/* Header */}
                <div className="mb-5 flex items-start justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest" style={{ color: t.color }}>
                      {t.label}
                    </p>
                    <p className="mt-1 font-serif text-2xl font-bold text-foreground">{t.price}</p>
                  </div>
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-full transition-transform group-hover:translate-x-0.5"
                    style={{ background: `color-mix(in srgb, ${t.color} 15%, transparent)` }}
                  >
                    <ArrowRight size={14} style={{ color: t.color }} />
                  </div>
                </div>

                <p className="mb-5 text-sm leading-relaxed text-muted-foreground">{t.tagline}</p>

                {/* Features */}
                <ul className="mt-auto space-y-2">
                  {t.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-foreground/80">
                      <CheckCircle2 size={14} className="shrink-0" style={{ color: t.color }} />
                      {f}
                    </li>
                  ))}
                </ul>

                <div
                  className="mt-6 w-full rounded-full py-2.5 text-center text-sm font-semibold text-white transition-opacity group-hover:opacity-90"
                  style={{ background: t.gradient }}
                >
                  Preview {t.label} Dashboard →
                </div>
              </Link>
            ))}
          </div>

          {/* Footer note */}
          <p className="mt-10 text-center text-sm text-muted-foreground">
            All previews use sample data for Sarah M. —{" "}
            <Link href="/assessment" className="font-semibold underline underline-offset-2 hover:text-foreground transition-colors" style={{ color: "var(--icon-green)" }}>
              take the free assessment to get your real score →
            </Link>
          </p>
        </div>
      </div>

    </div>
  )
}
