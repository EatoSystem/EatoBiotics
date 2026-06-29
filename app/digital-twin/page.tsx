import type { Metadata } from "next"
import {
  ArrowRight, Utensils, Moon, HeartPulse, Brain, ClipboardList, TrendingUp,
  Lightbulb, BarChart3, Leaf, History,
  User, Users, Globe, Baby, PersonStanding, UserRound,
  FileText, Mic, Bot, Watch, Puzzle, FlaskConical, ShieldCheck, Sparkles, Footprints,
} from "lucide-react"
import { ScrollReveal } from "@/components/scroll-reveal"
import { AgentLoopTimeline } from "@/components/agent-loop/AgentLoopTimeline"
import { DigitalTwinFigure, Eyebrow, CtaButton } from "@/components/digital-twin/parts"
import { CountUp } from "@/components/digital-twin/count-up"

export const metadata: Metadata = {
  title: "Your Food System Digital Twin",
  description:
    "A living digital twin of the Food System Inside You. It learns from your meals, sleep, activity, symptoms and habits, understands what's changing, and guides your next best action — improving your Food System, and helping build the Food System.",
  openGraph: {
    title: "Meet Your Food System Digital Twin — EatoBiotics",
    description: "Understand the Food System Inside You like never before.",
    url: "https://eatobiotics.com/digital-twin",
  },
}

const GREEN = "#4CB648"
const ORANGE = "#F5A623"
const lora = { fontFamily: "var(--font-lora), Georgia, serif" } as const

/* ── Ch2 inputs ─────────────────────────────────────────────── */
const INPUTS = [
  { Icon: Utensils, label: "Meals" }, { Icon: Moon, label: "Sleep" },
  { Icon: Footprints, label: "Activity" }, { Icon: HeartPulse, label: "Symptoms" },
  { Icon: Brain, label: "Habits" }, { Icon: ClipboardList, label: "Assessments" },
  { Icon: TrendingUp, label: "Progress" },
]
/* ── Ch3 friendly loop ──────────────────────────────────────── */
const LOOP_STEPS = ["You live", "Observes", "Learns", "Understands", "Guides", "You improve"]
/* ── Ch4 memories ───────────────────────────────────────────── */
const MEMORIES = [
  { Icon: Utensils, label: "Meals" }, { Icon: BarChart3, label: "Patterns" },
  { Icon: TrendingUp, label: "Progress" }, { Icon: Leaf, label: "Three Biotics" },
  { Icon: Lightbulb, label: "Recommendations" }, { Icon: History, label: "History" },
]
/* ── Ch7 lifecycle ──────────────────────────────────────────── */
const LIFECYCLE = [
  { Icon: Baby, label: "Childhood", s: 26 }, { Icon: PersonStanding, label: "Adolescence", s: 30 },
  { Icon: User, label: "Young adult", s: 34 }, { Icon: UserRound, label: "Adult", s: 38 },
  { Icon: Users, label: "Parent", s: 40 }, { Icon: PersonStanding, label: "Later life", s: 34 },
]
/* ── Ch8 future ─────────────────────────────────────────────── */
const CONNECTED = [
  { Icon: Utensils, label: "Meals" }, { Icon: Users, label: "Family" },
  { Icon: FileText, label: "Reports" }, { Icon: Mic, label: "Voice" },
  { Icon: Bot, label: "AI" }, { Icon: Watch, label: "Wearables" },
  { Icon: HeartPulse, label: "Health programmes" }, { Icon: Puzzle, label: "Add-on systems" },
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

      {/* ════ Ch1 — Meet Your Digital Twin ════ */}
      <section className="px-6 pt-24 pb-10 text-center md:pt-32">
        <ScrollReveal>
          <Eyebrow>Your Digital Twin</Eyebrow>
          <DigitalTwinFigure size={460} className="my-2" />
          <h1 style={lora} className="mx-auto mt-4 max-w-4xl text-5xl font-bold leading-[1.03] text-foreground sm:text-6xl md:text-7xl text-balance">
            Meet your <span className="brand-gradient-text">Digital Twin</span>.
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
            A living representation of the Food System Inside You — one that learns,
            understands, and guides you to feel your best.
          </p>
          <div className="mt-9 flex justify-center"><CtaButton>Build My Digital Twin</CtaButton></div>
        </ScrollReveal>
      </section>

      {/* ════ Ch2 — How Your Twin Comes Alive ════ */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-[1100px]">
          <ScrollReveal>
            <div className="mx-auto mb-14 max-w-2xl text-center">
              <Eyebrow>How it comes alive</Eyebrow>
              <h2 style={lora} className="text-4xl font-semibold text-foreground sm:text-5xl text-balance">
                Everything you do flows into one living system.
              </h2>
            </div>
          </ScrollReveal>
          <ScrollReveal>
            <div className="grid items-center gap-8 lg:grid-cols-[1fr_auto_1fr]">
              {/* inputs */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-1">
                {INPUTS.map(({ Icon, label }) => (
                  <div key={label} className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full" style={{ background: tint(GREEN, 12), color: GREEN }}>
                      <Icon className="h-[18px] w-[18px]" />
                    </span>
                    <span className="text-sm font-semibold text-foreground">{label}</span>
                  </div>
                ))}
              </div>
              {/* flow connector (desktop) */}
              <svg width="120" height="240" viewBox="0 0 120 240" fill="none" className="hidden lg:block" aria-hidden>
                {[40, 120, 200].map((y, i) => (
                  <path key={i} d={`M0 ${y} C 60 ${y}, 60 120, 120 120`} stroke={i % 2 ? ORANGE : GREEN} strokeWidth="2" strokeDasharray="2 9" strokeLinecap="round" className="eb-flow" opacity="0.6" />
                ))}
              </svg>
              {/* figure */}
              <DigitalTwinFigure size={320} className="lg:justify-self-end" />
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ════ Ch3 — Your Twin Learns (the engine) ════ */}
      <section className="px-6 py-24" style={{ background: tint(GREEN, 4) }}>
        <div className="mx-auto max-w-[1000px]">
          <ScrollReveal>
            <div className="mx-auto mb-10 max-w-2xl text-center">
              <Eyebrow>The engine</Eyebrow>
              <h2 style={lora} className="text-4xl font-semibold text-foreground sm:text-5xl text-balance">
                Your Twin learns — quietly, continuously.
              </h2>
            </div>
          </ScrollReveal>
          <ScrollReveal>
            <ol className="mb-10 flex flex-wrap items-center justify-center gap-2">
              {LOOP_STEPS.map((s, i) => (
                <li key={s} className="flex items-center gap-2">
                  <span className="rounded-full px-4 py-2 text-sm font-semibold text-white" style={{ background: i === 0 || i === LOOP_STEPS.length - 1 ? "linear-gradient(135deg,#4CB648,#2DAA6E)" : "linear-gradient(135deg,#F5C518,#F5A623)" }}>{s}</span>
                  {i < LOOP_STEPS.length - 1 && <ArrowRight aria-hidden className="h-4 w-4 text-muted-foreground" />}
                </li>
              ))}
            </ol>
          </ScrollReveal>
          <ScrollReveal>
            <div className="rounded-3xl border border-border bg-card p-6 sm:p-8">
              <p className="mb-4 text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground">The Agent Loop — the intelligence behind your Twin</p>
              <AgentLoopTimeline currentStage="recommend" />
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ════ Ch4 — Your Twin Remembers ════ */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-[1000px]">
          <ScrollReveal>
            <div className="mx-auto mb-12 max-w-2xl text-center">
              <Eyebrow>Memory</Eyebrow>
              <h2 style={lora} className="text-4xl font-semibold text-foreground sm:text-5xl text-balance">
                Your Twin remembers you.
              </h2>
              <p className="mt-5 text-lg text-muted-foreground">Every interaction makes it more useful.</p>
            </div>
          </ScrollReveal>
          <ScrollReveal>
            <div className="relative mx-auto" style={{ width: 440, height: 440, maxWidth: "100%" }}>
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"><DigitalTwinFigure size={230} showParticles={false} /></div>
              {/* rotating ring of memory chips */}
              <div className="eb-orbit absolute inset-0">
                {MEMORIES.map(({ Icon, label }, i) => {
                  const a = (i / MEMORIES.length) * 2 * Math.PI - Math.PI / 2
                  const R = 46 // percent radius
                  const x = 50 + R * Math.cos(a)
                  const y = 50 + R * Math.sin(a)
                  return (
                    <div key={label} className="absolute" style={{ left: `${x}%`, top: `${y}%`, transform: "translate(-50%,-50%)" }}>
                      <div className="eb-orbit-rev flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 shadow-[0_2px_10px_rgba(26,46,18,0.08)]">
                        <Icon className="h-3.5 w-3.5" style={{ color: GREEN }} />
                        <span className="whitespace-nowrap text-xs font-semibold text-foreground">{label}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ════ Ch5 — Your Twin Guides You ════ */}
      <section className="px-6 py-24" style={{ background: tint(ORANGE, 4) }}>
        <div className="mx-auto grid max-w-[1000px] items-center gap-12 lg:grid-cols-2">
          <ScrollReveal>
            <Eyebrow>Guidance</Eyebrow>
            <h2 style={lora} className="text-4xl font-semibold text-foreground sm:text-5xl text-balance">
              A living companion, not a static report.
            </h2>
            <p className="mt-5 max-w-md text-lg text-muted-foreground">
              Your score, your three biotics, your progress and the single most valuable next
              step — always in your pocket, always moving with you.
            </p>
            <ul className="mt-6 space-y-2 text-sm text-foreground">
              {["Food System Score", "Three Biotics", "Next Best Action", "Progress & loop stage"].map((t) => (
                <li key={t} className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full" style={{ background: GREEN }} />{t}</li>
              ))}
            </ul>
          </ScrollReveal>
          <ScrollReveal>
            <PhoneDashboard />
          </ScrollReveal>
        </div>
      </section>

      {/* ════ Ch6 — From You to the Food System ════ */}
      <section className="px-6 py-24" style={{ background: "linear-gradient(160deg, color-mix(in srgb,var(--icon-green) 8%,#fff), color-mix(in srgb,var(--icon-orange) 6%,#fff))" }}>
        <div className="mx-auto max-w-[1000px] text-center">
          <ScrollReveal>
            <Eyebrow>From you to the Food System</Eyebrow>
            <h2 style={lora} className="mx-auto max-w-3xl text-4xl font-semibold text-foreground sm:text-5xl text-balance">
              Millions of healthier Food Systems. <span className="brand-gradient-text">One shared impact.</span>
            </h2>
          </ScrollReveal>
          <ScrollReveal>
            <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
              {[
                { Icon: User, label: "You" }, { Icon: Users, label: "Your family" },
                { Icon: Users, label: "Your community" }, { Icon: Globe, label: "The Food System" },
              ].map(({ Icon, label }, i, arr) => (
                <div key={label} className="flex items-center gap-3">
                  <div className="flex flex-col items-center gap-2">
                    <span className="flex h-16 w-16 items-center justify-center rounded-full text-white" style={{ background: `linear-gradient(135deg, color-mix(in srgb,#A8E063 ${100 - i * 22}%, #F5A623), #4CB648)` }}>
                      <Icon className="h-7 w-7" />
                    </span>
                    <span className="text-sm font-semibold text-foreground">{label}</span>
                  </div>
                  {i < arr.length - 1 && <ArrowRight aria-hidden className="h-5 w-5 text-muted-foreground" />}
                </div>
              ))}
            </div>
          </ScrollReveal>
          <ScrollReveal>
            <p className="mx-auto mt-10 max-w-xl text-lg leading-relaxed text-muted-foreground">
              Healthier individuals create healthier families. Healthier families create
              healthier communities. Together they build a healthier Food System.
            </p>
            <p className="mt-4 text-lg font-semibold text-foreground">We develop the EatoSystem from the inside out.</p>
            <div className="mt-8 flex flex-wrap justify-center gap-2">
              {["Anonymous", "Aggregated", "Actionable", "Meaningful"].map((c) => (
                <span key={c} className="rounded-full border border-border bg-card px-4 py-1.5 text-xs font-semibold text-muted-foreground">{c}</span>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ════ Ch7 — A Lifetime of Learning ════ */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-[1100px]">
          <ScrollReveal>
            <div className="mx-auto mb-12 max-w-2xl text-center">
              <Eyebrow>A lifetime of learning</Eyebrow>
              <h2 style={lora} className="text-4xl font-semibold text-foreground sm:text-5xl text-balance">
                One Twin. A lifetime of learning.
              </h2>
              <p className="mt-5 text-lg text-muted-foreground">Your Digital Twin evolves with you — through every season of life.</p>
            </div>
          </ScrollReveal>
          <ScrollReveal>
            <div className="relative">
              <div aria-hidden className="absolute left-0 right-0 top-[42px] h-0.5 rounded-full" style={{ background: "linear-gradient(90deg,#A8E063,#4CB648,#2DAA6E,#F5C518,#F5A623)" }} />
              <div className="relative grid grid-cols-3 gap-y-8 sm:grid-cols-6">
                {LIFECYCLE.map(({ Icon, label, s }, i) => (
                  <div key={label} className="flex flex-col items-center text-center">
                    <span className="flex items-center justify-center rounded-full bg-card ring-1 ring-border" style={{ width: 88, height: 88, color: `color-mix(in srgb,#4CB648 ${100 - i * 14}%, #F5A623)` }}>
                      <Icon style={{ width: s, height: s }} />
                    </span>
                    <span className="mt-3 text-xs font-semibold text-foreground">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ════ Ch8 — Connected to Everything ════ */}
      <section className="px-6 py-24" style={{ background: tint(GREEN, 4) }}>
        <div className="mx-auto max-w-[1100px]">
          <ScrollReveal>
            <div className="mx-auto mb-12 max-w-2xl text-center">
              <Eyebrow>The road ahead</Eyebrow>
              <h2 style={lora} className="text-4xl font-semibold text-foreground sm:text-5xl text-balance">
                One Twin. Connected to everything.
              </h2>
              <p className="mt-5 text-lg text-muted-foreground">Future capabilities, all powered by the same Digital Twin.</p>
            </div>
          </ScrollReveal>
          <ScrollReveal>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {CONNECTED.map(({ Icon, label }) => (
                <div key={label} className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-6 text-center">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl text-white" style={{ background: "linear-gradient(135deg,#4CB648,#2DAA6E)" }}><Icon className="h-6 w-6" /></span>
                  <span className="text-sm font-semibold text-foreground">{label}</span>
                </div>
              ))}
            </div>
            <p className="mt-6 text-center text-xs text-muted-foreground">Long-term vision — not all features are available today.</p>
          </ScrollReveal>
        </div>
      </section>

      {/* ════ Final close ════ */}
      <section className="px-6 pb-10 pt-24 text-center">
        <ScrollReveal>
          <DigitalTwinFigure size={300} className="mb-2" />
          <h2 style={lora} className="mx-auto max-w-3xl text-4xl font-bold text-foreground sm:text-6xl text-balance">
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

/* ── Ch5 phone dashboard (bespoke light mockup) ─────────────── */
function PhoneDashboard() {
  const C = 2 * Math.PI * 52
  const pct = 0.74
  return (
    <div className="mx-auto w-[280px]">
      <div className="overflow-hidden rounded-[2.6rem] border-[7px] border-foreground bg-card p-5 shadow-[0_30px_60px_-20px_rgba(20,37,15,0.4)]">
        <div className="mx-auto mb-4 h-5 w-20 rounded-full bg-foreground" />
        <p className="text-sm font-semibold text-foreground">Good morning, Alex</p>
        <p className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Your Food System Score</p>
        <div className="relative mx-auto my-2 h-[140px] w-[140px]">
          <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
            <defs>
              <linearGradient id="dtRing" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#A8E063" /><stop offset="0.5" stopColor="#4CB648" /><stop offset="1" stopColor="#F5A623" />
              </linearGradient>
            </defs>
            <circle cx="60" cy="60" r="52" fill="none" stroke="var(--muted,#F3F3F3)" strokeWidth="10" />
            <circle cx="60" cy="60" r="52" fill="none" stroke="url(#dtRing)" strokeWidth="10" strokeLinecap="round" strokeDasharray={`${C * pct} ${C}`} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <CountUp to={74} className="text-4xl font-bold tabular-nums" />
            <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: GREEN }}>Improving</span>
          </div>
        </div>
        <div className="rounded-2xl p-3" style={{ background: tint(GREEN, 8) }}>
          <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: GREEN }}>Your next best action</p>
          <p className="mt-1 text-sm font-semibold leading-snug text-foreground">Add one prebiotic-rich food to two meals today.</p>
        </div>
        <div className="mt-3 space-y-2 text-xs">
          {[["Meals logged", "3"], ["Steps", "8,245"], ["Sleep", "7h 23m"]].map(([k, v]) => (
            <div key={k} className="flex items-center justify-between border-b border-border pb-1.5 last:border-0">
              <span className="text-muted-foreground">{k}</span><span className="font-semibold text-foreground tabular-nums">{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
