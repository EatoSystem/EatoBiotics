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
} from "lucide-react"
import { ScrollReveal } from "@/components/scroll-reveal"

export const metadata: Metadata = {
  title: { absolute: "EatoBetics | The Glucose System Inside You" },
  description:
    "EatoBetics is a glucose intelligence platform that helps people understand how food affects energy, cravings, glucose stability, and long-term metabolic health.",
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

const PRODUCT_STACK = [
  { title: "Free Assessment", body: "Understand your current glucose system signals." },
  { title: "Personal Report", body: "Receive your EatoBetics Score, profile, and 30-day focus." },
  { title: "Meal Intelligence", body: "Log or build meals through the glucose intelligence lens." },
  { title: "Weekly Consultation", body: "Review your patterns with an AI food intelligence consultant." },
  { title: "Ongoing Subscription", body: "Track improvement and build your glucose food system over time." },
]

/* ── Page ─────────────────────────────────────────────────────────────── */

export default function EatoBeticsPage() {
  return (
    <main className="overflow-hidden bg-white">
      {/* ── 1. HERO (homepage two-column layout) ── */}
      <section className="relative min-h-screen overflow-hidden px-6 pt-20 pb-16 md:pb-20">
        <div className="relative z-10 mx-auto flex max-w-[1200px] min-h-[calc(100vh-160px)] flex-col items-center justify-center gap-12 md:flex-row md:gap-16 lg:gap-20">

          {/* ── Left: Image ── */}
          <ScrollReveal delay={60} className="flex-1 flex items-center justify-center w-full max-w-[620px]">
            <div className="relative w-full">
              {/* Soft glucose-gold → green glow; also a graceful backdrop until the
                  asset is dropped at public/images/eatobetics-hero.png */}
              <div
                aria-hidden
                className="absolute inset-0 -z-10 blur-3xl"
                style={{
                  background:
                    "radial-gradient(60% 60% at 50% 48%, rgba(245,197,24,0.22), rgba(76,182,72,0.12) 55%, transparent 78%)",
                }}
              />
              {/* TODO: swap src to /images/eatobetics-hero.png once the glucose
                  illustration is uploaded. Using the homepage illustration as a
                  temporary on-brand placeholder so the hero is never empty. */}
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
                <Link
                  href="#how-it-works"
                  className="text-sm font-medium text-muted-foreground underline underline-offset-4 transition-colors hover:text-foreground"
                >
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
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                        {s.label}
                      </p>
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

      {/* ── 3. WHAT IT DOES ── */}
      <section id="how-it-works" className="relative overflow-hidden px-6 py-24 md:py-32" style={{ background: "linear-gradient(180deg, #F4F9EF 0%, #FFFFFF 100%)" }}>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-[360px]"
          style={{ background: "radial-gradient(55% 70% at 50% 0%, color-mix(in srgb, var(--icon-green) 12%, transparent), transparent 70%)" }}
        />
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

      {/* ── 4. REPORT PREVIEW ── */}
      <section className="px-6 py-24 md:py-32">
        <div className="mx-auto max-w-[1200px]">
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
            <Link href={ASSESSMENT_HREF} className="inline-flex items-center gap-2 rounded-full border-2 px-7 py-3 text-sm font-semibold transition-colors hover:bg-[#f4f8f0]" style={{ borderColor: "var(--icon-green)", color: "var(--icon-green)" }}>
              Take the assessment <ArrowRight size={15} />
            </Link>
          </div>
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
            {/* Connector */}
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

      {/* ── 7. WHO IT IS FOR ── */}
      <section className="px-6 py-24 md:py-32" style={{ background: "#f4f8f0" }}>
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
        </div>
      </section>

      {/* ── 8. EATOBIOTICS + EATOBETICS ── */}
      <section className="px-6 py-24 md:py-32">
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

      {/* ── 9. 30-DAY PROTOCOL ── */}
      <section className="px-6 py-24 md:py-32" style={{ background: "#f4f8f0" }}>
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

      {/* ── 10. STANDALONE PRODUCT MODEL ── */}
      <section className="px-6 py-24 md:py-32">
        <div className="mx-auto max-w-[1200px]">
          <ScrollReveal className="mx-auto max-w-3xl text-center">
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--icon-teal)" }}>The Platform</p>
            <SectionHeading>A standalone platform modelled from EatoBiotics</SectionHeading>
            <p className="mt-6 text-lg leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
              EatoBetics is being developed as its own platform, assessment, report, meal intelligence tool, and AI consultation model — focused specifically on glucose, energy, cravings, and metabolic food response.
            </p>
          </ScrollReveal>
          <div className="mt-14 grid gap-5 md:grid-cols-3 lg:grid-cols-5">
            {PRODUCT_STACK.map((p, i) => (
              <ScrollReveal key={p.title} delay={i * 60}>
                <div className="group h-full rounded-2xl border border-black/[0.05] bg-white p-6 shadow-[0_8px_30px_-14px_rgba(26,46,18,0.16)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_50px_-20px_rgba(26,46,18,0.26)]">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl font-serif text-sm font-bold text-white shadow-sm" style={{ background: GRADS[i % GRADS.length] }}>{i + 1}</span>
                  <h3 className="mt-4 font-serif text-base font-bold" style={{ color: "var(--foreground)" }}>{p.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>{p.body}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── 11. EATOSYSTEM ── */}
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

      {/* ── 12. FINAL CTA ── */}
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
                <Link href="/eatobetics" className="inline-flex items-center gap-2 rounded-full border border-white/25 px-8 py-4 text-base font-semibold text-white transition-colors hover:bg-white/10">
                  Join early access
                </Link>
              </div>
              <p className="mt-6 text-sm text-white/55">Currently in development.</p>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ── 13. DISCLAIMER ── */}
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
