import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { ScrollReveal } from "@/components/scroll-reveal"
import { HeroVideo } from "@/components/hero-video"
import { Eyebrow, Section, SectionHeading, StatusBadge } from "./shared"

/**
 * Section 6 — You first, Family next, deeper pathways on the shared
 * foundation. The Family band mirrors the production dark panel idiom
 * (components/home/closing-cta.tsx: dark green gradient, ambient glows,
 * gradient hairline); pathway cards mirror the quadrant card pattern
 * (the-framework.tsx: rounded-2xl, top gradient bar, uppercase label).
 */
const PATHWAYS = [
  {
    name: "Stability",
    color: "var(--icon-green)",
    gradient: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))",
    line: "Support greater digestive comfort, predictability, and confidence.",
    image: "/images/stability-hero.png",
    imageAlt: "Stability — a man and woman with the digestive system glowing calmly",
  },
  {
    name: "Glucose",
    color: "var(--icon-teal)",
    gradient: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))",
    line: "Support steadier energy, cravings, and food rhythm.",
    image: "/images/eatobetics-hero.webp",
    imageAlt: "Glucose — a man and woman with a steady energy wave between them",
  },
  {
    name: "Mind",
    color: "var(--icon-yellow)",
    gradient: "linear-gradient(135deg, var(--icon-teal), var(--icon-yellow))",
    line: "Explore the relationship between food, gut, mood, focus, and daily clarity.",
    image: "/images/mind-hero.png",
    imageAlt: "Mind — the gut-brain connection glowing in a man and woman",
  },
  {
    name: "Performance",
    color: "var(--icon-orange)",
    gradient: "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange))",
    line: "Support energy, recovery, strength, and output through better food patterns.",
    image: "/images/eatosports-hero.webp",
    imageAlt: "Performance — runners with energy flowing through their bodies",
  },
]

export function Pathways() {
  return (
    <Section>
      {/* Header — split layout with side CTA, as on the production framework section */}
      <ScrollReveal>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Eyebrow>One Connected System</Eyebrow>
            <SectionHeading>
              Begin <span className="brand-gradient-text">with you.</span>
            </SectionHeading>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground">
              Everything in EatoBiotics builds on one foundation: your own Food System Score.
              Establish it once, and every deeper pathway starts from what you have already
              shared — you are never asked to repeat the complete foundation assessment.
            </p>
          </div>
          <Link
            href="/assessment"
            className="inline-flex w-fit items-center gap-1.5 rounded-full border border-icon-green/30 bg-icon-green/5 px-5 py-2.5 text-sm font-semibold text-icon-green transition-all hover:border-icon-green/50 hover:bg-icon-green/10"
          >
            Get My Food System Score <ArrowRight size={15} />
          </Link>
        </div>
      </ScrollReveal>

      {/* Living twins — every food system is personal */}
      <div className="mt-14 grid gap-8 sm:grid-cols-2">
        {[
          {
            poster: "/videos/dt-twin-female-poster.jpg",
            webm: "/videos/dt-twin-female.webm",
            mp4: "/videos/dt-twin-female.mp4",
            alt: "A woman's food system, alive and personal",
            glow: "var(--icon-green)",
            caption: "Her food system",
          },
          {
            poster: "/videos/dt-twin-male-poster.jpg",
            webm: "/videos/dt-twin-male.webm",
            mp4: "/videos/dt-twin-male.mp4",
            alt: "A man's food system, alive and personal",
            glow: "var(--icon-orange)",
            caption: "His food system",
          },
        ].map((twin, i) => (
          <ScrollReveal key={twin.caption} delay={i * 120}>
            <div className="relative">
              <div
                aria-hidden
                className="absolute inset-0 -z-10 blur-3xl"
                style={{ background: `radial-gradient(55% 55% at 50% 48%, color-mix(in srgb, ${twin.glow} 22%, transparent), transparent 78%)` }}
              />
              <HeroVideo
                posterSrc={twin.poster}
                webmSrc={twin.webm}
                mp4Src={twin.mp4}
                alt={twin.alt}
                className="h-auto w-full object-contain"
              />
              <p className="mt-3 text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                {twin.caption}
              </p>
            </div>
          </ScrollReveal>
        ))}
      </div>
      <ScrollReveal delay={200}>
        <p className="mx-auto mt-6 max-w-xl text-center text-sm leading-relaxed text-muted-foreground">
          Two people, two different food systems — same foundation. Yours is just as personal.
        </p>
      </ScrollReveal>

      {/* Family — production dark panel idiom */}
      <ScrollReveal delay={100}>
        <div
          className="relative mt-16 overflow-hidden rounded-[2.5rem] px-6 py-16 md:px-12"
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
            style={{ background: "linear-gradient(90deg, var(--icon-lime), var(--icon-green), var(--icon-teal), var(--icon-yellow), var(--icon-orange))" }}
          />
          <div className="relative z-10 flex flex-col gap-10 lg:flex-row lg:items-center lg:gap-14">
            <div className="flex-1">
              <StatusBadge status="in-development" />
              <h3 className="mt-5 max-w-2xl font-serif text-4xl font-semibold leading-tight text-white sm:text-5xl text-balance">
                Your family has a{" "}
                <span
                  style={{
                    background: "linear-gradient(90deg, var(--icon-lime), var(--icon-yellow))",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  food system too.
                </span>
              </h3>
              <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/70 sm:text-lg">
                A household eats together, shops together, and builds habits together. Family is
                EatoBiotics&apos; next major expansion — adult household profiles first, with shared
                household food patterns, a Family Food System Score, one shared weekly action, and
                practical household meal and shopping guidance.
              </p>
              <p className="mt-4 text-xs text-white/55">
                Household features are being built adult-first. Child-specific profiles are not live.
              </p>
            </div>
            <div className="mx-auto w-full max-w-[300px] shrink-0 lg:mx-0">
              <div className="overflow-hidden rounded-2xl border border-white/15 bg-white p-3 shadow-xl shadow-black/30">
                <Image
                  src="/images/family-hero.png"
                  alt="A family's food systems, glowing together"
                  width={600}
                  height={900}
                  sizes="(max-width: 1024px) 300px, 300px"
                  className="h-auto w-full rounded-xl object-contain"
                />
              </div>
            </div>
          </div>
        </div>
      </ScrollReveal>

      {/* Deeper pathways — quadrant card idiom */}
      <div className="mt-16">
        <ScrollReveal>
          <h3 className="font-serif text-3xl font-semibold text-foreground sm:text-4xl text-balance">
            Go deeper <span className="brand-gradient-text">where it matters to you.</span>
          </h3>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
            Four pathways, all part of EatoBiotics, all building on your You or Family foundation.
          </p>
        </ScrollReveal>
        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {PATHWAYS.map((p, index) => (
            <ScrollReveal key={p.name} delay={index * 80}>
              <div className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-background transition-shadow hover:shadow-lg">
                <div className="absolute left-0 right-0 top-0 z-10 h-1" style={{ background: p.gradient }} />
                <div className="relative h-44 w-full overflow-hidden">
                  <Image src={p.image} alt={p.imageAlt} fill sizes="(max-width: 640px) 90vw, 560px" className="object-cover object-top" />
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <p className="text-xs font-bold uppercase tracking-widest" style={{ color: p.color }}>
                    Builds on your foundation
                  </p>
                  <h4 className="mt-1.5 font-serif text-xl font-semibold text-foreground">{p.name}</h4>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.line}</p>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </Section>
  )
}
