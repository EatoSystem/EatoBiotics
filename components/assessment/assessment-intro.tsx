"use client"

import { useState, useRef } from "react"
import {
  ArrowRight,
  Leaf,
  Wheat,
  FlaskConical,
  Timer,
  Heart,
  Mail,
  BarChart2,
  MessageSquare,
  ChevronDown,
} from "lucide-react"
import Link from "next/link"
import { GradientText } from "@/components/gradient-text"
import { MissionNote } from "./mission-note"
import type { LeadData } from "@/lib/assessment-storage"

interface AssessmentIntroProps {
  onStart: (lead: LeadData) => void
}

const PILLARS = [
  {
    icon: Leaf,
    label: "Diversity",
    description: "How varied your plant intake is each week",
    color: "var(--icon-lime)",
    gradient: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))",
  },
  {
    icon: Wheat,
    label: "Feeding",
    description: "How often you eat fibre-rich whole foods",
    color: "var(--icon-green)",
    gradient: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))",
  },
  {
    icon: FlaskConical,
    label: "Live Foods",
    description: "How regularly you include fermented foods",
    color: "var(--icon-teal)",
    gradient: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))",
  },
  {
    icon: Timer,
    label: "Consistency",
    description: "How stable and repeatable your eating habits are",
    color: "var(--icon-yellow)",
    gradient: "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange))",
  },
  {
    icon: Heart,
    label: "Feeling",
    description: "How your body responds — energy, comfort, clarity",
    color: "var(--icon-orange)",
    gradient: "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange))",
  },
]

const PROFILES = [
  {
    type: "Thriving System",
    tagline: "Your gut is working exactly as it should.",
    color: "var(--icon-green)",
  },
  {
    type: "Strong Foundation",
    tagline: "Solid habits with clear room to grow.",
    color: "var(--icon-teal)",
  },
  {
    type: "Emerging Balance",
    tagline: "The building blocks are there. Consistency is the next step.",
    color: "var(--icon-lime)",
  },
  {
    type: "Early Builder",
    tagline: "Every change you make now compounds quickly.",
    color: "var(--icon-orange)",
  },
]

const STEPS = [
  {
    number: "01",
    icon: MessageSquare,
    title: "Answer 15 honest questions",
    description: "About how you actually eat — no judgement, no wrong answers.",
  },
  {
    number: "02",
    icon: BarChart2,
    title: "Get your 5-pillar score",
    description: "See exactly where your food system is strong and where it needs support.",
  },
  {
    number: "03",
    icon: Mail,
    title: "Receive your personalised plan",
    description: "Your score, profile, and 7-day action plan delivered to your inbox.",
  },
]

const AGE_BRACKETS = ["Under 20", "20–29", "30–39", "40–49", "50–59", "60+"]

export function AssessmentIntro({ onStart }: AssessmentIntroProps) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [ageBracket, setAgeBracket] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const formRef = useRef<HTMLDivElement>(null)

  function validate(): boolean {
    const e: Record<string, string> = {}
    if (!name.trim()) e.name = "Please enter your name"
    if (!email.trim()) e.email = "Please enter your email"
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Please enter a valid email"
    if (!ageBracket) e.ageBracket = "Please select your age bracket"
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    onStart({ name: name.trim(), email: email.trim(), ageBracket })
  }

  function scrollToForm() {
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
  }

  return (
    <div className="min-h-screen bg-background">
      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden px-6 pb-20 pt-28 sm:pt-32">
        {/* Animated background blobs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div
            className="absolute left-[-10%] top-[-5%] h-[500px] w-[500px] rounded-full"
            style={{
              background: "radial-gradient(circle, var(--icon-lime), transparent 70%)",
              opacity: 0.07,
              animation: "blob-breathe 9s ease-in-out infinite",
            }}
          />
          <div
            className="absolute right-[-8%] top-[20%] h-[420px] w-[420px] rounded-full"
            style={{
              background: "radial-gradient(circle, var(--icon-teal), transparent 70%)",
              opacity: 0.06,
              animation: "blob-breathe 11s ease-in-out infinite 2s",
            }}
          />
          <div
            className="absolute bottom-[-5%] left-[30%] h-[380px] w-[380px] rounded-full"
            style={{
              background: "radial-gradient(circle, var(--icon-green), transparent 70%)",
              opacity: 0.05,
              animation: "blob-breathe 13s ease-in-out infinite 4s",
            }}
          />
        </div>

        <style>{`
          @keyframes blob-breathe {
            0%, 100% { transform: scale(1); opacity: 0.06; }
            50% { transform: scale(1.08); opacity: 0.11; }
          }
        `}</style>

        <div className="relative mx-auto max-w-2xl text-center">
          {/* Overline */}
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background/80 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground backdrop-blur-sm">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--icon-green)]" />
            Free · 5 minutes · Science-backed
          </div>

          {/* Headline */}
          <h1 className="mt-6 font-serif text-4xl font-semibold leading-tight text-foreground sm:text-5xl md:text-6xl">
            <GradientText>The Food System</GradientText>
            <br />
            Inside You
          </h1>

          <p className="mx-auto mt-5 max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg">
            A 15-question assessment revealing how well you&rsquo;re feeding your gut microbiome
            — scored across five pillars with a personalised 7-day action plan sent to your inbox.
          </p>

          {/* Scroll cue */}
          <button
            onClick={scrollToForm}
            className="mt-6 flex items-center gap-1.5 mx-auto text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors"
          >
            Start below
            <ChevronDown size={14} className="animate-bounce" />
          </button>
        </div>

        {/* Lead capture card */}
        <div
          ref={formRef}
          id="lead-form"
          className="relative mx-auto mt-10 max-w-md"
        >
          <div className="rounded-3xl border border-border bg-background/90 p-6 shadow-xl backdrop-blur-sm sm:p-8">
            <p className="mb-5 text-center font-serif text-lg font-semibold text-foreground">
              Begin your free assessment
            </p>

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              {/* Name */}
              <div>
                <label htmlFor="lead-name" className="mb-1.5 block text-xs font-semibold text-foreground">
                  First name
                </label>
                <input
                  id="lead-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Sarah"
                  autoComplete="given-name"
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder-muted-foreground/50 outline-none ring-0 transition focus:border-[var(--icon-green)] focus:ring-1 focus:ring-[var(--icon-green)]/30"
                />
                {errors.name && (
                  <p className="mt-1 text-xs text-destructive">{errors.name}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label htmlFor="lead-email" className="mb-1.5 block text-xs font-semibold text-foreground">
                  Email address
                </label>
                <input
                  id="lead-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder-muted-foreground/50 outline-none ring-0 transition focus:border-[var(--icon-green)] focus:ring-1 focus:ring-[var(--icon-green)]/30"
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-destructive">{errors.email}</p>
                )}
              </div>

              {/* Age bracket */}
              <div>
                <label htmlFor="lead-age" className="mb-1.5 block text-xs font-semibold text-foreground">
                  Age bracket
                </label>
                <select
                  id="lead-age"
                  value={ageBracket}
                  onChange={(e) => setAgeBracket(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none ring-0 transition focus:border-[var(--icon-green)] focus:ring-1 focus:ring-[var(--icon-green)]/30"
                >
                  <option value="" disabled>Select your age range</option>
                  {AGE_BRACKETS.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
                {errors.ageBracket && (
                  <p className="mt-1 text-xs text-destructive">{errors.ageBracket}</p>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="brand-gradient mt-1 flex w-full items-center justify-center gap-2 rounded-full py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              >
                Get My Free Biotics Score
                <ArrowRight size={16} />
              </button>
            </form>

            {/* Trust + demo link */}
            <div className="mt-4 flex items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground/50">
                Free · No credit card · Unsubscribe anytime
              </p>
              <Link
                href="/assessment/demo"
                className="shrink-0 text-xs text-muted-foreground/50 underline-offset-2 hover:text-muted-foreground hover:underline transition-colors"
              >
                Preview demo →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5 Pillars preview ─────────────────────────────────────────── */}
      <section className="border-t border-border bg-secondary/10 px-6 py-20">
        <div className="mx-auto max-w-3xl">
          <div className="mb-10 text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              What you&rsquo;ll discover
            </p>
            <h2 className="mt-3 font-serif text-2xl font-semibold text-foreground sm:text-3xl">
              You&rsquo;ll score 0–100 across 5 pillars
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
              Each pillar measures a different dimension of your internal food system. Together,
              they reveal the full picture.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {PILLARS.map((pillar) => (
              <div
                key={pillar.label}
                className="flex flex-col gap-3 rounded-2xl border border-border bg-background p-5"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                    style={{ background: pillar.gradient }}
                  >
                    <pillar.icon size={16} className="text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{pillar.label}</p>
                    <p className="text-xs text-muted-foreground">{pillar.description}</p>
                  </div>
                </div>
                {/* Teaser score bar */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground/50">Your score</span>
                    <span className="text-xs font-bold text-muted-foreground/40">??</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-border overflow-hidden">
                    <div
                      className="h-full w-0 rounded-full opacity-30"
                      style={{ background: pillar.gradient }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Sample profiles ───────────────────────────────────────────── */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-3xl">
          <div className="mb-10 text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Your profile
            </p>
            <h2 className="mt-3 font-serif text-2xl font-semibold text-foreground sm:text-3xl">
              Which one describes you today?
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
              The assessment places you in one of six profiles based on your 5 pillar scores.
              Take the assessment to find yours.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {PROFILES.map((p) => (
              <div
                key={p.type}
                className="flex items-start gap-3 rounded-2xl border border-border bg-background p-5"
              >
                <div
                  className="mt-0.5 h-3 w-3 shrink-0 rounded-full"
                  style={{ backgroundColor: p.color }}
                />
                <div>
                  <p className="text-sm font-bold text-foreground" style={{ color: p.color }}>
                    {p.type}
                  </p>
                  <p className="mt-0.5 text-sm text-muted-foreground italic">&ldquo;{p.tagline}&rdquo;</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <button
              onClick={scrollToForm}
              className="brand-gradient inline-flex items-center gap-2 rounded-full px-7 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              Find my profile
              <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────────────── */}
      <section className="border-t border-border bg-secondary/10 px-6 py-20">
        <div className="mx-auto max-w-2xl">
          <div className="mb-10 text-center">
            <h2 className="font-serif text-2xl font-semibold text-foreground sm:text-3xl">
              How it works
            </h2>
          </div>

          <div className="space-y-6">
            {STEPS.map((step, i) => (
              <div key={step.number} className="flex items-start gap-5">
                <div className="relative flex-none">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full brand-gradient text-sm font-bold text-white">
                    {step.number}
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className="absolute left-1/2 top-11 h-6 w-px -translate-x-1/2 bg-border" />
                  )}
                </div>
                <div className="pt-2">
                  <div className="flex items-center gap-2 mb-1">
                    <step.icon size={14} className="text-muted-foreground" />
                    <p className="text-sm font-semibold text-foreground">{step.title}</p>
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Mission ───────────────────────────────────────────────────── */}
      <section className="border-t border-border px-6 py-16">
        <div className="mx-auto max-w-2xl">
          <MissionNote variant="quote" />
        </div>
      </section>

      {/* ── Bottom CTA ────────────────────────────────────────────────── */}
      <section className="px-6 pb-24 pt-4">
        <div className="mx-auto max-w-xl text-center">
          <p className="font-serif text-2xl font-semibold text-foreground sm:text-3xl">
            Ready to see where your food system stands?
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            Takes 5 minutes. Results sent to your inbox immediately.
          </p>
          <div className="mt-6">
            <button
              onClick={scrollToForm}
              className="brand-gradient inline-flex items-center gap-2 rounded-full px-8 py-3.5 text-base font-semibold text-white transition-opacity hover:opacity-90"
            >
              Get My Free Biotics Score
              <ArrowRight size={18} />
            </button>
          </div>
          <p className="mt-4 text-xs text-muted-foreground/40">
            This assessment is for educational purposes and is not medical advice or a diagnosis.
          </p>
        </div>
      </section>
    </div>
  )
}
