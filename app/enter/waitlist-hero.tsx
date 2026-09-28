"use client"

import { useEffect, useState } from "react"
import { ScrollReveal } from "@/components/scroll-reveal"
import { earlyAccessState, EARLY_ACCESS_PLACES } from "@/lib/waitlist/early-access"
import { DiscoverFlow } from "@/components/waitlist/discover-flow"
import { WaitlistSocialProof } from "@/components/waitlist/social-proof"
import { HeroVideo } from "@/components/hero-video"

const GRADIENT_BAR =
  "linear-gradient(90deg, var(--icon-lime), var(--icon-green), var(--icon-teal), var(--icon-yellow), var(--icon-orange))"

/**
 * Waitlist hero for the gated landing page. The right-hand column hosts the
 * "Discover Your Food System Type" flow (a short quiz → profile reveal →
 * waitlist signup), which posts to /api/waitlist. Everything below it on /enter
 * reuses the real homepage showcase sections.
 */
export function WaitlistHero() {
  return (
    <section className="relative px-6 pt-24 pb-16 md:pb-20">
      <div className="relative z-10 mx-auto flex max-w-[1200px] flex-col items-center gap-12 md:flex-row md:gap-16 lg:gap-20">

        {/* Left: gut hero illustration with brand glow */}
        <ScrollReveal delay={60} className="flex-1 flex items-center justify-center w-full max-w-[520px]">
          <div className="relative w-full">
            <div
              aria-hidden
              className="absolute inset-0 -z-10 blur-3xl"
              style={{ background: "radial-gradient(60% 60% at 50% 48%, rgba(76,182,72,0.22), rgba(245,166,35,0.12) 55%, transparent 78%)" }}
            />
            <HeroVideo
              posterSrc="/videos/food-system-hero-poster.jpg"
              webmSrc="/videos/food-system-hero.webm"
              mp4Src="/videos/food-system-hero.mp4"
              alt="The food system inside you — animated gut microbiome figure"
              className="w-full h-auto max-h-[70vw] object-contain md:max-h-none"
            />
          </div>
        </ScrollReveal>

        {/* Right: waitlist content */}
        <div className="flex-1 text-left max-w-[560px] w-full">
          <ScrollReveal>
            <EarlyAccessBadge />
            <WaitlistSocialProof />
          </ScrollReveal>

          <ScrollReveal delay={80}>
            <h1 className="mt-5 font-serif text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl text-balance">
              <span style={{ color: "var(--icon-green)" }}>The Food System</span>{" "}
              <span
                style={{
                  background: GRADIENT_BAR,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Inside You
              </span>
            </h1>
          </ScrollReveal>

          <ScrollReveal delay={140}>
            <p className="mt-5 max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg">
              Take the 60-second discovery to meet the living food system inside you — then
              join the waitlist for early access when EatoBiotics launches.
            </p>
          </ScrollReveal>

          {/* Discover Your Food System Type flow */}
          <ScrollReveal delay={200}>
            <div className="mt-8 w-full">
              <DiscoverFlow />
            </div>
          </ScrollReveal>

          {/* Stat row — matches homepage */}
          <ScrollReveal delay={300}>
            <div className="mt-8 flex items-center gap-6">
              {[
                { num: "Free", label: "To join" },
                { num: "Early", label: "Access" },
                { num: "2026", label: "Launching" },
              ].map((s, i) => (
                <div key={s.label} className="flex items-center gap-5">
                  {i > 0 && <div className="h-5 w-px bg-border" />}
                  <div>
                    <p className="font-serif text-lg font-bold text-foreground">{s.num}</p>
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{s.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollReveal>

          <ScrollReveal delay={340}>
            <EarlyAccessNote />
          </ScrollReveal>
        </div>
      </div>
    </section>
  )
}

/**
 * What joining early actually gets you — and nothing more than that.
 *
 * This replaced a link to `/waitlist` reading "See what's coming — Book, App &
 * Course". EatoBiotics does not sell a book, an app or a course: V1 sells the
 * free Food System Assessment, the €49 Personal Food System Consultation, and
 * EatoBiotics Member. `/waitlist` made the same promise at greater length and
 * is now refused; this is the one holding page, so it carries one promise.
 *
 * ══ WHY A DATE AND NOT "THE FIRST 100" ══════════════════════════════════════
 *
 * There is no counter anywhere in this system, and a genuine rank-based cap
 * needs durable, race-safe state — a migration, which an agent session may
 * draft but never apply. A cap that miscounts under concurrency is a public
 * promise broken in public. A date does the same scarcity work with no state
 * to get wrong, and `FOUNDING_MEMBER_CUTOFF_DATE` already decides founding
 * status in the Stripe webhook and on the pricing page.
 *
 * ══ IT SAYS NOTHING WHEN IT KNOWS NOTHING ═══════════════════════════════════
 *
 * With no cutoff configured this renders nothing at all, rather than naming a
 * deadline nobody set or implying a discount that does not exist. Early access
 * here means exactly one thing: being in before the doors open.
 */
export function foundingAccessDeadline(
  value: string | undefined = process.env.NEXT_PUBLIC_FOUNDING_MEMBER_CUTOFF_DATE,
  now: number = Date.now(),
): string | null {
  if (!value) return null
  const closes = new Date(value)
  if (Number.isNaN(closes.getTime())) return null
  // A deadline that has already passed is not scarcity, it is a stale promise.
  if (closes.getTime() <= now) return null
  return closes.toLocaleDateString("en-IE", { day: "numeric", month: "long", year: "numeric" })
}

/**
 * The count, shared by the badge and the note so they cannot disagree.
 *
 * Both need the same number and neither owns it, so the fetch lives here. It
 * is the endpoint the social-proof line already calls; nothing new is counted.
 */
function useEarlyAccess() {
  const [total, setTotal] = useState<number | null>(null)

  useEffect(() => {
    let active = true
    fetch("/api/waitlist/count")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (active && data?.ok && typeof data.total === "number") setTotal(data.total)
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [])

  return earlyAccessState(total)
}

/**
 * The scarcity, where a visitor actually meets it.
 *
 * ══ WHY IT MOVED HERE ═══════════════════════════════════════════════════════
 *
 * It used to live only in the paragraph below the stat row — which measured
 * 1372px down the page, beneath the whole discovery card, in small grey body
 * text, inside a ScrollReveal that holds its children at `opacity: 0` until
 * they are scrolled to. It was, in every sense that matters, not on the
 * holding page.
 *
 * Every test I had written asserted `toContainText`, which passes for an
 * element at zero opacity a thousand pixels below the fold. The text was in
 * the DOM and invisible to a human, and nothing in the suite could tell the
 * difference. Screenshots could, immediately.
 *
 * So the campaign now replaces the pill that is the FIRST thing read on the
 * page, above the fold, and the note below keeps the plain-English promise
 * without repeating the number.
 *
 * With no count it reads exactly as it did before — this must never
 * manufacture urgency it has not counted.
 */
function EarlyAccessBadge() {
  const places = useEarlyAccess()

  const label = !places
    ? "Coming soon · Join the waitlist"
    : places.isOpen
      ? `${places.remaining} of ${EARLY_ACCESS_PLACES} early-access places left`
      : `The first ${EARLY_ACCESS_PLACES} places are taken`

  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: GRADIENT_BAR }} />
      {label}
    </span>
  )
}

function EarlyAccessNote() {
  const deadline = foundingAccessDeadline()
  const places = useEarlyAccess()

  return (
    <p className="mt-6 max-w-md text-sm leading-relaxed text-muted-foreground">
      {places && !places.isOpen
        ? `Join the waitlist and you'll still hear first.`
        : `Joining puts you in before the doors open — you'll be the first to take the Food System Assessment and get your Biotics Score™.`}
      {deadline ? (
        <>
          {" "}Founding access closes{" "}
          <span className="font-medium text-foreground">{deadline}</span>.
        </>
      ) : null}
    </p>
  )
}
