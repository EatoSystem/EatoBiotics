"use client"

import { useState, useRef } from "react"
import {
  ArrowRight,
  Leaf,
  Wheat,
  FlaskConical,
  Timer,
  Brain,
  Mail,
  BarChart2,
  MessageSquare,
  ChevronDown,
} from "lucide-react"
import Link from "next/link"
import { GradientText } from "@/components/gradient-text"
import type { LeadData } from "@/lib/assessment-storage"

interface MindAssessmentIntroProps {
  onStart: (lead: LeadData) => void
}

const PILLARS = [
  {
    icon: Leaf,
    label: "Brain Nutrition",
    description: "How varied your plant polyphenol intake is each week",
    color: "var(--icon-lime)",
    gradient: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))",
  },
  {
    icon: Wheat,
    label: "Brain Fuel",
    description: "How often you eat fibre-rich whole foods that feed serotonin-producing bacteria",
    color: "var(--icon-green)",
    gradient: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))",
  },
  {
    icon: FlaskConical,
    label: "Live Mind Foods",
    description: "How regularly you include fermented foods linked to mood and focus",
    color: "var(--icon-teal)",
    gradient: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))",
  },
  {
    icon: Timer,
    label: "Mind Rhythm",
    description: "How stable and consistent your eating patterns are for circadian gut health",
    color: "var(--icon-yellow)",
    gradient: "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange))",
  },
  {
    icon: Brain,
    label: "Mind Response",
    description: "How your mind actually responds — clarity, mood stability, afternoon focus",
    color: "var(--icon-orange)",
    gradient: "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange))",
  },
]

const PROFILES = [
  { type: "Sharp Mind", tagline: "Your gut-brain axis is working hard in your favour.", color: "var(--icon-green)" },
  { type: "Clear Foundation", tagline: "Solid habits supporting mental clarity — now sharpen the edges.", color: "var(--icon-teal)" },
  { type: "Emerging Clarity", tagline: "The building blocks are there. Consistency unlocks the rest.", color: "var(--icon-lime)" },
  { type: "Foggy System", tagline: "Good intention, disrupted by gaps the gut-brain axis feels.", color: "var(--icon-yellow)" },
]

const STEPS = [
  {
    number: "01",
    icon: MessageSquare,
    title: "Answer 15 honest questions",
    description: "About how you actually eat — framed specifically for the gut-brain connection.",
  },
  {
    number: "02",
    icon: BarChart2,
    title: "Get your Mind Score",
    description: "See exactly where your food habits support mental clarity — and where the gaps are.",
  },
  {
    number: "03",
    icon: Mail,
    title: "Receive your brain food plan",
    description: "Your score, mind profile, and brain starter pack delivered to your inbox.",
  },
]

const AGE_BRACKETS = ["Under 20", "20–29", "30–39", "40–49", "50–59", "60+"]

export function MindAssessmentIntro({ onStart }: MindAssessmentIntroProps) {
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
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div
            className="absolute left-[-10%] top-[-5%] h-[500px] w-[500px] rounded-full"
            style={{ background: "radial-gradient(circle, var(--icon-teal), transparent 70%)", opacity: 0.07 }}
          />
          <div
            className="absolute right-[-8%] top-[20%] h-[420px] w-[420px] rounded-full"
            style={{ background: "radial-gradient(circle, var(--icon-green), transparent 70%)", opacity: 0.06 }}
          />
        </div>

        <div className="relative mx-auto max-w-2xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background/80 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground backdrop-blur-sm">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--icon-teal)]" />
            Free · 5 minutes · Gut-Brain Focused
          </div>

          <h1 className="mt-6 font-serif text-4xl font-semibold leading-tight text-foreground sm:text-5xl md:text-6xl">
            <GradientText>The Food System</GradientText>
            <br />
            Inside Your Mind
          </h1>

          <p className="mx-auto mt-5 max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg">
            A 15-question assessment revealing how well your food habits support your gut-brain
            connection — scored across five pillars with a personalised brain food plan sent to your inbox.
          </p>

          <button
            onClick={scrollToForm}
            className="mt-6 flex items-center gap-1.5 mx-auto text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors"
          >
            Start below
            <ChevronDown size={14} className="animate-bounce" />
          </button>
        </div>

        {/* Lead capture form */}
        <div ref={formRef} id="lead-form" className="relative mx-auto mt-10 max-w-md">
          <div className="rounded-3xl border border-border bg-background/90 p-6 shadow-xl backdrop-blur-sm sm:p-8">
            <p className="mb-5 text-center font-serif text-lg font-semibold text-foreground">
              Begin your free mind assessment
            </p>

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <div>
                <label htmlFor="mind-name" className="mb-1.5 block text-xs font-semibold text-foreground">
                  First name
                </label>
                <input
                  id="mind-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Sarah"
                  autoComplete="given-name"
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder-muted-foreground/50 outline-none transition focus:border-[var(--icon-teal)] focus:ring-1 focus:ring-[var(--icon-teal)]/30"
                />
                {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name}</p>}
              </div>

              <div>
                <label htmlFor="mind-email" className="mb-1.5 block text-xs font-semibold text-foreground">
                  Email address
                </label>
                <input
                  id="mind-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder-muted-foreground/50 outline-none transition focus:border-[var(--icon-teal)] focus:ring-1 focus:ring-[var(--icon-teal)]/30"
                />
                {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email}</p>}
              </div>

              <div>
                <label htmlFor="mind-age" className="mb-1.5 block text-xs font-semibold text-foreground">
                  Age bracket
                </label>
                <select
                  id="mind-age"
                  value={ageBracket}
                  onChange={(e) => setAgeBracket(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none transition focus:border-[var(--icon-teal)] focus:ring-1 focus:ring-[var(--icon-teal)]/30"
                >
                  <option value="" disabled>Select your age range</option>
                  {AGE_BRACKETS.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
                {errors.ageBracket && <p className="mt-1 text-xs text-destructive">{errors.ageBracket}</p>}
              </div>

              <button
                type="submit"
                className="brand-gradient mt-1 flex w-full items-center justify-center gap-2 rounded-full py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              >
                Start the Mind Assessment
                <ArrowRight size={16} />
              </button>
            </form>

            <div className="mt-4 flex items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground/50">Free · No credit card · Unsubscribe anytime</p>
              <Link
                href="/gut-brain"
                className="shrink-0 text-xs text-muted-foreground/50 underline-offset-2 hover:text-muted-foreground hover:underline transition-colors"
              >
                Why this matters →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5 Pillars ────────────────────────────────────────────────── */}
      <section className="border-t border-border bg-secondary/10 px-6 py-20">
        <div className="mx-auto max-w-3xl">
          <div className="mb-10 text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              What you&rsquo;ll discover
            </p>
            <h2 className="mt-3 font-serif text-2xl font-semibold text-foreground sm:text-3xl">
              Your 5-pillar gut-brain score
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
              Each pillar measures a different dimension of how your food habits support your
              gut-brain axis. Together they reveal the full picture.
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
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground/50">Your score</span>
                    <span className="text-xs font-bold text-muted-foreground/40">??</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-border overflow-hidden">
                    <div className="h-full w-0 rounded-full opacity-30" style={{ background: pillar.gradient }} />
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
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Your mind profile</p>
            <h2 className="mt-3 font-serif text-2xl font-semibold text-foreground sm:text-3xl">
              Which one describes you today?
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {PROFILES.map((p) => (
              <div key={p.type} className="flex items-start gap-3 rounded-2xl border border-border bg-background p-5">
                <div className="mt-0.5 h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: p.color }} />
                <div>
                  <p className="text-sm font-bold" style={{ color: p.color }}>{p.type}</p>
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
              Find my mind profile
              <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────────────── */}
      <section className="border-t border-border bg-secondary/10 px-6 py-20">
        <div className="mx-auto max-w-2xl">
          <div className="mb-10 text-center">
            <h2 className="font-serif text-2xl font-semibold text-foreground sm:text-3xl">How it works</h2>
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
                  <p className="text-sm leading-relaxed text-muted-foreground">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ────────────────────────────────────────────────── */}
      <section className="px-6 pb-24 pt-12">
        <div className="mx-auto max-w-xl text-center">
          <p className="font-serif text-2xl font-semibold text-foreground sm:text-3xl">
            Ready to see what your gut is telling your brain?
          </p>
          <p className="mt-3 text-sm text-muted-foreground">Takes 5 minutes. Results sent to your inbox immediately.</p>
          <div className="mt-6">
            <button
              onClick={scrollToForm}
              className="brand-gradient inline-flex items-center gap-2 rounded-full px-8 py-3.5 text-base font-semibold text-white transition-opacity hover:opacity-90"
            >
              Start the Mind Assessment
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
