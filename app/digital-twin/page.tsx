import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import {
  ArrowRight, Baby, PersonStanding, User, UserRound, Users,
  FlaskConical, ShieldCheck, Sparkles, Globe, TrendingUp, Flame,
} from "lucide-react"
import { ScrollReveal } from "@/components/scroll-reveal"
import { HeroVideo } from "@/components/hero-video"
import { Eyebrow, CtaButton } from "@/components/digital-twin/parts"
import { HeroStage } from "@/components/digital-twin/hero-stage"
import { FlowDiagram } from "@/components/digital-twin/flow-diagram"
import { BioticEcosystems } from "@/components/digital-twin/biotic-ecosystems"
import { WeekDashboard } from "@/components/digital-twin/week-dashboard"
import { SystemDimensions } from "@/components/digital-twin/system-dimensions"
import { ReactionCards } from "@/components/digital-twin/reaction-cards"
import { InsideOutEmbed } from "@/components/twin-motion/inside-out-embed"
import { ImpactJourney } from "@/components/digital-twin/impact-journey"
import { OrbitHub } from "@/components/digital-twin/orbit-hub"
import { ScoreRing } from "@/components/assessment/score-ring"

export const metadata: Metadata = {
  title: "Your Food System — EatoBiotics",
  description:
    "Build the Food System Inside You. Watch it learn. See it improve. Feel the difference. A living picture of the Food System Inside You — one that learns from every meal.",
  openGraph: {
    title: "Your Food System — EatoBiotics",
    description: "Build the Food System Inside You. Watch it learn. See it improve. Feel the difference.",
    url: "https://eatobiotics.com/digital-twin",
  },
}

const GREEN = "#4CB648"
const ORANGE = "#F5A623"
const lora = { fontFamily: "var(--font-lora), Georgia, serif" } as const

const LOOP_STEPS = ["You live", "Observes", "Learns", "Understands", "Guides", "You improve"]

const IMPROVE_CHIPS = ["Steadier energy", "Calmer digestion", "Better sleep", "Clearer focus"]

const DEVELOP_CARDS = [
  { Icon: TrendingUp, title: "Your score climbs", line: "Each logged meal nudges your Food System Score upward.", gradient: "linear-gradient(135deg,#A8E063,#4CB648)" },
  { Icon: Sparkles, title: "Guidance adapts", line: "Your next best action changes to match where you are today.", gradient: "linear-gradient(135deg,#4CB648,#2DAA6E)" },
  { Icon: Flame, title: "Momentum builds", line: "Small wins stack into a streak you can actually feel.", gradient: "linear-gradient(135deg,#F5C518,#F5A623)" },
]

const LIFECYCLE = [
  { Icon: Baby, label: "Childhood", s: 26, score: 58 },
  { Icon: PersonStanding, label: "Adolescence", s: 30, score: 64 },
  { Icon: User, label: "Young adult", s: 34, score: 71 },
  { Icon: UserRound, label: "Adult", s: 38, score: 76 },
  { Icon: Users, label: "Parent", s: 40, score: 81 },
  { Icon: PersonStanding, label: "Later life", s: 34, score: 84 },
]
const TRUST = [
  { Icon: FlaskConical, t: "Science-backed", s: "Microbiome research + the three biotics." },
  { Icon: User, t: "Personal", s: "Built around your unique Food System." },
  { Icon: ShieldCheck, t: "Private", s: "Your data. Your control. Always." },
  { Icon: Sparkles, t: "Powerful", s: "Technology that learns; guidance that helps." },
  { Icon: Globe, t: "Purpose", s: "Improve yours. Help build the Food System." },
]

function tint(hex: string, pct: number) {
  return `color-mix(in srgb, ${hex} ${pct}%, #fff)`
}

export default function DigitalTwinPage() {
  return (
    <main className="overflow-hidden bg-background">

      {/* ════ 1 · Cinematic Hero ════ */}
      <section className="relative flex min-h-[90vh] flex-col items-center justify-center px-6 pt-20 pb-12 text-center">
        <ScrollReveal className="flex flex-col items-center">
          <Eyebrow>Your Food System</Eyebrow>
          <HeroStage>
            <HeroVideo
              posterSrc="/videos/dt-hero-poster.jpg"
              mp4Src="/videos/dt-hero.mp4"
              webmSrc="/videos/dt-hero.webm"
              alt="The living Food System Inside You"
              className="h-auto w-full"
            />
          </HeroStage>
          <h1 style={lora} className="mx-auto -mt-2 max-w-4xl text-5xl font-bold leading-[1.02] text-foreground sm:text-6xl md:text-7xl text-balance">
            Build the <span className="brand-gradient-text">Food System Inside You</span>.
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
            Watch it learn. See it improve. Feel the difference. A living picture of your Food
            System — one that learns from every meal.
          </p>
          <div className="mt-9 flex justify-center"><CtaButton>Build My Food System</CtaButton></div>
        </ScrollReveal>
      </section>

      {/* ════ 2 · Visualise — flowing streams ════ */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-[1100px]">
          <ScrollReveal>
            <div className="mx-auto mb-14 max-w-2xl text-center">
              <Eyebrow>Visualise</Eyebrow>
              <h2 style={lora} className="text-4xl font-semibold text-foreground sm:text-5xl text-balance">
                See the Food System Inside You.
              </h2>
              <p className="mt-5 text-lg text-muted-foreground">
                Everything you live flows into one living system — and guidance flows back.
              </p>
            </div>
          </ScrollReveal>
          <ScrollReveal><FlowDiagram /></ScrollReveal>
          <ScrollReveal>
            <ol className="mt-12 flex flex-wrap items-center justify-center gap-2">
              {LOOP_STEPS.map((s, i) => (
                <li key={s} className="flex items-center gap-2">
                  <span className="rounded-full px-4 py-2 text-sm font-semibold text-white" style={{ background: i === 0 || i === LOOP_STEPS.length - 1 ? "linear-gradient(135deg,#4CB648,#2DAA6E)" : "linear-gradient(135deg,#F5C518,#F5A623)" }}>{s}</span>
                  {i < LOOP_STEPS.length - 1 && <ArrowRight aria-hidden className="h-4 w-4 text-muted-foreground" />}
                </li>
              ))}
            </ol>
          </ScrollReveal>
        </div>
      </section>

      {/* ════ 3 · Understand — living biotic ecosystems ════ */}
      <section className="px-6 py-24" style={{ background: tint(GREEN, 4) }}>
        <div className="mx-auto max-w-[1100px]">
          <ScrollReveal>
            <div className="mx-auto mb-16 max-w-2xl text-center">
              <Eyebrow>Understand</Eyebrow>
              <h2 style={lora} className="text-4xl font-semibold text-foreground sm:text-5xl text-balance">
                Three living ecosystems inside you.
              </h2>
              <p className="mt-5 text-lg text-muted-foreground">
                Feed them, add to them, harvest the benefits — that&apos;s how your Food System grows.
              </p>
            </div>
          </ScrollReveal>
          <ScrollReveal><BioticEcosystems /></ScrollReveal>
        </div>
      </section>

      {/* ════ 3b · See it in action — every choice creates a reaction ════ */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-[1100px]">
          <ScrollReveal>
            <div className="mx-auto mb-12 max-w-2xl text-center">
              <Eyebrow>See it in action</Eyebrow>
              <h2 style={lora} className="text-4xl font-semibold text-foreground sm:text-5xl text-balance">
                Every choice creates a reaction.
              </h2>
              <p className="mt-5 text-lg text-muted-foreground">
                Kefir lights the probiotic network. Beans expand the fibre pathways. Your Food
                System responds to everything — and shows you, in the same colours, every day.
              </p>
            </div>
          </ScrollReveal>
          <ScrollReveal><ReactionCards /></ScrollReveal>
          <ScrollReveal>
            <div
              className="mx-auto mt-8 flex max-w-3xl flex-col items-center gap-4 rounded-[2rem] border border-border bg-card px-8 py-8 text-center sm:flex-row sm:text-left"
              style={{ boxShadow: "0 20px 50px -25px rgba(20,37,15,0.35)" }}
            >
              <p style={lora} className="flex-1 text-2xl font-semibold leading-snug text-foreground">
                You see it. You feel it. <span className="brand-gradient-text">You improve it.</span>
              </p>
              <div className="shrink-0">
                <p className="text-sm text-muted-foreground">Understanding creates empowerment.<br />Empowerment creates change.</p>
                <Link href="/demo/account/twin" className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-icon-green">
                  Watch a Food System respond <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ════ 4 · Develop — the Twin in action (animated week) ════ */}
      <section className="px-6 py-24 md:py-32">
        <div className="mx-auto max-w-[1200px]">
          <ScrollReveal>
            <div className="mx-auto mb-14 max-w-2xl text-center">
              <Eyebrow>Develop</Eyebrow>
              <h2 style={lora} className="text-4xl font-semibold text-foreground sm:text-5xl md:text-6xl text-balance">
                Watch it grow, <span className="brand-gradient-text">day by day</span>.
              </h2>
              <p className="mt-5 text-lg text-muted-foreground">
                Every meal makes your Food System smarter — your score climbs, your guidance adapts,
                and momentum builds.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            {/* Left — the living week dashboard */}
            <ScrollReveal>
              <div className="relative flex justify-center">
                <div
                  aria-hidden
                  className="pointer-events-none absolute -inset-4 -z-10 rounded-[3rem] opacity-70 blur-3xl"
                  style={{ background: "radial-gradient(55% 55% at 50% 45%, rgba(76,182,72,0.28), transparent 75%)" }}
                />
                <WeekDashboard />
              </div>
            </ScrollReveal>

            {/* Right — what happens as the week unfolds */}
            <ScrollReveal>
              <div className="flex flex-col gap-4">
                {DEVELOP_CARDS.map((c) => (
                  <div
                    key={c.title}
                    className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 transition-shadow hover:shadow-lg"
                  >
                    <span aria-hidden className="absolute inset-y-0 left-0 w-1.5" style={{ background: c.gradient }} />
                    <div className="flex items-start gap-4 pl-2">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white" style={{ background: c.gradient }}>
                        <c.Icon className="h-5 w-5" />
                      </span>
                      <div>
                        <h3 className="font-serif text-lg font-semibold text-foreground">{c.title}</h3>
                        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{c.line}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ════ 5 · Improve — aspirational vitality ════ */}
      <section className="px-6 py-24 md:py-32" style={{ background: tint(ORANGE, 4) }}>
        <div className="mx-auto max-w-[1200px]">
          <ScrollReveal>
            <div className="mx-auto mb-14 max-w-2xl text-center">
              <Eyebrow>Improve</Eyebrow>
              <h2 style={lora} className="text-4xl font-semibold text-foreground sm:text-5xl md:text-6xl text-balance">
                Feel the <span className="brand-gradient-text">difference</span>.
              </h2>
              <p className="mt-5 text-lg text-muted-foreground">
                Small steps compound. As your Food System strengthens, you feel it in how you live.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            {/* Left — aspirational image, large + well-framed */}
            <ScrollReveal>
              <div className="relative mx-auto w-full max-w-[520px]">
                <div
                  aria-hidden
                  className="pointer-events-none absolute -inset-6 -z-10 rounded-[3rem] opacity-80 blur-3xl"
                  style={{ background: "radial-gradient(60% 60% at 50% 48%, rgba(245,197,24,0.30), rgba(76,182,72,0.18) 55%, transparent 78%)" }}
                />
                <Image
                  src="/images/eatosports-hero.webp"
                  alt="Vitality and energy in motion"
                  width={760}
                  height={760}
                  sizes="(max-width: 1024px) 90vw, 520px"
                  className="h-auto w-full object-contain"
                  style={{ mixBlendMode: "multiply" }}
                />
              </div>
            </ScrollReveal>

            {/* Right — the outcome panel */}
            <ScrollReveal>
              <div className="relative overflow-hidden rounded-[2rem] border border-border bg-card p-8 shadow-[0_30px_70px_-30px_rgba(20,37,15,0.4)] sm:p-10">
                <span aria-hidden className="absolute inset-x-0 top-0 h-1.5" style={{ background: "linear-gradient(90deg,#A8E063,#4CB648,#2DAA6E,#F5C518,#F5A623)" }} />
                <div className="flex flex-col items-center gap-8 sm:flex-row sm:items-center">
                  <ScoreRing score={80} color="var(--icon-green)" gradientId="dt-improve-ring" profileType="Improving" className="relative h-44 w-44 shrink-0 sm:h-48 sm:w-48" />
                  <div className="text-center sm:text-left">
                    <div className="flex items-center justify-center gap-2 sm:justify-start">
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Baseline 74</span>
                      <ArrowRight className="h-4 w-4 text-icon-green" />
                      <span className="rounded-full px-2.5 py-0.5 text-xs font-bold text-white" style={{ background: "linear-gradient(135deg,#4CB648,#2DAA6E)" }}>+6</span>
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                      Six weeks of small, guided steps — and a measurably stronger Food System.
                    </p>
                    <Sparkline />
                  </div>
                </div>

                <div className="mt-8 grid grid-cols-2 gap-3">
                  {IMPROVE_CHIPS.map((c) => (
                    <span key={c} className="inline-flex items-center gap-2 rounded-2xl border border-border bg-background px-4 py-3 text-sm font-semibold text-foreground">
                      <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: GREEN }} />{c}
                    </span>
                  ))}
                </div>

                <Link href="/performance" className="mt-7 inline-flex items-center gap-1.5 text-sm font-semibold text-icon-green">
                  Built for performance, too <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ════ 6 · Many dimensions — product cards ════ */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-[1100px]">
          <ScrollReveal>
            <div className="mx-auto mb-12 max-w-2xl text-center">
              <Eyebrow>Many dimensions</Eyebrow>
              <h2 style={lora} className="text-4xl font-semibold text-foreground sm:text-5xl text-balance">
                One Food System. Many lenses.
              </h2>
              <p className="mt-5 text-lg text-muted-foreground">
                The same living system, seen through every part of your health and life.
              </p>
            </div>
          </ScrollReveal>
          <ScrollReveal><SystemDimensions /></ScrollReveal>
        </div>
      </section>

      {/* ════ 7 · From you to the Food System — vertical journey ════ */}
      <section className="px-6 py-24" style={{ background: "linear-gradient(160deg, color-mix(in srgb,var(--icon-green) 8%,#fff), color-mix(in srgb,var(--icon-orange) 6%,#fff))" }}>
        <div className="mx-auto max-w-[1000px] text-center">
          <ScrollReveal>
            <Eyebrow>From you to the Food System</Eyebrow>
            <h2 style={lora} className="mx-auto max-w-3xl text-4xl font-semibold text-foreground sm:text-5xl text-balance">
              Millions of healthier Food Systems. <span className="brand-gradient-text">One shared impact.</span>
            </h2>
          </ScrollReveal>
          <ScrollReveal>
            <div className="mt-14"><ImpactJourney /></div>
          </ScrollReveal>
          <ScrollReveal>
            <p className="mt-12 text-lg font-semibold text-foreground">We develop the EatoSystem from the inside out.</p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {["Anonymous", "Aggregated", "Actionable", "Meaningful"].map((c) => (
                <span key={c} className="rounded-full border border-border bg-card px-4 py-1.5 text-xs font-semibold text-muted-foreground">{c}</span>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ════ 8 · A lifetime of learning ════ */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-[1100px]">
          <ScrollReveal>
            <div className="mx-auto mb-14 max-w-2xl text-center">
              <Eyebrow>A lifetime of learning</Eyebrow>
              <h2 style={lora} className="text-4xl font-semibold text-foreground sm:text-5xl text-balance">
                One Food System. A lifetime of learning.
              </h2>
              <p className="mt-5 text-lg text-muted-foreground">Your Food System evolves with you — growing through every season of life.</p>
            </div>
          </ScrollReveal>
          <ScrollReveal>
            <div className="relative">
              <div aria-hidden className="absolute left-0 right-0 top-[44px] h-1 rounded-full" style={{ background: "linear-gradient(90deg,#A8E063,#4CB648,#2DAA6E,#F5C518,#F5A623)" }} />
              <div className="relative grid grid-cols-3 gap-y-10 sm:grid-cols-6">
                {LIFECYCLE.map(({ Icon, label, s, score }, i) => (
                  <div key={label} className="flex flex-col items-center text-center">
                    <span className="relative flex items-center justify-center rounded-full bg-card ring-1 ring-border" style={{ width: 92, height: 92, color: `color-mix(in srgb,#4CB648 ${100 - i * 14}%, #F5A623)` }}>
                      <Icon style={{ width: s, height: s }} />
                      <span className="absolute -bottom-2 rounded-full px-2 py-0.5 text-[10px] font-bold text-white" style={{ background: "linear-gradient(135deg,#4CB648,#2DAA6E)" }}>{score}</span>
                    </span>
                    <span className="mt-4 text-xs font-semibold text-foreground">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ════ 8.5 · From the inside out — the EatoSystem philosophy ════ */}
      <section className="relative overflow-hidden px-6 py-24" style={{ background: "linear-gradient(175deg, #0B1607 0%, #122208 55%, #16290F 100%)" }}>
        <div className="mx-auto max-w-[1100px]">
          <ScrollReveal>
            <div className="mx-auto mb-10 max-w-2xl text-center">
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: "#A8E063" }}>From the inside out</p>
              <h2 style={{ ...lora, color: "#FDFBF7" }} className="text-4xl font-semibold sm:text-5xl text-balance">
                You are where the Food System begins.
              </h2>
              <p className="mt-5 text-lg" style={{ color: "rgba(253,251,247,0.65)" }}>
                Improve the Food System Inside You, and it ripples outward — through your family,
                your community, your county, your country — into the Food System itself.
              </p>
            </div>
          </ScrollReveal>
          <ScrollReveal>
            <div className="mx-auto max-w-3xl">
              <InsideOutEmbed />
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ════ 9 · Connected to everything — orbiting hub ════ */}
      <section className="px-6 py-24" style={{ background: tint(GREEN, 4) }}>
        <div className="mx-auto max-w-[1100px]">
          <ScrollReveal>
            <div className="mx-auto mb-12 max-w-2xl text-center">
              <Eyebrow>The road ahead</Eyebrow>
              <h2 style={lora} className="text-4xl font-semibold text-foreground sm:text-5xl text-balance">
                One Food System. Connected to everything.
              </h2>
              <p className="mt-5 text-lg text-muted-foreground">Every capability orbits a single intelligent core — Your Food System.</p>
            </div>
          </ScrollReveal>
          <ScrollReveal><OrbitHub /></ScrollReveal>
          <p className="mt-8 text-center text-xs text-muted-foreground">Long-term vision — not all features are available today.</p>
        </div>
      </section>

      {/* ════ 10 · Final close ════ */}
      <section className="px-6 pb-10 pt-24 text-center">
        <ScrollReveal className="flex flex-col items-center">
          <HeroStage>
            <HeroVideo
              posterSrc="/videos/dt-close-poster.jpg"
              mp4Src="/videos/dt-close.mp4"
              webmSrc="/videos/dt-close.webm"
              alt="The Food System Inside You"
              className="h-auto w-full"
            />
          </HeroStage>
          <h2 style={lora} className="mx-auto -mt-2 max-w-3xl text-4xl font-bold text-foreground sm:text-6xl text-balance">
            Build the <span className="brand-gradient-text">Food System Inside You</span>.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground">
            Watch it learn. See it improve. Feel the difference — and help build the Food System.
          </p>
          <div className="mt-9 flex justify-center"><CtaButton>Build My Food System</CtaButton></div>
        </ScrollReveal>
      </section>

      {/* trust strip */}
      <section className="px-6 pb-28">
        <div className="mx-auto grid max-w-[1100px] gap-5 rounded-3xl border border-border bg-card p-8 sm:grid-cols-2 lg:grid-cols-5">
          {TRUST.map(({ Icon, t, s }) => (
            <div key={t} className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full" style={{ background: tint(GREEN, 12), color: GREEN }}><Icon className="h-[18px] w-[18px]" /></span>
              <div><div className="text-sm font-semibold text-foreground">{t}</div><div className="text-xs leading-snug text-muted-foreground">{s}</div></div>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}

/* ── Improve: a small upward trend sparkline (brand gradient) ─── */
function Sparkline() {
  const pts = [10, 18, 15, 26, 30, 38, 44]
  const w = 180
  const h = 48
  const max = 48
  const step = w / (pts.length - 1)
  const coords = pts.map((p, i) => [i * step, h - (p / max) * h] as const)
  const line = coords.map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`).join(" ")
  const area = `${line} L ${w} ${h} L 0 ${h} Z`
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="mt-4 h-12 w-full max-w-[220px]" aria-hidden>
      <defs>
        <linearGradient id="dt-spark-line" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#A8E063" /><stop offset="0.5" stopColor="#4CB648" /><stop offset="1" stopColor="#F5A623" />
        </linearGradient>
        <linearGradient id="dt-spark-area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="rgba(76,182,72,0.28)" /><stop offset="1" stopColor="rgba(76,182,72,0)" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#dt-spark-area)" />
      <path d={line} fill="none" stroke="url(#dt-spark-line)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {coords.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i === coords.length - 1 ? 3.5 : 0} fill="#F5A623" />
      ))}
    </svg>
  )
}
