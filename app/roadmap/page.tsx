import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { ScrollReveal } from "@/components/scroll-reveal"
import { GradientText } from "@/components/gradient-text"
import {
  Activity, ArrowRight, ArrowUpRight, BookOpen, CheckCircle2, Circle, Clock,
  Globe2, Home, ShieldCheck, Sprout,
} from "lucide-react"
import { cn } from "@/lib/utils"

export const metadata: Metadata = {
  title: "Roadmap",
  description:
    "The EatoBiotics roadmap — the Food System Score and personalised reports are live. Here's what we've shipped, what we're building now, and where the next twelve months take us.",
}

/* ────────────────────────────────────────────────────────────────────────
   Where we are today — live capabilities (kept honest: only what's shipped)
   ──────────────────────────────────────────────────────────────────────── */
const LIVE_NOW = [
  { label: "Free Food System Assessment + Score", note: "About 5 minutes, no account required" },
  { label: "Personalised Food System Report", note: "One-time purchase — online + PDF, yours to keep" },
  { label: "Your account & report history", note: "Reports and downloads, whenever you return" },
  { label: "Meal scoring", note: "Describe a plate, see how it feeds your system" },
  { label: "Membership plans", note: "Ongoing tracking and support tiers" },
  { label: "Foundation-first pathways", note: "You or Family first; Stability, Glucose, Mind, and Performance build on it" },
  { label: "The book & Substack", note: "The science and the story, chapter by chapter" },
]

/* ────────────────────────────────────────────────────────────────────────
   The next 12 months — four horizons (relative, so this page never
   stale-dates; statuses are honest: only "Now" is underway)
   ──────────────────────────────────────────────────────────────────────── */
const HORIZONS = [
  {
    horizon: "Now",
    label: "Trust & Foundation",
    status: "Underway",
    color: "var(--icon-lime)",
    description:
      "Making every purchase bulletproof — dependable report delivery, downloads that never go stale, and honest, clear account history. Boring on purpose: trust is the product.",
  },
  {
    horizon: "Next 90 days",
    label: "The Loop",
    status: "Next",
    color: "var(--icon-green)",
    description:
      "Weekly 60-second check-ins, a day-75 retest with before-and-after progress, score history, and one practical action at a time. The score becomes a story you can watch.",
  },
  {
    horizon: "Months 4–6",
    label: "Family & Meal Map",
    status: "Planned",
    color: "var(--icon-teal)",
    description:
      "Your family has a food system too. Adult-first household profiles, a Family Food System Score, the Family Plate — and Meal Map, mapping any meal through Feed, Seed, and Heal.",
  },
  {
    horizon: "Months 7–12",
    label: "Global foundations & full launch",
    status: "Direction",
    color: "var(--icon-orange)",
    description:
      "The science is global. The food is local. Ireland as the first country pack, the UK next, and the public launch of the full platform — one system, fed locally.",
  },
]

/* ────────────────────────────────────────────────────────────────────────
   Detailed tracks
   ──────────────────────────────────────────────────────────────────────── */
type MilestoneStatus = "done" | "active" | "planned"

type Milestone = {
  step: string
  label: string
  status: MilestoneStatus
  color: string
  detail: string
}

const productMilestones: Milestone[] = [
  {
    step: "01",
    label: "Foundation Platform",
    status: "done",
    color: "#A8E063",
    detail:
      "The core platform is live: the free assessment, the Food System Score with its Feed, Seed, and Heal breakdown, the personalised paid report, meal scoring, and memberships.",
  },
  {
    step: "02",
    label: "Trust Hardening",
    status: "active",
    color: "#4CB648",
    detail:
      "A dedicated pass on buyer trust: reports that always reach your account, downloads that never expire into dead links, honest report history, and internal alerting so no delivery problem goes unseen.",
  },
  {
    step: "03",
    label: "The Loop",
    status: "planned",
    color: "#2DAA6E",
    detail:
      "Weekly 60-second check-ins, the day-75 retest with a before-and-after view, score history over time, and one-action weeks. Every check-in gives direction, not judgement.",
  },
  {
    step: "04",
    label: "Meal Map & the Living Twin",
    status: "planned",
    color: "#2DAA6E",
    detail:
      "Meal Map grows from today's meal scoring — describe a meal now, photograph it later — always composition guidance through Feed, Seed, and Heal, never calorie counting or judgement. Your account becomes a living reflection of your food system.",
  },
]

const familyMilestones: Milestone[] = [
  {
    step: "01",
    label: "Family Foundation Assessment",
    status: "done",
    color: "#A8E063",
    detail:
      "The Family foundation assessment is live — a household's food patterns, understood together, as the second entry point into EatoBiotics.",
  },
  {
    step: "02",
    label: "Household Groundwork",
    status: "active",
    color: "#4CB648",
    detail:
      "The underlying household model is being built adult-first: household member profiles managed by one account holder, with family scoring on the shared foundation.",
  },
  {
    step: "03",
    label: "Family Plate & Shared Actions",
    status: "planned",
    color: "#2DAA6E",
    detail:
      "One shared weekly view for the household: the Family Food System Score, each member's one action, and one shared meal idea the whole table can get behind.",
  },
  {
    step: "04",
    label: "Household Meal & Shopping Guidance",
    status: "planned",
    color: "#2DAA6E",
    detail:
      "Practical weekly meal and shopping guidance for real households — budgets, preferences, and the way your family actually eats.",
  },
]

const globalMilestones: Milestone[] = [
  {
    step: "01",
    label: "Global-Ready Architecture",
    status: "done",
    color: "#A8E063",
    detail:
      "One score model and one assessment engine, designed so the science stays universal while the food, language, and examples can become local.",
  },
  {
    step: "02",
    label: "Country & Food-Culture Packs",
    status: "planned",
    color: "#F5C518",
    detail:
      "Local content as data, not code: food examples, meal structures — plate, bowl, thali, tiffin, mezze — affordability tiers, and local safety wording, each reviewed by a named local expert.",
  },
  {
    step: "03",
    label: "Ireland First",
    status: "planned",
    color: "#F5A623",
    detail:
      "Ireland becomes the reference pack — the home market proving that the same Feed, Seed, and Heal can be fed from a local shop, at a local price, in local food language.",
  },
  {
    step: "04",
    label: "The UK & Beyond",
    status: "planned",
    color: "#F5A623",
    detail:
      "The UK next, then wider markets as each pack earns its place. Global in philosophy, local in practice — never a Western plate imposed on everyone.",
  },
]

const contentMilestones: Milestone[] = [
  {
    step: "01",
    label: "Substack Community",
    status: "done",
    color: "#A8E063",
    detail:
      "The EatoBiotics Substack is live — the biotic framework, food profiles, and plate builds, published in the open and shaping the product.",
  },
  {
    step: "02",
    label: "The Book, Chapter by Chapter",
    status: "active",
    color: "#4CB648",
    detail:
      "EatoBiotics — The Food System Inside You continues to publish chapter by chapter on the site and Substack, the deep foundation beneath the product.",
  },
  {
    step: "03",
    label: "Community Feedback Loop",
    status: "planned",
    color: "#2DAA6E",
    detail:
      "Reader questions and member experiences feed the roadmap directly — the community sees features first and shapes what comes next.",
  },
  {
    step: "04",
    label: "Content Meets Product",
    status: "planned",
    color: "#2DAA6E",
    detail:
      "Book chapters, food profiles, and Substack essays woven into reports, plans, and check-ins — the knowledge arriving exactly where it's useful.",
  },
]

/* ────────────────────────────────────────────────────────────────────────
   How we build — the principles behind every milestone
   ──────────────────────────────────────────────────────────────────────── */
const PRINCIPLES = [
  {
    icon: ShieldCheck,
    color: "var(--icon-green)",
    title: "Trust first",
    detail:
      "No paying customer should fail silently, see stale data, or lose access. Recent releases have been dedicated to exactly this — and it stays the first priority.",
  },
  {
    icon: CheckCircle2,
    color: "var(--icon-teal)",
    title: "Honest labelling",
    detail:
      "Live means live. Everything else is labelled as in development or direction — on this page and everywhere else. No future feature is dressed up as today's.",
  },
  {
    icon: Sprout,
    color: "var(--icon-lime)",
    title: "Educational & non-diagnostic",
    detail:
      "EatoBiotics never diagnoses, treats, or replaces medical care. It helps you understand food patterns and take practical, food-first steps — direction, not judgement.",
  },
  {
    icon: Globe2,
    color: "var(--icon-orange)",
    title: "Global philosophy, local practice",
    detail:
      "The Food System Inside You is universal. How you feed it is personal, local, and cultural — and the platform is being built to honour that.",
  },
]

/* ────────────────────────────────────────────────────────────────────────
   Shared bits (status icon/pill + track section)
   ──────────────────────────────────────────────────────────────────────── */
function StatusIcon({ status, color }: { status: MilestoneStatus; color: string }) {
  if (status === "done") {
    return <CheckCircle2 size={20} style={{ color }} className="shrink-0" />
  }
  if (status === "active") {
    return <Clock size={20} style={{ color }} className="shrink-0" />
  }
  return <Circle size={20} className="shrink-0 text-border" />
}

function StatusPill({ status }: { status: MilestoneStatus }) {
  if (status === "done") {
    return (
      <span className="inline-flex items-center rounded-full bg-icon-lime/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-icon-lime">
        Live
      </span>
    )
  }
  if (status === "active") {
    return (
      <span className="inline-flex items-center rounded-full bg-icon-teal/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-icon-teal">
        In development
      </span>
    )
  }
  return (
    <span className="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
      Planned
    </span>
  )
}

function TimelineSection({
  label,
  labelColor,
  phaseStatus,
  heading,
  icon: Icon,
  milestones,
}: {
  label: string
  labelColor: string
  phaseStatus: string
  heading: string
  icon: typeof BookOpen
  milestones: Milestone[]
}) {
  return (
    <section className="px-6 py-24 md:py-32">
      <div className="mx-auto max-w-[1200px]">
        <div className="flex flex-col items-start gap-12 md:flex-row md:gap-20">

          {/* Left: heading */}
          <ScrollReveal className="md:sticky md:top-32 md:w-[280px] md:shrink-0">
            <div className="flex items-center gap-2">
              <p
                className="text-xs font-semibold uppercase tracking-widest"
                style={{ color: labelColor }}
              >
                {label}
              </p>
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest"
                style={{ color: labelColor, backgroundColor: `color-mix(in srgb, ${labelColor} 12%, transparent)` }}
              >
                {phaseStatus}
              </span>
            </div>
            <h2 className="mt-4 font-serif text-3xl font-semibold text-foreground sm:text-4xl text-balance">
              {heading}
            </h2>
            <div
              className="mt-6 flex h-14 w-14 items-center justify-center rounded-2xl"
              style={{ backgroundColor: labelColor }}
            >
              <Icon size={28} className="text-white" />
            </div>

            {/* Progress indicators */}
            <div className="mt-6 flex flex-col gap-2">
              {milestones.map((m) => (
                <div key={m.step} className="flex items-center gap-2">
                  <div
                    className="h-1.5 w-1.5 rounded-full shrink-0"
                    style={{
                      backgroundColor: m.status === "planned" ? "var(--border)" : m.color,
                    }}
                  />
                  <span className={cn("text-xs", m.status === "planned" ? "text-muted-foreground/50" : "text-muted-foreground")}>
                    {m.label}
                  </span>
                </div>
              ))}
            </div>
          </ScrollReveal>

          {/* Right: milestone cards */}
          <div className="flex-1">
            <div className="relative flex flex-col gap-4">
              {/* Vertical track */}
              <div
                className="absolute left-[19px] top-5 bottom-5 w-0.5"
                style={{ background: `linear-gradient(to bottom, ${milestones[0].color}40, transparent)` }}
              />

              {milestones.map((item, index) => (
                <ScrollReveal key={item.step} delay={index * 100}>
                  <div className="flex gap-4">
                    {/* Status icon column */}
                    <div className="relative z-10 mt-4 shrink-0">
                      <StatusIcon status={item.status} color={item.color} />
                    </div>

                    {/* Card */}
                    <div
                      className={cn(
                        "flex-1 rounded-2xl border bg-background p-5 transition-shadow",
                        item.status === "done" && "border-border",
                        item.status === "active" && "border-border shadow-sm",
                        item.status === "planned" && "border-dashed border-border"
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold text-muted-foreground/50">
                            {item.step}
                          </span>
                          <p
                            className={cn(
                              "font-serif text-base font-semibold",
                              item.status === "planned" ? "text-foreground/60" : "text-foreground"
                            )}
                          >
                            {item.label}
                          </p>
                        </div>
                        <StatusPill status={item.status} />
                      </div>
                      <p
                        className={cn(
                          "mt-2 text-sm leading-relaxed",
                          item.status === "planned" ? "text-muted-foreground/60" : "text-muted-foreground"
                        )}
                      >
                        {item.detail}
                      </p>
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default function RoadmapPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 pt-20 pb-20">
        <div className="relative z-10 mx-auto flex max-w-[720px] flex-col items-center text-center">
          <ScrollReveal>
            <Image
              src="/eatobiotics-icon.webp"
              alt="EatoBiotics icon"
              width={200}
              height={200}
              priority
              className="h-32 w-32 sm:h-40 sm:w-40 md:h-48 md:w-48"
            />
          </ScrollReveal>

          <ScrollReveal delay={100} className="w-full text-center">
            <p className="mt-6 text-xs font-semibold uppercase tracking-widest text-icon-green">
              The Journey
            </p>
          </ScrollReveal>

          <ScrollReveal delay={200} className="w-full text-center">
            <h1 className="mt-4 font-serif text-5xl font-semibold tracking-tight sm:text-7xl md:text-8xl">
              <GradientText>Roadmap</GradientText>
            </h1>
          </ScrollReveal>

          <ScrollReveal delay={300} className="w-full text-center">
            <p className="mt-4 font-serif text-xl font-medium text-foreground sm:text-2xl">
              From one score to a lifelong food system
            </p>
          </ScrollReveal>

          <ScrollReveal delay={400} className="w-full text-center">
            <p className="mx-auto mt-6 max-w-lg text-sm leading-relaxed text-muted-foreground sm:text-base md:text-lg">
              EatoBiotics is live — the Food System Score, personalised reports, and the
              foundation platform are here. This is what we&apos;ve shipped, what we&apos;re
              building now, and where the next twelve months take us.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={500}>
            <div className="mt-10 flex items-center justify-center gap-1.5">
              <span className="biotic-pill bg-icon-lime" />
              <span className="biotic-pill bg-icon-green" />
              <span className="biotic-pill bg-icon-teal" />
              <span className="biotic-pill bg-icon-yellow" />
              <span className="biotic-pill bg-icon-orange" />
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Gradient divider */}
      <div className="section-divider" />

      {/* Where we are today */}
      <section className="px-6 py-24 md:py-32">
        <div className="mx-auto max-w-[1200px]">
          <ScrollReveal className="text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-icon-green">
              Where We Are Today
            </p>
            <h2 className="mt-4 font-serif text-3xl font-semibold text-foreground sm:text-4xl md:text-5xl text-balance">
              Shipped <span className="brand-gradient-text">and live.</span>
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-muted-foreground">
              Not a concept, not a waitlist promise — the foundation platform is running today.
            </p>
          </ScrollReveal>

          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {LIVE_NOW.map((item, index) => (
              <ScrollReveal key={item.label} delay={index * 60}>
                <div className="flex h-full items-start gap-3 rounded-2xl border border-border bg-background p-5 transition-shadow hover:shadow-md">
                  <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-icon-green" />
                  <div>
                    <p className="font-serif text-base font-semibold text-foreground">{item.label}</p>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.note}</p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>

          <ScrollReveal delay={400}>
            <p className="mx-auto mt-10 max-w-xl text-center text-sm leading-relaxed text-muted-foreground">
              Recent releases have focused on buyer trust — making every purchase, report, and
              download dependable. That work continues to lead the roadmap.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* Gradient divider */}
      <div className="section-divider" />

      {/* The next 12 months */}
      <section className="px-6 py-24 md:py-32">
        <div className="mx-auto max-w-[1200px]">
          <ScrollReveal className="text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-icon-teal">
              The Next 12 Months
            </p>
            <h2 className="mt-4 font-serif text-3xl font-semibold text-foreground sm:text-4xl md:text-5xl text-balance">
              Trust. Loop. Family. <span className="brand-gradient-text">World.</span>
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-muted-foreground">
              Four horizons, in order — each one only starts when the one before it holds.
            </p>
          </ScrollReveal>

          <div className="mt-16 flex flex-col gap-4">
            {HORIZONS.map((phase, index) => (
              <ScrollReveal key={phase.horizon} delay={index * 100}>
                <div className="relative overflow-hidden rounded-2xl border border-border bg-background p-6 transition-shadow hover:shadow-md">
                  {/* Left accent bar */}
                  <div
                    className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
                    style={{ backgroundColor: phase.color }}
                  />

                  <div className="flex flex-col gap-4 pl-4 sm:flex-row sm:items-center sm:gap-8">
                    {/* Horizon */}
                    <div className="w-full shrink-0 sm:w-[180px]">
                      <p className="font-serif text-2xl font-semibold brand-gradient-text sm:text-3xl">
                        {phase.horizon}
                      </p>
                    </div>

                    {/* Divider (desktop) */}
                    <div className="hidden h-14 w-px bg-border sm:block" />

                    {/* Label + status */}
                    <div className="w-full shrink-0 sm:w-[220px]">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-serif text-xl font-semibold text-foreground">
                          {phase.label}
                        </p>
                      </div>
                      <span
                        className="mt-1.5 inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider"
                        style={{
                          color: `color-mix(in srgb, ${phase.color} 78%, var(--foreground))`,
                          backgroundColor: `color-mix(in srgb, ${phase.color} 14%, transparent)`,
                        }}
                      >
                        {phase.status}
                      </span>
                    </div>

                    {/* Divider (desktop) */}
                    <div className="hidden h-14 w-px bg-border sm:block" />

                    {/* Description */}
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {phase.description}
                    </p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>

          {/* Legend */}
          <ScrollReveal delay={400}>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-6">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-icon-lime" />
                <span className="text-xs text-muted-foreground">Live</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-icon-teal" />
                <span className="text-xs text-muted-foreground">In development</span>
              </div>
              <div className="flex items-center gap-2">
                <Circle size={16} className="text-border" />
                <span className="text-xs text-muted-foreground">Planned</span>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Gradient divider */}
      <div className="section-divider" />

      {/* Product Track */}
      <TimelineSection
        label="Product"
        labelColor="var(--icon-green)"
        phaseStatus="Underway"
        heading="From Score to Story"
        icon={Activity}
        milestones={productMilestones}
      />

      {/* Gradient divider */}
      <div className="section-divider" />

      {/* Family Track */}
      <TimelineSection
        label="Family"
        labelColor="var(--icon-teal)"
        phaseStatus="Building"
        heading="The Household Joins"
        icon={Home}
        milestones={familyMilestones}
      />

      {/* Gradient divider */}
      <div className="section-divider" />

      {/* Global Track */}
      <TimelineSection
        label="Global"
        labelColor="var(--icon-orange)"
        phaseStatus="Direction"
        heading="Local Everywhere"
        icon={Globe2}
        milestones={globalMilestones}
      />

      {/* Gradient divider */}
      <div className="section-divider" />

      {/* Content & Community Track */}
      <TimelineSection
        label="Content & Community"
        labelColor="var(--icon-lime)"
        phaseStatus="Live"
        heading="The Story Alongside"
        icon={BookOpen}
        milestones={contentMilestones}
      />

      {/* Gradient divider */}
      <div className="section-divider" />

      {/* How we build */}
      <section className="px-6 py-24 md:py-32">
        <div className="mx-auto max-w-[1200px]">
          <ScrollReveal className="text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-icon-green">
              How We Build
            </p>
            <h2 className="mt-4 font-serif text-3xl font-semibold text-foreground sm:text-4xl md:text-5xl text-balance">
              The rules behind <span className="brand-gradient-text">every milestone.</span>
            </h2>
          </ScrollReveal>

          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {PRINCIPLES.map((p, index) => {
              const Icon = p.icon
              return (
                <ScrollReveal key={p.title} delay={index * 80}>
                  <div className="flex h-full flex-col rounded-2xl border border-border bg-background p-6 transition-shadow hover:shadow-lg">
                    <div
                      className="flex h-11 w-11 items-center justify-center rounded-xl"
                      style={{ backgroundColor: `color-mix(in srgb, ${p.color} 14%, transparent)` }}
                    >
                      <Icon size={22} style={{ color: p.color }} />
                    </div>
                    <h3 className="mt-4 font-serif text-lg font-semibold text-foreground">{p.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.detail}</p>
                  </div>
                </ScrollReveal>
              )
            })}
          </div>
        </div>
      </section>

      {/* Gradient divider */}
      <div className="section-divider" />

      {/* Closing CTA */}
      <section className="px-6 py-24 md:py-32">
        <div className="mx-auto max-w-[720px] text-center">
          <ScrollReveal>
            <h2 className="font-serif text-2xl font-semibold text-foreground sm:text-3xl md:text-4xl text-balance">
              The roadmap starts with your score.
            </h2>
          </ScrollReveal>
          <ScrollReveal delay={100}>
            <p className="mx-auto mt-6 max-w-lg text-sm leading-relaxed text-muted-foreground sm:text-base">
              Everything above builds on one foundation — the Food System Score. Take the free
              assessment today, and watch the rest of the roadmap arrive around you.
            </p>
          </ScrollReveal>
          <ScrollReveal delay={200}>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/assessment"
                className="brand-gradient inline-flex items-center gap-2 rounded-full px-8 py-4 text-base font-semibold text-white shadow-lg shadow-icon-green/20 transition-all hover:shadow-xl hover:shadow-icon-green/30 hover:opacity-90"
              >
                Get My Food System Score
                <ArrowRight size={16} />
              </Link>
              <a
                href="https://eatobiotics.substack.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-fit items-center gap-1.5 rounded-full border border-icon-green/30 bg-icon-green/5 px-5 py-2.5 text-sm font-semibold text-icon-green transition-all hover:border-icon-green/50 hover:bg-icon-green/10"
              >
                Follow the journey on Substack
                <ArrowUpRight size={15} />
              </a>
            </div>
          </ScrollReveal>
          <ScrollReveal delay={300}>
            <div className="mt-10 flex items-center justify-center gap-1.5">
              <span className="biotic-pill bg-icon-lime" />
              <span className="biotic-pill bg-icon-green" />
              <span className="biotic-pill bg-icon-teal" />
              <span className="biotic-pill bg-icon-yellow" />
              <span className="biotic-pill bg-icon-orange" />
            </div>
          </ScrollReveal>
        </div>
      </section>
    </>
  )
}
