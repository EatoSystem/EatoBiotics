import type { Metadata } from "next"
import Link from "next/link"
import {
  Leaf, Droplets, Sparkles, Zap, ShieldCheck, Smile, HeartPulse,
  ClipboardList, BookOpen, UtensilsCrossed, Activity, ArrowRight, ArrowUpRight,
  Calculator, Salad, Pill, LineChart, Gauge, User, Compass, Users, Brain, Dumbbell,
} from "lucide-react"
import { ScrollReveal } from "@/components/scroll-reveal"
import { SystemDisclaimer } from "@/components/systems/system-disclaimer"
import { GLOBAL_DISCLAIMER } from "@/lib/assessment-disclaimers"
import { YouHero } from "@/components/you/you-hero"
import { YouFramework } from "@/components/you/YouFramework"
import { YouScoreShowcase } from "@/components/you/YouScoreShowcase"

export const metadata: Metadata = {
  title: { absolute: "The Food System Inside You | EatoBiotics" },
  description:
    "Your gut is home to 100 trillion microbes — a living system shaped by many things, what you eat among them. Learn how to build the food system inside you.",
  openGraph: {
    title: "The Food System Inside You | EatoBiotics",
    description:
      "Your gut is home to 100 trillion microbes — a living system shaped by many things, what you eat among them. Learn how to build the food system inside you.",
  },
}

const ASSESSMENT_HREF = "/assessment"
const YOU_GRADIENT = "linear-gradient(135deg, var(--icon-green), var(--icon-teal))"

/* ── Section 3 — The 3 Biotics (the EatoBiotics Score pillars) ──────── */
const BIOTICS = [
  {
    number: "01", title: "Prebiotics", label: "FEED", icon: Leaf,
    accent: "var(--icon-lime)", gradientFrom: "var(--icon-lime)", gradientTo: "var(--icon-green)",
    description: "The fibres and plant compounds in everyday foods that nourish your beneficial gut bacteria — the fuel the whole system runs on.",
    support: "Garlic · Oats · Bananas · Legumes",
  },
  {
    number: "02", title: "Probiotics", label: "ADD", icon: Droplets,
    accent: "var(--icon-teal)", gradientFrom: "var(--icon-green)", gradientTo: "var(--icon-teal)",
    description: "Living bacteria and yeasts from fermented foods that replenish and diversify the microbial community in your gut.",
    support: "Yogurt · Kefir · Kimchi · Miso",
  },
  {
    number: "03", title: "Postbiotics", label: "PRODUCE", icon: Sparkles,
    accent: "var(--icon-orange)", gradientFrom: "var(--icon-yellow)", gradientTo: "var(--icon-orange)",
    description: "The compounds your gut bacteria produce when you feed them well — short-chain fatty acids that power immunity, calm inflammation, and shape how you feel.",
    support: "Butyrate · SCFAs · B12 · Serotonin",
  },
]

/* ── Section 5 — Why EatoBiotics (contrast cards) ───────────────────── */
const CONTRASTS = [
  { icon: Calculator, old: "Instead of counting calories", neu: "Feed the system inside you.", accent: "var(--icon-lime)" },
  { icon: Salad, old: "Instead of cutting foods out", neu: "Build better foods in.", accent: "var(--icon-green)" },
  { icon: Pill, old: "Instead of expensive supplements", neu: "Real, everyday foods.", accent: "var(--icon-teal)" },
  { icon: LineChart, old: "Instead of generic advice", neu: "Your own EatoBiotics Score.", accent: "var(--icon-orange)" },
]

/* ── Section 6 — What your food system shapes ───────────────────────── */
const SHAPES = [
  { title: "Energy", stat: "All day", icon: Zap, accent: "var(--icon-lime)", gradient: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))", description: "A well-fed microbiome means steadier energy and fewer crashes — the daily feeling of a balanced food system." },
  { title: "Immunity", stat: "70%", icon: ShieldCheck, accent: "var(--icon-green)", gradient: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))", description: "70% of your immune system lives in your gut. What you feed it shapes how well it protects you — every day." },
  { title: "Mood", stat: "95%", icon: Smile, accent: "var(--icon-teal)", gradient: "linear-gradient(135deg, var(--icon-teal), var(--icon-yellow))", description: "95% of your serotonin is made in your gut, not your brain. Food is mood — directly and measurably." },
  { title: "Longevity", stat: "Decades", icon: HeartPulse, accent: "var(--icon-orange)", gradient: "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange))", description: "Gut diversity is one of the strongest predictors of long-term health. The habits you build now compound for decades." },
]

/* ── Section 7 — How it works (flow + mock card) ────────────────────── */
const FLOW = [
  { step: "01", icon: ClipboardList, label: "Assess", detail: "Take the free 15-question assessment and get your EatoBiotics Score across the three biotics." },
  { step: "02", icon: BookOpen, label: "Learn", detail: "See which biotics you're already getting and where the gaps are — exactly which foods to add first." },
  { step: "03", icon: UtensilsCrossed, label: "Build", detail: "Use the EatoBiotics Plate to design meals that hit all three biotics, adapted to your tastes." },
  { step: "04", icon: Activity, label: "Track", detail: "Log your plate weekly and watch your score compound — better habits, better health, week after week." },
]

const MOCK_BIOTICS = [
  { label: "Prebiotics", score: 74, accent: "var(--icon-lime)", gradient: "linear-gradient(90deg, var(--icon-lime), var(--icon-green))" },
  { label: "Probiotics", score: 62, accent: "var(--icon-teal)", gradient: "linear-gradient(90deg, var(--icon-green), var(--icon-teal))" },
  { label: "Postbiotics", score: 78, accent: "var(--icon-orange)", gradient: "linear-gradient(90deg, var(--icon-yellow), var(--icon-orange))" },
]

/* ── Section 9 — The EatoBiotics Plate (dark) ───────────────────────── */
const PLATE = [
  { biotic: "PREBIOTIC", title: "Fibre Foundation", accent: "var(--icon-lime)", gradient: "linear-gradient(90deg, var(--icon-lime), var(--icon-green))", examples: ["Leafy greens", "Legumes", "Root veg", "Whole grains"] },
  { biotic: "PROBIOTIC", title: "Fermented Foods", accent: "var(--icon-green)", gradient: "linear-gradient(90deg, var(--icon-green), var(--icon-teal))", examples: ["Yogurt", "Kefir", "Kimchi", "Sauerkraut"] },
  { biotic: "PROTEIN", title: "Quality Protein", accent: "var(--icon-teal)", gradient: "linear-gradient(90deg, var(--icon-teal), var(--icon-yellow))", examples: ["Eggs", "Salmon", "Beans", "Chicken"] },
  { biotic: "POSTBIOTIC", title: "Healthy Fats", accent: "var(--icon-orange)", gradient: "linear-gradient(90deg, var(--icon-yellow), var(--icon-orange))", examples: ["Olive oil", "Avocado", "Nuts", "Seeds"] },
]

/* ── Section 10 — The EatoBiotics System (ecosystem hub) ────────────── */
const PROGRAMS = [
  { name: "You", icon: User, tagline: "The Food System Inside You", status: "You're here", here: true, href: null, accent: "var(--icon-green)", gradient: YOU_GRADIENT },
  { name: "Stability™", icon: Compass, tagline: "The Stability System Inside You", status: "Explore", here: false, href: "/stability", accent: "var(--icon-teal)", gradient: "linear-gradient(135deg, var(--icon-teal), var(--icon-green))" },
  { name: "Glucose", icon: Activity, tagline: "The Glucose System Inside You", status: "Explore", here: false, href: "/glucose", accent: "var(--icon-orange)", gradient: "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange))" },
  { name: "Family", icon: Users, tagline: "The Food System Inside Your Family", status: "Explore", here: false, href: "/family", accent: "var(--icon-lime)", gradient: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))" },
  { name: "Mind", icon: Brain, tagline: "The Food System Inside Your Mind", status: "Explore", here: false, href: "/mind", accent: "var(--icon-teal)", gradient: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))" },
  { name: "Sports", icon: Dumbbell, tagline: "The Performance System Inside You", status: "Explore", here: false, href: "/performance", accent: "var(--icon-yellow)", gradient: "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange))" },
]

export default function YouPage() {
  return (
    <main className="overflow-hidden bg-white">
      {/* ── 1. HERO ── */}
      <YouHero />
      <div style={{ height: "2px", background: "linear-gradient(90deg, var(--icon-lime), var(--icon-green), var(--icon-teal), var(--icon-yellow), var(--icon-orange))" }} />

      {/* ── 2. THE PROBLEM (editorial) ── */}
      <section className="px-6 py-24 md:py-32">
        <div className="mx-auto max-w-[1200px]">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-20">
            <ScrollReveal>
              <p className="text-xs font-bold uppercase tracking-widest text-icon-green">The Problem</p>
              <h2 className="mt-4 text-pretty font-serif text-3xl font-semibold text-foreground sm:text-4xl md:text-5xl">
                You can&apos;t see your gut —{" "}
                <span className="brand-gradient-text">but you feel it every day.</span>
              </h2>
              <blockquote className="mt-8 border-l-2 pl-6 font-serif text-xl font-medium italic text-foreground" style={{ borderColor: "var(--icon-green)" }}>
                &ldquo;What lives inside you shapes everything — energy, immunity, mood, and how you age.&rdquo;
              </blockquote>
            </ScrollReveal>
            <ScrollReveal delay={150}>
              <div className="rounded-3xl border border-border bg-secondary/40 p-8 md:p-10">
                <p className="text-base leading-relaxed text-muted-foreground">
                  Inside your gut is a thriving ecosystem of 100 trillion microbes — a second genome,
                  shaped by every meal you eat. Most of us were never taught how it actually works.
                </p>
                <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                  How you feed it is associated with how you feel day to day — energy, digestion, mood.{" "}
                  <span className="font-semibold text-foreground">EatoBiotics helps you understand and build it</span> — one meal at a time.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* ── 3. THE 3 BIOTICS ── */}
      <section className="px-6 py-24 md:py-32">
        <div className="mx-auto max-w-[1200px]">
          <ScrollReveal className="max-w-2xl">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-icon-green">The Framework</p>
            <h2 className="font-serif text-4xl font-semibold text-foreground sm:text-5xl text-balance">
              Three things your gut{" "}
              <span className="brand-gradient-text">needs every day</span>
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              The 3 Biotics are the foundation of gut health — and the three pillars of your EatoBiotics
              Score. Feed the system, add to it, and let it produce.
            </p>
          </ScrollReveal>

          <div className="mt-16 grid gap-6 md:grid-cols-3">
            {BIOTICS.map((sys, index) => {
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
                    {index < BIOTICS.length - 1 && (
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

      {/* ── 4. ONE FOOD SYSTEM. FEED. ADD. PRODUCE. ── */}
      <section className="px-6 py-24 md:py-32">
        <div className="mx-auto max-w-[1200px]">
          <div className="flex flex-col gap-16 lg:flex-row lg:items-center lg:gap-20">
            <div className="lg:w-[420px] lg:shrink-0">
              <ScrollReveal>
                <p className="text-xs font-semibold uppercase tracking-widest text-icon-green">The Framework</p>
                <h2 className="mt-4 font-serif text-4xl font-semibold text-foreground sm:text-5xl text-balance">
                  Feed. Add. Produce.{" "}
                  <span className="brand-gradient-text">One connected system.</span>
                </h2>
                <p className="mt-6 text-base leading-relaxed text-muted-foreground">
                  The three biotics aren&apos;t separate habits — they&apos;re one loop. You feed your bacteria,
                  you add to them, and they produce the compounds that make you feel good.
                </p>
                <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                  Together they shape your Biotics Score™ — one clear number, built from the habits you
                  report.
                </p>
              </ScrollReveal>
              <ScrollReveal delay={150}>
                <Link href={ASSESSMENT_HREF} className="mt-8 inline-flex items-center gap-2 rounded-full border-2 border-icon-green px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-icon-green hover:text-white">
                  Get my Biotics Score <ArrowUpRight size={14} />
                </Link>
              </ScrollReveal>
            </div>
            <div className="flex-1">
              <ScrollReveal delay={100}><YouFramework /></ScrollReveal>
              <ScrollReveal delay={200}>
                <p className="mt-4 text-center text-xs text-muted-foreground">
                  A connected system where each biotic supports the next — measured as one Biotics Score™.
                </p>
              </ScrollReveal>
            </div>
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* ── 5. WHY EATOBIOTICS ── */}
      <section className="bg-secondary/40 px-6 py-24 md:py-32">
        <div className="mx-auto max-w-[1200px]">
          <div className="grid gap-16 lg:grid-cols-2 lg:items-start lg:gap-24">
            <ScrollReveal>
              <p className="text-xs font-bold uppercase tracking-widest text-icon-green">Why EatoBiotics</p>
              <h2 className="mt-4 text-pretty font-serif text-3xl font-semibold text-foreground sm:text-4xl md:text-5xl">
                Food is the most powerful tool you have.
              </h2>
              <p className="mt-6 text-base leading-relaxed text-muted-foreground">
                Not a diet. Not a supplement shelf. EatoBiotics approaches food as a system — and gives you a
                clear way to understand how every meal feeds the life inside you.
              </p>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                You don&apos;t overhaul everything overnight. You build better foods in, one meal at a time.
              </p>
              <blockquote className="mt-8 border-l-2 pl-6 font-serif text-xl font-medium italic text-foreground" style={{ borderColor: "var(--icon-green)" }}>
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

      {/* ── 6. WHAT YOUR FOOD SYSTEM SHAPES ── */}
      <section className="px-6 py-24 md:py-32">
        <div className="mx-auto max-w-[1200px]">
          <ScrollReveal>
            <p className="text-xs font-bold uppercase tracking-widest text-icon-green">Why It Matters</p>
            <h2 className="mt-4 text-pretty font-serif text-4xl font-semibold text-foreground sm:text-5xl md:text-6xl">
              What lives inside you
              <br />
              <span className="brand-gradient-text">shapes everything.</span>
            </h2>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground">
              Your microbiome is one of the systems most closely associated with how you feel day to
              day — energy, digestion, mood — and what you eat is one of the things that shapes it.
            </p>
          </ScrollReveal>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {SHAPES.map((s, index) => (
              <ScrollReveal key={s.title} delay={index * 100}>
                <div className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-background p-7">
                  <div className="absolute top-0 left-0 right-0 h-1" style={{ background: s.gradient }} />
                  <div className="flex items-center justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl" style={{ background: `color-mix(in srgb, ${s.accent} 15%, transparent)` }}>
                      <s.icon size={22} style={{ color: s.accent }} />
                    </div>
                    <span className="font-serif text-2xl font-bold" style={{ color: s.accent }}>{s.stat}</span>
                  </div>
                  <h3 className="mt-5 font-serif text-xl font-semibold text-foreground">{s.title}</h3>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">{s.description}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* ── 7. HOW IT WORKS ── */}
      <section id="how-it-works" className="scroll-mt-24 bg-secondary/40 px-6 py-24 md:py-32">
        <div className="mx-auto max-w-[1200px]">
          <ScrollReveal>
            <p className="text-xs font-bold uppercase tracking-widest text-icon-green">The Tool</p>
            <h2 className="mt-4 text-pretty font-serif text-4xl font-semibold text-foreground sm:text-5xl md:text-6xl">
              Your personal food system
              <br />
              <span className="brand-gradient-text">in four steps.</span>
            </h2>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground">
              From your first assessment to a weekly routine you can actually stick to — here&apos;s how
              EatoBiotics works for you.
            </p>
          </ScrollReveal>

          {/* 4-step flow */}
          <div className="mt-14">
            <ScrollReveal delay={100}>
              <div className="grid gap-8 sm:grid-cols-4 sm:gap-0">
                {FLOW.map((item, i) => (
                  <div key={item.step} className="flex items-start gap-3 sm:flex-col sm:gap-2">
                    <div className="flex items-center gap-3 sm:w-full">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white" style={{ background: YOU_GRADIENT }}>{item.step}</div>
                      {i < FLOW.length - 1 && (
                        <div className="hidden h-px flex-1 sm:block" style={{ background: "linear-gradient(90deg, var(--icon-green), var(--icon-teal))", opacity: 0.3 }} />
                      )}
                    </div>
                    <div className="pt-0.5 sm:pt-3">
                      <item.icon size={20} style={{ color: "var(--icon-green)" }} />
                      <p className="mt-2 text-sm font-semibold text-foreground">{item.label}</p>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollReveal>
          </div>

          {/* Mock score card */}
          <ScrollReveal delay={200}>
            <div className="mt-14 overflow-hidden rounded-3xl border border-border bg-background shadow-lg">
              <div className="flex items-center justify-between px-7 py-5" style={{ background: "color-mix(in srgb, var(--icon-green) 6%, var(--background))" }}>
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: YOU_GRADIENT }}>
                    <Gauge size={16} className="text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">EatoBiotics Score</p>
                    <p className="text-xs text-muted-foreground">Prebiotics · Probiotics · Postbiotics</p>
                  </div>
                </div>
                <span className="rounded-full px-3 py-1 text-xs font-bold text-white" style={{ background: YOU_GRADIENT }}>Example</span>
              </div>
              <div className="px-7 pb-7 pt-6">
                <div className="space-y-5">
                  {MOCK_BIOTICS.map((item) => (
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
                <div className="mt-7 flex items-start gap-4 rounded-2xl p-5" style={{ background: "color-mix(in srgb, var(--icon-green) 8%, transparent)", border: "1px solid color-mix(in srgb, var(--icon-green) 25%, transparent)" }}>
                  <Sparkles size={18} style={{ color: "var(--icon-green)", flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <p className="text-sm font-semibold text-foreground">Add one fermented food</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Probiotics is your biggest opportunity. A daily serving of yogurt, kefir, or kimchi
                      would meaningfully diversify your microbiome — and lift your whole score.
                    </p>
                  </div>
                </div>
                <p className="mt-5 text-center text-xs text-muted-foreground/60">An illustrative example — your own EatoBiotics Score comes from the free assessment.</p>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <div className="section-divider" />

      {/* ── 8. YOUR EATOBIOTICS SCORE™ ── */}
      <section className="px-6 py-24 md:py-32">
        <div className="mx-auto max-w-[1100px]">
          <ScrollReveal className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-icon-green">The Score</p>
            <h2 className="mt-4 font-serif text-4xl font-semibold text-foreground sm:text-5xl text-balance">Your EatoBiotics Score™</h2>
            <p className="mt-6 text-base leading-relaxed text-muted-foreground">
              A single score for how well-fed your food system is — built from your intake across the three
              biotics.
            </p>
            <p className="mt-3 font-semibold text-foreground">Your EatoBiotics Score™ is your Biotics Score™ — the measure at the heart of EatoBiotics.</p>
          </ScrollReveal>
          <div className="mt-16">
            <YouScoreShowcase />
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* ── 9. THE EATOBIOTICS PLATE (dark) ── */}
      <section className="bg-foreground px-6 py-24 md:py-32">
        <div className="mx-auto max-w-[1200px]">
          <ScrollReveal>
            <p className="text-xs font-bold uppercase tracking-widest text-icon-lime">The Plate</p>
            <h2 className="mt-4 text-pretty font-serif text-4xl font-semibold text-background sm:text-5xl md:text-6xl">
              One plate.
              <br />
              <span className="brand-gradient-text">Every biotic.</span>
            </h2>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-background/70">
              The EatoBiotics Plate is your template for gut-healthy eating — four quadrants designed so you
              hit all three biotics in every meal. One template, infinite meals.
            </p>
          </ScrollReveal>
          <ScrollReveal delay={150}>
            <Link href="/biotics" className="mt-8 inline-flex items-center gap-2 rounded-full border-2 border-icon-lime px-6 py-3 text-sm font-semibold text-background transition-colors hover:bg-icon-lime hover:text-foreground">
              Explore the framework <ArrowUpRight size={14} />
            </Link>
          </ScrollReveal>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {PLATE.map((q, index) => (
              <ScrollReveal key={q.title} delay={index * 100}>
                <div className="relative flex flex-col overflow-hidden rounded-2xl p-7" style={{ background: `color-mix(in srgb, ${q.accent} 8%, var(--foreground))`, border: `1px solid color-mix(in srgb, ${q.accent} 25%, transparent)` }}>
                  <div className="absolute top-0 left-0 right-0 h-1" style={{ background: q.gradient }} />
                  <p className="text-xs font-bold uppercase tracking-widest" style={{ color: q.accent }}>{q.biotic}</p>
                  <h3 className="mt-2 font-serif text-lg font-semibold text-background">{q.title}</h3>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {q.examples.map((ex) => (
                      <span key={ex} className="rounded-full px-3 py-1 text-xs font-semibold" style={{ background: `color-mix(in srgb, ${q.accent} 18%, transparent)`, color: q.accent }}>{ex}</span>
                    ))}
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
          <ScrollReveal delay={200}>
            <p className="mt-10 text-center text-sm text-background/50">One template. Infinite meals. Always gut-healthy.</p>
          </ScrollReveal>
        </div>
      </section>

      <div className="section-divider" />

      {/* ── 10. THE EATOBIOTICS SYSTEM (ecosystem hub) ── */}
      <section className="bg-secondary/40 px-6 py-24 md:py-32">
        <div className="mx-auto max-w-[1200px]">
          <ScrollReveal>
            <p className="text-xs font-bold uppercase tracking-widest text-icon-green">The Ecosystem</p>
            <h2 className="mt-4 text-pretty font-serif text-4xl font-semibold text-foreground sm:text-5xl md:text-6xl">
              One philosophy.
              <br />
              <span className="brand-gradient-text">Many systems.</span>
            </h2>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground">
              The Food System Inside You is the core. Each program applies it to a different part of your
              life — all built on the same three biotics.
            </p>
          </ScrollReveal>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {PROGRAMS.map((sys, index) => {
              const Card = (
                <div className="group relative flex h-full flex-col overflow-hidden rounded-2xl border bg-background p-6 transition-all hover:shadow-lg" style={{ borderColor: sys.here ? `color-mix(in srgb, ${sys.accent} 45%, transparent)` : "var(--border)" }}>
                  <div className="absolute top-0 left-0 right-0 h-1" style={{ background: sys.gradient }} />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: `color-mix(in srgb, ${sys.accent} 15%, transparent)` }}>
                        <sys.icon size={20} style={{ color: sys.accent }} />
                      </div>
                      <h3 className="font-serif text-xl font-semibold text-foreground">{sys.name}</h3>
                    </div>
                    <span className="rounded-full px-2.5 py-1 text-xs font-semibold text-white" style={{ background: sys.gradient }}>{sys.status}</span>
                  </div>
                  <p className="mt-4 flex-1 text-sm leading-relaxed text-muted-foreground">{sys.tagline}</p>
                  {!sys.here && (
                    <span className="mt-4 flex items-center gap-1 text-sm font-semibold opacity-70 transition-opacity group-hover:opacity-100" style={{ color: sys.accent }}>
                      Explore <ArrowUpRight size={14} />
                    </span>
                  )}
                </div>
              )
              return (
                <ScrollReveal key={sys.name} delay={index * 80}>
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
                <p className="text-xs font-bold uppercase tracking-widest text-icon-green">EatoBiotics</p>
                <h2 className="mt-4 text-balance font-serif text-4xl font-semibold text-foreground sm:text-5xl">
                  Build the food system <span className="brand-gradient-text">inside you.</span>
                </h2>
                <p className="mx-auto mt-6 max-w-lg text-base leading-relaxed text-muted-foreground">
                  Take the free assessment, get your EatoBiotics Score, and start building the habits
                  that support your gut microbiome.
                </p>
              </ScrollReveal>
              <ScrollReveal delay={150}>
                <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                  <Link href={ASSESSMENT_HREF} className="brand-gradient inline-flex items-center gap-2 rounded-full px-8 py-4 text-base font-semibold text-white shadow-lg shadow-icon-green/20 transition-all hover:opacity-90 hover:shadow-xl">
                    Start Free Assessment <ArrowRight size={16} />
                  </Link>
                  <Link href="/biotics" className="inline-flex items-center gap-2 rounded-full border border-border px-8 py-4 text-base font-semibold text-foreground transition-all hover:border-icon-green hover:text-icon-green">
                    Explore the framework
                  </Link>
                </div>
                <p className="mt-4 text-sm text-muted-foreground">Free to start. No card needed. Takes about 3 minutes.</p>
              </ScrollReveal>
            </div>
          </div>
        </div>
      </section>

      {/* ── Medical disclaimer — last section, as on the glucose pages ── */}
      <SystemDisclaimer level="standard" note={GLOBAL_DISCLAIMER} />
    </main>
  )
}
