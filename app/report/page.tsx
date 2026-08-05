import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { ScrollReveal } from "@/components/scroll-reveal"

export const metadata: Metadata = {
  title: "EatoBiotics Reports — See What's Inside",
  description:
    "Explore the three EatoBiotics report types — You, Family, and Mind. View sample reports and discover what a full gut health analysis looks like.",
}

const REPORTS = [
  {
    label: "YOUR REPORT",
    title: "The Food System Inside You",
    tagline: "Your gut system is developing real momentum — you have genuine strengths to build on and clear levers to pull.",
    insight: "Your plant diversity is a genuine foundation — fermented foods are a clear next lever.",
    copy: "A complete personal gut health analysis — your Prebiotics · Probiotics · Postbiotics scores, what they mean for your daily energy, and a personalised 30-day plan to improve your food system.",
    score: 68,
    profile: "Emerging Balance",
    cta: "View Sample Report",
    href: "/report-you",
    sampleHref: "/report-you",
    accent: "var(--icon-green)",
    gradient: "linear-gradient(90deg, var(--icon-lime), var(--icon-green))",
    borderColor: "color-mix(in srgb, var(--icon-green) 20%, transparent)",
    primary: true,
    pillars: [
      { name: "Prebiotics", score: 72, color: "var(--icon-green)" },
      { name: "Probiotics", score: 45, color: "var(--icon-orange)" },
      { name: "Postbiotics", score: 78, color: "var(--icon-teal)" },
    ],
  },
  {
    label: "FAMILY REPORT",
    title: "The Food System Inside Your Family",
    tagline: "Your family's food system has real shared strengths — a few targeted shifts can add up for everyone at the table.",
    insight: "Shared mealtimes are your family's biggest asset — the next step is what's on the plate.",
    copy: "A collective family food system analysis — shared habits, children's nutrition, and a practical family plan to build better gut health together.",
    score: 64,
    profile: "Growing Together",
    cta: "View Sample Report",
    href: "/report-family",
    sampleHref: "/report-family",
    accent: "var(--icon-yellow)",
    gradient: "linear-gradient(90deg, var(--icon-green), var(--icon-yellow))",
    borderColor: "color-mix(in srgb, var(--icon-yellow) 20%, transparent)",
    primary: false,
    pillars: [
      { name: "Prebiotics", score: 68, color: "var(--icon-green)" },
      { name: "Probiotics", score: 41, color: "var(--icon-orange)" },
      { name: "Postbiotics", score: 74, color: "var(--icon-teal)" },
    ],
  },
  {
    label: "MIND REPORT",
    title: "The Food System Inside Your Mind",
    tagline: "Your gut-brain connection is sending signals — tune in to the right foods and your mood, clarity, and energy can shift noticeably.",
    insight: "Your reported diet is low in the foods associated with gut serotonin production — a targeted place to start.",
    copy: "A focused gut-brain analysis — how your food system affects mood, focus, and mental clarity, with targeted foods and habits to support your mind.",
    score: 59,
    profile: "Foggy Foundations",
    cta: "View Sample Report",
    href: "/report-mind",
    sampleHref: "/report-mind",
    accent: "var(--icon-teal)",
    gradient: "linear-gradient(90deg, var(--icon-teal), var(--icon-green))",
    borderColor: "color-mix(in srgb, var(--icon-teal) 20%, transparent)",
    primary: false,
    pillars: [
      { name: "Prebiotics", score: 62, color: "var(--icon-green)" },
      { name: "Probiotics", score: 38, color: "var(--icon-orange)" },
      { name: "Postbiotics", score: 64, color: "var(--icon-teal)" },
    ],
  },
]

const REPORT_SECTIONS = [
  {
    icon: "🧬",
    name: "Your Three Biotics",
    description: "Prebiotics · Probiotics · Postbiotics — scored individually with a full breakdown of what each means for you",
    color: "var(--icon-green)",
  },
  {
    icon: "🪪",
    name: "Gut Profile",
    description: "Your personal gut health identity — one of five profiles based on your combined score pattern",
    color: "var(--icon-lime)",
  },
  {
    icon: "📈",
    name: "Score Projection",
    description: "Where your score could go with consistent adherence to your personalised plan",
    color: "var(--icon-teal)",
  },
  {
    icon: "🗺️",
    name: "Symptom Map",
    description: "How your current scores connect to everyday symptoms — brain fog, energy crashes, sleep quality and more",
    color: "var(--icon-orange)",
  },
  {
    icon: "💡",
    name: "Deep Insight",
    description: "The single most important biological finding in your report — explained clearly and acted on directly",
    color: "var(--icon-yellow)",
  },
  {
    icon: "📅",
    name: "7-Day Starter Plan",
    description: "One action per day for your first week — specific, practical, and chosen for your exact score pattern",
    color: "var(--icon-green)",
  },
  {
    icon: "🗓️",
    name: "30-Day Roadmap",
    description: "A full four-week progression — building habits week by week to close your biggest gaps",
    color: "var(--icon-teal)",
  },
  {
    icon: "🛒",
    name: "Food Prescription",
    description: "Five foods chosen specifically for your biotics scores — what to buy, why it works, and how to eat it",
    color: "var(--icon-lime)",
  },
]

export default function ReportPage() {
  return (
    <div className="min-h-screen bg-background">

      {/* Dark Hero */}
      <section
        className="px-6 pb-20 pt-32 md:pt-40 md:pb-28"
        style={{ background: "var(--foreground)" }}
      >
        <div className="mx-auto max-w-[1200px]">
          <ScrollReveal>
            {/* Identity bar */}
            <div className="mb-8 flex flex-wrap items-center justify-center gap-3">
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.5)" }}>
                The EatoBiotics Report
              </p>
              <div className="flex items-center gap-2">
                {[
                  { label: "You", score: 68, color: "var(--icon-green)" },
                  { label: "Family", score: 64, color: "var(--icon-yellow)" },
                  { label: "Mind", score: 59, color: "var(--icon-teal)" },
                ].map((pill) => (
                  <span
                    key={pill.label}
                    className="rounded-full px-3 py-1 text-xs font-semibold"
                    style={{
                      background: `color-mix(in srgb, ${pill.color} 18%, transparent)`,
                      color: pill.color,
                      border: `1px solid color-mix(in srgb, ${pill.color} 30%, transparent)`,
                    }}
                  >
                    {pill.label} {pill.score}
                  </span>
                ))}
              </div>
            </div>

            {/* Headline */}
            <div className="text-center">
              <h1 className="font-serif text-5xl font-bold leading-tight text-white sm:text-6xl text-balance">
                See what{" "}
                <span className="brand-gradient-text">your report</span>{" "}
                looks like
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>
                Each EatoBiotics report is a complete picture of your food system — where you are now, what it means, and exactly what to do next.
              </p>

              {/* Report type pills */}
              <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                {REPORTS.map((r) => (
                  <Link
                    key={r.href}
                    href={r.sampleHref}
                    className="rounded-full px-5 py-2.5 text-sm font-semibold transition-opacity hover:opacity-80"
                    style={{
                      background: `color-mix(in srgb, ${r.accent} 15%, transparent)`,
                      color: r.accent,
                      border: `1px solid color-mix(in srgb, ${r.accent} 25%, transparent)`,
                    }}
                  >
                    {r.label} →
                  </Link>
                ))}
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Gradient divider */}
      <div className="section-divider" />

      {/* Premium Report Preview Cards */}
      <section className="px-6 py-20 md:py-28" style={{ background: "var(--foreground)" }}>
        <div className="mx-auto max-w-[1200px]">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {REPORTS.map((report, i) => (
              <ScrollReveal key={report.href} delay={i * 80}>
                <div
                  className="relative flex h-full flex-col overflow-hidden rounded-3xl transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl"
                  style={{
                    background: "color-mix(in srgb, var(--foreground) 80%, #000 20%)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderTopWidth: "4px",
                    borderTopColor: report.accent,
                  }}
                >
                  {/* Score + Profile */}
                  <div className="flex flex-col items-center gap-3 px-6 pt-8 pb-5">
                    {/* Score ring */}
                    <div className="relative flex h-32 w-32 items-center justify-center">
                      <svg className="absolute inset-0" viewBox="0 0 128 128" fill="none">
                        <circle cx="64" cy="64" r="54" stroke="rgba(255,255,255,0.1)" strokeWidth="8" fill="none" />
                        <circle
                          cx="64"
                          cy="64"
                          r="54"
                          stroke={`url(#scoreGrad${i})`}
                          strokeWidth="8"
                          fill="none"
                          strokeLinecap="round"
                          strokeDasharray={`${2 * Math.PI * 54}`}
                          strokeDashoffset={`${2 * Math.PI * 54 * (1 - report.score / 100)}`}
                          transform="rotate(-90 64 64)"
                        />
                        <defs>
                          <linearGradient id={`scoreGrad${i}`} x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="var(--icon-lime)" />
                            <stop offset="50%" stopColor="var(--icon-green)" />
                            <stop offset="100%" stopColor="var(--icon-teal)" />
                          </linearGradient>
                        </defs>
                      </svg>
                      <div className="relative text-center">
                        <div className="font-serif text-3xl font-bold text-white">{report.score}</div>
                        <div className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>/100</div>
                      </div>
                    </div>

                    {/* Profile badge */}
                    <span
                      className="rounded-full px-3 py-1 text-xs font-semibold"
                      style={{
                        background: `color-mix(in srgb, ${report.accent} 15%, transparent)`,
                        color: report.accent,
                      }}
                    >
                      {report.profile}
                    </span>

                    {/* Pillar bars */}
                    <div className="w-full space-y-2 mt-1">
                      {report.pillars.map((p) => (
                        <div key={p.name} className="flex items-center gap-2">
                          <span className="w-16 text-right text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                            {p.name.slice(0, 3)}
                          </span>
                          <div className="flex-1 overflow-hidden rounded-full h-1.5" style={{ background: "rgba(255,255,255,0.1)" }}>
                            <div className="h-full rounded-full" style={{ width: `${p.score}%`, background: p.color }} />
                          </div>
                          <span className="w-6 text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{p.score}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Content */}
                  <div
                    className="flex flex-1 flex-col p-6"
                    style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}
                  >
                    <p className="text-xs font-bold uppercase tracking-widest" style={{ color: report.accent }}>
                      {report.label}
                    </p>
                    <h3 className="mt-2 font-serif text-xl font-semibold leading-snug text-white">
                      {report.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.55)" }}>
                      {report.tagline}
                    </p>

                    {/* Sample insight callout */}
                    <div
                      className="mt-4 rounded-xl p-4"
                      style={{
                        background: `color-mix(in srgb, ${report.accent} 8%, transparent)`,
                        border: `1px solid color-mix(in srgb, ${report.accent} 20%, transparent)`,
                      }}
                    >
                      <p className="text-xs font-semibold uppercase tracking-widest mb-1.5" style={{ color: report.accent }}>
                        Key Insight
                      </p>
                      <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.7)" }}>
                        {report.insight}
                      </p>
                    </div>

                    {/* Dual CTA */}
                    <div className="mt-5 space-y-3">
                      <Link
                        href={report.sampleHref}
                        className="inline-flex items-center gap-1.5 text-sm font-semibold transition-opacity hover:opacity-75"
                        style={{ color: report.accent }}
                      >
                        View full sample
                        <ArrowRight size={13} />
                      </Link>
                      <Link
                        href="/assessment"
                        className="flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 brand-gradient"
                      >
                        Start free assessment
                        <ArrowRight size={14} />
                      </Link>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Gradient divider */}
      <div className="section-divider" style={{ transform: "scaleY(-1)" }} />

      {/* What's inside — magazine section grid */}
      <section className="px-6 py-20 md:py-28">
        <div className="mx-auto max-w-[1200px]">
          <ScrollReveal>
            <div className="mb-12 text-center">
              <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Every Report Includes
              </p>
              <h2 className="font-serif text-4xl font-bold text-foreground sm:text-5xl text-balance">
                What&apos;s inside{" "}
                <span className="brand-gradient-text">every report</span>
              </h2>
              <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-muted-foreground">
                Eight named sections — each tailored to you, your family, or your mind depending on your report type.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {REPORT_SECTIONS.map((section, i) => (
              <ScrollReveal key={section.name} delay={i * 40}>
                <div className="flex flex-col gap-3 rounded-2xl border border-border bg-background p-5 h-full">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-xl text-lg"
                    style={{ background: `color-mix(in srgb, ${section.color} 12%, transparent)` }}
                  >
                    {section.icon}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{section.name}</p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{section.description}</p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA strip */}
      <section className="px-6 pb-20 md:pb-28">
        <div className="mx-auto max-w-[1200px]">
          <ScrollReveal>
            <div className="brand-gradient overflow-hidden rounded-3xl px-8 py-14 text-center text-white">
              <p className="text-xs font-bold uppercase tracking-widest opacity-80">
                Get Started
              </p>
              <h2 className="mt-3 font-serif text-3xl font-bold sm:text-4xl">
                Ready to see yours?
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed opacity-90">
                Take the free assessment to see your gut health score, then unlock your full personalised report.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/assessment"
                  className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-base font-semibold shadow-lg transition-opacity hover:opacity-90"
                  style={{ color: "var(--icon-green)" }}
                >
                  Start Free Assessment
                  <ArrowRight size={16} />
                </Link>
                <Link
                  href="/report"
                  className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/10 px-8 py-4 text-base font-semibold text-white transition-colors hover:bg-white/20"
                >
                  View all sample reports
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

    </div>
  )
}
