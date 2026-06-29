import type { Metadata } from "next"
import Link from "next/link"
import {
  ArrowRight, Lock, Brain, HeartPulse, Moon, Activity as ActivityIcon, Utensils, ClipboardList,
  Sparkles, NotebookPen, Users, Mic, Watch, FileText, Puzzle, Bot,
} from "lucide-react"
import { ScrollReveal } from "@/components/scroll-reveal"
import { HeroVideo } from "@/components/hero-video"
import { AgentLoopTimeline } from "@/components/agent-loop/AgentLoopTimeline"
import { FoodSystemLoopCard } from "@/components/agent-loop/FoodSystemLoopCard"
import { FoodSystemMemoryPanel } from "@/components/agent-loop/FoodSystemMemoryPanel"
import { buildBaseline, LOOP_DISCLAIMER, type FoodSystemDigitalTwin } from "@/lib/agent-loop"

export const metadata: Metadata = {
  title: "Your Food System Digital Twin",
  description:
    "Build a living digital twin of the Food System Inside You. It learns from your meals, symptoms, sleep, activity and habits, shows what's changing, and gives you your next best action — improving your Food System, and helping build the Food System.",
  openGraph: {
    title: "Build Your Food System Digital Twin — EatoBiotics",
    description:
      "A living representation of the Food System Inside You. Understand it like never before.",
    url: "https://eatobiotics.com/digital-twin",
  },
}

/* A representative (static) Digital Twin for the marketing preview. */
const sampleBaseline = buildBaseline({
  foundationKey: "you",
  score: 74,
  scoreLabel: "Strong Foundation",
  biotics: { prebiotics: 58, probiotics: 80, postbiotics: 67 },
  strengths: ["Fermented foods"],
  priorities: ["Fibre diversity"],
})
const sampleAction = {
  id: "sample",
  action: "Add one prebiotic-rich food to two meals this week.",
  why: "Your fibre diversity looks lower than your fermented-food consistency — small, repeatable changes here move your Food System Score the most.",
  category: "food-first" as const,
  targetBiotic: "prebiotics" as const,
  effort: "small" as const,
  disclaimer: LOOP_DISCLAIMER,
}
const SAMPLE_TWIN: FoodSystemDigitalTwin = {
  baseline: sampleBaseline,
  currentScore: sampleBaseline.foodSystemScore,
  biotics: sampleBaseline.biotics,
  observations: [],
  trends: [
    { label: "Food System Score", direction: "up", detail: "+6 since your baseline" },
    { label: "Momentum", direction: "up", detail: "improving" },
  ],
  activeSystem: "foundation",
  currentStage: "recommend",
  nextBestAction: sampleAction,
  recommendations: [sampleAction],
  memory: {
    completed: ["m1"],
    ignored: [],
    outcomes: [{ recommendationId: "m1", action: "Add a fermented food each day", status: "completed", at: 0 }],
    preferences: {},
  },
  progress: { loopsCompleted: 3, scoreDelta: 6, completedActions: 2, ignoredActions: 0, momentum: "improving" },
  updatedAt: 0,
}

const GROW_INPUTS = [
  { icon: Utensils, label: "Meals" },
  { icon: HeartPulse, label: "Symptoms" },
  { icon: Moon, label: "Sleep" },
  { icon: ActivityIcon, label: "Activity" },
  { icon: Brain, label: "Habits" },
  { icon: ClipboardList, label: "Assessments" },
]
const GROW_FLOW = ["Food System Digital Twin", "Agent Loop", "Next Best Action", "Better Food System"]

const MEMORY_ITEMS = ["Meals", "Progress", "Observations", "Habits", "Improvements"]

const FUTURE = [
  { icon: Utensils, label: "Meals" },
  { icon: Users, label: "Family" },
  { icon: Puzzle, label: "Add-on systems" },
  { icon: FileText, label: "Reports" },
  { icon: Mic, label: "Voice" },
  { icon: Bot, label: "AI" },
  { icon: Watch, label: "Wearables" },
  { icon: HeartPulse, label: "Health programmes" },
]

function CtaButton({ children, href = "/assessment" }: { children: React.ReactNode; href?: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 rounded-full px-8 py-4 text-base font-semibold text-white shadow-lg transition-transform hover:-translate-y-0.5"
      style={{ background: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))" }}
    >
      {children}
      <ArrowRight className="h-5 w-5" />
    </Link>
  )
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-icon-green">{children}</p>
  )
}

export default function DigitalTwinPage() {
  return (
    <main className="bg-background">
      {/* ── 1. Hero ───────────────────────────────────────────────── */}
      <section className="px-6 pt-24 pb-16 md:pt-32">
        <div className="mx-auto grid max-w-[1200px] items-center gap-12 lg:grid-cols-2">
          <ScrollReveal>
            <div className="max-w-xl">
              <Eyebrow>Your Digital Twin</Eyebrow>
              <h1 className="font-serif text-5xl font-semibold leading-tight text-foreground sm:text-6xl text-balance">
                Build Your <span className="brand-gradient-text">Digital Twin</span>.
              </h1>
              <p className="mt-5 text-xl leading-relaxed text-muted-foreground">
                Understand the Food System Inside You like never before — a living
                representation that learns from your everyday and shows you what matters next.
              </p>
              <div className="mt-8 flex flex-col items-start gap-3">
                <CtaButton>Build My Digital Twin</CtaButton>
                <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Lock className="h-3.5 w-3.5" /> Private to you. No spam, ever.
                </span>
              </div>
            </div>
          </ScrollReveal>
          <ScrollReveal>
            <div className="relative mx-auto aspect-square w-full max-w-[460px]">
              <HeroVideo
                posterSrc="/videos/food-system-hero-poster.jpg"
                mp4Src="/videos/food-system-hero.mp4"
                webmSrc="/videos/food-system-hero.webm"
                alt="Your living Food System Digital Twin"
                className="h-full w-full object-contain"
              />
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ── 2. What is a Digital Twin? ────────────────────────────── */}
      <section className="px-6 py-20">
        <ScrollReveal>
          <div className="mx-auto max-w-3xl text-center">
            <Eyebrow>What is a Digital Twin?</Eyebrow>
            <h2 className="font-serif text-4xl font-semibold text-foreground sm:text-5xl text-balance">
              A living representation of the Food System Inside You.
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
              Most apps give you a score and stop. Your Digital Twin keeps going. It begins
              with your baseline, then quietly grows with every meal, symptom, habit and
              check-in — building a picture of your Food System that gets richer and more
              useful the more you live with it. It&rsquo;s not a report. It&rsquo;s a companion.
            </p>
          </div>
        </ScrollReveal>
      </section>

      {/* ── 3. How Your Digital Twin Grows ────────────────────────── */}
      <section className="px-6 py-20" style={{ background: "color-mix(in srgb, var(--icon-green) 4%, #fff)" }}>
        <div className="mx-auto max-w-[1100px]">
          <ScrollReveal>
            <div className="mx-auto mb-12 max-w-2xl text-center">
              <Eyebrow>How your Digital Twin grows</Eyebrow>
              <h2 className="font-serif text-4xl font-semibold text-foreground sm:text-5xl text-balance">
                Everything you do feeds one living system.
              </h2>
            </div>
          </ScrollReveal>
          <ScrollReveal>
            <div className="flex flex-wrap items-center justify-center gap-2.5">
              {GROW_INPUTS.map(({ icon: Icon, label }) => (
                <span key={label} className="inline-flex items-center gap-1.5 rounded-full bg-card px-3.5 py-2 text-sm font-semibold text-foreground ring-1 ring-border">
                  <Icon className="h-4 w-4" style={{ color: "var(--icon-green)" }} /> {label}
                </span>
              ))}
            </div>
            <div className="my-4 flex justify-center"><ArrowRight aria-hidden className="h-5 w-5 rotate-90 text-muted-foreground" /></div>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {GROW_FLOW.map((label, i) => (
                <div key={label} className="flex items-center gap-2">
                  <span
                    className="rounded-full px-4 py-2 text-sm font-semibold text-white"
                    style={{ background: i === 0 ? "linear-gradient(135deg, var(--icon-green), var(--icon-teal))" : "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange))" }}
                  >
                    {label}
                  </span>
                  {i < GROW_FLOW.length - 1 && <ArrowRight aria-hidden className="h-4 w-4 text-muted-foreground" />}
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ── 4. The Agent Loop (the engine) ────────────────────────── */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-[1000px]">
          <ScrollReveal>
            <div className="mx-auto mb-10 max-w-2xl text-center">
              <Eyebrow>The engine</Eyebrow>
              <h2 className="font-serif text-4xl font-semibold text-foreground sm:text-5xl text-balance">
                The Agent Loop keeps your Twin learning.
              </h2>
              <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
                Quietly, in the background, an eight-stage loop turns what you log into what
                you should do next — then learns from what helped.
              </p>
            </div>
          </ScrollReveal>
          <ScrollReveal>
            <div className="rounded-3xl border border-border bg-card p-6 sm:p-8">
              <AgentLoopTimeline currentStage="recommend" />
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ── 5. Food System Memory ─────────────────────────────────── */}
      <section className="px-6 py-20" style={{ background: "color-mix(in srgb, var(--icon-orange) 4%, #fff)" }}>
        <ScrollReveal>
          <div className="mx-auto max-w-3xl text-center">
            <Eyebrow>Food System Memory</Eyebrow>
            <h2 className="font-serif text-4xl font-semibold text-foreground sm:text-5xl text-balance">
              Your Digital Twin remembers you.
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
              Every interaction makes it more useful. It remembers what you&rsquo;ve tried, what
              worked, and how far you&rsquo;ve come — so guidance keeps getting more personal.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-2.5">
              {MEMORY_ITEMS.map((label) => (
                <span key={label} className="inline-flex items-center gap-1.5 rounded-full bg-card px-4 py-2 text-sm font-semibold text-foreground ring-1 ring-border">
                  <NotebookPen className="h-4 w-4" style={{ color: "var(--icon-orange)" }} /> {label}
                </span>
              ))}
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* ── 6. Personalised Guidance (live sample) ────────────────── */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-[1000px]">
          <ScrollReveal>
            <div className="mx-auto mb-10 max-w-2xl text-center">
              <Eyebrow>Personalised guidance</Eyebrow>
              <h2 className="font-serif text-4xl font-semibold text-foreground sm:text-5xl text-balance">
                A living companion, not a static report.
              </h2>
              <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
                Your score, your three biotics, your progress, and the single next best action
                — all in one place that moves with you. (Example shown.)
              </p>
            </div>
          </ScrollReveal>
          <ScrollReveal>
            <FoodSystemLoopCard twin={SAMPLE_TWIN} />
            <FoodSystemMemoryPanel className="mt-4" twin={SAMPLE_TWIN} />
          </ScrollReveal>
        </div>
      </section>

      {/* ── 7. From You to the Food System ────────────────────────── */}
      <section className="px-6 py-24" style={{ background: "linear-gradient(160deg, color-mix(in srgb, var(--icon-green) 8%, #fff), color-mix(in srgb, var(--icon-orange) 6%, #fff))" }}>
        <ScrollReveal>
          <div className="mx-auto max-w-3xl text-center">
            <Eyebrow>From you to the Food System</Eyebrow>
            <h2 className="font-serif text-4xl font-semibold text-foreground sm:text-5xl text-balance">
              Build the Food System Inside You.{" "}
              <span className="brand-gradient-text">Help build the Food System.</span>
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
              Your Digital Twin exists to improve your own Food System. And as more people
              strengthen the Food System Inside Them, anonymised, aggregated insights help us
              understand and improve the wider Food System — for families, communities and the
              future of food.
            </p>
            <p className="mt-4 text-lg font-medium text-foreground">
              We develop the EatoSystem from the inside out.
            </p>
          </div>
        </ScrollReveal>
      </section>

      {/* ── 8. Future Vision ──────────────────────────────────────── */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-[1100px]">
          <ScrollReveal>
            <div className="mx-auto mb-10 max-w-2xl text-center">
              <Eyebrow>The road ahead</Eyebrow>
              <h2 className="font-serif text-4xl font-semibold text-foreground sm:text-5xl text-balance">
                One Twin, connected to everything.
              </h2>
              <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
                Where your Digital Twin is headed — a long-term vision we&rsquo;re building toward.
              </p>
            </div>
          </ScrollReveal>
          <ScrollReveal>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {FUTURE.map(({ icon: Icon, label }) => (
                <div key={label} className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-5 text-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl text-white" style={{ background: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))" }}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-sm font-semibold text-foreground">{label}</span>
                </div>
              ))}
            </div>
            <p className="mt-6 text-center text-xs text-muted-foreground">
              Long-term vision — not all features are available today.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* ── 9. Final CTA ──────────────────────────────────────────── */}
      <section className="px-6 pb-28 pt-8">
        <ScrollReveal>
          <div className="mx-auto max-w-2xl rounded-3xl border border-border bg-card p-10 text-center shadow-[0_8px_40px_-12px_rgba(20,37,15,0.25)]">
            <Sparkles aria-hidden className="mx-auto h-7 w-7" style={{ color: "var(--icon-green)" }} />
            <h2 className="mt-3 font-serif text-3xl font-semibold text-foreground sm:text-4xl text-balance">
              Build Your Digital Twin.
            </h2>
            <p className="mt-3 text-lg text-muted-foreground">
              Improve the Food System Inside You. Help build the Food System.
            </p>
            <div className="mt-7 flex justify-center">
              <CtaButton>Build My Digital Twin</CtaButton>
            </div>
          </div>
        </ScrollReveal>
      </section>
    </main>
  )
}
