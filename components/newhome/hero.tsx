import Image from "next/image"
import { ScrollReveal } from "@/components/scroll-reveal"
import { HeroVideo } from "@/components/hero-video"
import { PrimaryCta, SampleResultLink } from "./cta"

/* Real food photography strip under the hero — the "food-first" moment.
   Drifts slowly; static under prefers-reduced-motion. */
const STRIP_FOODS = [1, 3, 5, 7, 9, 11, 14, 17, 19, 21].map((n) => `/food-${n}.webp`)

function FoodStrip() {
  const row = (suffix: string) => (
    <div className="flex shrink-0 items-center gap-4 pr-4">
      {STRIP_FOODS.map((src) => (
        <div key={`${src}${suffix}`} className="relative h-28 w-44 shrink-0 overflow-hidden rounded-2xl border border-border">
          <Image src={src} alt="" fill sizes="176px" className="object-cover" />
        </div>
      ))}
    </div>
  )
  return (
    <div aria-hidden className="mt-16">
      <div
        className="mx-auto mb-8 h-1 max-w-[1280px] rounded-full"
        style={{ background: "linear-gradient(90deg, var(--icon-lime), var(--icon-green), var(--icon-teal), var(--icon-yellow), var(--icon-orange))" }}
      />
      <div className="relative overflow-hidden">
        <style>{`
          @keyframes newhome-food-drift { from { transform: translateX(0); } to { transform: translateX(-50%); } }
          .newhome-food-strip { animation: newhome-food-drift 70s linear infinite; }
          @media (prefers-reduced-motion: reduce) { .newhome-food-strip { animation: none; } }
        `}</style>
        <div className="newhome-food-strip flex w-max">
          {row("")}
          {row("-b")}
        </div>
      </div>
    </div>
  )
}

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

            {/* One concise statement. The previous version ran two paragraphs and
                a six-item biotics list before the fold; the brief asks for compact
                copy and a CTA visible without scrolling. */}
            <ScrollReveal delay={100}>
              <p className="mt-5 max-w-md text-lg leading-relaxed text-muted-foreground">
                Discover how your food, habits and everyday life support the living system
                inside you — and the practical steps that help it thrive.
              </p>
            </ScrollReveal>

            <ScrollReveal delay={200}>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <PrimaryCta placement="hero" />
                <SampleResultLink />
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                Takes about 5 minutes. Free, educational and non-diagnostic.
              </p>
            </ScrollReveal>
          </div>
        </div>

        <ScrollReveal delay={200}>
          <FoodStrip />
        </ScrollReveal>
      </div>
    </section>
  )
}
