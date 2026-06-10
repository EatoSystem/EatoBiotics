import type { Metadata } from "next"
import Link from "next/link"
import {
  ArrowRight, ClipboardCheck, LineChart, Sparkles, Droplets, Moon, Footprints,
  Salad, Activity, GaugeCircle, Timer, ShieldCheck,
} from "lucide-react"
import { ScrollReveal } from "@/components/scroll-reveal"
import { StabilityHero } from "@/components/stability/StabilityHero"
import { RedFlagWarning } from "@/components/stability/RedFlagWarning"
import { MedicalDisclaimer } from "@/components/stability/MedicalDisclaimer"
import { STABILITY_BANDS } from "@/lib/stability/scoring"

export const metadata: Metadata = {
  title: { absolute: "EatoBiotics Stability™ — Understand Your Gut. Reduce Urgency. Build Stability." },
  description:
    "An educational digestive-stability tool to track stool quality, urgency, food triggers, and lifestyle patterns — and build confidence in everyday life. Not a medical device.",
}

const GRADS = [
  "linear-gradient(135deg, var(--icon-lime), var(--icon-green))",
  "linear-gradient(135deg, var(--icon-green), var(--icon-teal))",
  "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange))",
  "linear-gradient(135deg, var(--icon-teal), var(--icon-green))",
]
const CARD = "h-full rounded-3xl border border-black/[0.05] bg-white p-6 shadow-[0_10px_40px_-16px_rgba(26,46,18,0.16)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_60px_-22px_rgba(26,46,18,0.26)]"

const MEASURES = [
  { icon: GaugeCircle, title: "Stool Stability", body: "Consistency and form, tracked over time." },
  { icon: Timer, title: "Urgency", body: "How often and how strongly the urge arrives." },
  { icon: Activity, title: "Digestive Comfort", body: "Bloating, discomfort, and how settled you feel." },
  { icon: Salad, title: "Food Diversity", body: "Plant variety, fibre, and fermented foods." },
  { icon: Droplets, title: "Hydration", body: "Steady fluids that support regularity." },
  { icon: Moon, title: "Sleep & Stress", body: "Two of the biggest gut-brain influences." },
  { icon: Footprints, title: "Movement", body: "Gentle daily activity that aids digestion." },
]

const STEPS = [
  { icon: ClipboardCheck, n: "1", title: "Complete the Stability Assessment", body: "A short, calm questionnaire builds your baseline Stability Score across five areas." },
  { icon: LineChart, n: "2", title: "Track daily bowel and food patterns", body: "Log stool, urgency, food, hydration, sleep, and stress in under a minute a day." },
  { icon: Sparkles, n: "3", title: "Get personalised insights & a plan", body: "See possible patterns and a gentle, one-step-at-a-time Stability Plan." },
]

const SCORE_CRITERIA = [
  "Stool consistency", "Bowel frequency", "Urgency episodes", "Accidents/leakage",
  "Food diversity", "Fibre intake", "Hydration", "Sleep", "Stress", "Movement", "Trigger exposure",
]

export default function StabilityPage() {
  return (
    <main className="overflow-hidden bg-white">
      <StabilityHero />
      <div style={{ height: "2px", background: "linear-gradient(90deg, var(--icon-lime), var(--icon-green), var(--icon-teal), var(--icon-yellow), var(--icon-orange))" }} />

      {/* 1. Problem */}
      <section className="px-6 py-24 md:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <ScrollReveal>
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--icon-orange)" }}>The Problem</p>
            <h2 className="font-serif text-3xl font-bold leading-tight text-balance sm:text-4xl lg:text-5xl" style={{ color: "var(--foreground)" }}>
              When your gut is unpredictable, life becomes smaller.
            </h2>
            <p className="mt-6 text-lg leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
              Digestive urgency and poor bowel predictability can affect confidence, travel, work,
              exercise, and social life. Many people don&apos;t know what triggers their symptoms — or
              which daily habits improve stability. EatoBiotics Stability helps you see the patterns.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* 2. What Stability measures */}
      <section className="px-6 py-24 md:py-28" style={{ background: "#f4f8f0" }}>
        <div className="mx-auto max-w-[1200px]">
          <ScrollReveal className="mx-auto max-w-2xl text-center">
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--icon-green)" }}>What It Measures</p>
            <h2 className="font-serif text-3xl font-bold text-balance sm:text-4xl" style={{ color: "var(--foreground)" }}>Seven everyday signals of a stable gut</h2>
          </ScrollReveal>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {MEASURES.map((m, i) => (
              <ScrollReveal key={m.title} delay={i * 60}>
                <div className={CARD}>
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl text-white shadow-sm" style={{ background: GRADS[i % GRADS.length] }}><m.icon size={20} /></div>
                  <h3 className="mt-4 font-serif text-lg font-bold" style={{ color: "var(--foreground)" }}>{m.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>{m.body}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* 3. The Stability Score */}
      <section className="px-6 py-24 md:py-28">
        <div className="mx-auto max-w-[1000px]">
          <ScrollReveal className="mx-auto max-w-2xl text-center">
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--icon-teal)" }}>The Score</p>
            <h2 className="font-serif text-3xl font-bold text-balance sm:text-4xl" style={{ color: "var(--foreground)" }}>The EatoBiotics Stability Score</h2>
            <p className="mt-5 text-base leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
              A single 0–100 number, built from the signals that shape day-to-day stability:
            </p>
          </ScrollReveal>
          <ScrollReveal delay={80}>
            <div className="mt-8 flex flex-wrap justify-center gap-2">
              {SCORE_CRITERIA.map((c) => (
                <span key={c} className="rounded-full border px-3 py-1.5 text-xs font-medium" style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }}>{c}</span>
              ))}
            </div>
          </ScrollReveal>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STABILITY_BANDS.map((b) => (
              <ScrollReveal key={b.band} delay={60}>
                <div className="h-full rounded-2xl border border-black/[0.05] bg-white p-5 shadow-sm">
                  <div className="h-1.5 w-12 rounded-full" style={{ background: b.color }} />
                  <p className="mt-3 font-serif text-sm font-bold" style={{ color: b.color }}>{b.min}–{(STABILITY_BANDS[STABILITY_BANDS.indexOf(b) + 1]?.min ?? 101) - 1}</p>
                  <p className="font-serif text-base font-bold" style={{ color: "var(--foreground)" }}>{b.band}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* 4. How it works */}
      <section className="px-6 py-24 md:py-28" style={{ background: "#f4f8f0" }}>
        <div className="mx-auto max-w-[1100px]">
          <ScrollReveal className="mx-auto max-w-2xl text-center">
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--icon-green)" }}>How It Works</p>
            <h2 className="font-serif text-3xl font-bold text-balance sm:text-4xl" style={{ color: "var(--foreground)" }}>Three calm steps</h2>
          </ScrollReveal>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <ScrollReveal key={s.n} delay={i * 80}>
                <div className={CARD}>
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl font-serif text-sm font-bold text-white shadow-sm" style={{ background: GRADS[i % GRADS.length] }}>{s.n}</span>
                    <s.icon size={20} style={{ color: "var(--icon-teal)" }} />
                  </div>
                  <h3 className="mt-4 font-serif text-lg font-bold" style={{ color: "var(--foreground)" }}>{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>{s.body}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Red flag */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-3xl">
          <ScrollReveal><RedFlagWarning /></ScrollReveal>
        </div>
      </section>

      {/* 6. CTA */}
      <section className="px-6 py-8">
        <div className="relative mx-auto max-w-[1100px] overflow-hidden rounded-[2.5rem] px-6 py-20 text-center md:py-24" style={{ background: "linear-gradient(135deg, #14250F 0%, #1A2E12 45%, #243611 100%)" }}>
          <div aria-hidden className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full opacity-40 blur-3xl" style={{ background: "radial-gradient(circle, var(--icon-green), transparent 70%)" }} />
          <div aria-hidden className="pointer-events-none absolute -bottom-24 -right-16 h-72 w-72 rounded-full opacity-30 blur-3xl" style={{ background: "radial-gradient(circle, var(--icon-yellow), transparent 70%)" }} />
          <div className="relative z-10">
            <ScrollReveal>
              <ShieldCheck size={28} className="mx-auto mb-4" style={{ color: "var(--icon-lime)" }} />
              <h2 className="mx-auto max-w-xl font-serif text-3xl font-semibold leading-tight text-white sm:text-4xl text-balance">Build your digestive stability profile.</h2>
              <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-white/70">A few calm questions to set your baseline — then track and improve from there.</p>
              <Link href="/stability/assessment" className="brand-gradient mt-8 inline-flex items-center gap-2 rounded-full px-8 py-4 text-base font-semibold text-white shadow-xl shadow-black/30 transition-opacity hover:opacity-90">
                Start Stability Assessment <ArrowRight size={16} />
              </Link>
            </ScrollReveal>
          </div>
        </div>
      </section>

      <MedicalDisclaimer />
    </main>
  )
}
