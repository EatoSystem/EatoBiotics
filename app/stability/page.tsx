import type { Metadata } from "next"
import Link from "next/link"
import {
  ArrowRight, ChevronDown, RefreshCw, Heart, ShieldCheck, TrendingUp,
  Compass, Sprout, HeartPulse, Infinity as InfinityIcon, ClipboardCheck,
  LineChart, Sparkles, Trophy,
} from "lucide-react"
import { ScrollReveal } from "@/components/scroll-reveal"
import { StabilityHero } from "@/components/stability/StabilityHero"
import { StabilityCtaButton } from "@/components/stability/StabilityCtaButton"
import { RedFlagWarning } from "@/components/stability/RedFlagWarning"
import { MedicalDisclaimer } from "@/components/stability/MedicalDisclaimer"
import { STABILITY_BANDS } from "@/lib/stability/scoring"

export const metadata: Metadata = {
  title: { absolute: "EatoBiotics Stability™ | The Stability System Inside You" },
  description:
    "Build a more predictable, comfortable, and confident Food System. Take the Stability Assessment, discover your Stability Score™, and improve your day-to-day digestive stability — the first system within EatoBiotics.",
  openGraph: {
    title: "EatoBiotics Stability™ | The Stability System Inside You",
    description:
      "Build a more predictable, comfortable, and confident Food System. Discover your Stability Score™ and improve your day-to-day digestive stability.",
  },
}

/* ── Section 3 — The Four Pillars of Stability™ ──────────────────────── */
const PILLARS = [
  { icon: RefreshCw,  title: "Consistency",    body: "How regularly your Food System performs.",      accent: "var(--icon-lime)" },
  { icon: Heart,      title: "Comfort",        body: "How comfortable your digestive experience feels.", accent: "var(--icon-green)" },
  { icon: ShieldCheck,title: "Confidence",     body: "How much trust you have in your Food System.",   accent: "var(--icon-teal)" },
  { icon: TrendingUp, title: "Predictability", body: "How reliably your Food System responds day to day.", accent: "var(--icon-yellow)" },
]

/* ── Section 6 — The Systems of EatoBiotics ──────────────────────────── */
const SYSTEMS = [
  { icon: Compass,      name: "Stability™",  tagline: "The Stability System Inside You",  status: "live",  color: "var(--icon-teal)" },
  { icon: Sprout,       name: "Diversity™",  tagline: "The Diversity System Inside You",  status: "soon",  color: "var(--icon-lime)" },
  { icon: HeartPulse,   name: "Recovery™",   tagline: "The Recovery System Inside You",   status: "soon",  color: "var(--icon-orange)" },
  { icon: InfinityIcon, name: "Longevity™",  tagline: "The Longevity System Inside You",  status: "soon",  color: "var(--icon-green)" },
]

/* ── Section 7 — How It Works ────────────────────────────────────────── */
const STEPS = [
  { icon: ClipboardCheck, title: "Take the Stability Assessment",  body: "A short, calm questionnaire builds your baseline Stability Score™." },
  { icon: LineChart,      title: "Track Stability Patterns",       body: "Log the daily signals that shape how settled and predictable you feel." },
  { icon: Sparkles,       title: "Receive Personalised Insights",  body: "See the habits, foods, and patterns influencing your stability." },
  { icon: Trophy,         title: "Improve Your Stability Score™",  body: "Change one thing at a time and watch your stability strengthen." },
]

const STEP_GRADS = [
  "linear-gradient(135deg, var(--icon-lime), var(--icon-green))",
  "linear-gradient(135deg, var(--icon-green), var(--icon-teal))",
  "linear-gradient(135deg, var(--icon-teal), var(--icon-yellow))",
  "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange))",
]

export default function StabilityPage() {
  return (
    <main className="overflow-hidden bg-white">
      <StabilityHero />
      <div className="section-divider" />

      {/* ── 2. The Problem ──────────────────────────────────────────── */}
      <section className="px-6 py-24 md:py-32">
        <div className="mx-auto max-w-3xl text-center">
          <ScrollReveal>
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--icon-orange)" }}>The Problem</p>
            <h2 className="font-serif text-3xl font-bold leading-tight text-balance sm:text-4xl lg:text-5xl" style={{ color: "var(--foreground)" }}>
              When your Food System is unstable, life becomes smaller.
            </h2>
            <p className="mt-6 text-lg leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
              Digestive instability can affect confidence, travel, work, exercise, relationships,
              and everyday decision-making. Many people don&apos;t know what patterns influence their
              digestive stability. <span style={{ color: "var(--foreground)" }}>Stability™ helps reveal those patterns.</span>
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* ── 3. The Four Pillars of Stability™ ───────────────────────── */}
      <section className="px-6 py-24 md:py-32" style={{ background: "#f4f8f0" }}>
        <div className="mx-auto max-w-[1200px]">
          <ScrollReveal className="mx-auto max-w-2xl text-center">
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--icon-teal)" }}>The Framework</p>
            <h2 className="font-serif text-3xl font-bold text-balance sm:text-4xl lg:text-5xl" style={{ color: "var(--foreground)" }}>The Four Pillars of Stability™</h2>
            <p className="mt-5 text-lg leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
              Four dimensions that together describe how stable your Food System really is.
            </p>
          </ScrollReveal>
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {PILLARS.map((p, i) => (
              <ScrollReveal key={p.title} delay={i * 70}>
                <div
                  className="group relative h-full rounded-3xl p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_60px_-22px_rgba(26,46,18,0.26)]"
                  style={{
                    background: `linear-gradient(160deg, color-mix(in srgb, ${p.accent} 12%, white), white 62%)`,
                    border: `1.5px solid color-mix(in srgb, ${p.accent} 28%, transparent)`,
                    borderLeft: `4px solid ${p.accent}`,
                  }}
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-sm" style={{ background: `color-mix(in srgb, ${p.accent} 88%, black 4%)` }}>
                    <p.icon size={22} />
                  </div>
                  <h3 className="mt-5 font-serif text-xl font-bold" style={{ color: "var(--foreground)" }}>{p.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>{p.body}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. Your Stability Score™ ────────────────────────────────── */}
      <section className="px-6 py-24 md:py-32">
        <div className="mx-auto max-w-[1100px]">
          <div className="grid items-center gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
            {/* Premium score ring mockup */}
            <ScrollReveal className="flex justify-center">
              <div className="relative">
                <div aria-hidden className="absolute inset-0 -z-10 blur-3xl" style={{ background: "radial-gradient(50% 50% at 50% 50%, rgba(45,170,110,0.18), transparent 72%)" }} />
                <svg width="280" height="280" viewBox="0 0 280 280">
                  <defs>
                    <linearGradient id="score-ring" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="var(--icon-lime)" />
                      <stop offset="50%" stopColor="var(--icon-teal)" />
                      <stop offset="100%" stopColor="var(--icon-yellow)" />
                    </linearGradient>
                  </defs>
                  <circle cx="140" cy="140" r="112" fill="none" stroke="#eef2ec" strokeWidth="18" />
                  <circle cx="140" cy="140" r="112" fill="none" stroke="url(#score-ring)" strokeWidth="18" strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 112 * 0.72} ${2 * Math.PI * 112}`} transform="rotate(-90 140 140)" />
                  <text x="140" y="132" textAnchor="middle" className="font-serif" style={{ fontSize: 56, fontWeight: 800, fill: "var(--foreground)" }}>72</text>
                  <text x="140" y="166" textAnchor="middle" style={{ fontSize: 14, fill: "var(--muted-foreground)" }}>/ 100</text>
                </svg>
                <span className="mx-auto mt-4 block w-fit rounded-full px-4 py-1.5 text-sm font-bold text-white" style={{ background: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))" }}>
                  Improving Stability
                </span>
              </div>
            </ScrollReveal>

            <div>
              <ScrollReveal>
                <p className="mb-4 text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--icon-green)" }}>The Score</p>
                <h2 className="font-serif text-3xl font-bold text-balance sm:text-4xl lg:text-5xl" style={{ color: "var(--foreground)" }}>Your Stability Score™</h2>
                <p className="mt-5 text-lg leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
                  A single score designed to measure the stability of your Food System. The
                  Stability Score™ contributes to your overall Biotics Score™.
                </p>
              </ScrollReveal>
              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                {STABILITY_BANDS.map((b, i) => {
                  const max = (STABILITY_BANDS[i + 1]?.min ?? 101) - 1
                  return (
                    <ScrollReveal key={b.band} delay={i * 60}>
                      <div className="h-full rounded-2xl border border-black/[0.06] bg-white p-4 shadow-sm">
                        <div className="flex items-center justify-between">
                          <span className="font-serif text-base font-bold" style={{ color: "var(--foreground)" }}>{b.band}</span>
                          <span className="font-serif text-sm font-bold" style={{ color: b.color }}>{b.min}–{max}</span>
                        </div>
                        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[#eef2ec]">
                          <div className="h-full rounded-full" style={{ width: `${max}%`, background: b.color }} />
                        </div>
                      </div>
                    </ScrollReveal>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. Relationship to EatoBiotics ──────────────────────────── */}
      <section className="px-6 py-24 md:py-32" style={{ background: "#f4f8f0" }}>
        <div className="mx-auto max-w-2xl text-center">
          <ScrollReveal>
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--icon-teal)" }}>How It Fits</p>
            <h2 className="font-serif text-3xl font-bold text-balance sm:text-4xl" style={{ color: "var(--foreground)" }}>
              Stability™ is part of the Food System Inside You
            </h2>
          </ScrollReveal>

          <ScrollReveal delay={80}>
            <div className="mt-12 flex flex-col items-center gap-4">
              <div className="w-full max-w-sm rounded-3xl border border-black/[0.06] bg-white p-6 shadow-sm">
                <p className="font-serif text-xl font-bold" style={{ color: "var(--foreground)" }}>EatoBiotics</p>
                <p className="mt-1 text-sm" style={{ color: "var(--muted-foreground)" }}>The Food System Inside You</p>
              </div>
              <ChevronDown size={22} style={{ color: "var(--icon-teal)" }} />
              <div className="w-full max-w-sm rounded-3xl p-6 text-white shadow-md" style={{ background: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))" }}>
                <p className="font-serif text-xl font-bold">Stability™</p>
                <p className="mt-1 text-sm text-white/80">The Stability System Inside You</p>
              </div>
              <ChevronDown size={22} style={{ color: "var(--icon-teal)" }} />
              <div className="w-full max-w-sm rounded-3xl border border-black/[0.06] bg-white p-6 shadow-sm">
                <p className="brand-gradient-text font-serif text-xl font-bold">Biotics Score™</p>
                <p className="mt-1 text-sm" style={{ color: "var(--muted-foreground)" }}>Your overall Food System health</p>
              </div>
            </div>
            <p className="mx-auto mt-10 max-w-lg text-base leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
              Stability is one of the foundational systems that contributes to your overall Food
              System health — before your Food System can thrive, it first needs to become stable.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* ── 6. The Systems of EatoBiotics ───────────────────────────── */}
      <section className="px-6 py-24 md:py-32">
        <div className="mx-auto max-w-[1200px]">
          <ScrollReveal className="mx-auto max-w-2xl text-center">
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--icon-green)" }}>The Roadmap</p>
            <h2 className="font-serif text-3xl font-bold text-balance sm:text-4xl lg:text-5xl" style={{ color: "var(--foreground)" }}>The Systems of EatoBiotics</h2>
            <p className="mt-5 text-lg leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
              Stability is the first system. More are on the way.
            </p>
          </ScrollReveal>
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {SYSTEMS.map((s, i) => {
              const live = s.status === "live"
              return (
                <ScrollReveal key={s.name} delay={i * 70}>
                  <div className={`group relative h-full overflow-hidden rounded-2xl border bg-background p-6 transition-all ${live ? "hover:shadow-lg" : ""}`}
                    style={{ borderColor: live ? `color-mix(in srgb, ${s.color} 40%, transparent)` : "var(--border)" }}>
                    <div className="absolute top-0 left-0 right-0 h-1" style={{ background: live ? `linear-gradient(90deg, ${s.color}, var(--icon-lime))` : "var(--border)" }} />
                    <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${live ? "text-white" : ""}`}
                      style={{ background: live ? s.color : "color-mix(in srgb, var(--muted-foreground) 10%, white)", color: live ? "white" : "var(--muted-foreground)" }}>
                      <s.icon size={22} />
                    </div>
                    <div className="mt-5 flex items-center gap-2">
                      <h3 className="font-serif text-lg font-bold" style={{ color: live ? "var(--foreground)" : "var(--muted-foreground)" }}>{s.name}</h3>
                      <span className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white"
                        style={{ background: live ? `linear-gradient(135deg, ${s.color}, var(--icon-green))` : "color-mix(in srgb, var(--muted-foreground) 22%, white)" }}>
                        {live ? "Available now" : "Coming soon"}
                      </span>
                    </div>
                    <p className="mt-1.5 text-sm leading-relaxed" style={{ color: "var(--muted-foreground)", opacity: live ? 1 : 0.85 }}>{s.tagline}</p>
                    {live && (
                      <Link href="/stability/assessment" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold opacity-70 transition-opacity group-hover:opacity-100" style={{ color: s.color }}>
                        Start now <ArrowRight size={14} />
                      </Link>
                    )}
                  </div>
                </ScrollReveal>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── 7. How It Works ─────────────────────────────────────────── */}
      <section id="how-it-works" className="scroll-mt-24 px-6 py-24 md:py-32" style={{ background: "#f4f8f0" }}>
        <div className="mx-auto max-w-[1200px]">
          <ScrollReveal className="mx-auto max-w-2xl text-center">
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--icon-green)" }}>How It Works</p>
            <h2 className="font-serif text-3xl font-bold text-balance sm:text-4xl lg:text-5xl" style={{ color: "var(--foreground)" }}>Four steps to a stronger system</h2>
          </ScrollReveal>
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <ScrollReveal key={s.title} delay={i * 70}>
                <div className="relative h-full rounded-3xl border border-black/[0.05] bg-white p-6 shadow-[0_10px_40px_-16px_rgba(26,46,18,0.16)]">
                  <div className="flex items-center justify-between">
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl font-serif text-base font-bold text-white shadow-sm" style={{ background: STEP_GRADS[i] }}>{i + 1}</span>
                    <s.icon size={20} style={{ color: "var(--icon-teal)" }} />
                  </div>
                  <h3 className="mt-5 font-serif text-lg font-bold" style={{ color: "var(--foreground)" }}>{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>{s.body}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── 8. Final CTA ────────────────────────────────────────────── */}
      <section className="px-6 py-16 md:py-20">
        <div className="relative mx-auto max-w-[1100px] overflow-hidden rounded-[2.5rem] px-6 py-20 text-center md:py-24" style={{ background: "linear-gradient(135deg, #14250F 0%, #1A2E12 45%, #243611 100%)" }}>
          <div aria-hidden className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full opacity-40 blur-3xl" style={{ background: "radial-gradient(circle, var(--icon-green), transparent 70%)" }} />
          <div aria-hidden className="pointer-events-none absolute -bottom-24 -right-16 h-72 w-72 rounded-full opacity-30 blur-3xl" style={{ background: "radial-gradient(circle, var(--icon-yellow), transparent 70%)" }} />
          <div className="absolute inset-x-0 top-0 h-1.5" style={{ background: "linear-gradient(90deg, var(--icon-lime), var(--icon-green), var(--icon-teal), var(--icon-yellow), var(--icon-orange))" }} />
          <div className="relative z-10">
            <ScrollReveal>
              <h2 className="mx-auto max-w-xl font-serif text-3xl font-semibold leading-tight text-white sm:text-4xl text-balance">Build Your Stability System</h2>
              <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-white/70">
                Take the Stability Assessment and begin building a more predictable, comfortable,
                and confident Food System.
              </p>
              <div className="mt-8 flex justify-center">
                <StabilityCtaButton source="footer_cta" className="brand-gradient inline-flex items-center gap-2 rounded-full px-8 py-4 text-base font-semibold text-white shadow-xl shadow-black/30 transition-opacity hover:opacity-90" />
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ── Compliance (de-emphasized) ──────────────────────────────── */}
      <section className="px-6 pb-12">
        <div className="mx-auto max-w-3xl">
          <ScrollReveal><RedFlagWarning compact /></ScrollReveal>
        </div>
      </section>
      <MedicalDisclaimer />
    </main>
  )
}
