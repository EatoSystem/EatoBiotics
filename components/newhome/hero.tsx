import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { ScrollReveal } from "@/components/scroll-reveal"
import { HeroVideo } from "@/components/hero-video"

/**
 * /newhome concept hero — mirrors the production hero shell
 * (components/home/hero.tsx: media left, text right, split-colour H1,
 * identical primary CTA) with the concept's locked copy and a secondary
 * in-page anchor styled as the production secondary pill.
 */
export function ConceptHero() {
  return (
    <section className="relative overflow-hidden px-6 pt-10 pb-20 md:pt-12 md:pb-28">
      <div className="relative z-10 mx-auto max-w-[1280px]">
        {/* Internal review marker — not part of the public proposition */}
        <ScrollReveal>
          <p className="mb-10 inline-flex items-center gap-2 rounded-full border border-dashed border-border px-3 py-1 text-xs font-medium text-muted-foreground">
            New homepage concept
          </p>
        </ScrollReveal>

        <div className="flex flex-col items-center justify-center gap-12 md:flex-row md:gap-16 lg:gap-24">
          {/* ── Left: the production hero figure ── */}
          <ScrollReveal delay={60} className="flex w-full max-w-[660px] flex-1 items-center justify-center">
            <div className="relative w-full">
              <div
                aria-hidden
                className="absolute inset-0 -z-10 blur-3xl"
                style={{ background: "radial-gradient(60% 60% at 50% 48%, rgba(76,182,72,0.20), rgba(45,170,110,0.12) 55%, transparent 78%)" }}
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
              <h1 className="font-serif text-5xl font-bold leading-[1.05] text-balance sm:text-6xl lg:text-7xl">
                <span style={{ color: "var(--icon-green)" }}>The Food System</span>{" "}
                <span
                  style={{
                    background: "linear-gradient(90deg, var(--icon-lime), var(--icon-green), var(--icon-teal), var(--icon-yellow), var(--icon-orange))",
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
              <p className="mt-4 max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg">
                Your digestion, energy, cravings, gut comfort, mood, daily rhythm, and relationship
                with food are connected. EatoBiotics helps you understand your own food system, see
                how it is being fed, and take practical steps to improve it over time.
              </p>
              <p className="mt-4 max-w-md text-base font-medium leading-relaxed text-foreground">
                Understand the Food System Inside You. Learn how to feed it better. Watch it improve.
              </p>
            </ScrollReveal>

            <ScrollReveal delay={200}>
              <div className="mt-8">
                <div className="flex flex-wrap items-center gap-4">
                  <Link
                    href="/assessment"
                    className="brand-gradient inline-flex items-center gap-2.5 rounded-full px-10 py-5 text-lg font-semibold text-white shadow-xl shadow-icon-green/25 transition-all hover:shadow-2xl hover:shadow-icon-green/35 hover:opacity-90"
                  >
                    Get My Food System Score <ArrowRight size={18} />
                  </Link>
                  <a
                    href="#journey"
                    className="inline-flex w-fit items-center gap-1.5 rounded-full border border-icon-green/30 bg-icon-green/5 px-5 py-2.5 text-sm font-semibold text-icon-green transition-all hover:border-icon-green/50 hover:bg-icon-green/10"
                  >
                    See How It Works
                  </a>
                </div>
                <p className="mt-3.5 text-sm text-muted-foreground">
                  Takes about 5 minutes. Educational, food-first, and non-diagnostic.
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={320}>
              <div className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm font-medium text-muted-foreground">
                <span>Built on the 3 Biotics</span>
                <span className="h-1 w-1 rounded-full bg-border" />
                <span>Prebiotics</span>
                <span className="h-1 w-1 rounded-full bg-border" />
                <span>Probiotics</span>
                <span className="h-1 w-1 rounded-full bg-border" />
                <span>Postbiotics</span>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </div>
    </section>
  )
}
