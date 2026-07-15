import type { Metadata } from "next"
import Link from "next/link"
import {
  Leaf, Wheat, FlaskConical, Timer, Brain, Smartphone, Sprout, LineChart,
  CloudRain, Zap, RefreshCw, Target, MessageSquare, BarChart2, Mail, UtensilsCrossed,
  Smile, Wind, Activity, ArrowRight, ArrowUpRight, Sparkles, User, Compass, Gauge,
} from "lucide-react"
import { ScrollReveal } from "@/components/scroll-reveal"
import { MindHero } from "@/components/mind/MindHero"
import { MindFramework } from "@/components/mind/MindFramework"
import { MindScoreShowcase } from "@/components/mind/MindScoreShowcase"

export const metadata: Metadata = {
  title: { absolute: "The Food System Inside Your Mind | EatoBiotics" },
  description:
    "Your gut produces 90–95% of your body's serotonin. Learn how the microbiome-brain axis works and how what you eat shapes your mood, focus, and mental clarity.",
  openGraph: {
    title: "The Food System Inside Your Mind — EatoBiotics",
    description:
      "The science behind how your gut talks to your brain — and how food changes the conversation.",
  },
}

const ASSESSMENT_HREF = "/assessment/add/mind"
const MIND_GRADIENT = "linear-gradient(135deg, var(--icon-green), var(--icon-teal))"

/* ── Section 3 — The 5 Pillars of your Mind Score ───────────────────── */
const PILLARS = [
  { title: "Brain Nutrition", icon: Leaf, accent: "var(--icon-lime)", description: "How varied your plant polyphenol intake is each week." },
  { title: "Brain Fuel", icon: Wheat, accent: "var(--icon-green)", description: "How often you eat fibre-rich whole foods that feed serotonin-producing bacteria." },
  { title: "Live Mind Foods", icon: FlaskConical, accent: "var(--icon-teal)", description: "How regularly you include fermented foods linked to mood and focus." },
  { title: "Mind Rhythm", icon: Timer, accent: "var(--icon-yellow)", description: "How stable your eating patterns are for circadian gut health." },
  { title: "Mind Response", icon: Brain, accent: "var(--icon-orange)", description: "How your mind responds — clarity, mood stability, afternoon focus." },
]

/* ── Section 5 — Why EatoBiotics for the mind (contrast cards) ───────── */
const CONTRASTS = [
  { icon: Brain, old: "Instead of treating mood as all-in-your-head", neu: "Start with the gut.", accent: "var(--icon-teal)" },
  { icon: Smartphone, old: "Instead of another screen-time hack", neu: "Feed the gut-brain axis.", accent: "var(--icon-green)" },
  { icon: Sprout, old: "Instead of generic “eat healthy”", neu: "Foods that build serotonin & GABA.", accent: "var(--icon-lime)" },
  { icon: LineChart, old: "Instead of guessing", neu: "Your own Mind Score.", accent: "var(--icon-orange)" },
]

/* ── Section 6 — The gut connection in common conditions ────────────── */
const CONDITIONS = [
  {
    name: "Depression", icon: CloudRain, href: "/depression",
    color: "var(--icon-teal)", gradient: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))",
    gutLink: "People with depression show reduced microbial diversity — particularly lower Lactobacillus and Bifidobacterium, the bacteria most associated with serotonin and GABA production.",
    foodAngle: "Fermented foods, diverse plants, and prebiotic fibre directly increase the bacterial populations depleted in depression.",
  },
  {
    name: "Anxiety", icon: Zap, href: "/anxiety",
    color: "var(--icon-yellow)", gradient: "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange))",
    gutLink: "The gut produces GABA — the brain's primary calming neurotransmitter. Anxiety consistently shows reduced vagal tone and elevated intestinal permeability.",
    foodAngle: "Foods that restore the gut barrier, increase GABA-producing bacteria, and reduce inflammation each address a different driver of anxiety.",
  },
  {
    name: "Bipolar Disorder", icon: RefreshCw, href: "/bipolar",
    color: "var(--icon-lime)", gradient: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))",
    gutLink: "People with bipolar disorder show a distinct gut signature — lower diversity, elevated inflammation, and disrupted circadian rhythm in gut bacterial activity.",
    foodAngle: "Bipolar needs medical management, but gut health is a modifiable factor: consistent meal timing, fibre, and fermented foods support the circadian gut rhythm mood stability depends on.",
  },
  {
    name: "ADHD & Focus", icon: Target, href: "/adhd",
    color: "var(--icon-orange)", gradient: "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange))",
    gutLink: "ADHD is associated with lower short-chain fatty acid-producing bacteria and disruption to the dopamine-serotonin balance the gut-brain axis regulates.",
    foodAngle: "Omega-3 rich foods, polyphenol-rich plants, and fermented foods support the bacterial and inflammatory pathways most disrupted in ADHD.",
  },
]

/* ── Section 7 — How it works (flow + mock card) ────────────────────── */
const FLOW = [
  { step: "01", icon: MessageSquare, label: "Assess", detail: "Answer 15 honest questions about how you actually eat — framed for the gut-brain connection." },
  { step: "02", icon: BarChart2, label: "Score", detail: "Get your Mind Score across five pillars, with exactly where your habits help and where the gaps are." },
  { step: "03", icon: Mail, label: "Plan", detail: "Receive your mind profile and a personalised brain food plan, delivered to your inbox." },
  { step: "04", icon: UtensilsCrossed, label: "Build", detail: "Add the brain foods that close your biggest gaps — and watch your clarity and mood steady." },
]

const MOCK_PILLARS = [
  { label: "Brain Nutrition", score: 72, accent: "var(--icon-lime)", gradient: "linear-gradient(90deg, var(--icon-lime), var(--icon-green))" },
  { label: "Brain Fuel", score: 64, accent: "var(--icon-green)", gradient: "linear-gradient(90deg, var(--icon-lime), var(--icon-green))" },
  { label: "Live Mind Foods", score: 58, accent: "var(--icon-teal)", gradient: "linear-gradient(90deg, var(--icon-green), var(--icon-teal))" },
  { label: "Mind Rhythm", score: 70, accent: "var(--icon-yellow)", gradient: "linear-gradient(90deg, var(--icon-yellow), var(--icon-orange))" },
  { label: "Mind Response", score: 76, accent: "var(--icon-orange)", gradient: "linear-gradient(90deg, var(--icon-yellow), var(--icon-orange))" },
]

/* ── Section 9 — The gut-brain axis (dark foundation) ───────────────── */
const AXIS = [
  { number: "01", title: "Serotonin", icon: Smile, accent: "var(--icon-lime)", gradient: "linear-gradient(90deg, var(--icon-lime), var(--icon-green))", body: "90–95% of your body's serotonin — the neurotransmitter most linked to mood and wellbeing — is made in your gut, not your brain. Food is mood." },
  { number: "02", title: "GABA", icon: Wind, accent: "var(--icon-teal)", gradient: "linear-gradient(90deg, var(--icon-green), var(--icon-teal))", body: "Specific probiotic bacteria produce GABA, the brain's primary calming neurotransmitter. A well-fed gut helps regulate the calm signals your mind relies on." },
  { number: "03", title: "The Vagus Nerve", icon: Activity, accent: "var(--icon-orange)", gradient: "linear-gradient(90deg, var(--icon-teal), var(--icon-yellow))", body: "The vagus nerve is the gut-brain highway — a direct line carrying signals both ways. Its strength (vagal tone) is shaped by the health of your microbiome." },
]

/* ── Section 10 — Part of EatoBiotics (sibling programs) ────────────── */
const PROGRAMS = [
  { number: "01", name: "Mind", icon: Brain, tagline: "The Food System Inside Your Mind", status: "You're here", here: true, href: null, accent: "var(--icon-teal)", gradient: MIND_GRADIENT },
  { number: "02", name: "You", icon: User, tagline: "The Food System Inside You", status: "Explore", here: false, href: "/you", accent: "var(--icon-green)", gradient: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))" },
  { number: "03", name: "Stability™", icon: Compass, tagline: "The Stability System Inside You", status: "Explore", here: false, href: "/stability", accent: "var(--icon-lime)", gradient: "linear-gradient(135deg, var(--icon-teal), var(--icon-green))" },
  { number: "04", name: "Glucose", icon: Activity, tagline: "The Glucose System Inside You", status: "Explore", here: false, href: "/glucose", accent: "var(--icon-orange)", gradient: "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange))" },
]

export default function MindPage() {
  return (
    <main className="overflow-hidden bg-white">
      {/* ── 1. HERO ── */}
      <MindHero />
      <div style={{ height: "2px", background: "linear-gradient(90deg, var(--icon-lime), var(--icon-green), var(--icon-teal), var(--icon-yellow), var(--icon-orange))" }} />

      {/* ── 2. THE PROBLEM (editorial) ── */}
      <section className="px-6 py-24 md:py-32">
        <div className="mx-auto max-w-[1200px]">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-20">
            <ScrollReveal>
              <p className="text-xs font-bold uppercase tracking-widest text-icon-teal">The Problem</p>
              <h2 className="mt-4 text-pretty font-serif text-3xl font-semibold text-foreground sm:text-4xl md:text-5xl">
                Your gut and your brain are{" "}
                <span className="brand-gradient-text">in constant conversation.</span>
              </h2>
              <blockquote className="mt-8 border-l-2 pl-6 font-serif text-xl font-medium italic text-foreground" style={{ borderColor: "var(--icon-teal)" }}>
                &ldquo;90–95% of your serotonin is made in the gut — not the brain.&rdquo;
              </blockquote>
            </ScrollReveal>
            <ScrollReveal delay={150}>
              <div className="rounded-3xl border border-border bg-secondary/40 p-8 md:p-10">
                <p className="text-base leading-relaxed text-muted-foreground">
                  The food you eat shapes your mood, focus, mental clarity, and resilience — through
                  gut-brain pathways most people have never been told about.
                </p>
                <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                  When the gut is well-fed, the mind feels it. When it isn&apos;t, the mind feels that too.
                  <span className="font-semibold text-foreground"> EatoBiotics helps you feed the system inside your mind</span> — one meal at a time.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* ── 3. THE 5 PILLARS ── */}
      <section className="px-6 py-24 md:py-32">
        <div className="mx-auto max-w-[1200px]">
          <ScrollReveal className="max-w-2xl">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-icon-teal">The Framework</p>
            <h2 className="font-serif text-4xl font-semibold text-foreground sm:text-5xl text-balance">
              The 5 pillars{" "}
              <span className="brand-gradient-text">of your Mind Score</span>
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              Five dimensions that together describe how well your food habits support your gut-brain axis —
              and the clarity, mood, and focus that flow from it.
            </p>
          </ScrollReveal>

          <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
            {PILLARS.map((p, index) => {
              const Icon = p.icon
              const bgGradient = `linear-gradient(160deg, color-mix(in srgb, ${p.accent} 10%, transparent), transparent 60%)`
              return (
                <ScrollReveal key={p.title} delay={index * 70}>
                  <div
                    className="flex h-full flex-col rounded-3xl p-5 transition-shadow hover:shadow-lg"
                    style={{ background: bgGradient, border: `1.5px solid color-mix(in srgb, ${p.accent} 30%, transparent)`, borderTop: `4px solid ${p.accent}` }}
                  >
                    <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl" style={{ background: `color-mix(in srgb, ${p.accent} 15%, transparent)` }}>
                      <Icon size={20} style={{ color: p.accent }} />
                    </div>
                    <h3 className="font-serif text-lg font-semibold text-foreground">{p.title}</h3>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{p.description}</p>
                  </div>
                </ScrollReveal>
              )
            })}
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* ── 4. THE GUT-BRAIN AXIS ── */}
      <section className="px-6 py-24 md:py-32">
        <div className="mx-auto max-w-[1200px]">
          <div className="flex flex-col gap-16 lg:flex-row lg:items-center lg:gap-20">
            <div className="lg:w-[420px] lg:shrink-0">
              <ScrollReveal>
                <p className="text-xs font-semibold uppercase tracking-widest text-icon-teal">The Framework</p>
                <h2 className="mt-4 font-serif text-4xl font-semibold text-foreground sm:text-5xl text-balance">
                  How your gut{" "}
                  <span className="brand-gradient-text">talks to your brain.</span>
                </h2>
                <p className="mt-6 text-base leading-relaxed text-muted-foreground">
                  The gut-brain axis is a two-way line. What you eat feeds your microbiome, which produces
                  the neurotransmitters — serotonin, GABA, dopamine — that shape how you think and feel.
                </p>
                <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                  Change the food, and you change the conversation. It all contributes to your overall
                  Biotics Score™.
                </p>
              </ScrollReveal>
              <ScrollReveal delay={150}>
                <Link href={ASSESSMENT_HREF} className="mt-8 inline-flex items-center gap-2 rounded-full border-2 border-icon-teal px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-icon-teal hover:text-white">
                  Get my Mind Score <ArrowUpRight size={14} />
                </Link>
              </ScrollReveal>
            </div>
            <div className="flex-1">
              <ScrollReveal delay={100}><MindFramework /></ScrollReveal>
              <ScrollReveal delay={200}>
                <p className="mt-4 text-center text-xs text-muted-foreground">
                  A two-way axis where the food you eat shapes the neurotransmitters your mind runs on.
                </p>
              </ScrollReveal>
            </div>
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* ── 5. WHY EATOBIOTICS FOR THE MIND ── */}
      <section className="bg-secondary/40 px-6 py-24 md:py-32">
        <div className="mx-auto max-w-[1200px]">
          <div className="grid gap-16 lg:grid-cols-2 lg:items-start lg:gap-24">
            <ScrollReveal>
              <p className="text-xs font-bold uppercase tracking-widest text-icon-teal">Why The Mind</p>
              <h2 className="mt-4 text-pretty font-serif text-3xl font-semibold text-foreground sm:text-4xl md:text-5xl">
                Mental clarity starts in the gut.
              </h2>
              <p className="mt-6 text-base leading-relaxed text-muted-foreground">
                Mood and focus aren&apos;t only in your head. They&apos;re shaped, every day, by the bacteria you
                feed and the neurotransmitters they produce.
              </p>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                EatoBiotics gives you a clear, food-first way to understand and strengthen that connection.
              </p>
              <blockquote className="mt-8 border-l-2 pl-6 font-serif text-xl font-medium italic text-foreground" style={{ borderColor: "var(--icon-teal)" }}>
                &ldquo;Feed the gut, and the mind feels it.&rdquo;
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

      {/* ── 6. THE GUT CONNECTION IN COMMON CONDITIONS ── */}
      <section className="px-6 py-24 md:py-32">
        <div className="mx-auto max-w-[1200px]">
          <ScrollReveal>
            <p className="text-xs font-bold uppercase tracking-widest text-icon-teal">Mental Health & The Gut</p>
            <h2 className="mt-4 text-pretty font-serif text-4xl font-semibold text-foreground sm:text-5xl md:text-6xl">
              The gut connection
              <br />
              <span className="brand-gradient-text">in common conditions.</span>
            </h2>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground">
              Educational — not clinical advice. If you&apos;re managing any of these conditions, please work
              with a qualified healthcare practitioner. The gut-brain connection is one important factor
              among many.
            </p>
          </ScrollReveal>

          <div className="mt-16 grid gap-6 sm:grid-cols-2">
            {CONDITIONS.map((c, index) => (
              <ScrollReveal key={c.name} delay={index * 80}>
                <div className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-background p-7" style={{ borderLeft: `4px solid ${c.color}` }}>
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl" style={{ background: `color-mix(in srgb, ${c.color} 15%, transparent)` }}>
                      <c.icon size={20} style={{ color: c.color }} />
                    </div>
                    <h3 className="font-serif text-xl font-semibold" style={{ color: c.color }}>{c.name}</h3>
                  </div>
                  <p className="mt-4 text-xs font-bold uppercase tracking-widest" style={{ color: c.color }}>The gut connection</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{c.gutLink}</p>
                  <div className="mt-4 rounded-2xl p-4" style={{ background: `color-mix(in srgb, ${c.color} 8%, transparent)`, border: `1px solid color-mix(in srgb, ${c.color} 20%, transparent)` }}>
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">What food can do</p>
                    <p className="mt-1 text-sm leading-relaxed text-foreground/80">{c.foodAngle}</p>
                  </div>
                  <Link href={c.href} className="mt-5 inline-flex items-center gap-1 text-sm font-semibold opacity-70 transition-opacity hover:opacity-100" style={{ color: c.color }}>
                    Read more <ArrowUpRight size={14} />
                  </Link>
                </div>
              </ScrollReveal>
            ))}
          </div>

          <ScrollReveal delay={320}>
            <div className="mt-8 rounded-2xl border border-border bg-secondary/40 px-6 py-4 text-center">
              <p className="text-xs text-muted-foreground">
                <strong className="text-foreground">Important:</strong> This information is for educational purposes only and does not
                constitute medical advice, diagnosis, or treatment. Always consult a qualified healthcare
                professional for mental health concerns.
              </p>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <div className="section-divider" />

      {/* ── 7. HOW IT WORKS ── */}
      <section id="how-it-works" className="scroll-mt-24 bg-secondary/40 px-6 py-24 md:py-32">
        <div className="mx-auto max-w-[1200px]">
          <ScrollReveal>
            <p className="text-xs font-bold uppercase tracking-widest text-icon-teal">The Tool</p>
            <h2 className="mt-4 text-pretty font-serif text-4xl font-semibold text-foreground sm:text-5xl md:text-6xl">
              Your gut-brain food system
              <br />
              <span className="brand-gradient-text">in four steps.</span>
            </h2>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground">
              From a first assessment to a brain food plan you can actually follow — here&apos;s how EatoBiotics
              works for your mind.
            </p>
          </ScrollReveal>

          {/* 4-step flow */}
          <div className="mt-14">
            <ScrollReveal delay={100}>
              <div className="grid gap-8 sm:grid-cols-4 sm:gap-0">
                {FLOW.map((item, i) => (
                  <div key={item.step} className="flex items-start gap-3 sm:flex-col sm:gap-2">
                    <div className="flex items-center gap-3 sm:w-full">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white" style={{ background: MIND_GRADIENT }}>{item.step}</div>
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

          {/* Mock score card */}
          <ScrollReveal delay={200}>
            <div className="mt-14 overflow-hidden rounded-3xl border border-border bg-background shadow-lg">
              <div className="flex items-center justify-between px-7 py-5" style={{ background: "color-mix(in srgb, var(--icon-teal) 6%, var(--background))" }}>
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: MIND_GRADIENT }}>
                    <Gauge size={16} className="text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Mind Score</p>
                    <p className="text-xs text-muted-foreground">Your 5 gut-brain pillars</p>
                  </div>
                </div>
                <span className="rounded-full px-3 py-1 text-xs font-bold text-white" style={{ background: MIND_GRADIENT }}>Example</span>
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
                <div className="mt-7 flex items-start gap-4 rounded-2xl p-5" style={{ background: "color-mix(in srgb, var(--icon-teal) 8%, transparent)", border: "1px solid color-mix(in srgb, var(--icon-teal) 25%, transparent)" }}>
                  <Sparkles size={18} style={{ color: "var(--icon-teal)", flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <p className="text-sm font-semibold text-foreground">Add live mind foods</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Live Mind Foods is your biggest opportunity. A daily serving of yogurt, kefir, or kimchi
                      builds the GABA-producing bacteria your calm and focus rely on.
                    </p>
                  </div>
                </div>
                <p className="mt-5 text-center text-xs text-muted-foreground/60">An illustrative example — your own Mind Score comes from the free assessment.</p>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <div className="section-divider" />

      {/* ── 8. YOUR MIND SCORE ── */}
      <section className="px-6 py-24 md:py-32">
        <div className="mx-auto max-w-[1100px]">
          <ScrollReveal className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-icon-teal">The Score</p>
            <h2 className="mt-4 font-serif text-4xl font-semibold text-foreground sm:text-5xl text-balance">Your Mind Score</h2>
            <p className="mt-6 text-base leading-relaxed text-muted-foreground">
              A single score for how well your food habits support your gut-brain axis — built from your
              intake across the five pillars.
            </p>
            <p className="mt-3 font-semibold text-foreground">Your Mind Score contributes to your overall Biotics Score™.</p>
          </ScrollReveal>
          <div className="mt-16">
            <MindScoreShowcase />
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* ── 9. THE GUT-BRAIN AXIS (dark) ── */}
      <section className="bg-foreground px-6 py-24 md:py-32">
        <div className="mx-auto max-w-[1200px]">
          <ScrollReveal>
            <p className="text-xs font-bold uppercase tracking-widest text-icon-lime">The Science</p>
            <h2 className="mt-4 text-pretty font-serif text-4xl font-semibold text-background sm:text-5xl md:text-6xl">
              How the gut
              <br />
              <span className="brand-gradient-text">talks to the brain.</span>
            </h2>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-background/70">
              The conversation runs on three channels — the neurotransmitters your gut produces and the
              nerve that carries them. All of it is shaped by what you eat.
            </p>
          </ScrollReveal>
          <ScrollReveal delay={150}>
            <Link href="/biotics" className="mt-8 inline-flex items-center gap-2 rounded-full border-2 border-icon-lime px-6 py-3 text-sm font-semibold text-background transition-colors hover:bg-icon-lime hover:text-foreground">
              Explore the framework <ArrowUpRight size={14} />
            </Link>
          </ScrollReveal>

          <div className="mt-16 grid gap-6 sm:grid-cols-3">
            {AXIS.map((card, index) => (
              <ScrollReveal key={card.title} delay={index * 100}>
                <div className="relative flex flex-col overflow-hidden rounded-2xl p-7" style={{ background: `color-mix(in srgb, ${card.accent} 8%, var(--foreground))`, border: `1px solid color-mix(in srgb, ${card.accent} 25%, transparent)` }}>
                  <div className="absolute top-0 left-0 right-0 h-1" style={{ background: card.gradient }} />
                  <div className="flex items-center gap-3">
                    <span className="font-serif text-4xl font-semibold" style={{ color: card.accent }}>{card.number}</span>
                    <card.icon size={22} style={{ color: card.accent }} />
                  </div>
                  <h3 className="mt-4 font-serif text-xl font-semibold text-background">{card.title}</h3>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-background/70">{card.body}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* ── 10. PART OF EATOBIOTICS ── */}
      <section className="bg-secondary/40 px-6 py-24 md:py-32">
        <div className="mx-auto max-w-[1200px]">
          <ScrollReveal>
            <p className="text-xs font-bold uppercase tracking-widest text-icon-teal">The Ecosystem</p>
            <h2 className="mt-4 text-pretty font-serif text-4xl font-semibold text-foreground sm:text-5xl md:text-6xl">
              Part of
              <br />
              <span className="brand-gradient-text">EatoBiotics.</span>
            </h2>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground">
              Mind is one expression of EatoBiotics — the food system inside you. Each program applies it to
              a different part of your life.
            </p>
          </ScrollReveal>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {PROGRAMS.map((sys, index) => {
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
                <p className="text-xs font-bold uppercase tracking-widest text-icon-teal">EatoBiotics Mind</p>
                <h2 className="mt-4 text-balance font-serif text-4xl font-semibold text-foreground sm:text-5xl">
                  Feed the system <span className="brand-gradient-text">inside your mind.</span>
                </h2>
                <p className="mx-auto mt-6 max-w-lg text-base leading-relaxed text-muted-foreground">
                  Take the free Mind Assessment, discover your Mind Score, and start building the gut-brain
                  axis that powers your mood, focus, and clarity.
                </p>
              </ScrollReveal>
              <ScrollReveal delay={150}>
                <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                  <Link href={ASSESSMENT_HREF} className="brand-gradient inline-flex items-center gap-2 rounded-full px-8 py-4 text-base font-semibold text-white shadow-lg shadow-icon-green/20 transition-all hover:opacity-90 hover:shadow-xl">
                    Start Mind Assessment <ArrowRight size={16} />
                  </Link>
                  <Link href="/biotics" className="inline-flex items-center gap-2 rounded-full border border-border px-8 py-4 text-base font-semibold text-foreground transition-all hover:border-icon-teal hover:text-icon-teal">
                    Explore the framework
                  </Link>
                </div>
                <p className="mt-4 text-sm text-muted-foreground">Free to start. Your score and brain food plan sent to your inbox.</p>
              </ScrollReveal>
            </div>
          </div>
        </div>
      </section>

      {/* ── Mental-health disclaimer (de-emphasized footer) ── */}
      <section className="px-6 py-12" style={{ background: "#f7f7f5" }}>
        <div className="mx-auto flex max-w-3xl items-start gap-3">
          <Brain size={18} className="mt-0.5 shrink-0" style={{ color: "var(--muted-foreground)" }} />
          <p className="text-xs leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
            The Food System Inside Your Mind is educational and is not a substitute for medical care. It does
            not diagnose, treat, or cure any mental-health condition. The gut-brain connection is one factor
            among many — always consult a qualified healthcare professional for mental-health concerns,
            especially if symptoms are new, worsening, or severe.
          </p>
        </div>
      </section>
    </main>
  )
}
