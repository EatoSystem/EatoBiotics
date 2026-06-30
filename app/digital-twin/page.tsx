import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import {
  ArrowRight, Baby, PersonStanding, User, UserRound, Users,
  FlaskConical, ShieldCheck, Sparkles, Globe,
} from "lucide-react"
import { ScrollReveal } from "@/components/scroll-reveal"
import { HeroVideo } from "@/components/hero-video"
import { DigitalTwinFigure, Eyebrow, CtaButton } from "@/components/digital-twin/parts"
import { HeroStage } from "@/components/digital-twin/hero-stage"
import { FlowDiagram } from "@/components/digital-twin/flow-diagram"
import { BioticEcosystems } from "@/components/digital-twin/biotic-ecosystems"
import { WeekDashboard } from "@/components/digital-twin/week-dashboard"
import { SystemDimensions } from "@/components/digital-twin/system-dimensions"
import { ImpactJourney } from "@/components/digital-twin/impact-journey"
import { OrbitHub } from "@/components/digital-twin/orbit-hub"
import { CountUp } from "@/components/digital-twin/count-up"

export const metadata: Metadata = {
  title: "Your Food System Digital Twin",
  description:
    "A living digital twin of the Food System Inside You. See it, understand it, develop it day by day, and feel the difference — improving your Food System, and helping build the Food System.",
  openGraph: {
    title: "Meet Your Food System Digital Twin — EatoBiotics",
    description: "Visualise, understand, develop and improve the Food System Inside You.",
    url: "https://eatobiotics.com/digital-twin",
  },
}

const GREEN = "#4CB648"
const ORANGE = "#F5A623"
const lora = { fontFamily: "var(--font-lora), Georgia, serif" } as const

const LOOP_STEPS = ["You live", "Observes", "Learns", "Understands", "Guides", "You improve"]

const IMPROVE_CHIPS = ["Steadier energy", "Calmer digestion", "Better sleep", "Clearer focus"]

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
          <Eyebrow>Your Digital Twin</Eyebrow>
          <HeroStage>
            <HeroVideo
              posterSrc="/videos/dt-hero-poster.jpg"
              mp4Src="/videos/dt-hero.mp4"
              webmSrc="/videos/dt-hero.webm"
              alt="Your living Food System Digital Twin"
              className="h-auto w-full"
            />
          </HeroStage>
          <h1 style={lora} className="mx-auto -mt-2 max-w-4xl text-5xl font-bold leading-[1.02] text-foreground sm:text-6xl md:text-7xl text-balance">
            Meet your <span className="brand-gradient-text">Digital Twin</span>.
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
            A living picture of the Food System Inside You — see it, understand it, grow it,
            and feel the difference.
          </p>
          <div className="mt-9 flex justify-center"><CtaButton>Build My Digital Twin</CtaButton></div>
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
                Feed them, add to them, harvest the benefits — that&apos;s how your Twin grows.
              </p>
            </div>
          </ScrollReveal>
          <ScrollReveal><BioticEcosystems /></ScrollReveal>
        </div>
      </section>

      {/* ════ 4 · Develop — the Twin in action (animated week) ════ */}
      <section className="px-6 py-24">
        <div className="mx-auto grid max-w-[1050px] items-center gap-12 lg:grid-cols-2">
          <ScrollReveal>
            <Eyebrow>Develop</Eyebrow>
            <h2 style={lora} className="text-4xl font-semibold text-foreground sm:text-5xl text-balance">
              Watch it grow, day by day.
            </h2>
            <p className="mt-5 max-w-md text-lg text-muted-foreground">
              Every meal makes your Twin smarter. As the week unfolds your score climbs, your
              next best action adapts, and momentum builds.
            </p>
            <div className="mt-7">
              <DevelopPlate />
            </div>
          </ScrollReveal>
          <ScrollReveal>
            <WeekDashboard />
          </ScrollReveal>
        </div>
      </section>

      {/* ════ 5 · Improve — aspirational vitality ════ */}
      <section className="px-6 py-24" style={{ background: tint(ORANGE, 4) }}>
        <div className="mx-auto grid max-w-[1050px] items-center gap-12 lg:grid-cols-2">
          <ScrollReveal>
            <div className="mx-auto w-[82%] lg:w-full">
              <DigitalTwinFigure size={400} src="/images/eatosports-hero.webp" alt="Vitality and energy in motion" />
            </div>
          </ScrollReveal>
          <ScrollReveal>
            <Eyebrow>Improve</Eyebrow>
            <h2 style={lora} className="text-4xl font-semibold text-foreground sm:text-5xl text-balance">
              Feel the difference.
            </h2>
            <div className="mt-6 flex items-end gap-4">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Baseline</div>
                <div style={lora} className="text-3xl font-bold leading-none text-muted-foreground">74</div>
              </div>
              <ArrowRight className="mb-1 h-7 w-7 text-icon-green" />
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-icon-green">Now</div>
                <span style={lora} className="text-6xl font-bold leading-none" >
                  <span style={{ color: GREEN }}><CountUp to={80} className="tabular-nums" /></span>
                </span>
              </div>
              <span className="mb-2 rounded-full px-3 py-1 text-sm font-semibold text-white" style={{ background: "linear-gradient(135deg,#4CB648,#2DAA6E)" }}>+6</span>
            </div>
            <p className="mt-5 max-w-md text-lg text-muted-foreground">
              Small steps compound. As your Food System strengthens, you feel it in how you live.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {IMPROVE_CHIPS.map((c) => (
                <span key={c} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: GREEN }} />{c}
                </span>
              ))}
            </div>
            <Link href="/performance" className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-icon-green">
              Built for performance, too <ArrowRight className="h-4 w-4" />
            </Link>
          </ScrollReveal>
        </div>
      </section>

      {/* ════ 6 · Many dimensions — product cards ════ */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-[1100px]">
          <ScrollReveal>
            <div className="mx-auto mb-12 max-w-2xl text-center">
              <Eyebrow>Many dimensions</Eyebrow>
              <h2 style={lora} className="text-4xl font-semibold text-foreground sm:text-5xl text-balance">
                One Twin. Many lenses.
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
                One Twin. A lifetime of learning.
              </h2>
              <p className="mt-5 text-lg text-muted-foreground">Your Digital Twin evolves with you — growing through every season of life.</p>
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

      {/* ════ 9 · Connected to everything — orbiting hub ════ */}
      <section className="px-6 py-24" style={{ background: tint(GREEN, 4) }}>
        <div className="mx-auto max-w-[1100px]">
          <ScrollReveal>
            <div className="mx-auto mb-12 max-w-2xl text-center">
              <Eyebrow>The road ahead</Eyebrow>
              <h2 style={lora} className="text-4xl font-semibold text-foreground sm:text-5xl text-balance">
                One Twin. Connected to everything.
              </h2>
              <p className="mt-5 text-lg text-muted-foreground">Every capability orbits a single intelligent core — your Digital Twin.</p>
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
              alt="Your Food System Digital Twin"
              className="h-auto w-full"
            />
          </HeroStage>
          <h2 style={lora} className="mx-auto -mt-2 max-w-3xl text-4xl font-bold text-foreground sm:text-6xl text-balance">
            Build your <span className="brand-gradient-text">Digital Twin</span>.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground">
            Improve the Food System Inside You. Help build the Food System.
          </p>
          <div className="mt-9 flex justify-center"><CtaButton>Build My Digital Twin</CtaButton></div>
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

/* ── Develop: the EatoBiotics plate (every meal feeds the Twin) ─ */
function DevelopPlate() {
  return (
    <div className="flex items-center gap-4 rounded-3xl border border-border bg-card p-4 shadow-[0_2px_10px_rgba(26,46,18,0.05)]">
      <Image
        src="/images/eatobiotics/eatobiotics-plate.png"
        alt="The EatoBiotics plate — prebiotic base, probiotic side, protein balance, healthy fats"
        width={160}
        height={160}
        sizes="160px"
        className="h-20 w-20 shrink-0 sm:h-24 sm:w-24"
        style={{ mixBlendMode: "multiply" }}
      />
      <div>
        <div className="text-xs font-semibold uppercase tracking-wider text-icon-green">Every meal counts</div>
        <p className="mt-1 text-sm font-semibold leading-snug text-foreground">
          Build a plate, log how you feel — your Twin learns from each one.
        </p>
      </div>
    </div>
  )
}
