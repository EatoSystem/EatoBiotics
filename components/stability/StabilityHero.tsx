import Image from "next/image"
import { ScrollReveal } from "@/components/scroll-reveal"
import { StabilityCtaButton } from "./StabilityCtaButton"

export function StabilityHero() {
  return (
    <section className="relative min-h-screen overflow-hidden px-6 pt-24 pb-16 md:pt-20 md:pb-20">
      <div className="relative z-10 mx-auto flex max-w-[1200px] min-h-[calc(100vh-180px)] flex-col items-center justify-center gap-12 md:flex-row md:gap-16 lg:gap-20">

        {/* ── Left: Image with cinematic glow + concentric system rings ── */}
        <ScrollReveal delay={60} className="flex-1 flex items-center justify-center w-full max-w-[600px]">
          <div className="relative w-full">
            {/* Layered radial glow */}
            <div
              aria-hidden
              className="absolute inset-0 -z-10 blur-3xl"
              style={{ background: "radial-gradient(58% 58% at 50% 48%, rgba(45,170,110,0.20), rgba(245,197,24,0.12) 52%, transparent 78%)" }}
            />
            {/* Faint concentric "system rings" — integrates the gut into a larger system */}
            <svg aria-hidden viewBox="0 0 600 600" className="absolute inset-0 -z-10 h-full w-full opacity-[0.18]">
              <defs>
                <linearGradient id="stab-ring" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="var(--icon-lime)" />
                  <stop offset="50%" stopColor="var(--icon-teal)" />
                  <stop offset="100%" stopColor="var(--icon-yellow)" />
                </linearGradient>
              </defs>
              {[150, 220, 290].map((r) => (
                <circle key={r} cx="300" cy="300" r={r} fill="none" stroke="url(#stab-ring)" strokeWidth="1.5" strokeDasharray="3 9" />
              ))}
            </svg>
            <Image
              src="/images/stability-hero.png"
              alt="The Stability System Inside You — two calm figures with a glowing, balanced digestive system"
              width={1402}
              height={1122}
              priority
              className="w-full h-auto object-contain"
            />
          </div>
        </ScrollReveal>

        {/* ── Right: Text ── */}
        <div className="flex-1 text-left max-w-[560px]">
          <ScrollReveal>
            <span className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-semibold uppercase tracking-wider" style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }}>
              EatoBiotics Stability™
            </span>
          </ScrollReveal>

          <ScrollReveal delay={80}>
            <h1 className="mt-5 font-serif text-4xl font-bold leading-tight text-balance sm:text-5xl lg:text-6xl">
              <span style={{ color: "var(--icon-green)" }}>The Stability System</span>{" "}
              <span className="brand-gradient-text">Inside You</span>
            </h1>
          </ScrollReveal>

          <ScrollReveal delay={140}>
            <p className="mt-4 max-w-md text-xl font-medium text-foreground sm:text-2xl">
              Build a more predictable, comfortable, and confident Food System.
            </p>
            <p className="mt-4 max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg">
              Take the Stability Assessment, discover your Stability Score™, and identify the
              habits, foods, and patterns that influence your day-to-day digestive stability.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={220}>
            <div className="mt-8 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
              <StabilityCtaButton source="hero" />
              <a href="#how-it-works" className="text-sm font-medium text-muted-foreground underline underline-offset-4 transition-colors hover:text-foreground">
                See How Stability Works
              </a>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={320}>
            <div className="mt-8 flex items-center gap-6">
              {[
                { num: "Free", label: "To start" },
                { num: "3 min", label: "Assessment" },
                { num: "Personalised", label: "Stability plan" },
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
        </div>
      </div>
    </section>
  )
}
