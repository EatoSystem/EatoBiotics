import type { Metadata } from "next"
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

const PRIMARY_CTA =
  "brand-gradient inline-flex items-center justify-center gap-2 rounded-full px-8 py-4 text-base font-semibold text-white shadow-lg shadow-icon-green/20 transition-all hover:opacity-90 hover:shadow-xl"

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-serif text-3xl font-bold leading-tight text-balance sm:text-4xl lg:text-5xl" style={{ color: "var(--foreground)" }}>
      {children}
    </h2>
  )
}

/* ── Data ─────────────────────────────────────────────────────────────── */

const PROBLEMS = [
  { icon: Zap, title: "Energy Crashes", body: "Post-meal tiredness, afternoon fog, and unstable energy can often be connected to meal composition, timing, sleep, stress, and glucose response." },
  { icon: Cookie, title: "Cravings & Hunger", body: "Craving cycles are not always about discipline. They can be signals from an unstable food and glucose rhythm." },
  { icon: TrendingUp, title: "Long-Term Risk", body: "Glucose instability and insulin resistance can build quietly over time. Understanding patterns early can help people make better food and lifestyle decisions." },
]

const STEPS = [
  { icon: ClipboardCheck, n: "1", title: "Assess Your Glucose System", body: "A guided assessment explores your food rhythm, energy patterns, cravings, sleep, stress, activity, blood test awareness, and metabolic risk signals." },
  { icon: FileText, n: "2", title: "Receive Your EatoBetics Report", body: "Your personalised report gives you an EatoBetics Score, glucose profile, strengths, improvement areas, and your 30-day glucose intelligence focus." },
  { icon: Utensils, n: "3", title: "Analyse Your Meals", body: "Every meal can be viewed through a glucose intelligence lens: fibre, protein, fat, carbohydrate type, processing level, food order, timing, and movement." },
  { icon: Target, n: "4", title: "Improve One Pattern at a Time", body: "EatoBetics does not shame, restrict, or overwhelm. It helps you understand one meal, one habit, and one pattern at a time." },
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
  { week: "Week 1", title: "Stabilise", body: "Identify your biggest glucose pattern and improve your meal rhythm." },
  { week: "Week 2", title: "Build Better Plates", body: "Increase protein, fibre, and food quality across your most repeated meals." },
  { week: "Week 3", title: "Flatten the Curve", body: "Use food order, movement, resistant starch, and smarter carbohydrate choices." },
  { week: "Week 4", title: "Sustain the System", body: "Create repeatable meals and habits that support long-term metabolic resilience." },
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
      {/* ── 1. HERO ── */}
      <section className="relative px-6 pt-16 pb-20 md:pt-20 md:pb-28">
        <div className="mx-auto max-w-3xl text-center">
          <ScrollReveal>
            {/* Illustration. Drop the asset at public/images/eatobetics-hero.webp;
                a soft gold→green gradient shows as a graceful fallback until then. */}
            <div
              role="img"
              aria-label="Two figures rendered in green and gold light with a glucose curve flowing through the body, symbolising the glucose system inside you."
              className="mx-auto mb-9 aspect-[3/2] w-full max-w-[640px] rounded-3xl"
              style={{
                background:
                  "url('/images/eatobetics-hero.png') center / contain no-repeat, radial-gradient(110% 80% at 50% 38%, rgba(245,197,24,0.20), rgba(76,182,72,0.12) 48%, #ffffff 80%)",
              }}
            />
            <span className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-semibold uppercase tracking-wider" style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }}>
              <Sparkles size={14} style={{ color: "var(--icon-yellow)" }} /> Glucose Intelligence by Eato
            </span>
            <h1 className="mt-5 font-serif text-4xl font-bold leading-[1.08] text-balance sm:text-5xl lg:text-6xl">
              <span style={{ color: "var(--foreground)" }}>The </span>
              <span style={{ color: "var(--icon-orange)" }}>Glucose</span>
              <span style={{ color: "var(--foreground)" }}> System Inside </span>
              <span style={{ color: "var(--icon-green)" }}>You</span>
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed sm:text-xl" style={{ color: "var(--muted-foreground)" }}>
              Personal food intelligence for energy, cravings, and metabolic health.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/assessment"
                className="inline-flex items-center justify-center gap-2 rounded-full px-8 py-4 text-base font-semibold text-white shadow-lg transition-all hover:opacity-90"
                style={{ background: "var(--foreground)" }}
              >
                Join Early Access <ArrowRight size={16} />
              </Link>
              <Link
                href="/assessment"
                className="inline-flex items-center justify-center gap-2 rounded-full border px-8 py-4 text-base font-semibold transition-colors hover:bg-[#f4f8f0]"
                style={{ borderColor: "var(--icon-green)", color: "var(--icon-green)" }}
              >
                Start Glucose Assessment
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ── 2. PROBLEM ── */}
      <section className="px-6 py-24 md:py-32">
        <div className="mx-auto max-w-[1200px]">
          <ScrollReveal className="mx-auto max-w-3xl text-center">
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
                <div className="h-full rounded-2xl border border-[#e8efe2] bg-white p-7 shadow-sm">
                  <p.icon size={26} style={{ color: "var(--icon-orange)" }} />
                  <h3 className="mt-4 font-serif text-xl font-bold" style={{ color: "var(--foreground)" }}>{p.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>{p.body}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. WHAT IT DOES ── */}
      <section className="px-6 py-24 md:py-32" style={{ background: "#f4f8f0" }}>
        <div className="mx-auto max-w-[1200px]">
          <ScrollReveal className="mx-auto max-w-3xl text-center">
            <SectionHeading>What EatoBetics does</SectionHeading>
            <p className="mt-6 text-lg leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
              EatoBetics is a food intelligence platform built around one central question: <span className="font-semibold" style={{ color: "var(--foreground)" }}>How does what you eat affect your glucose system?</span>
            </p>
          </ScrollReveal>
          <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <ScrollReveal key={s.n} delay={i * 80}>
                <div className="h-full rounded-2xl border border-[#e1ead8] bg-white p-7 shadow-sm">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full font-serif text-sm font-bold text-white" style={{ background: "var(--icon-green)" }}>{s.n}</span>
                    <s.icon size={22} style={{ color: "var(--icon-teal)" }} />
                  </div>
                  <h3 className="mt-4 font-serif text-lg font-bold" style={{ color: "var(--foreground)" }}>{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>{s.body}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. REPORT PREVIEW ── */}
      <section className="px-6 py-24 md:py-32">
        <div className="mx-auto max-w-[1200px]">
          <ScrollReveal className="mx-auto max-w-3xl text-center">
            <SectionHeading>Your personal EatoBetics Report</SectionHeading>
            <p className="mt-6 text-lg leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
              The EatoBetics Report is designed to turn your food and lifestyle patterns into clear, practical glucose intelligence.
            </p>
          </ScrollReveal>
          <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {REPORT_SECTIONS.map((r, i) => (
              <ScrollReveal key={r.title} delay={i * 60}>
                <div className="h-full rounded-2xl p-6" style={{ background: "#f4f8f0", border: "1px solid #e1ead8" }}>
                  <h3 className="font-serif text-lg font-bold" style={{ color: "var(--foreground)" }}>{r.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>{r.body}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link href="/assessment" className="inline-flex items-center gap-2 rounded-full border-2 px-7 py-3 text-sm font-semibold transition-colors hover:bg-[#f4f8f0]" style={{ borderColor: "var(--icon-green)", color: "var(--icon-green)" }}>
              View Sample Report <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── 5. GLUCOSE INTELLIGENCE LENS ── */}
      <section className="px-6 py-24 md:py-32" style={{ background: "var(--foreground)" }}>
        <div className="mx-auto max-w-[1200px]">
          <ScrollReveal className="mx-auto max-w-3xl text-center">
            <h2 className="font-serif text-3xl font-bold text-balance text-white sm:text-4xl lg:text-5xl">The Glucose Intelligence Lens</h2>
            <p className="mt-6 text-lg leading-relaxed text-white/75">
              EatoBetics does not just ask what you ate. It helps you understand how the meal was built.
            </p>
          </ScrollReveal>
          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {LENS.map((l, i) => (
              <ScrollReveal key={l.title} delay={i * 50}>
                <div className="h-full rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
                  <l.icon size={24} style={{ color: "var(--icon-lime)" }} />
                  <h3 className="mt-3 font-serif text-lg font-bold text-white">{l.title}</h3>
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
            <SectionHeading>One meal. One change. A better curve.</SectionHeading>
          </ScrollReveal>
          <div className="mt-14 grid gap-6 md:grid-cols-2">
            <ScrollReveal>
              <div className="h-full rounded-2xl border border-[#f0e2cf] bg-[#fdf8ef] p-7">
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--icon-orange)" }}>Before</span>
                <h3 className="mt-2 font-serif text-xl font-bold" style={{ color: "var(--foreground)" }}>Standard Lunch</h3>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>White rice, chicken, sauce, small portion of vegetables.</p>
                <p className="mt-4 text-sm leading-relaxed"><span className="font-semibold" style={{ color: "var(--foreground)" }}>Likely glucose issue:</span> <span style={{ color: "var(--muted-foreground)" }}>Fast carbohydrate load, low fibre volume, limited glucose buffer.</span></p>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={100}>
              <div className="h-full rounded-2xl border border-[#d8e7cc] bg-[#f1f8ec] p-7">
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--icon-green)" }}>EatoBetics improvement</span>
                <h3 className="mt-2 font-serif text-xl font-bold" style={{ color: "var(--foreground)" }}>Rebuilt Lunch</h3>
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
            <SectionHeading>Who EatoBetics is for</SectionHeading>
          </ScrollReveal>
          <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {AUDIENCES.map((a, i) => (
              <ScrollReveal key={a.title} delay={i * 60}>
                <div className="h-full rounded-2xl border border-[#e1ead8] bg-white p-7 shadow-sm">
                  <h3 className="font-serif text-lg font-bold" style={{ color: "var(--foreground)" }}>{a.title}</h3>
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
            <SectionHeading>Gut intelligence + glucose intelligence</SectionHeading>
            <p className="mt-6 text-lg leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
              EatoBiotics maps your gut food system. EatoBetics maps your glucose system. Together, they help you understand the food system inside you.
            </p>
          </ScrollReveal>
          <div className="mt-14 grid gap-6 md:grid-cols-2">
            <ScrollReveal>
              <div className="h-full rounded-3xl border border-[#d8e7cc] bg-[#f1f8ec] p-8">
                <Leaf size={28} style={{ color: "var(--icon-green)" }} />
                <h3 className="mt-4 font-serif text-2xl font-bold" style={{ color: "var(--foreground)" }}>EatoBiotics</h3>
                <p className="mt-1 text-sm font-semibold" style={{ color: "var(--icon-green)" }}>The Food System Inside You</p>
                <ul className="mt-4 space-y-1.5 text-sm" style={{ color: "var(--muted-foreground)" }}>
                  {["Gut health", "Microbiome diversity", "Fibre", "Fermented foods", "Digestion", "Internal ecosystem"].map((x) => <li key={x}>· {x}</li>)}
                </ul>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={100}>
              <div className="h-full rounded-3xl border border-[#f0e6cf] bg-[#fbf6ea] p-8">
                <Activity size={28} style={{ color: "var(--icon-orange)" }} />
                <h3 className="mt-4 font-serif text-2xl font-bold" style={{ color: "var(--foreground)" }}>EatoBetics</h3>
                <p className="mt-1 text-sm font-semibold" style={{ color: "var(--icon-orange)" }}>The Glucose System Inside You</p>
                <ul className="mt-4 space-y-1.5 text-sm" style={{ color: "var(--muted-foreground)" }}>
                  {["Glucose stability", "Energy", "Cravings", "Meal timing", "Insulin sensitivity", "Metabolic rhythm"].map((x) => <li key={x}>· {x}</li>)}
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
            <SectionHeading>Your 30-Day EatoBetics Protocol</SectionHeading>
          </ScrollReveal>
          <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {WEEKS.map((w, i) => (
              <ScrollReveal key={w.week} delay={i * 80}>
                <div className="h-full rounded-2xl border border-[#e1ead8] bg-white p-7 shadow-sm">
                  <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--icon-teal)" }}>{w.week}</span>
                  <h3 className="mt-2 font-serif text-lg font-bold" style={{ color: "var(--foreground)" }}>{w.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>{w.body}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link href="/assessment" className={PRIMARY_CTA}>Start Glucose Assessment <ArrowRight size={16} /></Link>
          </div>
        </div>
      </section>

      {/* ── 10. STANDALONE PRODUCT MODEL ── */}
      <section className="px-6 py-24 md:py-32">
        <div className="mx-auto max-w-[1200px]">
          <ScrollReveal className="mx-auto max-w-3xl text-center">
            <SectionHeading>A standalone platform modelled from EatoBiotics</SectionHeading>
            <p className="mt-6 text-lg leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
              EatoBetics is being developed as its own platform, assessment, report, meal intelligence tool, and AI consultation model — focused specifically on glucose, energy, cravings, and metabolic food response.
            </p>
          </ScrollReveal>
          <div className="mt-14 grid gap-5 md:grid-cols-3 lg:grid-cols-5">
            {PRODUCT_STACK.map((p, i) => (
              <ScrollReveal key={p.title} delay={i * 60}>
                <div className="h-full rounded-2xl border border-[#e8efe2] bg-white p-6 shadow-sm">
                  <h3 className="font-serif text-base font-bold" style={{ color: "var(--foreground)" }}>{p.title}</h3>
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
            <Globe size={32} className="mx-auto mb-5" style={{ color: "var(--icon-green)" }} />
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
      <section className="px-6 py-24 md:py-32" style={{ background: "linear-gradient(135deg, var(--foreground) 0%, #1f3d1a 55%, #3a4d12 100%)" }}>
        <div className="mx-auto max-w-2xl text-center">
          <ScrollReveal>
            <h2 className="font-serif text-3xl font-bold text-balance text-white sm:text-4xl lg:text-5xl">Ready to understand your glucose system?</h2>
            <p className="mt-6 text-lg leading-relaxed text-white/80">
              Join early access to EatoBetics and help shape a new food intelligence platform for glucose, energy, cravings, and metabolic health.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/assessment" className={PRIMARY_CTA}>Join Early Access <ArrowRight size={16} /></Link>
              <Link href="/assessment" className="inline-flex items-center justify-center gap-2 rounded-full border border-white/30 px-8 py-4 text-base font-semibold text-white transition-all hover:bg-white/10">
                Start Glucose Assessment
              </Link>
            </div>
            <p className="mt-5 text-sm text-white/55">Currently in development.</p>
          </ScrollReveal>
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
