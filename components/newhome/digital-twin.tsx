import { ScrollReveal } from "@/components/scroll-reveal"
import { HeroVideo } from "@/components/hero-video"
import { Eyebrow, Section, SectionHeading, StatusBadge } from "./shared"

/**
 * Chapter 6 — the Digital Twin as the ongoing experience after the first Score.
 *
 * This is the second of the flagship figure's two appearances (hero, here), per
 * the brief's rule that it should not be repeated across every card. The
 * previous concept used the twin videos as decoration inside `pathways.tsx`
 * ("Her food system" / "His food system"); here they carry the chapter that is
 * actually about the twin.
 *
 * ── Claims are scoped to what is built ──────────────────────────────────────
 * "Available now" items were verified against the shipped implementation:
 *   - the daily ritual's five checks are RitualDay in lib/account/ritual.ts
 *     (fermented, plants, moved, slept, feeling)
 *   - milestones and cross-device sync are twin_state + /api/twin-state
 *     (lib/account/twin-state-sync.ts)
 * Everything beyond that is labelled in development. Nothing here implies live
 * biological monitoring — the twin reflects what you record, not sensor data,
 * and the closing line says so plainly.
 */
const AVAILABLE_NOW = [
  "A daily ritual of five simple checks",
  "Milestones as your streak builds",
  "Your figure, personalised and synced across devices",
]

const IN_DEVELOPMENT = [
  "Score updates as your patterns change",
  "Meal history feeding back into your twin",
  "Personalised insights drawn from your own record",
]

export function DigitalTwin() {
  return (
    <Section>
      <div className="flex flex-col gap-12 lg:flex-row lg:items-center lg:gap-16">
        {/* ── The figure ── */}
        <ScrollReveal className="lg:w-[42%] lg:shrink-0">
          <div className="relative mx-auto max-w-[380px]">
            <div
              aria-hidden
              className="absolute inset-0 -z-10 blur-3xl"
              style={{
                background:
                  "radial-gradient(55% 55% at 50% 48%, rgba(76,182,72,0.22), rgba(245,197,24,0.12) 55%, transparent 78%)",
              }}
            />
            <HeroVideo
              posterSrc="/videos/dt-twin-female-poster.jpg"
              webmSrc="/videos/dt-twin-female.webm"
              mp4Src="/videos/dt-twin-female.mp4"
              alt="A Digital Twin figure with the food system glowing through it"
              className="h-auto w-full object-contain"
            />
          </div>
        </ScrollReveal>

        {/* ── The explanation ── */}
        <div className="flex-1">
          <ScrollReveal delay={100}>
            <Eyebrow>Your Evolving Digital Twin</Eyebrow>
            <SectionHeading>
              See the Food System Inside You{" "}
              <span className="brand-gradient-text">change.</span>
            </SectionHeading>
            <p className="mt-6 max-w-xl text-lg font-medium leading-relaxed text-foreground">
              Your Score shows where you are. Your Digital Twin helps you see what changes.
            </p>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
              Your first assessment begins it. From there it grows with what you record —
              the small daily actions that add up, and the patterns that emerge over months
              rather than days.
            </p>
          </ScrollReveal>

          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            <ScrollReveal delay={160}>
              <div className="relative h-full overflow-hidden rounded-2xl border border-border bg-background p-6">
                <div
                  aria-hidden
                  className="absolute inset-x-0 top-0 h-1"
                  style={{ background: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))" }}
                />
                <StatusBadge status="available" />
                <ul className="mt-4 flex flex-col gap-2.5">
                  {AVAILABLE_NOW.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2.5 text-sm leading-relaxed text-foreground"
                    >
                      <span
                        aria-hidden
                        className="mt-1.5 h-1.5 w-1.5 flex-none rounded-full"
                        style={{ background: "var(--icon-green)" }}
                      />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={240}>
              <div className="relative h-full overflow-hidden rounded-2xl border border-border bg-background p-6">
                <div
                  aria-hidden
                  className="absolute inset-x-0 top-0 h-1"
                  style={{ background: "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange))" }}
                />
                <StatusBadge status="in-development" />
                <ul className="mt-4 flex flex-col gap-2.5">
                  {IN_DEVELOPMENT.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2.5 text-sm leading-relaxed text-muted-foreground"
                    >
                      <span
                        aria-hidden
                        className="mt-1.5 h-1.5 w-1.5 flex-none rounded-full"
                        style={{ background: "var(--icon-orange)" }}
                      />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </ScrollReveal>
          </div>

          <ScrollReveal delay={320}>
            <p className="mt-6 max-w-xl text-sm leading-relaxed text-muted-foreground">
              Your Digital Twin reflects what you choose to record. It does not monitor your
              body, and it is not a medical device.
            </p>
          </ScrollReveal>
        </div>
      </div>
    </Section>
  )
}
