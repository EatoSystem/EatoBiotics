import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Assessment Preview — EatoBiotics",
  description: "Internal preview and test links for the EatoBiotics assessment system.",
}

const TIER_COLORS = {
  starter: { bg: "bg-[var(--icon-lime)]/10", border: "border-[var(--icon-lime)]/30", dot: "bg-[var(--icon-lime)]", label: "Starter · €20" },
  full: { bg: "bg-[var(--icon-green)]/10", border: "border-[var(--icon-green)]/30", dot: "bg-[var(--icon-green)]", label: "Full Report · €40" },
  premium: { bg: "bg-[var(--icon-teal)]/10", border: "border-[var(--icon-teal)]/30", dot: "bg-[var(--icon-teal)]", label: "Premium · €50" },
}

function PreviewCard({
  href,
  title,
  description,
  badge,
  badgeColor = "bg-secondary text-muted-foreground",
  note,
}: {
  href: string
  title: string
  description: string
  badge: string
  badgeColor?: string
  note?: string
}) {
  return (
    <Link
      href={href}
      className="group block rounded-2xl border bg-card p-5 hover:border-[var(--icon-green)]/40 hover:shadow-sm transition-all duration-200"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <span className={`text-[11px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full ${badgeColor}`}>
          {badge}
        </span>
        <span className="text-muted-foreground/40 group-hover:text-[var(--icon-green)] transition-colors text-lg leading-none">→</span>
      </div>
      <h3 className="font-semibold text-base mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
      {note && (
        <p className="text-xs text-muted-foreground/60 mt-3 italic">{note}</p>
      )}
    </Link>
  )
}

export default function PreviewPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-16 space-y-14">

        {/* Header */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
            EatoBiotics
          </p>
          <h1 className="text-3xl font-bold font-serif mb-3">Assessment Preview</h1>
          <p className="text-muted-foreground leading-relaxed max-w-xl">
            Internal test and demo links for the full assessment system. Not linked from the main navigation.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 text-xs bg-amber-50 border border-amber-200 text-amber-700 rounded-full px-3 py-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Deep assessment demos call Claude API for real — questions and analysis are live
          </div>
        </div>

        {/* Section 1 — Free Assessment */}
        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">
            Free Assessment
          </h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <PreviewCard
              href="/assessment"
              title="Free Assessment"
              description="Full 15-question flow with lead capture form, live scoring, pillar radar, and results email."
              badge="Live"
              badgeColor="bg-[var(--icon-green)]/10 text-[var(--icon-green)]"
              note="Uses real Resend + Supabase. Enter a real email to receive the results email."
            />
          </div>
        </section>

        {/* Section 2 — Static Report Previews */}
        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">
            Paid Report Previews — Static (no questions, instant)
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Shows the paid report UI using hardcoded demo data. No Claude call, no payment required.
          </p>
          <div className="grid sm:grid-cols-3 gap-3">
            {(["starter", "full", "premium"] as const).map((tier) => (
              <PreviewCard
                key={tier}
                href={`/assessment/demo?tier=${tier}`}
                title={`${tier.charAt(0).toUpperCase() + tier.slice(1)} Report`}
                description={
                  tier === "starter"
                    ? "7-day plan, top 5 foods, strengths & opportunities."
                    : tier === "full"
                    ? "30-day roadmap, deep dives, top 12 foods, lifestyle analysis."
                    : "90-day strategy, gut diagnostic, priority map, system story."
                }
                badge={TIER_COLORS[tier].label}
                badgeColor={`${TIER_COLORS[tier].bg} ${TIER_COLORS[tier].border} border`}
                note="Static demo — no Claude, no payment."
              />
            ))}
          </div>
        </section>

        {/* Section 3 — Live Deep Assessment */}
        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">
            Deep Assessment — Live Claude (no payment)
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Goes through the full paid flow — Claude generates questions based on mock scores, you answer
            them, Claude writes the full analysis. Skips Stripe, Resend, and PDF upload.
            Results shown at the end.
          </p>
          <div className="grid sm:grid-cols-3 gap-3">
            {(["starter", "full", "premium"] as const).map((tier) => (
              <PreviewCard
                key={tier}
                href={`/assessment/deep?demo=true&tier=${tier}`}
                title={`Deep — ${tier.charAt(0).toUpperCase() + tier.slice(1)}`}
                description={
                  tier === "starter"
                    ? "10 Claude-generated questions on your 2 weakest pillars."
                    : tier === "full"
                    ? "18 questions across all pillars + lifestyle factors."
                    : "25 questions including gut diagnostic + motivation mapping."
                }
                badge={`${TIER_COLORS[tier].label} · Live`}
                badgeColor={`${TIER_COLORS[tier].bg} ${TIER_COLORS[tier].border} border`}
                note="Calls Claude API. Takes ~15s to analyse after final question."
              />
            ))}
          </div>
        </section>

        {/* Footer note */}
        <div className="border-t pt-8 text-xs text-muted-foreground/60 space-y-1">
          <p>This page is not linked from the main navigation.</p>
          <p>Direct URL: <code className="font-mono">/assessment/preview</code></p>
        </div>

      </div>
    </div>
  )
}
