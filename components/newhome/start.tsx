import Image from "next/image"
import Link from "next/link"
import { ScrollReveal } from "@/components/scroll-reveal"
import { Eyebrow, Section, SectionHeading } from "./shared"
import { PrimaryCta, TrackedLink } from "./cta"

/**
 * Chapter 7 — start, choose and trust, compressed into one closing chapter.
 *
 * Merges the previous concept's `pathways.tsx` and `trust-and-connection.tsx`.
 * The old pathways section ran a four-card grid of deeper pathways (Stability,
 * Glucose, Mind, Performance) plus two twin videos plus a full dark Family
 * band; the brief reduces that to two entry contexts and a single restrained
 * line about the wider vision.
 *
 * ── Two facts checked against the codebase, not assumed ─────────────────────
 * 1. Family is AVAILABLE. /assessment/family renders a working
 *    FamilyAssessmentClient, and /start-family links to it. The previous
 *    concept badged Family "In development" — that label was stale, so it is
 *    not carried over and Family is not marked "Coming soon".
 * 2. The commercial sequence mirrors app/pricing/pricing-client.tsx exactly:
 *    free Score → one-time €49 Personal Report (which includes a free 30-day
 *    account) → optional €24.99/month Member plan afterwards, never automatic.
 *
 * Prices are in EUR because that is what Stripe charges (app/api/checkout).
 * The brief asked for "£49"; the only £ in the repository is a GB currency
 * symbol in lib/market.ts, and showing £49 next to a €49 charge would misstate
 * the price at the point of payment.
 *
 * No invented social proof: no customer counts, testimonials, endorsements,
 * partners or outcome statistics appear anywhere on this page.
 */
const ENTRY_POINTS = [
  {
    name: "You",
    href: "/start",
    event: "newhome_entry_click",
    metadata: { entry: "you" },
    line: "Your personal Food System baseline — where your own patterns stand today.",
    color: "var(--icon-green)",
    gradient: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))",
    image: "/images/couple-hero.png",
  },
  {
    name: "Family",
    href: "/start-family",
    event: "newhome_entry_click",
    metadata: { entry: "family" },
    line: "The Food System Inside Your Family — shared meals, routines and priorities.",
    color: "var(--icon-teal)",
    gradient: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))",
    image: "/images/family-hero.png",
  },
]

/* Only routes that exist. There is no /methodology, /science or /safety page —
   /method is the real methodology route. Verified before linking. */
const TRUST_LINKS = [
  { label: "How the score works", href: "/method" },
  { label: "About EatoBiotics", href: "/about" },
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
]

const COMMITMENTS = [
  "Evidence-informed and educational — not a diagnosis.",
  "A transparent scoring approach you can read in full.",
  "Built to adapt to your culture, budget and household.",
  "Food-first: we do not sell supplements as the solution.",
]

export function Start() {
  return (
    <>
      <Section>
        {/* ── Where to begin ── */}
        <ScrollReveal>
          <div className="mx-auto max-w-2xl text-center">
            <Eyebrow>Where To Begin</Eyebrow>
            <SectionHeading>
              Start with <span className="brand-gradient-text">you, or your household.</span>
            </SectionHeading>
          </div>
        </ScrollReveal>

        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {ENTRY_POINTS.map((e, i) => (
            <ScrollReveal key={e.name} delay={i * 120}>
              <TrackedLink
                href={e.href}
                event={e.event}
                metadata={e.metadata}
                className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-background transition-all hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-icon-green"
              >
                <div
                  aria-hidden
                  className="absolute inset-x-0 top-0 z-10 h-1.5"
                  style={{ background: e.gradient }}
                />
                <div className="relative h-52 w-full overflow-hidden bg-white">
                  <Image
                    src={e.image}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 90vw, 560px"
                    className="object-contain p-4"
                  />
                </div>
                <div className="flex flex-1 flex-col p-7">
                  <h3
                    className="font-serif text-2xl font-semibold"
                    style={{ color: e.color }}
                  >
                    {e.name}
                  </h3>
                  <p className="mt-2 flex-1 text-base leading-relaxed text-muted-foreground">
                    {e.line}
                  </p>
                  <span className="mt-4 text-sm font-semibold text-icon-green underline underline-offset-4 group-hover:opacity-80">
                    Start here
                  </span>
                </div>
              </TrackedLink>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal delay={240}>
          <p className="mx-auto mt-8 max-w-2xl text-center text-sm leading-relaxed text-muted-foreground">
            The same foundation can later support glucose, mind, performance, recovery,
            longevity and different stages of life.
          </p>
        </ScrollReveal>

        {/* ── What it costs ── */}
        <ScrollReveal delay={100}>
          <div className="mt-20 overflow-hidden rounded-2xl border border-border bg-background">
            <div
              aria-hidden
              className="h-1.5 w-full"
              style={{
                background:
                  "linear-gradient(90deg, var(--icon-lime), var(--icon-green), var(--icon-teal), var(--icon-yellow), var(--icon-orange))",
              }}
            />
            <div className="p-8 md:p-10">
              <h3 className="font-serif text-2xl font-semibold text-foreground sm:text-3xl">
                What it costs
              </h3>
              <ol className="mt-7 grid gap-6 md:grid-cols-3">
                {[
                  {
                    step: "Free",
                    title: "Your Biotics Score",
                    line: "The assessment and your score cost nothing.",
                    color: "var(--icon-green)",
                  },
                  {
                    step: "€49",
                    title: "Personal Report",
                    line: "Optional one-time purchase. Adds your full breakdown, a 30-day plan and a free 30-day account.",
                    color: "var(--icon-teal)",
                  },
                  {
                    step: "€24.99/mo",
                    title: "Member plan",
                    line: "Entirely optional, only after your free 30-day account ends. Nothing is charged automatically.",
                    color: "var(--icon-orange)",
                  },
                ].map((tier) => (
                  <li key={tier.title}>
                    <p
                      className="font-serif text-3xl font-bold"
                      style={{ color: tier.color }}
                    >
                      {tier.step}
                    </p>
                    <p className="mt-1.5 font-semibold text-foreground">{tier.title}</p>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                      {tier.line}
                    </p>
                  </li>
                ))}
              </ol>
              <p className="mt-7 text-sm">
                <TrackedLink
                  href="/pricing"
                  event="newhome_pricing_click"
                  className="font-semibold text-icon-green underline underline-offset-4 hover:opacity-80"
                >
                  See full pricing
                </TrackedLink>
              </p>
            </div>
          </div>
        </ScrollReveal>

        {/* ── Built with care ── */}
        <ScrollReveal delay={100}>
          <div className="mt-8 rounded-2xl border border-border bg-muted/30 p-8 md:p-10">
            <h3 className="font-serif text-2xl font-semibold text-foreground sm:text-3xl">
              Built with care.
            </h3>
            <ul className="mt-6 grid gap-x-10 gap-y-3 sm:grid-cols-2">
              {COMMITMENTS.map((c) => (
                <li
                  key={c}
                  className="flex items-start gap-3 text-base leading-relaxed text-foreground"
                >
                  <span
                    aria-hidden
                    className="mt-2 h-2 w-2 flex-none rounded-full"
                    style={{ background: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))" }}
                  />
                  {c}
                </li>
              ))}
            </ul>
            <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
              EatoBiotics does not diagnose, treat or prevent illness, and does not replace
              professional healthcare. If you have a medical concern, please speak to a
              healthcare professional.
            </p>
            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2">
              {TRUST_LINKS.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="text-sm font-semibold text-icon-green underline underline-offset-4 hover:opacity-80"
                >
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
        </ScrollReveal>
      </Section>

      {/* ── The close — dark by design, kept from the production idiom ── */}
      <section className="px-6 pb-16 pt-4 md:pb-20">
        <div
          className="relative mx-auto max-w-[1200px] overflow-hidden rounded-[2.5rem] px-6 py-20 text-center md:py-28"
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
              <h2 className="mx-auto max-w-2xl font-serif text-4xl font-semibold leading-tight text-white sm:text-5xl text-balance">
                Meet the{" "}
                <span
                  style={{
                    background: "linear-gradient(90deg, var(--icon-lime), var(--icon-yellow))",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  Food System Inside You.
                </span>
              </h2>
              <p className="mx-auto mt-5 max-w-lg text-base leading-relaxed text-white/70 sm:text-lg">
                Five minutes to your first Biotics Score. Free, and yours to keep.
              </p>
              <div className="mt-8 flex justify-center">
                <PrimaryCta placement="closing" />
              </div>
            </ScrollReveal>

            {/* The wider mission sits after the personal benefit, not before it. */}
            <ScrollReveal delay={140}>
              <p className="mx-auto mt-14 max-w-xl border-t border-white/12 pt-8 font-serif text-xl font-medium text-white/80 sm:text-2xl text-balance">
                Build the food system inside you — and help build the food system around you.
              </p>
              <p className="mt-4 text-sm text-white/55">
                <Link
                  href="/eatosystem"
                  className="font-medium underline underline-offset-4 transition-opacity hover:opacity-80"
                >
                  Learn about EatoSystem
                </Link>
              </p>
            </ScrollReveal>
          </div>
        </div>
      </section>
    </>
  )
}
