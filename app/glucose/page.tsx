import type { Metadata } from "next"
import Link from "next/link"
import {
  Activity, Zap, Clock, ArrowRight, ArrowUpRight, ShieldCheck, Pill,
  Calculator, Salad, LineChart, CalendarCheck, ClipboardCheck, Gauge, FileText,
  Sparkles, Compass, Dumbbell, User,
} from "lucide-react"
import { ScrollReveal } from "@/components/scroll-reveal"
import { EbHero } from "@/components/eatobetics/home/hero"
import { EbFramework } from "@/components/eatobetics/EbFramework"
import { EbScoreShowcase } from "@/components/eatobetics/EbScoreShowcase"

export const metadata: Metadata = {
  title: { absolute: "EatoBetics | The Glucose System Inside You" },
  description:
    "EatoBetics is a glucose intelligence platform that helps people understand how food affects energy, cravings, glucose stability, and long-term metabolic health. Take the free assessment, get your EatoBetics Score, and follow a personalised 30-day plan.",
  openGraph: {
    title: "EatoBetics | The Glucose System Inside You",
    description:
      "Understand how food affects your energy, cravings, glucose stability, and long-term metabolic health.",
  },
}

const ASSESSMENT_HREF = "/assessment/add/glucose"
const EB_GRADIENT = "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange))"

/* ── Section 3 — The 3 Systems of EatoBetics (the Score pillars) ─────── */
const SYSTEMS = [
  {
    number: "01", title: "Stability", label: "STEADY", icon: Activity,
    accent: "var(--icon-orange)", gradientFrom: "var(--icon-yellow)", gradientTo: "var(--icon-orange)",
    description: "How sharply your glucose rises and falls after meals. Shaped by fibre, protein, the order you eat in, and the quality of your carbs — the levers that flatten the curve.",
    support: "Fibre · Protein · Order",
  },
  {
    number: "02", title: "Energy", label: "SUSTAIN", icon: Zap,
    accent: "var(--icon-green)", gradientFrom: "var(--icon-lime)", gradientTo: "var(--icon-green)",
    description: "Whether your meals leave you energised or crashing. Steadier glucose means steadier focus, fewer cravings, and no afternoon slump — the daily feeling of a balanced food system.",
    support: "Focus · Cravings · Slump",
  },
  {
    number: "03", title: "Rhythm", label: "SUSTAIN", icon: Clock,
    accent: "var(--icon-teal)", gradientFrom: "var(--icon-green)", gradientTo: "var(--icon-teal)",
    description: "The timing, spacing, and movement around your meals. When you eat — and a short walk after — shapes your whole day, and builds long-term metabolic resilience.",
    support: "Timing · Spacing · Movement",
  },
]

/* ── Section 5 — Why EatoBetics (contrast cards) ────────────────────── */
const CONTRASTS = [
  { icon: Calculator, old: "Instead of counting calories", neu: "Understand your glucose response.", accent: "var(--icon-orange)" },
  { icon: Salad, old: "Instead of restrictive diets", neu: "Build better versions of your meals.", accent: "var(--icon-green)" },
  { icon: LineChart, old: "Instead of guessing", neu: "See your patterns across stability, energy & rhythm.", accent: "var(--icon-teal)" },
  { icon: CalendarCheck, old: "Instead of one-off advice", neu: "Follow a 30-day plan, one pattern at a time.", accent: "var(--icon-yellow)" },
]

/* ── Section 6 — Three ways to use EatoBetics (pathways) ────────────── */
const PATHWAYS = [
  {
    label: "ENERGY", title: "Steady energy, fewer crashes", icon: Zap,
    accent: "var(--icon-green)", gradient: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))",
    pillars: ["Energy", "Stability"], href: ASSESSMENT_HREF,
    copy: "For people who feel foggy, tired, or hungry soon after meals — understand the patterns behind your afternoon slump and craving cycles.",
  },
  {
    label: "PREVENTION", title: "Get ahead of the curve", icon: ShieldCheck,
    accent: "var(--icon-teal)", gradient: "linear-gradient(135deg, var(--icon-teal), var(--icon-green))",
    pillars: ["Stability", "Rhythm"], href: ASSESSMENT_HREF,
    copy: "For people watching fasting glucose, HbA1c, or family risk who want to understand their metabolic health before a diagnosis ever appears.",
  },
  {
    label: "GLP-1", title: "Make the most of your medication", icon: Pill,
    accent: "var(--icon-orange)", gradient: "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange))",
    pillars: ["Stability", "Energy"], href: "/glucose/glp1",
    copy: "On Ozempic, Wegovy, or Mounjaro? Use your appetite window to protect muscle and rebuild your relationship with food — not just eat less.",
    glp1: true,
  },
]

/* ── Section 7 — How EatoBetics works (flow + mock report) ──────────── */
const FLOW = [
  { step: "01", icon: ClipboardCheck, label: "Assess", detail: "A short, free assessment maps how your meals affect your glucose system. No account needed." },
  { step: "02", icon: Gauge, label: "Score", detail: "Get your EatoBetics Score across stability, energy, and rhythm — and where to focus first." },
  { step: "03", icon: FileText, label: "Report", detail: "A personal glucose profile with your biggest opportunity and meal-by-meal guidance." },
  { step: "04", icon: CalendarCheck, label: "30-Day Plan", detail: "Improve one pattern at a time, with daily actions and weekly check-ins." },
]

const MOCK_PILLARS = [
  { label: "Stability", score: 58, accent: "var(--icon-orange)", gradient: "linear-gradient(90deg, var(--icon-yellow), var(--icon-orange))" },
  { label: "Energy", score: 72, accent: "var(--icon-green)", gradient: "linear-gradient(90deg, var(--icon-lime), var(--icon-green))" },
  { label: "Rhythm", score: 66, accent: "var(--icon-teal)", gradient: "linear-gradient(90deg, var(--icon-green), var(--icon-teal))" },
]

/* ── Section 9 — EatoBiotics Foundation (dark) ──────────────────────── */
const FOUNDATION = [
  { number: "01", title: "Food System", accent: "var(--icon-lime)", gradient: "linear-gradient(90deg, var(--icon-lime), var(--icon-green))", body: "It starts with understanding how your Food System responds to food, habits, and daily life — the same philosophy at the heart of EatoBiotics." },
  { number: "02", title: "EatoBetics Score™", accent: "var(--icon-yellow)", gradient: "linear-gradient(90deg, var(--icon-yellow), var(--icon-orange))", body: "Your score translates everyday glucose patterns into a clear, single measure of how steadily your food system runs." },
  { number: "03", title: "Biotics Score™", accent: "var(--icon-teal)", gradient: "linear-gradient(90deg, var(--icon-teal), var(--icon-yellow))", body: "Your EatoBetics Score contributes to your overall Biotics Score™ — the core score at the heart of EatoBiotics." },
]

/* ── Section 10 — Part of EatoBiotics (real sibling programs) ───────── */
const FAMILY = [
  { number: "01", name: "EatoBetics", icon: Activity, tagline: "The Glucose System Inside You", status: "You're here", here: true, href: null, accent: "var(--icon-orange)", gradient: EB_GRADIENT },
  { number: "02", name: "Stability™", icon: Compass, tagline: "The Stability System Inside You", status: "Explore", here: false, href: "/stability", accent: "var(--icon-teal)", gradient: "linear-gradient(135deg, var(--icon-teal), var(--icon-green))" },
  { number: "03", name: "Performance", icon: Dumbbell, tagline: "The Performance System Inside You", status: "Explore", here: false, href: "/performance", accent: "var(--icon-yellow)", gradient: "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange))" },
  { number: "04", name: "You", icon: User, tagline: "The Food System Inside You", status: "Explore", here: false, href: "/you", accent: "var(--icon-green)", gradient: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))" },
]

export default function EatoBeticsPage() {
  return (
    <main className="overflow-hidden bg-white">
      {/* ── 1. HERO ── */}
      <EbHero />
      <div style={{ height: "2px", background: "linear-gradient(90deg, var(--icon-lime), var(--icon-green), var(--icon-teal), var(--icon-yellow), var(--icon-orange))" }} />

      {/* ── 2. THE PROBLEM (editorial) ── */}
      <section className="px-6 py-24 md:py-32">
        <div className="mx-auto max-w-[1200px]">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-20">
            <ScrollReveal>
              <p className="text-xs font-bold uppercase tracking-widest text-icon-orange">The Problem</p>
              <h2 className="mt-4 text-pretty font-serif text-3xl font-semibold text-foreground sm:text-4xl md:text-5xl">
                When your glucose is unstable,{" "}
                <span className="brand-gradient-text">everything feels harder.</span>
              </h2>
              <blockquote className="mt-8 border-l-2 pl-6 font-serif text-xl font-medium italic text-foreground" style={{ borderColor: "var(--icon-orange)" }}>
                &ldquo;Steady your glucose, and your whole day steadies with it.&rdquo;
              </blockquote>
            </ScrollReveal>
            <ScrollReveal delay={150}>
              <div className="rounded-3xl border border-border bg-secondary/40 p-8 md:p-10">
                <p className="text-base leading-relaxed text-muted-foreground">
                  Energy crashes, cravings, brain fog, low mood, and stubborn weight often trace back to one
                  thing: a glucose system that spikes and dips through the day.
                </p>
                <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                  Over time, those swings shape your long-term metabolic health too. Most people are never
                  shown what drives them. <span className="font-semibold text-foreground">EatoBetics helps reveal those patterns</span> — so you can
                  build steadier energy, fewer cravings, and better metabolic health.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* ── 3. THE 3 SYSTEMS OF EATOBETICS ── */}
      <section className="px-6 py-24 md:py-32">
        <div className="mx-auto max-w-[1200px]">
          <ScrollReveal className="max-w-2xl">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-icon-green">The Framework</p>
            <h2 className="font-serif text-4xl font-semibold text-foreground sm:text-5xl text-balance">
              The 3 Systems{" "}
              <span className="brand-gradient-text">of EatoBetics</span>
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              Three pillars that shape how steady, energised, and resilient your glucose system feels
              day to day — Stability, Energy, and Rhythm.
            </p>
          </ScrollReveal>

          <div className="mt-16 grid gap-6 md:grid-cols-3">
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

      {/* ── 4. ONE FOOD SYSTEM. BUILT ON GLUCOSE. ── */}
      <section className="px-6 py-24 md:py-32">
        <div className="mx-auto max-w-[1200px]">
          <div className="flex flex-col gap-16 lg:flex-row lg:items-center lg:gap-20">
            <div className="lg:w-[420px] lg:shrink-0">
              <ScrollReveal>
                <p className="text-xs font-semibold uppercase tracking-widest text-icon-orange">The Framework</p>
                <h2 className="mt-4 font-serif text-4xl font-semibold text-foreground sm:text-5xl text-balance">
                  One Food System.{" "}
                  <span className="brand-gradient-text">Built on glucose.</span>
                </h2>
                <p className="mt-6 text-base leading-relaxed text-muted-foreground">
                  Glucose stability is not one habit. It is the result of how Stability, Energy, and Rhythm
                  work together across your most-repeated meals.
                </p>
                <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                  Together, the three pillars shape your EatoBetics Score™ — which contributes to your overall
                  Biotics Score™, the core score of EatoBiotics.
                </p>
              </ScrollReveal>
              <ScrollReveal delay={150}>
                <Link href={ASSESSMENT_HREF} className="mt-8 inline-flex items-center gap-2 rounded-full border-2 border-icon-orange px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-icon-orange hover:text-white">
                  Add Glucose <ArrowUpRight size={14} />
                </Link>
              </ScrollReveal>
            </div>
            <div className="flex-1">
              <ScrollReveal delay={100}><EbFramework /></ScrollReveal>
              <ScrollReveal delay={200}>
                <p className="mt-4 text-center text-xs text-muted-foreground">
                  A connected system where each pillar supports the next — measured as one EatoBetics Score™.
                </p>
              </ScrollReveal>
            </div>
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* ── 5. WHY EATOBETICS ── */}
      <section className="bg-secondary/40 px-6 py-24 md:py-32">
        <div className="mx-auto max-w-[1200px]">
          <div className="grid gap-16 lg:grid-cols-2 lg:items-start lg:gap-24">
            <ScrollReveal>
              <p className="text-xs font-bold uppercase tracking-widest text-icon-orange">Why EatoBetics</p>
              <h2 className="mt-4 text-pretty font-serif text-3xl font-semibold text-foreground sm:text-4xl md:text-5xl">
                Most food apps count. EatoBetics understands.
              </h2>
              <p className="mt-6 text-base leading-relaxed text-muted-foreground">
                Most apps count calories or macros. EatoBetics focuses on your glucose system — how each meal
                affects your energy, cravings, and long-term metabolic health.
              </p>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                It isn&apos;t a restrictive diet. It helps you rebuild your most-repeated meals so they work
                better for your body — more fibre, better order, smarter timing.
              </p>
              <blockquote className="mt-8 border-l-2 pl-6 font-serif text-xl font-medium italic text-foreground" style={{ borderColor: "var(--icon-orange)" }}>
                &ldquo;You build in. You don&apos;t cut out.&rdquo;
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

      {/* ── 6. THREE WAYS TO USE EATOBETICS (pathways) ── */}
      <section className="px-6 py-24 md:py-32">
        <div className="mx-auto max-w-[1200px]">
          <ScrollReveal>
            <p className="text-xs font-bold uppercase tracking-widest text-icon-orange">Choose Your Path</p>
            <h2 className="mt-4 text-pretty font-serif text-4xl font-semibold text-foreground sm:text-5xl md:text-6xl">
              Three ways
              <br />
              <span className="brand-gradient-text">to use EatoBetics.</span>
            </h2>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground">
              Whether you&apos;re chasing steadier energy, getting ahead of your numbers, or making the most of
              a GLP-1 — it starts with one free assessment.
            </p>
          </ScrollReveal>

          <div className="mt-16 grid gap-6 md:grid-cols-3">
            {PATHWAYS.map((p, index) => (
              <ScrollReveal key={p.label} delay={index * 100}>
                <div className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-background p-7">
                  <div className="absolute top-0 left-0 right-0 h-1" style={{ background: p.gradient }} />
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl" style={{ background: `color-mix(in srgb, ${p.accent} 15%, transparent)` }}>
                      <p.icon size={22} style={{ color: p.accent }} />
                    </div>
                    <h3 className="font-serif text-xl font-semibold leading-snug text-foreground">{p.title}</h3>
                  </div>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {p.pillars.map((pl) => {
                      const sys = SYSTEMS.find((x) => x.title === pl)
                      return (
                        <span key={pl} className="rounded-full px-3 py-1 text-xs font-semibold text-white" style={{ background: `linear-gradient(135deg, ${sys?.gradientFrom}, ${sys?.gradientTo})` }}>{pl}</span>
                      )
                    })}
                  </div>
                  <p className="mt-5 flex-1 text-sm leading-relaxed text-muted-foreground">{p.copy}</p>
                  <div className="mt-6 space-y-3">
                    {p.glp1 && (
                      <Link href="/glucose/glp1" className="inline-flex items-center gap-1.5 text-sm font-semibold transition-opacity hover:opacity-75" style={{ color: p.accent }}>
                        Explore the GLP-1 Companion <ArrowUpRight size={14} />
                      </Link>
                    )}
                    <Link href={ASSESSMENT_HREF} className="brand-gradient flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90">
                      Start free assessment <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* ── 7. HOW EATOBETICS WORKS ── */}
      <section id="how-it-works" className="scroll-mt-24 bg-secondary/40 px-6 py-24 md:py-32">
        <div className="mx-auto max-w-[1200px]">
          <ScrollReveal>
            <p className="text-xs font-bold uppercase tracking-widest text-icon-orange">The Tool</p>
            <h2 className="mt-4 text-pretty font-serif text-4xl font-semibold text-foreground sm:text-5xl md:text-6xl">
              How EatoBetics
              <br />
              <span className="brand-gradient-text">works</span>
            </h2>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground">
              A simple loop that turns your everyday meals into a clear EatoBetics Score™ — and a 30-day plan
              to steady it.
            </p>
          </ScrollReveal>

          {/* 4-step flow */}
          <div className="mt-14">
            <ScrollReveal delay={100}>
              <div className="grid gap-8 sm:grid-cols-4 sm:gap-0">
                {FLOW.map((item, i) => (
                  <div key={item.step} className="flex items-start gap-3 sm:flex-col sm:gap-2">
                    <div className="flex items-center gap-3 sm:w-full">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white" style={{ background: EB_GRADIENT }}>{item.step}</div>
                      {i < FLOW.length - 1 && (
                        <div className="hidden h-px flex-1 sm:block" style={{ background: "linear-gradient(90deg, var(--icon-yellow), var(--icon-orange))", opacity: 0.3 }} />
                      )}
                    </div>
                    <div className="pt-0.5 sm:pt-3">
                      <item.icon size={20} style={{ color: "var(--icon-orange)" }} />
                      <p className="mt-2 text-sm font-semibold text-foreground">{item.label}</p>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollReveal>
          </div>

          {/* Mock report card */}
          <ScrollReveal delay={200}>
            <div className="mt-14 overflow-hidden rounded-3xl border border-border bg-background shadow-lg">
              <div className="flex items-center justify-between px-7 py-5" style={{ background: "color-mix(in srgb, var(--icon-orange) 6%, var(--background))" }}>
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: EB_GRADIENT }}>
                    <Gauge size={16} className="text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">EatoBetics Report</p>
                    <p className="text-xs text-muted-foreground">Stability · Energy · Rhythm</p>
                  </div>
                </div>
                <span className="rounded-full px-3 py-1 text-xs font-bold text-white" style={{ background: EB_GRADIENT }}>Example</span>
              </div>
              <div className="px-7 pb-7 pt-6">
                <div className="space-y-5">
                  {MOCK_PILLARS.map((item) => (
                    <div key={item.label}>
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-sm font-semibold text-foreground">{item.label}</span>
                        <span className="text-sm font-bold" style={{ color: item.accent }}>{item.score}/100</span>
                      </div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-secondary">
                        <div className="h-full rounded-full" style={{ width: `${item.score}%`, background: item.gradient }} />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-7 flex items-start gap-4 rounded-2xl p-5" style={{ background: "color-mix(in srgb, var(--icon-orange) 8%, transparent)", border: "1px solid color-mix(in srgb, var(--icon-orange) 25%, transparent)" }}>
                  <Sparkles size={18} style={{ color: "var(--icon-orange)", flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <p className="text-sm font-semibold text-foreground">Steady your stability first</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Energy and rhythm are working in your favour. The biggest opportunity is stability — a
                      little more fibre and protein on your most-repeated meals, plus eating vegetables first,
                      could steady your curve within weeks.
                    </p>
                  </div>
                </div>
                <p className="mt-5 text-center text-xs text-muted-foreground/60">An illustrative example — your own EatoBetics Score is built from your free assessment.</p>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <div className="section-divider" />

      {/* ── 8. YOUR EATOBETICS SCORE™ ── */}
      <section className="px-6 py-24 md:py-32">
        <div className="mx-auto max-w-[1100px]">
          <ScrollReveal className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-icon-orange">The Score</p>
            <h2 className="mt-4 font-serif text-4xl font-semibold text-foreground sm:text-5xl text-balance">Your EatoBetics Score™</h2>
            <p className="mt-6 text-base leading-relaxed text-muted-foreground">
              A single score designed to measure how steadily your glucose system runs, day to day.
            </p>
            <p className="mt-3 font-semibold text-foreground">Your EatoBetics Score™ contributes to your overall Biotics Score™.</p>
          </ScrollReveal>
          <div className="mt-16">
            <EbScoreShowcase />
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
              <span className="brand-gradient-text">The foundation EatoBetics is built on.</span>
            </h2>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-background/70">
              EatoBetics is the metabolic expression of EatoBiotics — The Food System Inside You. It measures
              how steadily your glucose system runs, and contributes to your overall Biotics Score™.
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
        </div>
      </section>

      <div className="section-divider" />

      {/* ── 10. PART OF EATOBIOTICS (family) ── */}
      <section className="bg-secondary/40 px-6 py-24 md:py-32">
        <div className="mx-auto max-w-[1200px]">
          <ScrollReveal>
            <p className="text-xs font-bold uppercase tracking-widest text-icon-orange">The Ecosystem</p>
            <h2 className="mt-4 text-pretty font-serif text-4xl font-semibold text-foreground sm:text-5xl md:text-6xl">
              Part of
              <br />
              <span className="brand-gradient-text">EatoBiotics.</span>
            </h2>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground">
              EatoBetics is one expression of EatoBiotics — the food system inside you. Each program is a new
              way to understand and steady it.
            </p>
          </ScrollReveal>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {FAMILY.map((sys, index) => {
              const Card = (
                <div className="group relative flex h-full flex-col overflow-hidden rounded-2xl border bg-background p-6 transition-all hover:shadow-lg" style={{ borderColor: sys.here ? `color-mix(in srgb, ${sys.accent} 45%, transparent)` : "var(--border)" }}>
                  <div className="absolute top-0 left-0 right-0 h-1" style={{ background: sys.gradient }} />
                  <div className="flex items-start justify-between">
                    <span className="font-serif text-5xl font-bold" style={{ color: sys.accent }}>{sys.number}</span>
                    <span className="mt-1 rounded-full px-2.5 py-1 text-xs font-semibold text-white" style={{ background: sys.gradient }}>{sys.status}</span>
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                    <sys.icon size={18} style={{ color: sys.accent }} />
                    <h3 className="font-serif text-xl font-semibold text-foreground">{sys.name}</h3>
                  </div>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{sys.tagline}</p>
                  {!sys.here && (
                    <span className="mt-5 flex items-center gap-1 text-sm font-semibold opacity-70 transition-opacity group-hover:opacity-100" style={{ color: sys.accent }}>
                      Explore <ArrowUpRight size={14} />
                    </span>
                  )}
                </div>
              )
              return (
                <ScrollReveal key={sys.number} delay={index * 100}>
                  {sys.href ? <Link href={sys.href} className="block h-full">{Card}</Link> : Card}
                </ScrollReveal>
              )
            })}
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
                <p className="text-xs font-bold uppercase tracking-widest text-icon-orange">EatoBetics</p>
                <h2 className="mt-4 text-balance font-serif text-4xl font-semibold text-foreground sm:text-5xl">
                  Meet the <span className="brand-gradient-text">glucose system inside you.</span>
                </h2>
                <p className="mx-auto mt-6 max-w-lg text-base leading-relaxed text-muted-foreground">
                  Take the free EatoBetics Assessment and begin building steadier energy, fewer cravings, and
                  better metabolic health — in 30 days.
                </p>
              </ScrollReveal>
              <ScrollReveal delay={150}>
                <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                  <Link href={ASSESSMENT_HREF} className="brand-gradient inline-flex items-center gap-2 rounded-full px-8 py-4 text-base font-semibold text-white shadow-lg shadow-icon-green/20 transition-all hover:opacity-90 hover:shadow-xl">
                    Start Glucose Assessment <ArrowRight size={16} />
                  </Link>
                  <Link href="/glucose/glp1" className="inline-flex items-center gap-2 rounded-full border border-border px-8 py-4 text-base font-semibold text-foreground transition-all hover:border-icon-orange hover:text-icon-orange">
                    Explore the GLP-1 Companion
                  </Link>
                </div>
                <p className="mt-4 text-sm text-muted-foreground">Free to start. No card needed. Takes about 3 minutes.</p>
              </ScrollReveal>
            </div>
          </div>
        </div>
      </section>

      {/* ── Medical disclaimer (clean, de-emphasized) ── */}
      <section className="px-6 py-12" style={{ background: "#f7f7f5" }}>
        <div className="mx-auto flex max-w-3xl items-start gap-3">
          <ShieldCheck size={18} className="mt-0.5 shrink-0" style={{ color: "var(--muted-foreground)" }} />
          <p className="text-xs leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
            EatoBetics is an educational food intelligence platform. It does not diagnose, treat, cure, or prevent diabetes or any medical condition. The information provided is for general education and lifestyle support only. Always consult a qualified healthcare professional for medical advice, diagnosis, testing, or treatment, especially if you have diabetes, prediabetes, use medication, or have concerns about your blood glucose.
          </p>
        </div>
      </section>
    </main>
  )
}
