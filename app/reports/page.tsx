import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Check, FileText, Sparkles, Clock, Shield, Star } from "lucide-react"
import { ScrollReveal } from "@/components/scroll-reveal"
import { GradientText } from "@/components/gradient-text"

export const metadata: Metadata = {
  title: "Deep Assessment Reports — EatoBiotics",
  description:
    "Go beyond your free Biotics Score. Get a personalised AI-generated report with pillar-by-pillar food recommendations, a 30-day rebuilding plan, and condition-specific guidance.",
}

/* ── Report data ─────────────────────────────────────────────────────── */

const REPORTS = [
  {
    id:       "starter",
    label:    "Starter Insights",
    price:    "€20",
    tagline:  "Understand your score in depth",
    color:    "var(--icon-lime)",
    gradient: "linear-gradient(135deg, var(--icon-lime), #56C135)",
    popular:  false,
    includes: [
      "Full breakdown of your Biotics Score",
      "Your top 5 highest-impact priority foods",
      "7-day daily starter food plan",
      "Plain-English explanation of your results",
      "PDF delivered to your inbox",
    ],
    ideal: "Perfect if you want a clear, actionable starting point without the full depth.",
  },
  {
    id:       "full",
    label:    "Full Report",
    price:    "€40",
    tagline:  "Your complete food system roadmap",
    color:    "var(--icon-green)",
    gradient: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))",
    popular:  true,
    includes: [
      "Everything in Starter",
      "Pillar-by-pillar food recommendations",
      "Your top 12 foods ranked by gut impact",
      "Personalised 30-day rebuilding plan",
      "Weekly focus areas for each biotic",
      "PDF delivered to your inbox",
    ],
    ideal: "Best for people who want a complete picture and a structured plan to follow.",
  },
  {
    id:       "premium",
    label:    "Premium Report",
    price:    "€50",
    tagline:  "The full system, fully optimised",
    color:    "var(--icon-teal)",
    gradient: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))",
    popular:  false,
    includes: [
      "Everything in Full Report",
      "Personalised meal timing guidance",
      "Seasonal food guide for your profile",
      "Weekly shopping list",
      "90-day milestone tracker",
      "3 Biotic Kitchen recipes for your type",
      "PDF delivered to your inbox",
    ],
    ideal: "For those who want every detail — timing, seasons, recipes, and a 90-day roadmap.",
  },
]

/* ── How it works steps ──────────────────────────────────────────────── */

const STEPS = [
  {
    number: "01",
    title:  "Take the free assessment",
    body:   "Answer 15 questions about your eating habits. Takes about 3 minutes. No account required.",
    color:  "var(--icon-lime)",
    icon:   "📋",
  },
  {
    number: "02",
    title:  "Get your free Biotics Score",
    body:   "Instantly see your score across 5 pillars — Diversity, Feeding, Adding, Consistency, and Feeling.",
    color:  "var(--icon-green)",
    icon:   "📊",
  },
  {
    number: "03",
    title:  "Choose your report",
    body:   "Select Starter, Full, or Premium. Pay once — no subscription, no lock-in.",
    color:  "var(--icon-teal)",
    icon:   "📄",
  },
  {
    number: "04",
    title:  "Answer 10 deep-dive questions",
    body:   "We ask a second layer of personalised questions to make your report specific to you.",
    color:  "var(--icon-yellow)",
    icon:   "💬",
  },
  {
    number: "05",
    title:  "Receive your PDF report",
    body:   "Your AI-generated report is built from your answers and delivered to your inbox within minutes.",
    color:  "var(--icon-orange)",
    icon:   "✉️",
  },
]

/* ── What makes reports different ────────────────────────────────────── */

const DIFFERENTIATORS = [
  {
    icon:  "🎯",
    title: "Built from your answers",
    body:  "Every report is generated specifically from your assessment data — not a generic template. Claude reads your pillar scores and crafts recommendations for your food system.",
    color: "var(--icon-lime)",
  },
  {
    icon:  "🔬",
    title: "Grounded in the 3 Biotics framework",
    body:  "Recommendations are structured around Prebiotics, Probiotics, and Postbiotics — the three levers you can pull to meaningfully improve your gut health.",
    color: "var(--icon-green)",
  },
  {
    icon:  "📅",
    title: "Actionable plans, not just insight",
    body:  "You leave with a 7-day or 30-day plan (depending on tier) that tells you exactly what to eat and when — not just what's good for gut health in general.",
    color: "var(--icon-teal)",
  },
  {
    icon:  "🔒",
    title: "One-time, yours forever",
    body:  "Pay once. The report is yours — no subscription required, no expiry date. Upgrade to a membership whenever you're ready to track daily.",
    color: "var(--icon-orange)",
  },
]

/* ── FAQs ──────────────────────────────────────────────────────────────── */

const FAQS = [
  {
    q: "Do I need an account to buy a report?",
    a: "No — you just need to complete the free assessment. We'll send the report to the email you provide. Creating an account lets you access it online any time.",
  },
  {
    q: "How long does the report take to arrive?",
    a: "Typically 2–5 minutes after you complete the deep-dive questions. Claude generates it fresh from your answers, so it takes a moment.",
  },
  {
    q: "Can I upgrade from Starter to Full later?",
    a: "Not currently — each report is generated once from your assessment data at the time of purchase. We recommend choosing Full if you're unsure.",
  },
  {
    q: "What's the difference between a report and a membership?",
    a: "A report is a one-time deep dive into your current food system. A membership is for ongoing daily tracking — meal analysis, streak building, and a score that moves in real time as your habits change.",
  },
  {
    q: "Is my assessment data stored?",
    a: "If you create an account, your score is saved to your profile. If not, only what's needed to generate your report is retained.",
  },
]

/* ── Page ────────────────────────────────────────────────────────────── */

export default function ReportsPage() {
  return (
    <div className="min-h-screen bg-background">

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden px-6 pt-24 pb-16 md:pt-32 md:pb-20">
        <div className="relative mx-auto flex max-w-[1200px] min-h-[calc(100vh-200px)] flex-col items-center justify-center gap-12 md:flex-row md:gap-16 lg:gap-20">

          {/* Left: Text */}
          <div className="flex-1 max-w-[560px] text-left">
            <ScrollReveal>
              <div
                className="mb-5 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest"
                style={{
                  background: "color-mix(in srgb, var(--icon-lime) 15%, transparent)",
                  color: "var(--icon-green)",
                }}
              >
                <FileText size={11} /> Deep Assessment Reports
              </div>
              <h1 className="font-serif text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
                <GradientText>Your gut health,</GradientText>
                <br />
                explained in full
              </h1>
              <p className="mt-6 max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg">
                Take the free assessment, then unlock a personalised AI-generated report —
                pillar-by-pillar analysis, your highest-impact foods, and a plan built
                specifically for you.
              </p>
            </ScrollReveal>

            <ScrollReveal delay={120}>
              <div className="mt-8 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
                <Link
                  href="/assessment"
                  className="inline-flex items-center gap-2 rounded-full px-8 py-4 text-base font-semibold text-white shadow-lg transition-all hover:opacity-90 hover:shadow-xl"
                  style={{ background: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))" }}
                >
                  Start free assessment <ArrowRight size={16} />
                </Link>
                <a
                  href="#reports"
                  className="inline-flex items-center gap-2 rounded-full border border-border px-8 py-4 text-base font-semibold text-foreground transition-colors hover:bg-muted"
                >
                  See report tiers
                </a>
              </div>
            </ScrollReveal>

            {/* Trust badges */}
            <ScrollReveal delay={200}>
              <div className="mt-8 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Shield size={12} style={{ color: "var(--icon-green)" }} />
                  One-time payment · no subscription
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock size={12} style={{ color: "var(--icon-teal)" }} />
                  Delivered within minutes
                </span>
                <span className="flex items-center gap-1.5">
                  <Sparkles size={12} style={{ color: "var(--icon-lime)" }} />
                  AI-generated from your data
                </span>
              </div>
            </ScrollReveal>
          </div>

          {/* Right: Image */}
          <ScrollReveal delay={80} className="flex-1 flex items-center justify-center w-full max-w-[480px]">
            <div className="relative w-full">
              <Image
                src="/images/couple-hero.png"
                alt="Two people with glowing gut microbiome connection"
                width={900}
                height={900}
                priority
                className="w-full h-auto object-contain"
              />
            </div>
          </ScrollReveal>

        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────── */}
      <section className="px-6 py-20 md:py-28">
        <div className="mx-auto max-w-[1100px]">
          <ScrollReveal>
            <div className="text-center mb-14">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
                How it works
              </p>
              <h2 className="font-serif text-3xl font-semibold text-foreground sm:text-4xl">
                Free to start. Yours in minutes.
              </h2>
            </div>
          </ScrollReveal>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {STEPS.map((step, i) => (
              <ScrollReveal key={step.number} delay={i * 70}>
                <div className="relative rounded-2xl border border-border bg-card p-5 h-full">
                  {/* Connector line (desktop only, not on last) */}
                  {i < STEPS.length - 1 && (
                    <div
                      className="absolute right-0 top-1/2 hidden h-px w-4 translate-x-full lg:block"
                      style={{ background: `color-mix(in srgb, ${step.color} 40%, var(--border))` }}
                    />
                  )}
                  <div className="flex items-start gap-3 mb-3">
                    <span className="text-2xl leading-none">{step.icon}</span>
                    <span
                      className="text-[10px] font-bold uppercase tracking-widest mt-1"
                      style={{ color: step.color }}
                    >
                      {step.number}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-foreground mb-1.5">{step.title}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{step.body}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Report tier cards ─────────────────────────────────────────── */}
      <section id="reports" className="px-6 py-20 md:py-28">
        <div className="mx-auto max-w-[1100px]">
          <ScrollReveal>
            <div className="text-center mb-14">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
                Choose your report
              </p>
              <h2 className="font-serif text-3xl font-semibold text-foreground sm:text-4xl text-balance">
                One-time payment. No subscription required.
              </h2>
              <p className="mt-4 mx-auto max-w-md text-base text-muted-foreground">
                All reports require a free assessment first — your score is the foundation everything is built on.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid gap-6 sm:grid-cols-3">
            {REPORTS.map((report, i) => (
              <ScrollReveal key={report.id} delay={i * 80}>
                <div
                  className="relative flex flex-col h-full rounded-3xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
                  style={{
                    background: "var(--card)",
                    border: report.popular
                      ? `2px solid color-mix(in srgb, ${report.color} 55%, transparent)`
                      : "1px solid var(--border)",
                    boxShadow: report.popular
                      ? `0 8px 32px color-mix(in srgb, ${report.color} 14%, transparent)`
                      : undefined,
                  }}
                >
                  {/* Popular badge */}
                  {report.popular && (
                    <div
                      className="absolute right-4 top-4 flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white z-10"
                      style={{ background: report.gradient }}
                    >
                      <Star size={9} fill="currentColor" /> Most popular
                    </div>
                  )}

                  {/* Gradient bar */}
                  <div className="h-1.5 w-full shrink-0" style={{ background: report.gradient }} />

                  {/* Header */}
                  <div className="px-6 pt-6 pb-4">
                    <p
                      className="text-[10px] font-bold uppercase tracking-widest mb-2"
                      style={{ color: report.color }}
                    >
                      {report.label}
                    </p>
                    <div className="flex items-baseline gap-1">
                      <span className="font-serif text-4xl font-bold text-foreground">
                        {report.price}
                      </span>
                      <span className="text-sm text-muted-foreground">one-time</span>
                    </div>
                    <p className="mt-1.5 text-xs text-muted-foreground">{report.tagline}</p>
                  </div>

                  {/* Divider */}
                  <div
                    className="mx-6 h-px"
                    style={{ background: `color-mix(in srgb, ${report.color} 20%, var(--border))` }}
                  />

                  {/* Features */}
                  <div className="flex flex-1 flex-col px-6 py-5">
                    <ul className="flex-1 space-y-2.5 mb-5">
                      {report.includes.map((item) => (
                        <li key={item} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                          <Check
                            size={13}
                            className="mt-0.5 shrink-0"
                            style={{ color: report.color }}
                          />
                          {item}
                        </li>
                      ))}
                    </ul>

                    {/* Ideal for */}
                    <div
                      className="rounded-xl p-3 mb-5"
                      style={{ background: `color-mix(in srgb, ${report.color} 8%, transparent)` }}
                    >
                      <p className="text-[11px] font-semibold mb-0.5" style={{ color: report.color }}>
                        Ideal for
                      </p>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        {report.ideal}
                      </p>
                    </div>

                    {/* CTA */}
                    <Link
                      href="/assessment"
                      className="flex items-center justify-center gap-1.5 rounded-full py-3 px-5 text-sm font-semibold text-white transition-all hover:opacity-90 hover:shadow-lg"
                      style={{ background: report.gradient }}
                    >
                      Start free assessment <ArrowRight size={13} />
                    </Link>
                    <p className="mt-2 text-center text-[11px] text-muted-foreground/60">
                      Free assessment first, then choose your report
                    </p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>

          {/* Comparison note */}
          <ScrollReveal delay={300}>
            <div className="mt-8 rounded-2xl border border-border bg-card px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">Not sure which to pick?</span>{" "}
                The Full Report is the most popular — it gives you everything you need to start making meaningful changes.
              </p>
              <Link
                href="/assessment"
                className="shrink-0 inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                style={{ background: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))" }}
              >
                Start free <ArrowRight size={13} />
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ── What makes reports different ─────────────────────────────── */}
      <section className="px-6 py-20 md:py-28">
        <div className="mx-auto max-w-[1100px]">
          <ScrollReveal>
            <div className="text-center mb-14">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
                Why EatoBiotics reports
              </p>
              <h2 className="font-serif text-3xl font-semibold text-foreground sm:text-4xl text-balance">
                Not a generic PDF. Built from your answers.
              </h2>
            </div>
          </ScrollReveal>

          <div className="grid gap-5 sm:grid-cols-2">
            {DIFFERENTIATORS.map((d, i) => (
              <ScrollReveal key={d.title} delay={i * 80}>
                <div className="flex gap-4 rounded-2xl border border-border bg-card p-6">
                  <span
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl"
                    style={{ background: `color-mix(in srgb, ${d.color} 14%, transparent)` }}
                  >
                    {d.icon}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-foreground mb-1.5">{d.title}</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">{d.body}</p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Reports vs Membership ─────────────────────────────────────── */}
      <section className="px-6 py-20 md:py-28">
        <div className="mx-auto max-w-[800px]">
          <ScrollReveal>
            <div className="text-center mb-10">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
                Reports vs Membership
              </p>
              <h2 className="font-serif text-3xl font-semibold text-foreground sm:text-4xl text-balance">
                Which is right for you?
              </h2>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={80}>
            <div className="grid gap-5 sm:grid-cols-2">
              {/* Reports */}
              <div
                className="rounded-2xl border bg-card p-6"
                style={{ borderColor: `color-mix(in srgb, var(--icon-green) 30%, var(--border))` }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <span
                    className="flex h-10 w-10 items-center justify-center rounded-xl text-lg"
                    style={{ background: "color-mix(in srgb, var(--icon-green) 14%, transparent)" }}
                  >
                    📄
                  </span>
                  <div>
                    <p className="text-sm font-bold text-foreground">One-time Report</p>
                    <p className="text-xs text-muted-foreground">From €20, once</p>
                  </div>
                </div>
                <ul className="space-y-2">
                  {[
                    "Deep insight into where you are right now",
                    "Specific plan to start improving",
                    "Pay once, keep forever",
                    "No account required",
                    "Best for: first step or gift",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Check size={12} className="mt-0.5 shrink-0" style={{ color: "var(--icon-green)" }} />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/assessment"
                  className="mt-5 flex items-center justify-center gap-1.5 rounded-full py-2.5 px-5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                  style={{ background: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))" }}
                >
                  Get a report <ArrowRight size={13} />
                </Link>
              </div>

              {/* Membership */}
              <div
                className="rounded-2xl border bg-card p-6"
                style={{ borderColor: `color-mix(in srgb, var(--icon-teal) 30%, var(--border))` }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <span
                    className="flex h-10 w-10 items-center justify-center rounded-xl text-lg"
                    style={{ background: "color-mix(in srgb, var(--icon-teal) 14%, transparent)" }}
                  >
                    📈
                  </span>
                  <div>
                    <p className="text-sm font-bold text-foreground">Membership</p>
                    <p className="text-xs text-muted-foreground">From €9.99/month</p>
                  </div>
                </div>
                <ul className="space-y-2">
                  {[
                    "Daily meal analysis and scoring",
                    "Score that moves as your habits improve",
                    "Streak tracking and habit nudges",
                    "AI consultation (Transform tier)",
                    "Best for: building long-term habits",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Check size={12} className="mt-0.5 shrink-0" style={{ color: "var(--icon-teal)" }} />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/pricing"
                  className="mt-5 flex items-center justify-center gap-1.5 rounded-full py-2.5 px-5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                  style={{ background: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))" }}
                >
                  See membership plans <ArrowRight size={13} />
                </Link>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────── */}
      <section className="px-6 py-20 md:py-28">
        <div className="mx-auto max-w-[720px]">
          <ScrollReveal>
            <div className="text-center mb-12">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
                FAQ
              </p>
              <h2 className="font-serif text-3xl font-semibold text-foreground sm:text-4xl">
                Common questions
              </h2>
            </div>
          </ScrollReveal>

          <div className="space-y-4">
            {FAQS.map((faq, i) => (
              <ScrollReveal key={i} delay={i * 60}>
                <div className="rounded-2xl border border-border bg-card p-6">
                  <p className="text-sm font-semibold text-foreground mb-2">{faq.q}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────────────────── */}
      <section className="px-6 py-20 md:py-28">
        <div className="mx-auto max-w-[560px] text-center">
          <ScrollReveal>
            <span className="text-4xl">🌿</span>
            <h2 className="mt-5 font-serif text-3xl font-semibold text-foreground sm:text-4xl text-balance">
              Start with your free score.
              <br />
              <span
                style={{
                  background: "linear-gradient(135deg, var(--icon-lime), var(--icon-green), var(--icon-teal))",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Go deeper when you&apos;re ready.
              </span>
            </h2>
            <p className="mt-4 text-base text-muted-foreground leading-relaxed">
              The assessment is free and takes 3 minutes. You&apos;ll get your Biotics Score
              immediately — unlock a full report whenever it feels right.
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/assessment"
                className="inline-flex items-center gap-2 rounded-full px-8 py-4 text-base font-semibold text-white shadow-lg transition-all hover:opacity-90 hover:shadow-xl"
                style={{ background: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))" }}
              >
                Take the free assessment <ArrowRight size={16} />
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center gap-2 rounded-full border border-border px-8 py-4 text-base font-semibold text-foreground transition-colors hover:bg-muted"
              >
                See membership plans
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

    </div>
  )
}
