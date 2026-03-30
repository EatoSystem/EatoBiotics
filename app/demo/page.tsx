import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import {
  ClipboardList,
  Camera,
  Utensils,
  User,
  ArrowRight,
  MessageSquare,
  Lock,
} from "lucide-react"

export const metadata: Metadata = {
  title: "Try EatoBiotics — Beta Testing",
  description: "Explore the EatoBiotics food system health platform — assessment, meal analysis, plate builder, and account.",
  robots: "noindex",
}

const FEATURES = [
  {
    icon: ClipboardList,
    color: "var(--icon-green)",
    label: "Gut Assessment",
    description:
      "Answer 15 questions about what you eat and how you feel. Get a personalised food system score across 5 pillars, a profile type, and a 7-day action plan.",
    primaryHref: "/assessment",
    primaryLabel: "Take the real assessment →",
    secondaryHref: "/demo/assessment",
    secondaryLabel: "See instant demo results",
  },
  {
    icon: Camera,
    color: "var(--icon-teal)",
    label: "Meal Analysis",
    description:
      "Upload a photo of any meal. The analyser identifies every food, scores it against the 3 biotics framework, and suggests how to improve your gut score.",
    primaryHref: "/analyse",
    primaryLabel: "Try meal analysis →",
    secondaryHref: "/demo/analyse",
    secondaryLabel: "Try demo (no login needed)",
  },
  {
    icon: Utensils,
    color: "var(--icon-lime)",
    label: "My Plate",
    description:
      "Build your daily gut plate by adding foods to 4 biotic categories. Track your 30-plant weekly challenge, log your wellbeing in the journal, and watch your score update live.",
    primaryHref: "/myplate",
    primaryLabel: "Build your plate →",
    secondaryHref: null,
    secondaryLabel: null,
  },
  {
    icon: User,
    color: "var(--icon-orange)",
    label: "Account Dashboard",
    description:
      "After completing the assessment, you get a personal account showing your scores over time, paid reports, referrals, and your saved plate data.",
    primaryHref: "/demo/account",
    primaryLabel: "Preview the account →",
    secondaryHref: null,
    secondaryLabel: null,
  },
]

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden px-6 pb-12 pt-28 sm:pt-36">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 70% 50% at 50% 0%, color-mix(in srgb, var(--icon-green) 10%, transparent), transparent 70%)",
          }}
        />
        <div className="relative mx-auto max-w-2xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--icon-yellow)]/40 bg-[var(--icon-yellow)]/8 px-3 py-1.5 text-xs font-semibold text-[var(--icon-yellow)]">
            <Lock size={10} />
            Private Beta
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
            You&rsquo;re invited to test EatoBiotics
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-muted-foreground">
            Explore every part of the platform below. We&apos;d love your honest feedback — what
            works, what doesn&apos;t, and what you wish was there.
          </p>
          <p className="mt-3 text-xs text-muted-foreground/50">
            🔒 Private link — please don&apos;t share publicly
          </p>
        </div>
      </section>

      {/* ── Feature cards ─────────────────────────────────────────────── */}
      <section className="px-6 pb-16">
        <div className="mx-auto max-w-3xl">
          <div className="grid gap-4 sm:grid-cols-2">
            {FEATURES.map((f) => {
              const Icon = f.icon
              return (
                <div
                  key={f.label}
                  className="flex flex-col rounded-2xl border border-border bg-background p-6 transition-shadow hover:shadow-md"
                  style={{ borderTopWidth: "3px", borderTopColor: f.color }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="flex h-9 w-9 items-center justify-center rounded-xl"
                      style={{ background: `color-mix(in srgb, ${f.color} 15%, transparent)` }}
                    >
                      <Icon size={16} style={{ color: f.color }} />
                    </div>
                    <h2 className="font-semibold text-base text-foreground">{f.label}</h2>
                  </div>

                  <p className="text-sm leading-relaxed text-muted-foreground flex-1 mb-5">
                    {f.description}
                  </p>

                  <div className="space-y-2">
                    <Link
                      href={f.primaryHref}
                      className="flex items-center justify-between rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                      style={{ background: `color-mix(in srgb, ${f.color} 90%, #000 10%)` }}
                    >
                      {f.primaryLabel}
                      <ArrowRight size={14} />
                    </Link>
                    {f.secondaryHref && (
                      <Link
                        href={f.secondaryHref}
                        className="flex items-center justify-center gap-1.5 rounded-xl border border-border px-4 py-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground hover:border-foreground/30"
                      >
                        {f.secondaryLabel}
                      </Link>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── More to explore ───────────────────────────────────────────── */}
      <section className="border-t border-border bg-secondary/10 px-6 py-12">
        <div className="mx-auto max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-5">
            Also worth exploring
          </p>
          <div className="flex flex-wrap gap-3">
            {[
              { href: "/food", label: "Food Library" },
              { href: "/food/garlic", label: "Food Detail Page (Garlic)" },
              { href: "/assessment/demo?tier=full", label: "Paid Report Demo" },
              { href: "/book", label: "Book Chapters" },
              { href: "/assessment", label: "Full Assessment Flow" },
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

      {/* ── Feedback ──────────────────────────────────────────────────── */}
      <section className="border-t border-border px-6 py-16">
        <div className="mx-auto max-w-xl text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--icon-green)]/10">
            <MessageSquare size={20} className="text-[var(--icon-green)]" />
          </div>
          <h2 className="font-serif text-2xl font-semibold text-foreground">
            Share your feedback
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            What felt good? What was confusing? What would make you use this every day? All
            feedback — big or small — directly shapes what we build next.
          </p>
          <a
            href="mailto:hello@eatobiotics.com?subject=EatoBiotics Beta Feedback"
            className="mt-6 inline-flex items-center gap-2 rounded-2xl brand-gradient px-8 py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            <MessageSquare size={15} />
            Send feedback →
          </a>
          <p className="mt-3 text-xs text-muted-foreground/50">
            Opens your email — or reply directly to any EatoBiotics email you&apos;ve received
          </p>
        </div>
      </section>
    </div>
  )
}
