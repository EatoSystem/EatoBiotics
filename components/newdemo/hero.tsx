import { ScrollReveal } from "@/components/scroll-reveal"
import { display, text } from "./tokens"
import { HeroVideo } from "@/components/hero-video"
import { PrimaryCta } from "./cta"

/**
 * Section 1 — hero. Copied from components/home/hero.tsx (shared with no other
 * route, but copied anyway so production is untouchable) with the layout and
 * the glowing figure kept exactly as-is. Only the copy is reduced.
 *
 * Removed from the production version, per the brief:
 *   - the bolded second paragraph
 *   - the "Built on the 3 Biotics · Prebiotics · Probiotics · Postbiotics" row
 *   - the second button (production ships two: /analyse and /assessment)
 *   - <WaitlistSocialProof />, a live "N already joined" count. That number is
 *     real rather than invented, but the brief's hero spec does not include it
 *     and the page carries no user counts.
 *
 * The figure is a <HeroVideo>, not a next/image, so "priority on the hero
 * image" has no direct target — HeroVideo's poster is what loads first.
 */
export function Hero() {
  return (
    <section
      id="newdemo-hero"
      className="relative overflow-hidden px-6 pt-24 pb-20 md:pt-28 md:pb-28"
    >
      <div className="relative z-10 mx-auto flex max-w-[1280px] flex-col items-center justify-center gap-12 md:flex-row md:gap-16 lg:gap-24">
        {/* ── Left: the figure (appearance 1 of 3) ── */}
        <ScrollReveal delay={60} className="flex w-full max-w-[660px] flex-1 items-center justify-center">
          <div className="relative w-full">
            <div
              aria-hidden
              className="absolute inset-0 -z-10 blur-3xl"
              style={{
                background:
                  "radial-gradient(60% 60% at 50% 48%, rgba(76,182,72,0.20), rgba(45,170,110,0.12) 55%, transparent 78%)",
              }}
            />
            <HeroVideo
              posterSrc="/videos/food-system-hero-poster.jpg"
              webmSrc="/videos/food-system-hero.webm"
              mp4Src="/videos/food-system-hero.mp4"
              alt="The food system inside you — animated gut microbiome figure"
              className="h-auto max-h-[70vw] w-full object-contain md:max-h-none"
            />
          </div>
        </ScrollReveal>

        {/* ── Right: text ── */}
        <div className="max-w-[600px] flex-1 text-left">
          <ScrollReveal>
            <h1 className="font-serif text-5xl font-bold leading-[1.05] sm:text-6xl lg:text-7xl text-balance">
              <span style={{ color: display.green }}>The Food System</span>{" "}
              <span
                style={{
                  background:
                    "linear-gradient(90deg, var(--icon-lime), var(--icon-green), var(--icon-teal), var(--icon-yellow), var(--icon-orange))",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Inside You
              </span>
            </h1>
          </ScrollReveal>

          <ScrollReveal delay={100}>
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-muted-foreground">
              EatoBiotics measures how well your food is supporting the living system inside
              you — and shows you what to change.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={200}>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4">
              <PrimaryCta />
              <a
                href="#sample-score"
                className="inline-flex min-h-[44px] items-center text-base font-semibold underline decoration-icon-green/40 underline-offset-4 transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-icon-green" style={{ color: text.green }}
              >
                See a sample result
              </a>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Takes about 3 minutes. No account required.
            </p>
          </ScrollReveal>
        </div>
      </div>
    </section>
  )
}
