import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Check, ShieldCheck } from "lucide-react"
import { ScrollReveal } from "@/components/scroll-reveal"
import { display, text } from "./tokens"
import { foundationSystems } from "@/lib/systems"
import { PrimaryCtaOnDark } from "./cta"

/**
 * Section 7 — Begin. Four compact blocks in one section: You/Family, pricing,
 * trust, and the dark close. The brief is explicit that these must not become
 * four more full sections.
 *
 * ── 7a replaces the pathway grid ────────────────────────────────────────────
 * Production's Ecosystem section renders eleven tiles: You + Family, six health
 * systems (Stability, Glucose, Mind, Performance, Recovery, Longevity) and
 * three life systems (Pregnancy, Birth, Baby) — a product menu shown before the
 * visitor understands the core product. Reduced here to the two foundation
 * cards plus one line. components/home/ecosystem.tsx is NOT copied and NOT
 * deleted: it stays in production and may be reused elsewhere. The two cards
 * read from lib/systems.ts (read-only) so the taxonomy can't drift.
 *
 * Both foundations are status: "live", so neither is labelled "coming soon".
 *
 * The catalog gives each foundation an `image` (/images/hero-gut.png,
 * /images/family-hero.png) — both glowing figures. Those are deliberately NOT
 * used: the figure is capped at three appearances (hero, Digital Twin, 7d), so
 * these cards use the catalog's own icon + gradient idiom instead. That was the
 * treatment proposed and approved before building.
 */
const FUTURE_LINE =
  "Over time, the same foundation can support glucose, mind, performance, recovery, longevity and different stages of life."

/* 7c. Only claims the repository supports. No testimonials, no user counts, no
   partner logos — for a pre-launch health product, methodological transparency
   is the credibility asset and fabricated proof is worse than none. */
const COMMITMENTS: { text: string; href?: string }[] = [
  { text: "Evidence-informed, not diagnostic" },
  { text: "Educational guidance, not medical treatment" },
  { text: "Privacy by default", href: "/privacy" },
  { text: "Anonymised contribution only with explicit consent" },
  { text: "How your Biotics Score is calculated", href: "/method" },
  { text: "When to speak to a healthcare professional" },
]

export function Begin() {
  const foundations = foundationSystems()

  return (
    // One <section> for the whole chapter: 7a–7d are blocks within section 7,
    // not four more top-level sections. Keeps the page at exactly seven.
    <section className="px-6 pb-16 pt-20 md:pb-20 md:pt-28">
      <>
        <div className="mx-auto max-w-[1100px]">
          {/* ── 7a. You / Family ── */}
          <ScrollReveal>
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: text.green }}>
                Where To Begin
              </p>
              <h2 className="mt-4 font-serif text-4xl font-bold text-foreground sm:text-5xl text-balance">
                Start with <span className="brand-gradient-text">you, or your household.</span>
              </h2>
            </div>
          </ScrollReveal>

          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            {foundations.map((s, i) => {
              const Icon = s.icon
              return (
                <ScrollReveal key={s.key} delay={i * 120}>
                  <Link
                    href={s.href}
                    className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card p-7 transition-all hover:-translate-y-1 hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-icon-green"
                  >
                    <div
                      aria-hidden
                      className="absolute inset-x-0 top-0 h-1.5"
                      style={{ background: s.gradient }}
                    />
                    <span
                      aria-hidden
                      className="flex h-14 w-14 items-center justify-center rounded-2xl shadow-sm"
                      style={{ background: s.gradient }}
                    >
                      <Icon size={26} className="text-white" />
                    </span>
                    <h3
                      className="mt-5 font-serif text-2xl font-bold"
                      style={{ color: `color-mix(in srgb, ${s.accent} 64%, var(--foreground))` }}
                    >
                      {s.label}
                    </h3>
                    <p className="mt-2 flex-1 text-base leading-relaxed text-muted-foreground">
                      {s.key === "you" ? s.focus : s.tagline}
                    </p>
                    {/* Not "Start here": the brief bans "Start" as a CTA
                        variant, and this navigates to a system page rather than
                        the free assessment. */}
                    <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold" style={{ color: text.green }}>
                      Explore {s.label} <ArrowRight size={15} aria-hidden />
                    </span>
                  </Link>
                </ScrollReveal>
              )
            })}
          </div>

          <ScrollReveal delay={240}>
            <p className="mx-auto mt-8 max-w-2xl text-center text-base leading-relaxed text-muted-foreground">
              {FUTURE_LINE}{" "}
              <Link
                href="/food-systems"
                className="font-semibold underline underline-offset-4 hover:opacity-80" style={{ color: text.green }}
              >
                Explore all systems
              </Link>
            </p>
          </ScrollReveal>

          {/* ── 7b. Ways to begin — pricing, ported verbatim ──
              Copy, structure, prices, feature lists, badge, guarantee line and
              both button labels are exactly as production ships them. Whether
              the one-time report survives as a distinct product is an open
              business decision, not something to settle through layout.

              Known tension, flagged in the PR: "Get my Gut Report" points at
              /assessment, the same destination as the page's primary CTA under
              a different label. Reconciling that would mean restructuring the
              pricing block, which the brief forbids. */}
          <div className="mt-24">
            <ScrollReveal>
              <div className="mb-12 text-center">
                <h2 className="font-serif text-4xl font-semibold tracking-tight text-foreground sm:text-5xl text-balance">
                  Two ways to start
                </h2>
                <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-muted-foreground">
                  Start with clarity. Continue with a system.
                </p>
              </div>
            </ScrollReveal>

            <div className="grid items-stretch gap-6 sm:grid-cols-2 lg:gap-7">
              <ScrollReveal delay={60}>
                <div
                  className="relative flex h-full flex-col rounded-3xl border-2 bg-card p-8 shadow-lg"
                  style={{ borderColor: "color-mix(in srgb, var(--icon-teal) 50%, transparent)" }}
                >
                  <div
                    aria-hidden
                    className="mb-5 h-1 w-full rounded-full"
                    style={{ background: "linear-gradient(90deg, var(--icon-lime), var(--icon-teal))" }}
                  />
                  <p className="mb-1 text-xs font-bold uppercase tracking-widest" style={{ color: text.teal }}>
                    Step 1 · Gut Report
                  </p>
                  <p className="mb-1 font-serif text-3xl font-bold text-foreground">
                    €49 <span className="text-base font-normal text-muted-foreground">one-time</span>
                  </p>
                  <p className="mb-5 text-base text-muted-foreground">
                    Understand what is driving your gut score and get your personalised 30-day action plan.
                  </p>
                  <ul className="mb-6 flex-1 space-y-2.5">
                    {[
                      "See what is driving your gut score",
                      "Get a personalised 30-day action plan",
                      "Know your next best food changes",
                      "Understand your stability, diversity, and recovery scores",
                    ].map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-base text-muted-foreground">
                        <Check size={14} className="mt-1 shrink-0" style={{ color: "var(--icon-teal)" }} aria-hidden />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/assessment"
                    className="flex min-h-[48px] items-center justify-center gap-2 rounded-full py-4 text-base font-semibold text-white transition-all hover:opacity-90 hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-icon-teal"
                    style={{ background: "linear-gradient(135deg, var(--icon-lime), var(--icon-teal))" }}
                  >
                    Get my Gut Report <ArrowRight size={16} aria-hidden />
                  </Link>
                </div>
              </ScrollReveal>

              <ScrollReveal delay={120}>
                <div
                  className="relative flex h-full flex-col rounded-3xl border-2 p-8 pt-9 shadow-2xl"
                  style={{
                    borderColor: "color-mix(in srgb, var(--icon-green) 60%, transparent)",
                    background:
                      "linear-gradient(170deg, color-mix(in srgb, var(--icon-green) 7%, var(--card)) 0%, var(--card) 55%)",
                  }}
                >
                  <span
                    className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-white shadow-md"
                    style={{ background: "linear-gradient(135deg, var(--icon-teal), var(--icon-green))" }}
                  >
                    Best for ongoing improvement
                  </span>
                  <div
                    aria-hidden
                    className="mb-5 h-1 w-full rounded-full"
                    style={{ background: "linear-gradient(90deg, var(--icon-teal), var(--icon-green))" }}
                  />
                  <p className="mb-1 text-xs font-bold uppercase tracking-widest" style={{ color: text.green }}>
                    Step 2 · EatoBiotics Membership
                  </p>
                  <p className="mb-1 font-serif text-3xl font-bold text-foreground">
                    €24.99<span className="text-base font-normal text-muted-foreground">/month</span>
                  </p>
                  <p className="mb-5 text-base text-muted-foreground">
                    Keep improving your score, meals, habits, and food confidence week by week.
                  </p>
                  <ul className="mb-6 flex-1 space-y-2.5">
                    {[
                      "Track your score week by week",
                      "Build better meals with ongoing guidance",
                      "Stay accountable with a simple daily system",
                      "Keep improving after your 30-day plan",
                    ].map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-base text-muted-foreground">
                        <Check size={14} className="mt-1 shrink-0" style={{ color: "var(--icon-green)" }} aria-hidden />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/pricing"
                    className="flex min-h-[48px] items-center justify-center gap-2 rounded-full py-4 text-base font-semibold text-white transition-all hover:opacity-90 hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-icon-green"
                    style={{ background: "linear-gradient(135deg, var(--icon-teal), var(--icon-green))" }}
                  >
                    Join EatoBiotics <ArrowRight size={16} aria-hidden />
                  </Link>
                  <p className="mt-2.5 text-center text-sm text-muted-foreground">Cancel anytime.</p>
                </div>
              </ScrollReveal>
            </div>

            <ScrollReveal delay={220}>
              <p className="mt-6 flex items-center justify-center gap-2 text-center text-sm font-medium text-muted-foreground">
                <ShieldCheck size={15} style={{ color: "var(--icon-green)" }} aria-hidden />
                30-day money-back guarantee on the Gut Report.
              </p>
            </ScrollReveal>
          </div>

          {/* ── 7c. Built with care ── */}
          <ScrollReveal delay={100}>
            <div className="mt-20 rounded-2xl border border-border bg-muted/30 p-8 md:p-10">
              <h2 className="font-serif text-3xl font-bold text-foreground sm:text-4xl">
                Built with care.
              </h2>
              <ul className="mt-7 grid gap-x-10 gap-y-3.5 sm:grid-cols-2">
                {COMMITMENTS.map((c) => (
                  <li
                    key={c.text}
                    className="flex items-start gap-3 text-base leading-relaxed text-foreground"
                  >
                    <span
                      aria-hidden
                      className="mt-2 h-2 w-2 flex-none rounded-full"
                      style={{ background: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))" }}
                    />
                    {c.href ? (
                      <Link
                        href={c.href}
                        className="font-semibold underline underline-offset-4 hover:opacity-80" style={{ color: text.green }}
                      >
                        {c.text}
                      </Link>
                    ) : (
                      c.text
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </ScrollReveal>
        </div>

        {/* ── 7d. The close — dark band #2, kept dark by design ── */}
        <div className="mt-20">
          <div
            className="relative mx-auto max-w-[1200px] overflow-hidden rounded-[2.5rem] px-6 py-20 text-center md:py-24"
          style={{ background: "linear-gradient(135deg, #14250F 0%, #1A2E12 45%, #2C3A12 100%)" }}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full opacity-40 blur-3xl"
            style={{ background: "radial-gradient(circle, var(--icon-green), transparent 70%)" }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-24 -right-16 h-80 w-80 rounded-full opacity-30 blur-3xl"
            style={{ background: "radial-gradient(circle, var(--icon-yellow), transparent 70%)" }}
          />
          <div
            aria-hidden
            className="absolute inset-x-0 top-0 h-1"
            style={{
              background:
                "linear-gradient(90deg, var(--icon-lime), var(--icon-green), var(--icon-teal), var(--icon-yellow), var(--icon-orange))",
            }}
          />

          <div className="relative z-10">
            <ScrollReveal>
              {/* Figure, appearance 3 of 3. Production's closing panel carries no
                  figure; the brief asks for it here. */}
              <div className="mx-auto mb-8 w-full max-w-[220px]">
                <Image
                  src="/images/hero-gut.png"
                  alt=""
                  width={1536}
                  height={1024}
                  sizes="220px"
                  className="h-auto w-full object-contain"
                />
              </div>
              <h2 className="mx-auto max-w-2xl font-serif text-4xl font-bold leading-tight text-white sm:text-5xl text-balance">
                Meet the{" "}
                <span
                  style={{
                    background: "linear-gradient(90deg, var(--icon-lime), var(--icon-yellow))",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  Food System Inside You
                </span>
              </h2>
              <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-white/80">
                Take the free assessment, get your first Biotics Score, and start building your
                personal Food System.
              </p>
            </ScrollReveal>

            <ScrollReveal delay={120}>
              <div className="mt-9 flex justify-center">
                <PrimaryCtaOnDark />
              </div>
              <p className="mx-auto mt-12 max-w-xl border-t border-white/15 pt-8 text-base text-white/70">
                Build the food system inside you — and help build the food system around you.
              </p>
            </ScrollReveal>
            </div>
          </div>
        </div>
      </>
    </section>
  )
}
