import Image from "next/image"
import { Zap, ShieldPlus, BarChart3, Activity, Infinity as InfinityIcon, type LucideIcon } from "lucide-react"
import { ScrollReveal } from "@/components/scroll-reveal"

type Benefit = {
  title: string
  copy: string
  icon: LucideIcon | "stomach"
  accent: string
  angle: number // degrees, standard math (0 = east, CCW positive)
  side: "left" | "right"
}

const BENEFITS: Benefit[] = [
  { title: "Energy", copy: "Feel more energised and consistent throughout the day.", icon: Zap, accent: "var(--icon-green)", angle: 150, side: "left" },
  { title: "Immunity", copy: "Support the systems that help protect and defend your body.", icon: ShieldPlus, accent: "var(--icon-green)", angle: 180, side: "left" },
  { title: "Metabolism", copy: "Build a stronger foundation for glucose and metabolic health.", icon: BarChart3, accent: "var(--icon-green)", angle: 210, side: "left" },
  { title: "Digestion", copy: "Build a more comfortable and predictable digestive system.", icon: "stomach", accent: "var(--icon-green)", angle: 30, side: "right" },
  { title: "Recovery", copy: "Recover better from training, illness, travel, and everyday stress.", icon: Activity, accent: "var(--icon-orange)", angle: 0, side: "right" },
  { title: "Longevity", copy: "Support healthier ageing through better food choices and habits.", icon: InfinityIcon, accent: "var(--icon-orange)", angle: 330, side: "right" },
]

const RAD = (deg: number) => (deg * Math.PI) / 180
// position on the ring as a percentage of the stage (0–100)
const pos = (angle: number) => ({
  left: 50 + 50 * Math.cos(RAD(angle)),
  top: 50 - 50 * Math.sin(RAD(angle)),
})

function StomachIcon({ size = 28, color }: { size?: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M9 3v3.5a3 3 0 0 0 3 3h1.5a4.5 4.5 0 0 1 4.5 4.5 4.5 4.5 0 0 1-4.5 4.5c-3.6 0-6.5-2.9-6.5-6.5V7a4 4 0 0 1 4-4Z" />
      <path d="M13.5 18.5v1.5" />
    </svg>
  )
}

function Orb({ b, size = 80 }: { b: Benefit; size?: number }) {
  const Icon = b.icon
  return (
    <div
      className="relative flex items-center justify-center rounded-full bg-card shadow-[0_10px_30px_-8px_rgba(20,37,15,0.25)] ring-1"
      style={{
        height: size,
        width: size,
        ["--tw-ring-color" as string]: `color-mix(in srgb, ${b.accent} 35%, transparent)`,
      }}
    >
      {/* soft accent glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-2 -z-10 rounded-full opacity-60 blur-md"
        style={{ background: `radial-gradient(circle, color-mix(in srgb, ${b.accent} 28%, transparent), transparent 70%)` }}
      />
      {/* inner faint ring */}
      <div
        aria-hidden
        className="absolute inset-1.5 rounded-full ring-1"
        style={{ ["--tw-ring-color" as string]: `color-mix(in srgb, ${b.accent} 18%, transparent)` }}
      />
      {Icon === "stomach" ? <StomachIcon color={b.accent} /> : <Icon size={28} style={{ color: b.accent }} />}
    </div>
  )
}

function Label({ b }: { b: Benefit }) {
  return (
    <div className={b.side === "left" ? "text-right" : "text-left"}>
      <h3 className="font-serif text-xl font-semibold" style={{ color: b.accent }}>{b.title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{b.copy}</p>
      <div
        className={`mt-3 h-1 w-10 rounded-full ${b.side === "left" ? "ml-auto" : ""}`}
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
              <span className="relative">
                <span style={{ color: "var(--icon-green)" }}>powers</span>
                <span aria-hidden className="absolute -bottom-1 left-0 right-1 h-1 rounded-full" style={{ background: "var(--icon-green)" }} />
              </span>{" "}
              <span className="relative">
                <span style={{ color: "var(--icon-orange)" }}>everything.</span>
                <span aria-hidden className="absolute -bottom-1 left-0 right-2 h-1 rounded-full" style={{ background: "linear-gradient(90deg, var(--icon-yellow), var(--icon-orange))" }} />
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

        {/* ── Desktop: circular orbit ─────────────────────────────────── */}
        <ScrollReveal delay={120} className="mt-8 hidden xl:block">
          <div className="relative mx-auto h-[600px] w-[600px]">
            {/* Ring + radial spokes */}
            <svg viewBox="0 0 600 600" className="absolute inset-0 h-full w-full overflow-visible" aria-hidden>
              <defs>
                <linearGradient id="pe-ring" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="var(--icon-green)" />
                  <stop offset="55%" stopColor="var(--icon-lime)" />
                  <stop offset="100%" stopColor="var(--icon-orange)" />
                </linearGradient>
              </defs>
              <circle cx="300" cy="300" r="300" fill="none" stroke="url(#pe-ring)" strokeWidth="1.5" strokeDasharray="2 9" opacity="0.55" />
              {BENEFITS.map((b) => {
                const x = 300 + 300 * Math.cos(RAD(b.angle))
                const y = 300 - 300 * Math.sin(RAD(b.angle))
                return (
                  <line key={b.title} x1="300" y1="300" x2={x} y2={y} stroke={b.accent} strokeWidth="1.5" strokeDasharray="2 8" opacity="0.3" />
                )
              })}
            </svg>

            {/* Centre illustration */}
            {/* Landscape artwork (3:2) in a square slot, so the box is wider than
                it is tall to give the figure comparable visual mass to the portrait
                image it replaced. */}
            <div className="absolute left-1/2 top-1/2 h-[78%] w-[94%] -translate-x-1/2 -translate-y-1/2">
              <div aria-hidden className="absolute inset-0 -z-10 blur-3xl" style={{ background: "radial-gradient(58% 58% at 50% 50%, rgba(245,197,24,0.24), rgba(76,182,72,0.12) 55%, transparent 78%)" }} />
              <Image
                src="/images/hero-gut.png"
                alt="Two silhouetted figures with a glowing digestive pathway running through them"
                fill
                sizes="560px"
                className="object-contain"
              />
            </div>

            {/* Orbs + labels */}
            {BENEFITS.map((b) => {
              const { left, top } = pos(b.angle)
              return (
                <div key={b.title} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${left}%`, top: `${top}%` }}>
                  <Orb b={b} />
                  <div
                    className="absolute top-1/2 w-[210px] -translate-y-1/2"
                    style={b.side === "left" ? { right: "100%", marginRight: 20 } : { left: "100%", marginLeft: 20 }}
                  >
                    <Label b={b} />
                  </div>
                </div>
              )
            })}

            {/* Centre node */}
            <div className="absolute left-1/2 top-full flex h-28 w-28 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full bg-card text-center shadow-xl ring-1" style={{ ["--tw-ring-color" as string]: "color-mix(in srgb, var(--icon-green) 30%, transparent)" }}>
              <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Your</span>
              <span className="font-serif text-sm font-bold leading-tight text-foreground">Food<br />System</span>
            </div>
          </div>
        </ScrollReveal>

        {/* ── Tablet / mobile: illustration on top + orb grid ─────────── */}
        <div className="mt-14 xl:hidden">
          <ScrollReveal>
            <div className="relative mx-auto mb-12 max-w-[420px]">
              <div aria-hidden className="absolute inset-0 -z-10 blur-3xl" style={{ background: "radial-gradient(58% 58% at 50% 50%, rgba(245,197,24,0.24), rgba(76,182,72,0.12) 55%, transparent 78%)" }} />
              <Image
                src="/images/hero-gut.png"
                alt="Two silhouetted figures with a glowing digestive pathway running through them"
                width={1536}
                height={1024}
                className="h-auto w-full object-contain"
              />
            </div>
          </ScrollReveal>
          <div className="mx-auto grid max-w-2xl grid-cols-1 gap-x-10 gap-y-8 sm:grid-cols-2">
            {BENEFITS.map((b, i) => (
              <ScrollReveal key={b.title} delay={i * 70}>
                <div className="flex items-start gap-4">
                  <div className="shrink-0">
                    <Orb b={b} size={60} />
                  </div>
                  <div className="text-left">
                    <h3 className="font-serif text-lg font-semibold" style={{ color: b.accent }}>{b.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{b.copy}</p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
