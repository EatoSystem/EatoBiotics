import Image from "next/image"
import { Zap, ShieldPlus, Activity, Flame, Infinity as InfinityIcon, type LucideIcon } from "lucide-react"
import { ScrollReveal } from "@/components/scroll-reveal"

type Benefit = {
  title: string
  copy: string
  icon: LucideIcon | "stomach"
  accent: string
}

const LEFT: Benefit[] = [
  { title: "Energy", copy: "Feel more energised and consistent throughout the day.", icon: Zap, accent: "var(--icon-yellow)" },
  { title: "Immunity", copy: "Support the systems that help protect and defend your body.", icon: ShieldPlus, accent: "var(--icon-teal)" },
  { title: "Metabolism", copy: "Build a stronger foundation for glucose and metabolic health.", icon: Flame, accent: "var(--icon-orange)" },
]

const RIGHT: Benefit[] = [
  { title: "Digestion", copy: "Build a more comfortable and predictable digestive system.", icon: "stomach", accent: "var(--icon-green)" },
  { title: "Recovery", copy: "Recover better from training, illness, travel, and everyday stress.", icon: Activity, accent: "var(--icon-lime)" },
  { title: "Longevity", copy: "Support healthier ageing through better food choices and habits.", icon: InfinityIcon, accent: "var(--icon-green)" },
]

function StomachIcon({ size = 26, color }: { size?: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M9 3v3.5a3 3 0 0 0 3 3h1.5a4.5 4.5 0 0 1 4.5 4.5 4.5 4.5 0 0 1-4.5 4.5c-3.6 0-6.5-2.9-6.5-6.5V7a4 4 0 0 1 4-4Z" />
      <path d="M13.5 18.5v1.5" />
    </svg>
  )
}

function BenefitCard({ b, align = "left" }: { b: Benefit; align?: "left" | "right" }) {
  const Icon = b.icon
  return (
    <div
      className="group relative flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-border p-7 shadow-lg transition-all hover:-translate-y-1 hover:shadow-2xl"
      style={{ background: `linear-gradient(165deg, color-mix(in srgb, ${b.accent} 9%, var(--card)) 0%, var(--card) 55%)` }}
    >
      {/* soft accent glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full opacity-50 blur-2xl transition-opacity duration-300 group-hover:opacity-80"
        style={{ background: `radial-gradient(circle, color-mix(in srgb, ${b.accent} 30%, transparent), transparent 70%)` }}
      />
      {/* large circular icon chip */}
      <div
        className="relative flex h-14 w-14 items-center justify-center rounded-full shadow-sm ring-1"
        style={{
          background: `color-mix(in srgb, ${b.accent} 14%, var(--card))`,
          ["--tw-ring-color" as string]: `color-mix(in srgb, ${b.accent} 30%, transparent)`,
        }}
      >
        {Icon === "stomach" ? <StomachIcon color={b.accent} /> : <Icon size={26} style={{ color: b.accent }} />}
      </div>
      <h3 className="relative mt-5 font-serif text-xl font-semibold text-foreground">{b.title}</h3>
      <p className="relative mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{b.copy}</p>
      {/* accent underline */}
      <div
        className={`relative mt-5 h-1 w-10 rounded-full ${align === "right" ? "self-end" : ""}`}
        style={{ background: `linear-gradient(90deg, ${b.accent}, color-mix(in srgb, ${b.accent} 35%, transparent))` }}
      />
    </div>
  )
}

export function PowersEverything() {
  return (
    <section className="px-6 py-24 md:py-32">
      <div className="mx-auto max-w-[1200px]">
        {/* Heading + subheading */}
        <ScrollReveal>
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="font-serif text-4xl font-bold leading-[1.1] text-foreground sm:text-5xl md:text-6xl text-balance">
              The Food System Inside You
              <br />
              <span style={{ color: "var(--icon-green)" }}>powers </span>
              <span className="relative">
                <span style={{ color: "var(--icon-orange)" }}>everything.</span>
                <span
                  aria-hidden
                  className="absolute -bottom-1 left-0 right-0 h-1 rounded-full"
                  style={{ background: "linear-gradient(90deg, var(--icon-yellow), var(--icon-orange))" }}
                />
              </span>
            </h2>
            <p className="mt-8 text-lg font-medium leading-relaxed text-foreground/80">
              Your energy. Your digestion. Your immunity. Your recovery. Your mood. Your metabolism.
              Your long-term health.
            </p>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              Most people feel the effects every day. Few people understand the system behind them.
            </p>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              <span className="font-semibold text-icon-green">EatoBiotics</span> helps you measure,
              understand, and improve the Food System Inside You through your{" "}
              <span className="font-semibold text-icon-green">Biotics Score™</span>.
            </p>
          </div>
        </ScrollReveal>

        {/* Desktop: cards radiate from the centre illustration */}
        <div className="mt-16 hidden items-center gap-x-8 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(300px,380px)_minmax(0,1fr)]">
          {/* Left column */}
          <div className="flex flex-col gap-6">
            {LEFT.map((b, i) => (
              <ScrollReveal key={b.title} delay={i * 90}>
                <div className="relative">
                  <BenefitCard b={b} align="left" />
                  {/* connector */}
                  <span aria-hidden className="absolute top-1/2 left-full hidden h-px w-8 -translate-y-1/2 lg:block" style={{ background: `linear-gradient(90deg, color-mix(in srgb, ${b.accent} 60%, transparent), transparent)` }} />
                  <span aria-hidden className="absolute top-1/2 left-full hidden h-2 w-2 -translate-y-1/2 translate-x-7 rounded-full lg:block" style={{ background: b.accent }} />
                </div>
              </ScrollReveal>
            ))}
          </div>

          {/* Centre illustration */}
          <ScrollReveal delay={120} className="flex items-center justify-center">
            <div className="relative w-full">
              <div
                aria-hidden
                className="absolute inset-0 -z-10 blur-3xl"
                style={{ background: "radial-gradient(60% 60% at 50% 50%, rgba(245,197,24,0.22), rgba(76,182,72,0.12) 55%, transparent 78%)" }}
              />
              <Image
                src="/images/couple-hero.png"
                alt="The food system inside you — two figures with a glowing digestive system"
                width={760}
                height={760}
                className="h-auto w-full object-contain"
              />
            </div>
          </ScrollReveal>

          {/* Right column */}
          <div className="flex flex-col gap-6">
            {RIGHT.map((b, i) => (
              <ScrollReveal key={b.title} delay={i * 90}>
                <div className="relative">
                  <BenefitCard b={b} align="right" />
                  {/* connector */}
                  <span aria-hidden className="absolute top-1/2 right-full hidden h-px w-8 -translate-y-1/2 lg:block" style={{ background: `linear-gradient(270deg, color-mix(in srgb, ${b.accent} 60%, transparent), transparent)` }} />
                  <span aria-hidden className="absolute top-1/2 right-full hidden h-2 w-2 -translate-y-1/2 -translate-x-7 rounded-full lg:block" style={{ background: b.accent }} />
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>

        {/* Tablet / mobile: illustration on top, then card grid (1 col → 2 cols) */}
        <div className="mt-14 lg:hidden">
          <ScrollReveal>
            <div className="relative mx-auto mb-10 max-w-[340px]">
              <div
                aria-hidden
                className="absolute inset-0 -z-10 blur-3xl"
                style={{ background: "radial-gradient(60% 60% at 50% 50%, rgba(245,197,24,0.22), rgba(76,182,72,0.12) 55%, transparent 78%)" }}
              />
              <Image
                src="/images/couple-hero.png"
                alt="The food system inside you — two figures with a glowing digestive system"
                width={680}
                height={680}
                className="h-auto w-full object-contain"
              />
            </div>
          </ScrollReveal>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {[...LEFT, ...RIGHT].map((b, i) => (
              <ScrollReveal key={b.title} delay={i * 70}>
                <BenefitCard b={b} />
              </ScrollReveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
