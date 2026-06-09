import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import {
  ArrowRight,
  Activity,
  Zap,
  Cookie,
  TrendingUp,
  ClipboardCheck,
  FileText,
  Utensils,
  Target,
  Wheat,
  Beef,
  Droplets,
  Salad,
  ListOrdered,
  Clock,
  Footprints,
  Moon,
  Sparkles,
  Leaf,
  ShieldCheck,
  Globe,
  Check,
  Syringe,
  Star,
  Quote,
} from "lucide-react"
import { ScrollReveal } from "@/components/scroll-reveal"
import { ScoreRing } from "@/components/assessment/score-ring"
import { EatobeticsFaq } from "@/components/eatobetics/faq"
import { EatobeticsStickyCta } from "@/components/eatobetics/sticky-cta"

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

/* ── Shared bits ──────────────────────────────────────────────────────── */

const ASSESSMENT_HREF = "/eatobetics/assessment"

const PRIMARY_CTA =
  "brand-gradient inline-flex items-center justify-center gap-2 rounded-full px-8 py-4 text-base font-semibold text-white shadow-lg shadow-icon-green/20 transition-all hover:opacity-90 hover:shadow-xl"

// Reusable depth: soft floating card that lifts on hover.
const CARD =
  "h-full rounded-3xl border border-black/[0.05] bg-white p-7 shadow-[0_10px_40px_-16px_rgba(26,46,18,0.18)] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_24px_60px_-22px_rgba(26,46,18,0.28)]"

const GRADS = [
  "linear-gradient(135deg, var(--icon-lime), var(--icon-green))",
  "linear-gradient(135deg, var(--icon-green), var(--icon-teal))",
  "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange))",
  "linear-gradient(135deg, var(--icon-teal), var(--icon-green))",
  "linear-gradient(135deg, var(--icon-orange), var(--icon-yellow))",
]

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-serif text-3xl font-bold leading-tight text-balance sm:text-4xl lg:text-5xl" style={{ color: "var(--foreground)" }}>
      {children}
    </h2>
  )
}

/* ── Data ─────────────────────────────────────────────────────────────── */

const PROBLEMS = [
  { icon: Zap, gradient: GRADS[2], title: "Energy Crashes", body: "Post-meal tiredness, afternoon fog, and unstable energy can often be connected to meal composition, timing, sleep, stress, and glucose response." },
  { icon: Cookie, gradient: GRADS[1], title: "Cravings & Hunger", body: "Craving cycles are not always about discipline. They can be signals from an unstable food and glucose rhythm." },
  { icon: TrendingUp, gradient: GRADS[0], title: "Long-Term Risk", body: "Glucose instability and insulin resistance can build quietly over time. Understanding patterns early can help people make better food and lifestyle decisions." },
]

const STEPS = [
  { icon: ClipboardCheck, n: "1", gradient: GRADS[0], title: "Assess Your Glucose System", body: "A guided assessment explores your food rhythm, energy patterns, cravings, sleep, stress, activity, blood test awareness, and metabolic risk signals." },
  { icon: FileText, n: "2", gradient: GRADS[1], title: "Receive Your EatoBetics Report", body: "Your personalised report gives you an EatoBetics Score, glucose profile, strengths, improvement areas, and your 30-day glucose intelligence focus." },
  { icon: Utensils, n: "3", gradient: GRADS[3], title: "Analyse Your Meals", body: "Every meal can be viewed through a glucose intelligence lens: fibre, protein, fat, carbohydrate type, processing level, food order, timing, and movement." },
  { icon: Target, n: "4", gradient: GRADS[2], title: "Improve One Pattern at a Time", body: "EatoBetics does not shame, restrict, or overwhelm. It helps you understand one meal, one habit, and one pattern at a time." },
]

const SCORE_EXAMPLE = {
  overall: 64,
  profile: "Stabilising",
  pillars: [
    { label: "Stability", score: 58, color: "var(--icon-orange)", gradient: "linear-gradient(90deg, var(--icon-yellow), var(--icon-orange))", description: "Glucose response to meals" },
    { label: "Energy", score: 72, color: "var(--icon-lime)", gradient: "linear-gradient(90deg, var(--icon-lime), var(--icon-green))", description: "Post-meal energy & focus" },
    { label: "Rhythm", score: 66, color: "var(--icon-teal)", gradient: "linear-gradient(90deg, var(--icon-green), var(--icon-teal))", description: "Timing, spacing & movement" },
  ],
  insight:
    "Energy and rhythm are working in your favour — your meals are reasonably timed and you move through your day well. The biggest opportunity is stability: a little more fibre and protein on your most-repeated meals, plus eating vegetables first, could steady your curve within a few weeks.",
}

const REPORT_SECTIONS = [
  { title: "Your EatoBetics Score", body: "A simple score showing your current glucose intelligence baseline." },
  { title: "Your Glucose Profile", body: "Understand whether your current pattern suggests stable, variable, or high-risk glucose behaviour." },
  { title: "Your Energy Stability Score", body: "See how your food rhythm may be affecting energy, focus, and post-meal crashes." },
  { title: "Your Biggest Glucose Opportunity", body: "The one area most likely to improve your glucose system over the next 30 days." },
  { title: "Your Meal Timing Pattern", body: "Understand whether your timing, spacing, and late eating habits may be affecting your glucose rhythm." },
  { title: "Your 30-Day Glucose Protocol", body: "A simple weekly plan to stabilise, diversify, strengthen, and sustain your food system." },
]

const LENS = [
  { icon: Wheat, title: "Fibre", body: "Slows glucose absorption and supports gut health." },
  { icon: Beef, title: "Protein", body: "Supports satiety, muscle, and more stable meals." },
  { icon: Droplets, title: "Fat", body: "Can slow absorption but needs balance and food quality." },
  { icon: Salad, title: "Carbohydrate Type", body: "Whole, minimally processed carbohydrates behave differently from refined carbohydrates." },
  { icon: ListOrdered, title: "Food Order", body: "Eating vegetables, fibre, and protein before starch can change the glucose curve." },
  { icon: Clock, title: "Meal Timing", body: "Irregular timing, late meals, and long gaps can influence energy and cravings." },
  { icon: Footprints, title: "Movement", body: "A short walk after a meal can support better post-meal glucose handling." },
  { icon: Moon, title: "Sleep & Stress", body: "Poor sleep and high stress can raise glucose and reduce metabolic resilience." },
]

const PATHWAYS = [
  {
    label: "ENERGY",
    title: "Steady energy, fewer crashes",
    copy: "For people who feel foggy, tired, or hungry soon after meals — understand the food patterns behind your afternoon slump and craving cycles.",
    image: "/food-5.webp",
    alt: "A balanced, colourful plate of whole foods",
    accent: "var(--icon-green)",
    gradient: "linear-gradient(90deg, var(--icon-lime), var(--icon-green))",
    href: ASSESSMENT_HREF,
    cta: "Take the free assessment",
  },
  {
    label: "PREVENTION",
    title: "Get ahead of the curve",
    copy: "For people watching fasting glucose, HbA1c, or family risk who want to understand their metabolic health before a diagnosis ever appears.",
    image: "/food-7.webp",
    alt: "Fresh vegetables and whole ingredients",
    accent: "var(--icon-teal)",
    gradient: "linear-gradient(90deg, var(--icon-teal), var(--icon-green))",
    href: ASSESSMENT_HREF,
    cta: "Take the free assessment",
  },
  {
    label: "GLP-1",
    title: "Make the most of your medication",
    copy: "On Ozempic, Wegovy, or Mounjaro? Use your appetite window to protect muscle and rebuild your relationship with food — not just eat less of the same.",
    image: "/food-12.webp",
    alt: "Protein-rich, muscle-supporting meal",
    accent: "var(--icon-orange)",
    gradient: "linear-gradient(90deg, var(--icon-yellow), var(--icon-orange))",
    href: "/eatobetics/glp1",
    cta: "Explore the GLP-1 Companion",
  },
]

const TESTIMONIALS = [
  {
    quote: "My 3pm energy crash is basically gone. EatoBetics showed me it was how I built my lunch — not my willpower.",
    name: "Marie D.", role: "Teacher, Limerick", from: 41, to: 78, weeks: 5, avatar: "MD",
    color: "var(--icon-lime)", gradient: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))",
  },
  {
    quote: "My fasting glucose had been creeping up for years. Food order and a walk after dinner finally gave me something I could act on.",
    name: "Tom K.", role: "Engineer, Belfast", from: 52, to: 81, weeks: 6, avatar: "TK",
    color: "var(--icon-teal)", gradient: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))",
  },
  {
    quote: "On a GLP-1, I rebuilt my meals around protein instead of just eating less. My energy stayed steady and I kept my strength.",
    name: "Priya S.", role: "Pharmacist, Dublin", from: 47, to: 79, weeks: 4, avatar: "PS",
    color: "var(--icon-orange)", gradient: "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange))",
  },
]

const AUDIENCES = [
  { title: "People with Energy Crashes", body: "For people who feel foggy, tired, or hungry soon after meals." },
  { title: "People with Rising Glucose Markers", body: "For people whose blood tests show fasting glucose, HbA1c, or insulin resistance markers moving in the wrong direction." },
  { title: "People with Prediabetes", body: "For people who deserve more than a generic leaflet and want to understand their daily food patterns." },
  { title: "People Managing Type 2 Diabetes", body: "For people who want food intelligence to support better conversations, better habits, and better daily decisions." },
  { title: "People Using GLP-1 Medications", body: "For people using an appetite window to rebuild their relationship with food, not simply eat less of the same foods." },
  { title: "People Focused on Prevention", body: "For anyone who wants to understand their metabolic health before a diagnosis appears." },
]

const WEEKS = [
  { week: "Week 1", gradient: GRADS[0], title: "Stabilise", body: "Identify your biggest glucose pattern and improve your meal rhythm." },
  { week: "Week 2", gradient: GRADS[1], title: "Build Better Plates", body: "Increase protein, fibre, and food quality across your most repeated meals." },
  { week: "Week 3", gradient: GRADS[3], title: "Flatten the Curve", body: "Use food order, movement, resistant starch, and smarter carbohydrate choices." },
  { week: "Week 4", gradient: GRADS[2], title: "Sustain the System", body: "Create repeatable meals and habits that support long-term metabolic resilience." },
]

/* ── Page ─────────────────────────────────────────────────────────────── */

export default function EatoBeticsPage() {
  return (
    <main className="overflow-hidden bg-white">
      {/* ── 1. HERO ── */}
      <section className="relative min-h-screen overflow-hidden px-6 pt-20 pb-16 md:pb-20">
        <div className="relative z-10 mx-auto flex max-w-[1200px] min-h-[calc(100vh-160px)] flex-col items-center justify-center gap-12 md:flex-row md:gap-16 lg:gap-20">

          {/* ── Left: Image ── */}
          <ScrollReveal delay={60} className="flex-1 flex items-center justify-center w-full max-w-[620px]">
            <div className="relative w-full">
              <div
                aria-hidden
                className="absolute inset-0 -z-10 blur-3xl"
                style={{ background: "radial-gradient(60% 60% at 50% 48%, rgba(245,197,24,0.22), rgba(76,182,72,0.12) 55%, transparent 78%)" }}
              />
              {/* TODO: swap to /images/eatobetics-hero.png once the glucose illustration is uploaded. */}
              <Image
                src="/images/hero-gut.png"
                alt="The glucose system inside you — a figure in green and gold light with a glucose curve flowing through the body"
                width={1200}
                height={800}
                priority
                className="w-full h-auto object-contain"
              />
            </div>
          </ScrollReveal>

          {/* ── Right: Text ── */}
          <div className="flex-1 text-left max-w-[560px]">
            <ScrollReveal>
              <span className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-semibold uppercase tracking-wider" style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }}>
                <Sparkles size={14} style={{ color: "var(--icon-yellow)" }} /> Glucose Intelligence by Eato
              </span>
            </ScrollReveal>

            <ScrollReveal delay={80}>
              <h1 className="mt-5 font-serif text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl text-balance">
                <span style={{ color: "var(--icon-orange)" }}>The Glucose System</span>{" "}
                <span
                  style={{
                    background: "linear-gradient(90deg, var(--icon-yellow), var(--icon-orange), var(--icon-green))",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  Inside You
                </span>
              </h1>
            </ScrollReveal>

            <ScrollReveal delay={140}>
              <p className="mt-4 max-w-md text-xl font-medium text-foreground sm:text-2xl">
                Personal food intelligence for energy, cravings, and metabolic health.
              </p>
              <p className="mt-4 max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg">
                Understand how every meal affects your glucose, get your EatoBetics Score,
                and follow a personalised 30-day plan to a steadier food system.
              </p>
            </ScrollReveal>

            <ScrollReveal delay={220}>
              <div className="mt-8 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
                <Link href={ASSESSMENT_HREF} className={PRIMARY_CTA}>
                  Take the free assessment <ArrowRight size={16} />
                </Link>
                <Link href="#how-it-works" className="text-sm font-medium text-muted-foreground underline underline-offset-4 transition-colors hover:text-foreground">
                  See how it works
                </Link>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={320}>
              <div className="mt-8 flex items-center gap-6">
                {[
                  { num: "Free", label: "To start" },
                  { num: "3 min", label: "Takes about" },
                  { num: "30 days", label: "To results" },
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

      {/* Brand-gradient divider — matches the homepage */}
      <div style={{ height: "2px", background: "linear-gradient(90deg, var(--icon-lime), var(--icon-green), var(--icon-teal), var(--icon-yellow), var(--icon-orange))" }} />

      {/* ── 2. PROBLEM ── */}
      <section className="px-6 py-24 md:py-32">
        <div className="mx-auto max-w-[1200px]">
          <ScrollReveal className="mx-auto max-w-3xl text-center">
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--icon-orange)" }}>The Problem</p>
            <SectionHeading>The problem is not willpower. It is information.</SectionHeading>
            <p className="mt-6 text-lg leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
              For decades, people have been told that managing blood sugar is simple: eat less sugar, avoid carbs, lose weight. But that advice misses something fundamental. <span className="font-semibold" style={{ color: "var(--foreground)" }}>Your glucose response to food is personal.</span>
            </p>
            <p className="mt-4 text-lg leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
              Two people can eat the same meal and experience completely different glucose curves. EatoBetics helps close the information gap between what you eat and what your body may be experiencing.
            </p>
          </ScrollReveal>
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {PROBLEMS.map((p, i) => (
              <ScrollReveal key={p.title} delay={i * 80}>
                <div className={CARD}>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-sm" style={{ background: p.gradient }}>
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

      {/* ── 3. HOW IT WORKS ── */}
      <section id="how-it-works" className="relative overflow-hidden px-6 py-24 md:py-32" style={{ background: "linear-gradient(180deg, #F4F9EF 0%, #FFFFFF 100%)" }}>
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[360px]" style={{ background: "radial-gradient(55% 70% at 50% 0%, color-mix(in srgb, var(--icon-green) 12%, transparent), transparent 70%)" }} />
        <div className="relative z-10 mx-auto max-w-[1200px]">
          <ScrollReveal className="mx-auto max-w-3xl text-center">
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--icon-green)" }}>How It Works</p>
            <SectionHeading>What EatoBetics does</SectionHeading>
            <p className="mt-6 text-lg leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
              EatoBetics is a food intelligence platform built around one central question: <span className="font-semibold" style={{ color: "var(--foreground)" }}>How does what you eat affect your glucose system?</span>
            </p>
          </ScrollReveal>
          <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <ScrollReveal key={s.n} delay={i * 80}>
                <div className={CARD}>
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl font-serif text-sm font-bold text-white shadow-sm" style={{ background: s.gradient }}>{s.n}</span>
                    <s.icon size={20} style={{ color: "var(--icon-teal)" }} />
                  </div>
                  <h3 className="mt-4 font-serif text-lg font-bold" style={{ color: "var(--foreground)" }}>{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>{s.body}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
          <ScrollReveal delay={360}>
            <div className="mt-12 text-center">
              <Link href={ASSESSMENT_HREF} className={PRIMARY_CTA}>Take the free assessment <ArrowRight size={16} /></Link>
              <p className="mt-3 text-xs" style={{ color: "var(--muted-foreground)" }}>Free · about 3 minutes · no account needed</p>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ── 4. SCORE PREVIEW ── */}
      <section className="px-6 py-24 md:py-32">
        <div className="mx-auto max-w-[1100px]">
          <ScrollReveal>
            <div className="mb-12 text-center">
              <p className="mb-3 text-xs font-bold uppercase tracking-widest" style={{ color: "var(--icon-orange)" }}>Your free EatoBetics Score</p>
              <SectionHeading>What does your score look like?</SectionHeading>
              <p className="mt-4 mx-auto max-w-lg text-base leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
                Here&apos;s an example. After the free assessment you&apos;ll get your own score across
                stability, energy, and rhythm — and exactly what it means for you.
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={80}>
            <div className="relative mx-auto max-w-lg overflow-hidden rounded-3xl border-2 bg-card shadow-2xl" style={{ borderColor: "color-mix(in srgb, var(--icon-orange) 40%, transparent)" }}>
              <div className="h-1.5 w-full" style={{ background: "linear-gradient(90deg, var(--icon-yellow), var(--icon-orange), var(--icon-green), var(--icon-teal))" }} />
              <div className="px-8 py-8">
                <div className="mb-6 flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--icon-orange)" }}>EatoBetics Score — Example</p>
                  <span className="rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-white" style={{ background: "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange))" }}>{SCORE_EXAMPLE.profile}</span>
                </div>

                <div className="mb-7 flex justify-center">
                  <ScoreRing score={SCORE_EXAMPLE.overall} color="var(--icon-orange)" gradientId="eatobetics-score-ring" profileType={SCORE_EXAMPLE.profile} />
                </div>

                <div className="mb-6 flex flex-col gap-4">
                  {SCORE_EXAMPLE.pillars.map(({ label, score, color, gradient, description }) => (
                    <div key={label}>
                      <div className="mb-1.5 flex items-center justify-between">
                        <div>
                          <span className="text-sm font-semibold text-foreground">{label}</span>
                          <span className="ml-2 text-xs text-muted-foreground">{description}</span>
                        </div>
                        <span className="font-serif text-sm font-bold" style={{ color }}>{score}</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full" style={{ width: `${score}%`, background: gradient }} />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="rounded-2xl px-4 py-3 text-sm leading-relaxed" style={{ background: "color-mix(in srgb, var(--muted) 60%, transparent)", color: "var(--muted-foreground)" }}>
                  <span className="font-semibold text-foreground">What this means: </span>{SCORE_EXAMPLE.insight}
                </div>
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={180}>
            <div className="mt-10 text-center">
              <Link href={ASSESSMENT_HREF} className={PRIMARY_CTA}>Get my EatoBetics Score <ArrowRight size={16} /></Link>
              <p className="mt-3 text-xs" style={{ color: "var(--muted-foreground)" }}>Free to take · no account needed · about 3 minutes</p>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ── 5. GLUCOSE INTELLIGENCE LENS ── */}
      <section className="relative overflow-hidden px-6 py-24 md:py-32" style={{ background: "linear-gradient(160deg, #14250F 0%, var(--foreground) 55%, #243611 100%)" }}>
        <div aria-hidden className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full opacity-30 blur-3xl" style={{ background: "radial-gradient(circle, var(--icon-green), transparent 70%)" }} />
        <div aria-hidden className="pointer-events-none absolute -right-16 bottom-0 h-72 w-72 rounded-full opacity-25 blur-3xl" style={{ background: "radial-gradient(circle, var(--icon-yellow), transparent 70%)" }} />
        <div className="relative z-10 mx-auto max-w-[1200px]">
          <ScrollReveal className="mx-auto max-w-3xl text-center">
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--icon-lime)" }}>The Lens</p>
            <h2 className="font-serif text-3xl font-bold text-balance text-white sm:text-4xl lg:text-5xl">The Glucose Intelligence Lens</h2>
            <p className="mt-6 text-lg leading-relaxed text-white/75">
              EatoBetics does not just ask what you ate. It helps you understand how the meal was built.
            </p>
          </ScrollReveal>
          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {LENS.map((l, i) => (
              <ScrollReveal key={l.title} delay={i * 50}>
                <div className="h-full rounded-2xl border border-white/10 bg-white/[0.06] p-6 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:bg-white/[0.1]">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl" style={{ background: GRADS[i % GRADS.length] }}>
                    <l.icon size={20} className="text-white" />
                  </div>
                  <h3 className="mt-4 font-serif text-lg font-bold text-white">{l.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-white/70">{l.body}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── 6. MEAL REBUILD ── */}
      <section className="px-6 py-24 md:py-32">
        <div className="mx-auto max-w-[1100px]">
          <ScrollReveal className="mx-auto max-w-3xl text-center">
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--icon-green)" }}>Meal Rebuild</p>
            <SectionHeading>One meal. One change. A better curve.</SectionHeading>
          </ScrollReveal>
          <div className="relative mt-14 grid gap-6 md:grid-cols-2">
            <ScrollReveal>
              <div className="h-full rounded-3xl border border-[#f0e2cf] bg-[#fdf8ef] p-7 shadow-[0_10px_40px_-18px_rgba(245,166,35,0.3)]">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-xs font-bold uppercase tracking-wider" style={{ color: "var(--icon-orange)" }}>Before</span>
                <h3 className="mt-3 font-serif text-xl font-bold" style={{ color: "var(--foreground)" }}>Standard Lunch</h3>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>White rice, chicken, sauce, small portion of vegetables.</p>
                <p className="mt-4 text-sm leading-relaxed"><span className="font-semibold" style={{ color: "var(--foreground)" }}>Likely glucose issue:</span> <span style={{ color: "var(--muted-foreground)" }}>Fast carbohydrate load, low fibre volume, limited glucose buffer.</span></p>
              </div>
            </ScrollReveal>
            <div aria-hidden className="absolute left-1/2 top-1/2 z-10 hidden h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-white shadow-lg md:flex" style={{ background: "linear-gradient(135deg, var(--icon-orange), var(--icon-green))" }}>
              <ArrowRight size={18} />
            </div>
            <ScrollReveal delay={100}>
              <div className="h-full rounded-3xl border border-[#d8e7cc] bg-[#f1f8ec] p-7 shadow-[0_10px_40px_-18px_rgba(76,182,72,0.3)]">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-xs font-bold uppercase tracking-wider" style={{ color: "var(--icon-green)" }}>EatoBetics improvement</span>
                <h3 className="mt-3 font-serif text-xl font-bold" style={{ color: "var(--foreground)" }}>Rebuilt Lunch</h3>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>Add extra vegetables, include beans or lentils, eat vegetables first, reduce rice portion slightly, and take a 10-minute walk after the meal.</p>
                <p className="mt-4 text-sm leading-relaxed"><span className="font-semibold" style={{ color: "var(--foreground)" }}>Likely benefit:</span> <span style={{ color: "var(--muted-foreground)" }}>More fibre, more satiety, slower absorption, improved energy stability.</span></p>
              </div>
            </ScrollReveal>
          </div>
          <p className="mx-auto mt-8 max-w-2xl text-center text-base italic" style={{ color: "var(--muted-foreground)" }}>
            EatoBetics is not about removing the foods people love. It is about rebuilding meals so they work better for the body.
          </p>
        </div>
      </section>

      {/* ── 7. REPORT PREVIEW ── */}
      <section className="px-6 pb-24 md:pb-32" style={{ background: "#f4f8f0" }}>
        <div className="mx-auto max-w-[1200px] pt-24 md:pt-32">
          <ScrollReveal className="mx-auto max-w-3xl text-center">
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--icon-teal)" }}>The Report</p>
            <SectionHeading>Your personal EatoBetics Report</SectionHeading>
            <p className="mt-6 text-lg leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
              The EatoBetics Report is designed to turn your food and lifestyle patterns into clear, practical glucose intelligence.
            </p>
          </ScrollReveal>
          <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {REPORT_SECTIONS.map((r, i) => (
              <ScrollReveal key={r.title} delay={i * 60}>
                <div className="group relative h-full overflow-hidden rounded-2xl border border-black/[0.05] bg-white p-6 shadow-[0_8px_30px_-14px_rgba(26,46,18,0.16)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_50px_-20px_rgba(26,46,18,0.26)]">
                  <div className="absolute inset-x-0 top-0 h-1" style={{ background: GRADS[i % GRADS.length] }} />
                  <h3 className="font-serif text-lg font-bold" style={{ color: "var(--foreground)" }}>{r.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>{r.body}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link href={ASSESSMENT_HREF} className="inline-flex items-center gap-2 rounded-full border-2 px-7 py-3 text-sm font-semibold transition-colors hover:bg-white" style={{ borderColor: "var(--icon-green)", color: "var(--icon-green)" }}>
              Take the assessment <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── 8. PATHWAYS ── */}
      <section className="px-6 py-24 md:py-32">
        <div className="mx-auto max-w-[1200px]">
          <ScrollReveal>
            <div className="mb-14 text-center">
              <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Choose Your Path</p>
              <SectionHeading>Three ways to use <span className="brand-gradient-text">EatoBetics.</span></SectionHeading>
              <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
                Whether you&apos;re chasing steadier energy, getting ahead of your numbers, or making the most of a GLP-1 — it starts with one free assessment.
              </p>
            </div>
          </ScrollReveal>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {PATHWAYS.map((p, i) => (
              <ScrollReveal key={p.label} delay={i * 100}>
                <div className="group flex h-full flex-col overflow-hidden rounded-3xl border bg-background transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl" style={{ borderColor: "var(--border)" }}>
                  <div className="h-1.5 w-full shrink-0" style={{ background: p.gradient }} />
                  <Link href={p.href} className="relative block w-full overflow-hidden bg-secondary/20">
                    <div className="relative aspect-[4/3] w-full">
                      <Image src={p.image} alt={p.alt} fill className="object-cover transition-transform duration-500 group-hover:scale-[1.04]" sizes="(max-width: 768px) 100vw, 33vw" />
                    </div>
                  </Link>
                  <div className="flex flex-1 flex-col p-6">
                    <p className="text-xs font-bold uppercase tracking-widest" style={{ color: p.accent }}>{p.label}</p>
                    <h3 className="mt-2 font-serif text-xl font-semibold leading-snug" style={{ color: "var(--foreground)" }}>{p.title}</h3>
                    <p className="mt-2 flex-1 text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>{p.copy}</p>
                    <Link href={p.href} className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold transition-opacity hover:opacity-75" style={{ color: p.accent }}>
                      {p.cta} <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── 9. PRICING / MEMBERSHIP TEASER ── */}
      <section className="relative overflow-hidden px-6 py-20 md:py-28" style={{ background: "#f4f8f0" }}>
        <div className="relative mx-auto max-w-[960px]">
          <ScrollReveal>
            <div className="mb-12 text-center">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest" style={{ background: "color-mix(in srgb, var(--icon-lime) 15%, transparent)", color: "var(--icon-green)" }}>
                <Zap size={11} /> One clear path
              </div>
              <h2 className="font-serif text-4xl font-semibold tracking-tight text-foreground sm:text-5xl text-balance">
                Free score.{" "}
                <span style={{ background: "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange), var(--icon-green))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Personal report.</span>
              </h2>
              <p className="mt-4 mx-auto max-w-lg text-base leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
                Start with the free assessment to get your EatoBetics Score. Then unlock your Personal Report and 30-day glucose protocol.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid gap-5 sm:grid-cols-2">
            <ScrollReveal delay={60}>
              <div className="flex h-full flex-col rounded-3xl border bg-card p-8">
                <div className="mb-5 h-1 w-full rounded-full" style={{ background: "linear-gradient(90deg, var(--icon-lime), var(--icon-green))" }} />
                <p className="mb-1 text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--icon-green)" }}>Free Assessment</p>
                <p className="mb-1 font-serif text-3xl font-bold text-foreground">Free</p>
                <p className="mb-5 text-sm text-muted-foreground">Your EatoBetics Score and where to start. No card required.</p>
                <ul className="mb-6 flex-1 space-y-2.5">
                  {["EatoBetics Score across 3 pillars", "Your glucose profile", "Your biggest opportunity", "A taste of your 30-day focus"].map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                      <Check size={13} className="mt-0.5 shrink-0" style={{ color: "var(--icon-green)" }} /> {f}
                    </li>
                  ))}
                </ul>
                <Link href={ASSESSMENT_HREF} className="flex items-center justify-center gap-2 rounded-full py-3 text-sm font-semibold text-white transition-all hover:opacity-90 hover:shadow-lg" style={{ background: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))" }}>
                  Take the free assessment <ArrowRight size={14} />
                </Link>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={120}>
              <div className="relative flex h-full flex-col rounded-3xl border-2 bg-card p-8 shadow-lg" style={{ borderColor: "color-mix(in srgb, var(--icon-orange) 45%, transparent)" }}>
                <div className="mb-5 h-1 w-full rounded-full" style={{ background: "linear-gradient(90deg, var(--icon-yellow), var(--icon-orange))" }} />
                <p className="mb-1 text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--icon-orange)" }}>Personal Report</p>
                <p className="mb-1 font-serif text-3xl font-bold text-foreground">€49 <span className="text-base font-normal text-muted-foreground">one-time</span></p>
                <p className="mb-5 text-sm text-muted-foreground">Personalised from your assessment. Yours to keep.</p>
                <ul className="mb-6 flex-1 space-y-2.5">
                  {["Full glucose profile & energy score", "Your 30-day glucose protocol", "Meal timing & food-order guidance", "Top food swaps for steadier curves", "Meal intelligence tools"].map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                      <Check size={13} className="mt-0.5 shrink-0" style={{ color: "var(--icon-orange)" }} /> {f}
                    </li>
                  ))}
                </ul>
                <Link href={ASSESSMENT_HREF} className="flex items-center justify-center gap-2 rounded-full py-3 text-sm font-semibold text-white transition-all hover:opacity-90 hover:shadow-lg" style={{ background: "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange))" }}>
                  Start with the assessment <ArrowRight size={14} />
                </Link>
              </div>
            </ScrollReveal>
          </div>

          <ScrollReveal delay={220}>
            <p className="mt-6 text-center text-xs text-muted-foreground">
              EatoBetics is in early access and actively in development. The free assessment is available now.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* ── 10. TESTIMONIALS ── */}
      <section className="relative overflow-hidden px-6 py-24 md:py-32" style={{ background: "linear-gradient(180deg, #F4F9EF 0%, #FFFFFF 100%)" }}>
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[420px]" style={{ background: "radial-gradient(60% 70% at 50% 0%, color-mix(in srgb, var(--icon-green) 14%, transparent), transparent 70%)" }} />
        <div className="relative z-10 mx-auto max-w-[1200px]">
          <ScrollReveal className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--icon-green)" }}>What People Notice</p>
            <h2 className="mt-4 font-serif text-4xl font-semibold text-foreground sm:text-5xl text-balance">Small changes, real difference.</h2>
            <p className="mt-4 mx-auto max-w-xl text-base leading-relaxed text-muted-foreground">
              When you understand your glucose system, the changes come naturally — steadier energy, fewer crashes, better numbers.
            </p>
          </ScrollReveal>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {TESTIMONIALS.map((t, i) => {
              const gain = t.to - t.from
              return (
                <ScrollReveal key={t.name} delay={i * 90}>
                  <div className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-white bg-white p-7 shadow-[0_10px_40px_-12px_rgba(26,46,18,0.18)] ring-1 ring-black/[0.03] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_24px_60px_-18px_rgba(26,46,18,0.28)]">
                    <div className="absolute inset-x-0 top-0 h-1.5" style={{ background: t.gradient }} />
                    <Quote size={56} className="pointer-events-none absolute -right-2 -top-1 opacity-[0.06]" style={{ color: t.color }} fill="currentColor" />
                    <div className="mb-4 flex gap-0.5">
                      {[...Array(5)].map((_, j) => (
                        <Star key={j} size={15} style={{ color: t.color }} fill="currentColor" strokeWidth={0} />
                      ))}
                    </div>
                    <p className="flex-1 text-[15px] leading-relaxed text-foreground/85">&ldquo;{t.quote}&rdquo;</p>
                    <div className="mt-6 rounded-2xl bg-secondary/60 p-4">
                      <div className="mb-2 flex items-center justify-between text-xs font-semibold">
                        <span className="text-muted-foreground">EatoBetics Score · {t.weeks} weeks</span>
                        <span style={{ color: t.color }}>+{gain} points</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-serif text-sm font-bold text-muted-foreground">{t.from}</span>
                        <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-muted">
                          <div className="absolute inset-y-0 left-0 rounded-full transition-all duration-700 group-hover:brightness-105" style={{ width: `${t.to}%`, background: t.gradient }} />
                        </div>
                        <span className="font-serif text-lg font-bold" style={{ color: t.color }}>{t.to}</span>
                      </div>
                    </div>
                    <div className="mt-5 flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ring-2 ring-white" style={{ background: t.gradient, boxShadow: `0 4px 12px -2px color-mix(in srgb, ${t.color} 50%, transparent)` }}>
                        {t.avatar}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{t.name}</p>
                        <p className="text-xs text-muted-foreground">{t.role}</p>
                      </div>
                    </div>
                  </div>
                </ScrollReveal>
              )
            })}
          </div>
          <p className="mt-8 text-center text-xs text-muted-foreground/80">
            Illustrative scenarios based on the EatoBetics approach. EatoBetics is in early access — results vary from person to person.
          </p>
        </div>
      </section>

      {/* ── 11. WHO IT IS FOR ── */}
      <section className="px-6 py-24 md:py-32">
        <div className="mx-auto max-w-[1200px]">
          <ScrollReveal className="mx-auto max-w-3xl text-center">
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--icon-teal)" }}>Who It&apos;s For</p>
            <SectionHeading>Who EatoBetics is for</SectionHeading>
          </ScrollReveal>
          <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {AUDIENCES.map((a, i) => (
              <ScrollReveal key={a.title} delay={i * 60}>
                <div className={CARD}>
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: `color-mix(in srgb, var(--icon-green) 14%, transparent)` }}>
                    <Check size={18} style={{ color: "var(--icon-green)" }} />
                  </div>
                  <h3 className="mt-4 font-serif text-lg font-bold" style={{ color: "var(--foreground)" }}>{a.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>{a.body}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
          <p className="mx-auto mt-10 max-w-2xl text-center text-sm" style={{ color: "var(--muted-foreground)" }}>
            EatoBetics supports understanding and helps people have better conversations with healthcare professionals. It is food intelligence — not medical treatment.
          </p>

          {/* GLP-1 Companion callout */}
          <ScrollReveal>
            <Link href="/eatobetics/glp1" className="group mt-12 block">
              <div className="relative overflow-hidden rounded-[2rem] border border-[#f0e6cf] p-8 shadow-[0_14px_50px_-22px_rgba(245,166,35,0.4)] transition-all duration-300 hover:-translate-y-1 md:p-10" style={{ background: "linear-gradient(150deg, #FBF6EA 0%, #FFFFFF 55%, #F1F8EC 100%)" }}>
                <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full opacity-50 blur-3xl" style={{ background: "radial-gradient(circle, color-mix(in srgb, var(--icon-yellow) 30%, transparent), transparent 70%)" }} />
                <div className="relative z-10 flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white shadow-sm" style={{ background: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))" }}>
                      <Syringe size={22} />
                    </div>
                    <div>
                      <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--icon-orange)" }}>New · GLP-1 Companion</span>
                      <h3 className="mt-1 font-serif text-2xl font-bold" style={{ color: "var(--foreground)" }}>On Ozempic, Wegovy, or Mounjaro?</h3>
                      <p className="mt-1.5 max-w-xl text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
                        Keep the muscle, not just lose the weight. Estimate your protein target and get a muscle-smart plan for your appetite window.
                      </p>
                    </div>
                  </div>
                  <span className="brand-gradient inline-flex shrink-0 items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white shadow-lg transition-transform group-hover:scale-[1.03]">
                    Explore <ArrowRight size={15} />
                  </span>
                </div>
              </div>
            </Link>
          </ScrollReveal>
        </div>
      </section>

      {/* ── 12. EATOBIOTICS + EATOBETICS ── */}
      <section className="px-6 py-24 md:py-32" style={{ background: "#f4f8f0" }}>
        <div className="mx-auto max-w-[1100px]">
          <ScrollReveal className="mx-auto max-w-3xl text-center">
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--icon-green)" }}>Two Systems</p>
            <SectionHeading>Gut intelligence + glucose intelligence</SectionHeading>
            <p className="mt-6 text-lg leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
              EatoBiotics maps your gut food system. EatoBetics maps your glucose system. Together, they help you understand the food system inside you.
            </p>
          </ScrollReveal>
          <div className="mt-14 grid gap-6 md:grid-cols-2">
            <ScrollReveal>
              <div className="relative h-full overflow-hidden rounded-3xl border border-[#d8e7cc] bg-[#f1f8ec] p-8 shadow-[0_12px_44px_-20px_rgba(76,182,72,0.35)]">
                <div className="absolute inset-x-0 top-0 h-1.5" style={{ background: GRADS[0] }} />
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-sm" style={{ background: GRADS[0] }}><Leaf size={22} /></div>
                <h3 className="mt-4 font-serif text-2xl font-bold" style={{ color: "var(--foreground)" }}>EatoBiotics</h3>
                <p className="mt-1 text-sm font-semibold" style={{ color: "var(--icon-green)" }}>The Food System Inside You</p>
                <ul className="mt-4 space-y-2 text-sm" style={{ color: "var(--muted-foreground)" }}>
                  {["Gut health", "Microbiome diversity", "Fibre", "Fermented foods", "Digestion", "Internal ecosystem"].map((x) => (
                    <li key={x} className="flex items-center gap-2"><Check size={14} style={{ color: "var(--icon-green)" }} /> {x}</li>
                  ))}
                </ul>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={100}>
              <div className="relative h-full overflow-hidden rounded-3xl border border-[#f0e6cf] bg-[#fbf6ea] p-8 shadow-[0_12px_44px_-20px_rgba(245,166,35,0.35)]">
                <div className="absolute inset-x-0 top-0 h-1.5" style={{ background: GRADS[2] }} />
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-sm" style={{ background: GRADS[2] }}><Activity size={22} /></div>
                <h3 className="mt-4 font-serif text-2xl font-bold" style={{ color: "var(--foreground)" }}>EatoBetics</h3>
                <p className="mt-1 text-sm font-semibold" style={{ color: "var(--icon-orange)" }}>The Glucose System Inside You</p>
                <ul className="mt-4 space-y-2 text-sm" style={{ color: "var(--muted-foreground)" }}>
                  {["Glucose stability", "Energy", "Cravings", "Meal timing", "Insulin sensitivity", "Metabolic rhythm"].map((x) => (
                    <li key={x} className="flex items-center gap-2"><Check size={14} style={{ color: "var(--icon-orange)" }} /> {x}</li>
                  ))}
                </ul>
              </div>
            </ScrollReveal>
          </div>
          <p className="mx-auto mt-8 max-w-2xl text-center text-base leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
            The gut and glucose systems are deeply connected. EatoBetics builds on the EatoBiotics model to help people understand how food affects both their internal ecosystem and their metabolic response.
          </p>
        </div>
      </section>

      {/* ── 13. 30-DAY PROTOCOL ── */}
      <section className="px-6 py-24 md:py-32">
        <div className="mx-auto max-w-[1200px]">
          <ScrollReveal className="mx-auto max-w-3xl text-center">
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--icon-orange)" }}>The Protocol</p>
            <SectionHeading>Your 30-Day EatoBetics Protocol</SectionHeading>
          </ScrollReveal>
          <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {WEEKS.map((w, i) => (
              <ScrollReveal key={w.week} delay={i * 80}>
                <div className={CARD}>
                  <span className="inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider text-white shadow-sm" style={{ background: w.gradient }}>{w.week}</span>
                  <h3 className="mt-4 font-serif text-lg font-bold" style={{ color: "var(--foreground)" }}>{w.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>{w.body}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link href={ASSESSMENT_HREF} className={PRIMARY_CTA}>Take the free assessment <ArrowRight size={16} /></Link>
          </div>
        </div>
      </section>

      {/* ── 14. FAQ ── */}
      <EatobeticsFaq />

      {/* ── 15. EATOSYSTEM ── */}
      <section className="px-6 py-24 md:py-32" style={{ background: "#f4f8f0" }}>
        <div className="mx-auto max-w-3xl text-center">
          <ScrollReveal>
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-3xl text-white shadow-md" style={{ background: GRADS[3] }}>
              <Globe size={28} />
            </div>
            <SectionHeading>Part of the EatoSystem</SectionHeading>
            <p className="mt-6 text-lg leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
              EatoBetics is part of a broader mission to help people Eat Optimal for Health, Community, and the Environment.
            </p>
            <p className="mt-4 text-lg leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
              The long-term vision is not a world where everyone is managing a condition. It is a world where people understand their bodies early enough to make better food decisions before problems compound. EatoBetics brings personal glucose intelligence into the wider EatoSystem: connecting food, health, education, technology, and local food systems.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* ── 16. FINAL CTA ── */}
      <section className="px-6 py-8">
        <div className="relative mx-auto max-w-[1200px] overflow-hidden rounded-[2.5rem] px-6 py-20 text-center md:py-28" style={{ background: "linear-gradient(135deg, #14250F 0%, #1A2E12 45%, #2C3A12 100%)" }}>
          <div aria-hidden className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full opacity-40 blur-3xl" style={{ background: "radial-gradient(circle, var(--icon-green), transparent 70%)" }} />
          <div aria-hidden className="pointer-events-none absolute -bottom-24 -right-16 h-80 w-80 rounded-full opacity-30 blur-3xl" style={{ background: "radial-gradient(circle, var(--icon-yellow), transparent 70%)" }} />
          <div aria-hidden className="absolute inset-x-0 top-0 h-1" style={{ background: "linear-gradient(90deg, var(--icon-lime), var(--icon-green), var(--icon-teal), var(--icon-yellow), var(--icon-orange))" }} />
          <div className="relative z-10">
            <ScrollReveal>
              <p className="mb-4 text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--icon-lime)" }}>Start today</p>
              <h2 className="mx-auto max-w-2xl font-serif text-4xl font-semibold leading-tight text-white sm:text-5xl text-balance">
                Ready to understand your{" "}
                <span style={{ background: "linear-gradient(90deg, var(--icon-lime), var(--icon-yellow))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>glucose system?</span>
              </h2>
              <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-white/70 sm:text-lg">
                Take the free EatoBetics assessment, get your Glucose Intelligence Score, and join early access to help shape a new food intelligence platform.
              </p>
            </ScrollReveal>
            <ScrollReveal delay={120}>
              <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link href={ASSESSMENT_HREF} className="brand-gradient inline-flex items-center gap-2 rounded-full px-8 py-4 text-base font-semibold text-white shadow-xl shadow-black/30 transition-all hover:opacity-90">
                  Take the free assessment <ArrowRight size={16} />
                </Link>
                <Link href="/eatobetics/glp1" className="inline-flex items-center gap-2 rounded-full border border-white/25 px-8 py-4 text-base font-semibold text-white transition-colors hover:bg-white/10">
                  Explore the GLP-1 Companion
                </Link>
              </div>
              <p className="mt-6 text-sm text-white/55">Currently in development.</p>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ── 17. DISCLAIMER ── */}
      <section className="px-6 py-12" style={{ background: "#f7f7f5" }}>
        <div className="mx-auto flex max-w-3xl items-start gap-3">
          <ShieldCheck size={18} className="mt-0.5 shrink-0" style={{ color: "var(--muted-foreground)" }} />
          <p className="text-xs leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
            EatoBetics is an educational food intelligence platform. It does not diagnose, treat, cure, or prevent diabetes or any medical condition. The information provided is for general education and lifestyle support only. Always consult a qualified healthcare professional for medical advice, diagnosis, testing, or treatment, especially if you have diabetes, prediabetes, use medication, or have concerns about your blood glucose.
          </p>
        </div>
      </section>

      {/* ── 18. STICKY CTA (mobile) ── */}
      <EatobeticsStickyCta />
    </main>
  )
}
