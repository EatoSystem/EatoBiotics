import type { Metadata } from "next"
import Link from "next/link"
import {
  Apple, Clock, Heart, ShieldCheck, ArrowRight, ArrowUpRight,
  Plane, Briefcase, Users, HeartPulse, Eye, Compass, Repeat, ClipboardList,
  ClipboardCheck, LineChart, Sparkles, Trophy, Activity, Sprout, Infinity as InfinityIcon,
} from "lucide-react"
import { ScrollReveal } from "@/components/scroll-reveal"
import { StabilityHero } from "@/components/stability/StabilityHero"
import { StabilityCtaButton } from "@/components/stability/StabilityCtaButton"
import { StabilityFramework } from "@/components/stability/StabilityFramework"
import { StabilityScoreShowcase } from "@/components/stability/StabilityScoreShowcase"
import { RedFlagWarning } from "@/components/stability/RedFlagWarning"
import { MedicalDisclaimer } from "@/components/stability/MedicalDisclaimer"

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

const STABILITY_GRADIENT = "linear-gradient(135deg, var(--icon-green), var(--icon-teal))"

/* ── Section 3 — The 4 Systems of Stability ──────────────────────────── */
const SYSTEMS = [
  {
    number: "01", title: "Food", label: "NOURISH", icon: Apple,
    accent: "var(--icon-lime)", gradientFrom: "var(--icon-lime)", gradientTo: "var(--icon-green)",
    description: "How meals, fibre, hydration, trigger foods, and overall food quality influence the day-to-day stability of your digestion.",
    support: "Fibre · Hydration · Quality",
  },
  {
    number: "02", title: "Rhythm", label: "ROUTINE", icon: Clock,
    accent: "var(--icon-green)", gradientFrom: "var(--icon-green)", gradientTo: "var(--icon-teal)",
    description: "How meal timing, bowel timing, sleep, stress, and your daily routine shape how predictable your Food System feels.",
    support: "Timing · Sleep · Routine",
  },
  {
    number: "03", title: "Comfort", label: "EASE", icon: Heart,
    accent: "var(--icon-teal)", gradientFrom: "var(--icon-teal)", gradientTo: "var(--icon-yellow)",
    description: "How bloating, cramps, discomfort, stool quality, and digestive ease shape how settled and confident you feel.",
    support: "Bloating · Comfort · Ease",
  },
  {
    number: "04", title: "Confidence", label: "FREEDOM", icon: ShieldCheck,
    accent: "var(--icon-yellow)", gradientFrom: "var(--icon-yellow)", gradientTo: "var(--icon-orange)",
    description: "How stability affects travel, work, exercise, social life, and the freedom to live fully without second-guessing your gut.",
    support: "Travel · Social · Freedom",
  },
]

/* ── Section 5 — Why Stability matters (contrast cards) ──────────────── */
const CONTRASTS = [
  { icon: Eye, old: "Instead of only tracking symptoms", neu: "Track the systems behind them.", accent: "var(--icon-lime)" },
  { icon: LineChart, old: "Instead of guessing triggers", neu: "Identify patterns over time.", accent: "var(--icon-teal)" },
  { icon: Repeat, old: "Instead of focusing on restriction", neu: "Build confidence through consistency.", accent: "var(--icon-yellow)" },
  { icon: Compass, old: "Instead of one-off advice", neu: "A Stability Plan that improves with you.", accent: "var(--icon-orange)" },
]

/* ── Section 6 — Different lives, different patterns ─────────────────── */
const SCENARIOS = [
  {
    title: "Travel Days", subtitle: "Holidays · Commutes · Away from home", icon: Plane,
    accent: "var(--icon-lime)", gradient: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))",
    systems: ["Rhythm", "Confidence"],
    description: "For people who worry about toilets, timing, routine disruption, and confidence away from home.",
  },
  {
    title: "Work Days", subtitle: "Meetings · Commutes · Pressure", icon: Briefcase,
    accent: "var(--icon-teal)", gradient: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))",
    systems: ["Rhythm", "Comfort"],
    description: "For people managing meetings, commutes, stress, and unpredictable symptoms through the working day.",
  },
  {
    title: "Social Days", subtitle: "Eating out · Events · Friends", icon: Users,
    accent: "var(--icon-yellow)", gradient: "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange))",
    systems: ["Comfort", "Confidence"],
    description: "For people who want the confidence to eat out, attend events, and enjoy life without second-guessing.",
  },
  {
    title: "Recovery Days", subtitle: "After illness · Antibiotics · Stress", icon: HeartPulse,
    accent: "var(--icon-orange)", gradient: "linear-gradient(135deg, var(--icon-teal), var(--icon-yellow))",
    systems: ["Food", "Rhythm"],
    description: "For people rebuilding stability after illness, antibiotics, stress, or a period of disruption.",
  },
]

/* ── Section 7 — How Stability works (flow + mock card) ─────────────── */
const FLOW = [
  { step: "01", icon: ClipboardCheck, label: "Take the Stability Assessment", detail: "A short assessment builds your baseline Stability Score™." },
  { step: "02", icon: Activity, label: "Track Your Patterns", detail: "Log the signals that shape stability — food, rhythm, comfort, sleep, and stress." },
  { step: "03", icon: Sparkles, label: "Discover Your Insights", detail: "EatoBiotic surfaces the habits, foods, and patterns that may influence your stability." },
  { step: "04", icon: Trophy, label: "Improve Your Stability Score™", detail: "Follow a personalised Stability Plan and build confidence over time." },
]

const MOCK_SCORES = [
  { system: "Food", score: 80, accent: "var(--icon-lime)", gradient: "linear-gradient(90deg, var(--icon-lime), var(--icon-green))" },
  { system: "Rhythm", score: 64, accent: "var(--icon-green)", gradient: "linear-gradient(90deg, var(--icon-green), var(--icon-teal))" },
  { system: "Comfort", score: 58, accent: "var(--icon-teal)", gradient: "linear-gradient(90deg, var(--icon-teal), var(--icon-yellow))" },
  { system: "Confidence", score: 72, accent: "var(--icon-yellow)", gradient: "linear-gradient(90deg, var(--icon-yellow), var(--icon-orange))" },
]

/* ── Section 9 — EatoBiotics Foundation (dark) ──────────────────────── */
const FOUNDATION = [
  { number: "01", title: "Food System", accent: "var(--icon-lime)", gradient: "linear-gradient(90deg, var(--icon-lime), var(--icon-green))", body: "Stability begins with understanding how your Food System responds to food, habits, and the realities of daily life." },
  { number: "02", title: "Stability Score™", accent: "var(--icon-green)", gradient: "linear-gradient(90deg, var(--icon-green), var(--icon-teal))", body: "Your score translates the everyday patterns you reported into one clear number. It is a behaviour score, not a clinical measurement." },
  { number: "03", title: "Biotics Score™", accent: "var(--icon-teal)", gradient: "linear-gradient(90deg, var(--icon-teal), var(--icon-yellow))", body: "Stability contributes to your overall Biotics Score™ — the core score at the heart of EatoBiotics." },
]

/* ── Section 10 — The Systems of EatoBiotics ────────────────────────── */
const EB_SYSTEMS = [
  { number: "01", name: "Stability™", icon: Compass, tagline: "The Stability System Inside You", status: "Available today", live: true, accent: "var(--icon-teal)", gradient: "linear-gradient(135deg, var(--icon-teal), var(--icon-green))" },
  { number: "02", name: "Diversity™", icon: Sprout, tagline: "The Diversity System Inside You", status: "Coming soon", live: false, accent: "var(--icon-lime)", gradient: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))" },
  { number: "03", name: "Recovery™", icon: HeartPulse, tagline: "The Recovery System Inside You", status: "Coming soon", live: false, accent: "var(--icon-orange)", gradient: "linear-gradient(135deg, var(--icon-teal), var(--icon-yellow))" },
  { number: "04", name: "Longevity™", icon: InfinityIcon, tagline: "The Longevity System Inside You", status: "Coming soon", live: false, accent: "var(--icon-green)", gradient: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))" },
]

export default function StabilityPage() {
  return (
    <>
      {/* ── 1. HERO ── */}
      <StabilityHero />
      <div style={{ height: "2px", background: "linear-gradient(90deg, var(--icon-lime), var(--icon-green), var(--icon-teal), var(--icon-yellow), var(--icon-orange))" }} />

      {/* ── 2. THE PROBLEM (editorial) ── */}
      <section className="px-6 py-24 md:py-32">
        <div className="mx-auto max-w-[1200px]">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-20">
            <ScrollReveal>
              <p className="text-xs font-bold uppercase tracking-widest text-icon-teal">The Problem</p>
              <h2 className="mt-4 text-pretty font-serif text-3xl font-semibold text-foreground sm:text-4xl md:text-5xl">
                When your Food System is unstable,{" "}
                <span className="brand-gradient-text">life becomes smaller.</span>
              </h2>
              <blockquote className="mt-8 border-l-2 pl-6 font-serif text-xl font-medium italic text-foreground" style={{ borderColor: "var(--icon-teal)" }}>
                &ldquo;Before your Food System can thrive, it must first become stable.&rdquo;
              </blockquote>
            </ScrollReveal>
            <ScrollReveal delay={150}>
              <div className="rounded-3xl border border-border bg-secondary/40 p-8 md:p-10">
                <p className="text-base leading-relaxed text-muted-foreground">
                  Digestive instability can affect confidence, travel, work, exercise, relationships, and
                  everyday decision-making. It quietly shrinks the things you feel able to do.
                </p>
                <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                  Many people do not know what patterns influence their stability — which foods, which
                  routines, which days. <span className="font-semibold text-foreground">Stability™ helps reveal those patterns</span>, so you can
                  build a more predictable, comfortable, and confident Food System.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* ── 3. THE 4 SYSTEMS OF STABILITY ── */}
      <section className="px-6 py-24 md:py-32">
        <div className="mx-auto max-w-[1200px]">
          <ScrollReveal className="max-w-2xl">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-icon-teal">The Framework</p>
            <h2 className="font-serif text-4xl font-semibold text-foreground sm:text-5xl text-balance">
              The 4 Systems{" "}
              <span className="brand-gradient-text">of Stability</span>
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              Four systems that shape how predictable, comfortable, and confident your Food System feels
              day to day — Food, Rhythm, Comfort, and Confidence.
            </p>
          </ScrollReveal>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {SYSTEMS.map((sys, index) => {
              const Icon = sys.icon
              const bgGradient = `linear-gradient(160deg, color-mix(in srgb, ${sys.accent} 10%, transparent), transparent 60%)`
              return (
                <ScrollReveal key={sys.number} delay={index * 80}>
                  <div
                    className="relative flex h-full flex-col rounded-3xl p-6 transition-shadow hover:shadow-lg"
                    style={{ background: bgGradient, border: `1.5px solid color-mix(in srgb, ${sys.accent} 30%, transparent)`, borderLeft: `4px solid ${sys.accent}` }}
                  >
                    <p className="mb-4 text-xs font-bold uppercase tracking-widest" style={{ color: sys.accent }}>{sys.number}</p>
                    <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl" style={{ background: `color-mix(in srgb, ${sys.accent} 15%, transparent)` }}>
                      <Icon size={20} style={{ color: sys.accent }} />
                    </div>
                    <h3 className="font-serif text-xl font-semibold text-foreground">{sys.title}</h3>
                    <p className="mt-1 text-xs font-bold uppercase tracking-widest" style={{ color: sys.accent }}>{sys.label}</p>
                    <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">{sys.description}</p>
                    <p className="mt-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">{sys.support}</p>
                    {index < SYSTEMS.length - 1 && (
                      <div className="absolute -right-3 top-1/2 hidden -translate-y-1/2 lg:block" style={{ zIndex: 1 }}>
                        <div className="flex h-6 w-6 items-center justify-center rounded-full text-white" style={{ background: `linear-gradient(135deg, ${sys.gradientFrom}, ${sys.gradientTo})` }}>
                          <ArrowRight size={12} />
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollReveal>
              )
            })}
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* ── 4. ONE FOOD SYSTEM. BUILT WITH STABILITY. ── */}
      <section className="px-6 py-24 md:py-32">
        <div className="mx-auto max-w-[1200px]">
          <div className="flex flex-col gap-16 lg:flex-row lg:items-center lg:gap-20">
            <div className="lg:w-[420px] lg:shrink-0">
              <ScrollReveal>
                <p className="text-xs font-semibold uppercase tracking-widest text-icon-teal">The Framework</p>
                <h2 className="mt-4 font-serif text-4xl font-semibold text-foreground sm:text-5xl text-balance">
                  One Food System.{" "}
                  <span className="brand-gradient-text">Built with Stability.</span>
                </h2>
                <p className="mt-6 text-base leading-relaxed text-muted-foreground">
                  Stability is not one habit. It is the result of how Food, Rhythm, Comfort, and Confidence
                  work together inside your Food System.
                </p>
                <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                  Together, the four systems shape your Stability Score™ — which contributes to your overall
                  Biotics Score™, the core score of EatoBiotics.
                </p>
              </ScrollReveal>
              <ScrollReveal delay={150}>
                <Link href="/assessment/add/stability" className="mt-8 inline-flex items-center gap-2 rounded-full border-2 border-icon-teal px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-icon-teal hover:text-white">
                  Add Stability <ArrowUpRight size={14} />
                </Link>
              </ScrollReveal>
            </div>
            <div className="flex-1">
              <ScrollReveal delay={100}><StabilityFramework /></ScrollReveal>
              <ScrollReveal delay={200}>
                <p className="mt-4 text-center text-xs text-muted-foreground">
                  A connected system where each part supports the next — measured as one Stability Score™.
                </p>
              </ScrollReveal>
            </div>
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* ── 5. WHY STABILITY MATTERS ── */}
      <section className="bg-secondary/40 px-6 py-24 md:py-32">
        <div className="mx-auto max-w-[1200px]">
          <div className="grid gap-16 lg:grid-cols-2 lg:items-start lg:gap-24">
            <ScrollReveal>
              <p className="text-xs font-bold uppercase tracking-widest text-icon-teal">Why Stability</p>
              <h2 className="mt-4 text-pretty font-serif text-3xl font-semibold text-foreground sm:text-4xl md:text-5xl">
                Most gut health tools were not built for real life.
              </h2>
              <p className="mt-6 text-base leading-relaxed text-muted-foreground">
                Many people are told to eat better, take fibre, avoid triggers, or try probiotics — but
                they are rarely given a way to understand what actually makes their Food System more stable.
              </p>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                Stability™ helps connect daily patterns to real-life outcomes, so progress feels visible,
                understandable, and within reach.
              </p>
              <blockquote className="mt-8 border-l-2 pl-6 font-serif text-xl font-medium italic text-foreground" style={{ borderColor: "var(--icon-teal)" }}>
                &ldquo;Stability is built, not guessed.&rdquo;
              </blockquote>
            </ScrollReveal>

            <ScrollReveal delay={150}>
              <div className="space-y-5">
                {CONTRASTS.map((item, i) => (
                  <div key={i} className="flex gap-5 rounded-2xl border border-border bg-background p-6">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl" style={{ background: `color-mix(in srgb, ${item.accent} 15%, transparent)` }}>
                      <item.icon size={20} style={{ color: item.accent }} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground line-through decoration-muted-foreground/40">{item.old}</p>
                      <p className="mt-1 flex items-center gap-2 font-semibold text-foreground">
                        <ArrowRight size={15} style={{ color: item.accent }} /> {item.neu}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* ── 6. DIFFERENT LIVES. DIFFERENT PATTERNS. ── */}
      <section className="px-6 py-24 md:py-32">
        <div className="mx-auto max-w-[1200px]">
          <ScrollReveal>
            <p className="text-xs font-bold uppercase tracking-widest text-icon-teal">Applied to Life</p>
            <h2 className="mt-4 text-pretty font-serif text-4xl font-semibold text-foreground sm:text-5xl md:text-6xl">
              Different lives.
              <br />
              <span className="brand-gradient-text">Different patterns.</span>
              <br />
              One Stability System.
            </h2>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground">
              Stability looks different for everyone. The system adapts to the realities of daily life —
              wherever you are and whatever the day asks of you.
            </p>
          </ScrollReveal>

          <div className="mt-16 grid gap-6 sm:grid-cols-2">
            {SCENARIOS.map((sc, index) => (
              <ScrollReveal key={sc.title} delay={index * 100}>
                <div className="relative overflow-hidden rounded-2xl border border-border bg-background p-7">
                  <div className="absolute top-0 left-0 right-0 h-1" style={{ background: sc.gradient }} />
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl" style={{ background: `color-mix(in srgb, ${sc.accent} 15%, transparent)` }}>
                      <sc.icon size={22} style={{ color: sc.accent }} />
                    </div>
                    <div>
                      <h3 className="font-serif text-xl font-semibold text-foreground">{sc.title}</h3>
                      <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: sc.accent }}>{sc.subtitle}</p>
                    </div>
                  </div>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {sc.systems.map((s) => {
                      const sys = SYSTEMS.find((x) => x.title === s)
                      return (
                        <span key={s} className="rounded-full px-3 py-1 text-xs font-semibold text-white" style={{ background: `linear-gradient(135deg, ${sys?.gradientFrom}, ${sys?.gradientTo})` }}>{s}</span>
                      )
                    })}
                  </div>
                  <p className="mt-5 text-sm leading-relaxed text-muted-foreground">{sc.description}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* ── 7. HOW STABILITY WORKS ── */}
      <section id="how-it-works" className="scroll-mt-24 bg-secondary/40 px-6 py-24 md:py-32">
        <div className="mx-auto max-w-[1200px]">
          <ScrollReveal>
            <p className="text-xs font-bold uppercase tracking-widest text-icon-teal">The Tool</p>
            <h2 className="mt-4 text-pretty font-serif text-4xl font-semibold text-foreground sm:text-5xl md:text-6xl">
              How Stability™
              <br />
              <span className="brand-gradient-text">works</span>
            </h2>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground">
              A simple, repeatable loop that turns your daily patterns into a clear Stability Score™ — and
              a plan to improve it.
            </p>
          </ScrollReveal>

          {/* 4-step flow */}
          <div className="mt-14">
            <ScrollReveal delay={100}>
              <div className="grid gap-8 sm:grid-cols-4 sm:gap-0">
                {FLOW.map((item, i) => (
                  <div key={item.step} className="flex items-start gap-3 sm:flex-col sm:gap-2">
                    <div className="flex items-center gap-3 sm:w-full">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white" style={{ background: STABILITY_GRADIENT }}>{item.step}</div>
                      {i < FLOW.length - 1 && (
                        <div className="hidden h-px flex-1 sm:block" style={{ background: "linear-gradient(90deg, var(--icon-green), var(--icon-teal))", opacity: 0.3 }} />
                      )}
                    </div>
                    <div className="pt-0.5 sm:pt-3">
                      <item.icon size={20} style={{ color: "var(--icon-teal)" }} />
                      <p className="mt-2 text-sm font-semibold text-foreground">{item.label}</p>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollReveal>
          </div>

          {/* Mock tracker card */}
          <ScrollReveal delay={200}>
            <div className="mt-14 overflow-hidden rounded-3xl border border-border bg-background shadow-lg">
              <div className="flex items-center justify-between px-7 py-5" style={{ background: "color-mix(in srgb, var(--icon-teal) 6%, var(--background))" }}>
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: STABILITY_GRADIENT }}>
                    <ClipboardList size={16} className="text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Stability Tracker</p>
                    <p className="text-xs text-muted-foreground">Your 4 Systems · this week</p>
                  </div>
                </div>
                <span className="rounded-full px-3 py-1 text-xs font-bold text-white" style={{ background: STABILITY_GRADIENT }}>Example</span>
              </div>
              <div className="px-7 pb-7 pt-6">
                <div className="space-y-5">
                  {MOCK_SCORES.map((item) => (
                    <div key={item.system}>
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-sm font-semibold text-foreground">{item.system}</span>
                        <span className="text-sm font-bold" style={{ color: item.accent }}>{item.score}/100</span>
                      </div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-secondary">
                        <div className="h-full rounded-full" style={{ width: `${item.score}%`, background: item.gradient }} />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-7 flex items-start gap-4 rounded-2xl p-5" style={{ background: "color-mix(in srgb, var(--icon-teal) 8%, transparent)", border: "1px solid color-mix(in srgb, var(--icon-teal) 25%, transparent)" }}>
                  <Sparkles size={18} style={{ color: "var(--icon-teal)", flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <p className="text-sm font-semibold text-foreground">Steady your Comfort system</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Comfort is your priority gap this week. A more consistent evening meal time and a little
                      more soluble fibre could meaningfully steady how settled your days feel.
                    </p>
                  </div>
                </div>
                <p className="mt-5 text-center text-xs text-muted-foreground/60">A conceptual preview of the Stability tracker — for education and self-tracking, not diagnosis.</p>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <div className="section-divider" />

      {/* ── 8. YOUR STABILITY SCORE™ ── */}
      <section className="px-6 py-24 md:py-32">
        <div className="mx-auto max-w-[1100px]">
          <ScrollReveal className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-icon-teal">The Score</p>
            <h2 className="mt-4 font-serif text-4xl font-semibold text-foreground sm:text-5xl text-balance">Your Stability Score™</h2>
            <p className="mt-6 text-base leading-relaxed text-muted-foreground">
              A single score reflecting how consistently your reported patterns support digestive
              stability, day to day.
            </p>
            <p className="mt-3 font-semibold text-foreground">Your Stability Score™ contributes to your overall Biotics Score™.</p>
          </ScrollReveal>
          <div className="mt-16">
            <StabilityScoreShowcase />
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* ── 9. EATOBIOTICS FOUNDATION (dark) ── */}
      <section className="bg-foreground px-6 py-24 md:py-32">
        <div className="mx-auto max-w-[1200px]">
          <ScrollReveal>
            <p className="text-xs font-bold uppercase tracking-widest text-icon-lime">The Food System Inside You</p>
            <h2 className="mt-4 text-pretty font-serif text-4xl font-semibold text-background sm:text-5xl md:text-6xl">
              EatoBiotics.
              <br />
              <span className="brand-gradient-text">The foundation Stability™ is built on.</span>
            </h2>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-background/70">
              Stability™ is part of EatoBiotics — The Food System Inside You. It reflects how strongly
              your reported habits support digestive stability, and contributes to your overall
              Biotics Score™.
            </p>
          </ScrollReveal>
          <ScrollReveal delay={150}>
            <Link href="/" className="mt-8 inline-flex items-center gap-2 rounded-full border-2 border-icon-lime px-6 py-3 text-sm font-semibold text-background transition-colors hover:bg-icon-lime hover:text-foreground">
              Explore EatoBiotics <ArrowUpRight size={14} />
            </Link>
          </ScrollReveal>

          <div className="mt-16 grid gap-6 sm:grid-cols-3">
            {FOUNDATION.map((card, index) => (
              <ScrollReveal key={card.title} delay={index * 100}>
                <div className="relative flex flex-col overflow-hidden rounded-2xl p-7" style={{ background: `color-mix(in srgb, ${card.accent} 8%, var(--foreground))`, border: `1px solid color-mix(in srgb, ${card.accent} 25%, transparent)` }}>
                  <div className="absolute top-0 left-0 right-0 h-1" style={{ background: card.gradient }} />
                  <span className="font-serif text-4xl font-semibold" style={{ color: card.accent }}>{card.number}</span>
                  <h3 className="mt-4 font-serif text-xl font-semibold text-background">{card.title}</h3>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-background/70">{card.body}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
          <ScrollReveal delay={200}>
            <p className="mt-10 text-center text-sm text-background/50">Stability is the first system within EatoBiotics — the foundation everything else is built on.</p>
          </ScrollReveal>
        </div>
      </section>

      <div className="section-divider" />

      {/* ── 10. THE SYSTEMS OF EATOBIOTICS ── */}
      <section className="bg-secondary/40 px-6 py-24 md:py-32">
        <div className="mx-auto max-w-[1200px]">
          <ScrollReveal>
            <p className="text-xs font-bold uppercase tracking-widest text-icon-teal">The Roadmap</p>
            <h2 className="mt-4 text-pretty font-serif text-4xl font-semibold text-foreground sm:text-5xl md:text-6xl">
              The Systems
              <br />
              <span className="brand-gradient-text">of EatoBiotics</span>
            </h2>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground">
              Stability is the first system. More are on the way — each one a new way to understand the Food
              System inside you.
            </p>
          </ScrollReveal>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {EB_SYSTEMS.map((sys, index) => (
              <ScrollReveal key={sys.number} delay={index * 100}>
                <div className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-background p-6 transition-all hover:shadow-lg">
                  <div className="absolute top-0 left-0 right-0 h-1" style={{ background: sys.live ? sys.gradient : "var(--border)" }} />
                  <div className="flex items-start justify-between">
                    <span className="font-serif text-5xl font-bold" style={{ color: sys.live ? sys.accent : "var(--muted-foreground)" }}>{sys.number}</span>
                    <span className="mt-1 rounded-full px-2.5 py-1 text-xs font-semibold text-white" style={{ background: sys.live ? sys.gradient : "color-mix(in srgb, var(--muted-foreground) 35%, transparent)" }}>{sys.status}</span>
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                    <sys.icon size={18} style={{ color: sys.live ? sys.accent : "var(--muted-foreground)" }} />
                    <h3 className="font-serif text-xl font-semibold" style={{ color: sys.live ? "var(--foreground)" : "var(--muted-foreground)" }}>{sys.name}</h3>
                  </div>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{sys.tagline}</p>
                  {sys.live ? (
                    <Link href="/assessment/add/stability" className="mt-5 flex items-center gap-1 text-sm font-semibold opacity-70 transition-opacity group-hover:opacity-100" style={{ color: sys.accent }}>
                      Start now <ArrowUpRight size={14} />
                    </Link>
                  ) : (
                    <span className="mt-5 text-sm font-semibold text-muted-foreground/50">In development</span>
                  )}
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* ── 11. FINAL CTA ── */}
      <section className="px-6 py-24 md:py-32">
        <div className="mx-auto max-w-[900px]">
          <div className="overflow-hidden rounded-3xl border border-border bg-background">
            <div className="h-1.5 w-full brand-gradient" />
            <div className="p-10 md:p-16 text-center">
              <ScrollReveal>
                <p className="text-xs font-bold uppercase tracking-widest text-icon-teal">EatoBiotics Stability™</p>
                <h2 className="mt-4 text-balance font-serif text-4xl font-semibold text-foreground sm:text-5xl">
                  Build your <span className="brand-gradient-text">Stability System</span>
                </h2>
                <p className="mx-auto mt-6 max-w-lg text-base leading-relaxed text-muted-foreground">
                  Take the Stability Assessment and begin building a more predictable, comfortable, and
                  confident Food System.
                </p>
              </ScrollReveal>
              <ScrollReveal delay={150}>
                <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                  <StabilityCtaButton source="footer_cta" />
                  <Link href="/stability/tracker" className="inline-flex items-center gap-2 rounded-full border border-border px-8 py-4 text-base font-semibold text-foreground transition-all hover:border-icon-teal hover:text-icon-teal">
                    Track Today&apos;s Gut Stability
                  </Link>
                </div>
                <p className="mt-4 text-sm text-muted-foreground">Free to start. No card needed. Takes about 3 minutes.</p>
              </ScrollReveal>
            </div>
          </div>
        </div>
      </section>

      {/* ── Compliance / medical disclaimer (clean, de-emphasized) ── */}
      <section className="px-6 pb-12">
        <div className="mx-auto max-w-3xl">
          <ScrollReveal><RedFlagWarning compact /></ScrollReveal>
        </div>
      </section>
      <MedicalDisclaimer />
    </>
  )
}
