import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import {
  Zap,
  Dumbbell,
  RefreshCw,
  Shield,
  ArrowUpRight,
  ChevronRight,
  Users,
  Award,
  Briefcase,
  TrendingUp,
  Building2,
  Heart,
  BarChart3,
  Target,
  Flame,
  Lightbulb,
  Leaf,
  Activity,
  Globe,
} from "lucide-react"
import { ScrollReveal } from "@/components/scroll-reveal"

export const metadata: Metadata = {
  title: "EatoSports — The Food System for Sports | EatoBiotics",
  description:
    "EatoSports applies the 3 Biotics framework to athletic performance through the 4 Systems of Performance: Energy, Build, Recovery, and Protection.",
}

/* ─────────────────────────────────────────────────
   COLOUR CONSTANTS
───────────────────────────────────────────────── */
const SPORTS_GRADIENT = "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange))"

const SYSTEMS = [
  {
    number: "01",
    title: "Energy",
    label: "FUEL",
    icon: Zap,
    accent: "var(--icon-lime)",
    gradientFrom: "var(--icon-lime)",
    gradientTo: "var(--icon-green)",
    description:
      "The fuel that drives output, effort, and repeat performance. Food choices that sustain energy across training, competition, and the demands of daily athletic life.",
    support: "Output · Endurance · Repeat effort",
  },
  {
    number: "02",
    title: "Build",
    label: "DEVELOP",
    icon: Dumbbell,
    accent: "var(--icon-teal)",
    gradientFrom: "var(--icon-green)",
    gradientTo: "var(--icon-teal)",
    description:
      "Repair, muscle support, and physical development. The food system that helps you build and maintain the physical capacity your sport demands.",
    support: "Muscle · Repair · Adaptation",
  },
  {
    number: "03",
    title: "Recovery",
    label: "RESET",
    icon: RefreshCw,
    accent: "var(--icon-yellow)",
    gradientFrom: "var(--icon-yellow)",
    gradientTo: "var(--icon-orange)",
    description:
      "Reset, readiness, and the ability to go again. Recovery is not passive — it is an active process built on the food choices made between sessions.",
    support: "Readiness · Reset · Consistency",
  },
  {
    number: "04",
    title: "Protection",
    label: "PROTECT",
    icon: Shield,
    accent: "var(--icon-orange)",
    gradientFrom: "var(--icon-teal)",
    gradientTo: "var(--icon-yellow)",
    description:
      "Resilience, immune support, and long-term performance stability. The foods that keep you available — training, competing, and performing week after week.",
    support: "Immunity · Longevity · Stability",
  },
]

const SPORTS = [
  {
    title: "Team Sports",
    subtitle: "GAA · Rugby · Football",
    icon: Users,
    accent: "var(--icon-lime)",
    gradient: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))",
    systems: ["Energy", "Recovery", "Protection"],
    description:
      "High-intensity efforts, repeated over 60–80 minutes with frequent collisions and contact. Energy availability and recovery speed are the critical levers.",
  },
  {
    title: "Endurance",
    subtitle: "Running · Cycling · Swimming",
    icon: TrendingUp,
    accent: "var(--icon-teal)",
    gradient: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))",
    systems: ["Energy", "Recovery"],
    description:
      "Sustained output over extended periods. Energy management is everything — with recovery the essential partner that determines training volume.",
  },
  {
    title: "Strength & Power",
    subtitle: "Gym · CrossFit · Power Sports",
    icon: Dumbbell,
    accent: "var(--icon-yellow)",
    gradient: "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange))",
    systems: ["Build", "Recovery", "Protection"],
    description:
      "Building and maintaining physical capacity through progressive loading. The food system here is centred on muscle repair, adaptation, and structural resilience.",
  },
  {
    title: "Everyday Active",
    subtitle: "Lifestyle · Training · Health",
    icon: Heart,
    accent: "var(--icon-orange)",
    gradient: "linear-gradient(135deg, var(--icon-teal), var(--icon-yellow))",
    systems: ["Energy", "Build", "Recovery", "Protection"],
    description:
      "Active people who train regularly and want to feel and perform at their best every day. Balance across all four systems is the goal — consistent, sustainable, whole.",
  },
]

const AUDIENCES = [
  { icon: Award, label: "Athletes", detail: "From development to elite performance" },
  { icon: Users, label: "Teams", detail: "Collective food strategy for collective results" },
  { icon: Briefcase, label: "Coaches", detail: "A framework to guide your players' food choices" },
  { icon: TrendingUp, label: "Developing Athletes", detail: "Build the right habits from the start" },
  { icon: Building2, label: "Gyms & Clubs", detail: "A performance food culture for your community" },
  { icon: Heart, label: "Everyday Active", detail: "For anyone who trains and wants to feel it" },
]

const PLATFORMS = [
  {
    number: "01",
    label: "ANALYSE",
    title: "Performance Meal Analysis",
    accent: "var(--icon-lime)",
    gradient: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))",
    description:
      "Upload any meal and see how it scores across the 4 Systems of Performance. Understand where your food is strong — and where it leaves gaps.",
    status: "In Development",
    href: "#",
  },
  {
    number: "02",
    label: "PROFILE",
    title: "Athlete Profiles",
    accent: "var(--icon-teal)",
    gradient: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))",
    description:
      "Build a personal performance food profile tailored to your sport, training load, and individual 4-System priorities.",
    status: "Coming Soon",
    href: "#",
  },
  {
    number: "03",
    label: "GUIDE",
    title: "Sport-Specific Guidance",
    accent: "var(--icon-yellow)",
    gradient: "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange))",
    description:
      "Food guidance designed around specific sports and their unique performance demands — not generic sports nutrition advice.",
    status: "Coming Soon",
    href: "#",
  },
  {
    number: "04",
    label: "EXPLORE",
    title: "EatoSports Editorial",
    accent: "var(--icon-orange)",
    gradient: "linear-gradient(135deg, var(--icon-teal), var(--icon-yellow))",
    description:
      "Deep dives, athlete interviews, and performance food conversations — a Substack and podcast for people serious about food and sport.",
    status: "Coming Soon",
    href: "#",
  },
]

const MOCK_SCORES = [
  { system: "Energy", score: 78, accent: "var(--icon-lime)", gradient: "linear-gradient(90deg, var(--icon-lime), var(--icon-green))" },
  { system: "Build", score: 55, accent: "var(--icon-teal)", gradient: "linear-gradient(90deg, var(--icon-green), var(--icon-teal))" },
  { system: "Recovery", score: 40, accent: "var(--icon-yellow)", gradient: "linear-gradient(90deg, var(--icon-yellow), var(--icon-orange))" },
  { system: "Protection", score: 64, accent: "var(--icon-orange)", gradient: "linear-gradient(90deg, var(--icon-teal), var(--icon-yellow))" },
]

/* ─────────────────────────────────────────────────
   PAGE
───────────────────────────────────────────────── */
export default function EatoSportsPage() {
  return (
    <>
      {/* ── 1. HERO ─────────────────────────────────────── */}
      <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 pt-20 pb-20 md:pb-32">
        <div className="relative z-10 mx-auto flex max-w-[720px] flex-col items-center text-center">
          {/* Icon — same as EatoBiotics homepage, placeholder until EatoSports icon is ready */}
          <ScrollReveal>
            <Image
              src="/eatobiotics-icon.webp"
              alt="EatoSports icon"
              width={200}
              height={200}
              priority
              className="h-40 w-40 sm:h-48 sm:w-48 md:h-56 md:w-56"
            />
          </ScrollReveal>

          {/* Headline — brand name as H1, matching homepage "EatoBiotics" pattern */}
          <ScrollReveal delay={100}>
            <h1 className="mt-8 font-serif text-6xl font-semibold tracking-tight sm:text-7xl md:text-8xl lg:text-9xl text-balance">
              <span className="brand-gradient-text">EatoSports</span>
            </h1>
          </ScrollReveal>

          {/* Sub-headline */}
          <ScrollReveal delay={200}>
            <p className="mt-4 font-serif text-xl font-medium text-foreground sm:text-2xl md:text-3xl">
              The Food System for Sports
            </p>
          </ScrollReveal>

          {/* Body */}
          <ScrollReveal delay={300}>
            <p className="mt-6 max-w-lg text-base leading-relaxed text-muted-foreground md:text-lg">
              EatoSports is a new way to understand how food supports athletic performance.
              Built on the same philosophy as EatoBiotics — but applied to energy, recovery,
              resilience, and results for athletes and active people.
            </p>
          </ScrollReveal>

          {/* Italic quote — mirrors homepage orange quote */}
          <ScrollReveal delay={400}>
            <p className="mt-6 max-w-md text-base font-medium italic text-icon-orange md:text-lg">
              &ldquo;Build the performance system inside you — and help build the food system around you.&rdquo;
            </p>
          </ScrollReveal>

          {/* CTAs */}
          <ScrollReveal delay={500}>
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <a
                href="#framework"
                className="inline-flex items-center gap-2 rounded-full px-8 py-4 text-base font-semibold text-white shadow-lg transition-all hover:opacity-90 hover:shadow-xl"
                style={{ background: SPORTS_GRADIENT, boxShadow: "0 8px 32px color-mix(in srgb, var(--icon-orange) 25%, transparent)" }}
              >
                Explore the 4 Systems
                <ChevronRight size={16} />
              </a>
              <a
                href="#how-it-works"
                className="inline-flex items-center gap-2 rounded-full border border-border px-8 py-4 text-base font-semibold text-foreground transition-all hover:border-icon-orange hover:text-icon-orange"
              >
                See how it works
              </a>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ── DIVIDER ─────────────────────────────────────── */}
      <div className="section-divider" />

      {/* ── 2. FRAMEWORK ────────────────────────────────── */}
      <section id="framework" className="px-6 py-24 md:py-32">
        <div className="mx-auto max-w-[1200px]">
          <ScrollReveal>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-icon-orange">
                  The Framework
                </p>
                <h2 className="mt-4 text-balance font-serif text-4xl font-semibold text-foreground sm:text-5xl md:text-6xl">
                  The 4 Systems
                  <br />
                  <span className="brand-gradient-text">of Performance</span>
                </h2>
              </div>
            </div>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground">
              A simple and practical framework for understanding how food supports the four
              core systems every athlete, team, and active person relies on.
            </p>
          </ScrollReveal>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {SYSTEMS.map((sys, index) => (
              <ScrollReveal key={sys.number} delay={index * 120}>
                <div className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-background p-7 transition-all hover:shadow-lg">
                  {/* Top gradient bar */}
                  <div
                    className="absolute top-0 left-0 right-0 h-1.5"
                    style={{ background: `linear-gradient(90deg, ${sys.gradientFrom}, ${sys.gradientTo})` }}
                  />

                  {/* Number */}
                  <span
                    className="font-serif text-5xl font-semibold md:text-6xl"
                    style={{ color: sys.accent }}
                  >
                    {sys.number}
                  </span>

                  {/* Title + label */}
                  <h3 className="mt-5 font-serif text-xl font-semibold text-foreground">
                    {sys.title}
                  </h3>
                  <p
                    className="mt-1 text-xs font-bold uppercase tracking-widest"
                    style={{ color: sys.accent }}
                  >
                    {sys.label}
                  </p>

                  {/* Description */}
                  <p className="mt-4 flex-1 text-sm leading-relaxed text-muted-foreground">
                    {sys.description}
                  </p>

                  {/* Support line */}
                  <p className="mt-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                    {sys.support}
                  </p>

                  {/* Bottom gradient bar */}
                  <div
                    className="mt-5 h-1.5 w-16 rounded-full transition-all group-hover:w-24"
                    style={{ background: `linear-gradient(90deg, ${sys.gradientFrom}, ${sys.gradientTo})` }}
                  />
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── DIVIDER ─────────────────────────────────────── */}
      <div className="section-divider" />

      {/* ── 3b. EATOSPORTS PLATE ─────────────────────────── */}
      <section className="bg-secondary/40 px-6 py-24 md:py-32">
        <div className="mx-auto max-w-[1200px]">
          <div className="flex flex-col gap-16 lg:flex-row lg:items-center lg:gap-20">

            {/* Left: text */}
            <div className="lg:w-[420px] lg:shrink-0">
              <ScrollReveal>
                <p className="text-xs font-semibold uppercase tracking-widest text-icon-orange">
                  The Framework
                </p>
                <h2 className="mt-4 text-balance font-serif text-4xl font-semibold text-foreground sm:text-5xl">
                  One plate.{" "}
                  <span className="brand-gradient-text">Built with 4 Systems.</span>
                </h2>
                <p className="mt-6 text-base leading-relaxed text-muted-foreground">
                  The EatoSports Plate is the practical model at the heart of the framework.
                  Four systems — each one mapping to a specific aspect of physical performance.
                </p>
                <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                  Each system targets what your body needs most: the fuel to go, the building
                  blocks to grow, the reset to recover, and the protection to keep going.
                </p>
              </ScrollReveal>
              <ScrollReveal delay={150}>
                <Link
                  href="#framework"
                  className="mt-8 inline-flex items-center gap-2 rounded-full border-2 border-icon-orange px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-icon-orange hover:text-white"
                >
                  Explore the 4 Systems
                  <ArrowUpRight size={14} />
                </Link>
              </ScrollReveal>
            </div>

            {/* Right: plate image + system cards */}
            <div className="flex-1">
              <ScrollReveal delay={100}>
                <div className="flex justify-center">
                  <Image
                    src="/eatosports-plate.png"
                    alt="The EatoSports Plate — four systems: Energy for fuel, Build for development, Recovery for reset, and Protection for longevity."
                    width={500}
                    height={500}
                    className="w-full max-w-[420px] drop-shadow-md"
                  />
                </div>
                <p className="mt-2 text-center text-xs text-muted-foreground">
                  A circular system where each performance dimension supports the next.
                </p>
              </ScrollReveal>

              {/* System cards */}
              <ScrollReveal delay={200}>
                <div className="mt-8 grid grid-cols-2 gap-4">
                  {[
                    {
                      label: "Energy",
                      system: "FUEL",
                      description: "Fuel for output and repeat performance.",
                      color: "var(--icon-lime)",
                      gradient: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))",
                      examples: ["Salmon", "Eggs", "White beans", "Oats"],
                    },
                    {
                      label: "Recovery",
                      system: "RESET",
                      description: "Reset and readiness.",
                      color: "var(--icon-teal)",
                      gradient: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))",
                      examples: ["Broccoli", "Berries", "Leafy greens", "Beets"],
                    },
                    {
                      label: "Build",
                      system: "DEVELOP",
                      description: "Muscle repair and growth.",
                      color: "var(--icon-yellow)",
                      gradient: "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange))",
                      examples: ["Chicken", "Brown rice", "Lentils", "Sweet potato"],
                    },
                    {
                      label: "Protection",
                      system: "PROTECT",
                      description: "Resilience and immune support.",
                      color: "var(--icon-orange)",
                      gradient: "linear-gradient(135deg, var(--icon-teal), var(--icon-yellow))",
                      examples: ["Greek yogurt", "Almonds", "Seeds", "Dark chocolate"],
                    },
                  ].map((s, index) => (
                    <ScrollReveal key={s.label} delay={index * 80}>
                      <div className="relative overflow-hidden rounded-2xl border border-border bg-background p-5 transition-shadow hover:shadow-lg">
                        <div
                          className="absolute top-0 left-0 right-0 h-1"
                          style={{ background: s.gradient }}
                        />
                        <p
                          className="text-xs font-bold uppercase tracking-widest"
                          style={{ color: s.color }}
                        >
                          {s.system}
                        </p>
                        <h3 className="mt-1.5 font-serif text-base font-semibold text-foreground">
                          {s.label}
                        </h3>
                        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                          {s.description}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {s.examples.map((ex) => (
                            <span
                              key={ex}
                              className="rounded-full px-2 py-0.5 text-xs font-medium text-white"
                              style={{ background: s.gradient }}
                            >
                              {ex}
                            </span>
                          ))}
                        </div>
                      </div>
                    </ScrollReveal>
                  ))}
                </div>
                <p className="mt-4 text-center text-xs text-muted-foreground">
                  Build your plate around these 4 systems. Every session. Every week.
                </p>
              </ScrollReveal>
            </div>
          </div>
        </div>
      </section>

      {/* ── DIVIDER ─────────────────────────────────────── */}
      <div className="section-divider" />

      {/* ── 4. WHY EATOSPORTS EXISTS ─────────────────────── */}
      <section className="bg-secondary/40 px-6 py-24 md:py-32">
        <div className="mx-auto max-w-[1200px]">
          <div className="grid gap-16 lg:grid-cols-2 lg:items-start lg:gap-24">
            {/* Left: problem statement */}
            <ScrollReveal>
              <p className="text-xs font-bold uppercase tracking-widest text-icon-orange">
                Why EatoSports
              </p>
              <h2 className="mt-4 text-pretty font-serif text-3xl font-semibold text-foreground sm:text-4xl md:text-5xl">
                Most nutrition tools weren&apos;t built for the athlete.
              </h2>
              <p className="mt-6 text-base leading-relaxed text-muted-foreground">
                Generic calorie counters and macro trackers were designed for weight
                management — not for performance. Athletes and active people need a
                fundamentally different way to think about food.
              </p>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                Not just what you eat. But how your food supports the specific physical
                systems that determine whether you perform, recover, and stay available
                — session after session, season after season.
              </p>
              <blockquote
                className="mt-8 border-l-2 pl-6 font-serif text-xl font-medium italic text-foreground"
                style={{ borderColor: "var(--icon-orange)" }}
              >
                &ldquo;Performance depends on food. And food, understood correctly, is a system.&rdquo;
              </blockquote>
            </ScrollReveal>

            {/* Right: three highlights */}
            <ScrollReveal delay={150}>
              <div className="space-y-5">
                {[
                  {
                    icon: Target,
                    title: "Performance-specific thinking",
                    body: "The 4 Systems framework is designed around how athletes actually use food — not just how much, but how well it supports specific physical demands.",
                    accent: "var(--icon-lime)",
                  },
                  {
                    icon: Flame,
                    title: "Real food, practical choices",
                    body: "EatoSports is not about supplements or shakes. It is about understanding ordinary foods and how they fit into an intelligent performance system.",
                    accent: "var(--icon-yellow)",
                  },
                  {
                    icon: BarChart3,
                    title: "Measurable, trackable, improvable",
                    body: "A framework is only useful if it helps you make better decisions. EatoSports makes performance nutrition visible, understandable, and actionable.",
                    accent: "var(--icon-orange)",
                  },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="flex gap-5 rounded-2xl border border-border bg-background p-6"
                  >
                    <div
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                      style={{ background: `color-mix(in srgb, ${item.accent} 15%, transparent)` }}
                    >
                      <item.icon size={20} style={{ color: item.accent }} />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{item.title}</p>
                      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ── DIVIDER ─────────────────────────────────────── */}
      <div className="section-divider" />

      {/* ── 5. SPORT-SPECIFIC APPLICATION ───────────────── */}
      <section className="px-6 py-24 md:py-32">
        <div className="mx-auto max-w-[1200px]">
          <ScrollReveal>
            <p className="text-xs font-bold uppercase tracking-widest text-icon-orange">
              Applied to Sport
            </p>
            <h2 className="mt-4 text-pretty font-serif text-4xl font-semibold text-foreground sm:text-5xl md:text-6xl">
              Different sports.
              <br />
              <span className="brand-gradient-text">Different demands.</span>
              <br />
              One intelligent food system.
            </h2>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground">
              EatoSports is not a one-size-fits-all approach. Each sport places unique
              demands on the 4 Systems — and the framework shifts accordingly.
            </p>
          </ScrollReveal>

          <div className="mt-16 grid gap-6 sm:grid-cols-2">
            {SPORTS.map((sport, index) => (
              <ScrollReveal key={sport.title} delay={index * 100}>
                <div className="relative overflow-hidden rounded-2xl border border-border bg-background p-7">
                  {/* Top gradient */}
                  <div
                    className="absolute top-0 left-0 right-0 h-1"
                    style={{ background: sport.gradient }}
                  />

                  {/* Icon + title */}
                  <div className="flex items-start gap-4">
                    <div
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
                      style={{ background: `color-mix(in srgb, ${sport.accent} 15%, transparent)` }}
                    >
                      <sport.icon size={22} style={{ color: sport.accent }} />
                    </div>
                    <div>
                      <h3 className="font-serif text-xl font-semibold text-foreground">
                        {sport.title}
                      </h3>
                      <p
                        className="text-xs font-semibold uppercase tracking-wider"
                        style={{ color: sport.accent }}
                      >
                        {sport.subtitle}
                      </p>
                    </div>
                  </div>

                  {/* System emphasis pills */}
                  <div className="mt-5 flex flex-wrap gap-2">
                    {sport.systems.map((s) => {
                      const sys = SYSTEMS.find((x) => x.title === s)
                      return (
                        <span
                          key={s}
                          className="rounded-full px-3 py-1 text-xs font-semibold text-white"
                          style={{ background: `linear-gradient(135deg, ${sys?.gradientFrom}, ${sys?.gradientTo})` }}
                        >
                          {s}
                        </span>
                      )
                    })}
                  </div>

                  {/* Description */}
                  <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
                    {sport.description}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── DIVIDER ─────────────────────────────────────── */}
      <div className="section-divider" />

      {/* ── 6. PRODUCT PREVIEW ──────────────────────────── */}
      <section id="how-it-works" className="bg-secondary/40 px-6 py-24 md:py-32">
        <div className="mx-auto max-w-[1200px]">
          <ScrollReveal>
            <p className="text-xs font-bold uppercase tracking-widest text-icon-orange">
              The Tool
            </p>
            <h2 className="mt-4 text-pretty font-serif text-4xl font-semibold text-foreground sm:text-5xl md:text-6xl">
              How EatoSports
              <br />
              <span className="brand-gradient-text">will work</span>
            </h2>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground">
              A practical analysis tool that shows you exactly how any meal supports your
              4 Systems of Performance — and how to make it stronger.
            </p>
          </ScrollReveal>

          {/* 4-step flow */}
          <div className="mt-14">
            <ScrollReveal delay={100}>
              <div className="grid gap-0 sm:grid-cols-4">
                {[
                  { step: "01", label: "Upload a meal", icon: "📸" },
                  { step: "02", label: "Analyse against 4 Systems", icon: "⚡" },
                  { step: "03", label: "See strengths & gaps", icon: "📊" },
                  { step: "04", label: "Get practical improvements", icon: "✅" },
                ].map((item, i) => (
                  <div key={item.step} className="flex items-start gap-3 sm:flex-col sm:gap-2">
                    <div className="flex items-center gap-3 sm:flex-row">
                      <div
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                        style={{ background: SPORTS_GRADIENT }}
                      >
                        {item.step}
                      </div>
                      {i < 3 && (
                        <div
                          className="hidden h-px flex-1 sm:block"
                          style={{ background: "linear-gradient(90deg, var(--icon-orange), var(--icon-yellow))", opacity: 0.3 }}
                        />
                      )}
                    </div>
                    <div className="pt-0.5 sm:pt-3">
                      <span className="text-lg">{item.icon}</span>
                      <p className="mt-1 text-sm font-semibold text-foreground">{item.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollReveal>
          </div>

          {/* Mock analysis card */}
          <ScrollReveal delay={200}>
            <div className="mt-14 overflow-hidden rounded-3xl border border-border bg-background shadow-lg">
              {/* Card header */}
              <div
                className="flex items-center justify-between px-7 py-5"
                style={{ background: "color-mix(in srgb, var(--icon-orange) 6%, var(--background))" }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-xl"
                    style={{ background: SPORTS_GRADIENT }}
                  >
                    <BarChart3 size={16} className="text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Performance Analysis</p>
                    <p className="text-xs text-muted-foreground">Grilled salmon · Brown rice · Broccoli · Greek yogurt</p>
                  </div>
                </div>
                <span
                  className="rounded-full px-3 py-1 text-xs font-bold text-white"
                  style={{ background: SPORTS_GRADIENT }}
                >
                  Example
                </span>
              </div>

              <div className="px-7 pb-7 pt-6">
                {/* Score bars */}
                <div className="space-y-5">
                  {MOCK_SCORES.map((item) => (
                    <div key={item.system}>
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-sm font-semibold text-foreground">{item.system}</span>
                        <span
                          className="text-sm font-bold"
                          style={{ color: item.accent }}
                        >
                          {item.score}/100
                        </span>
                      </div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-secondary">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${item.score}%`,
                            background: item.gradient,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Suggested improvement */}
                <div
                  className="mt-7 flex items-start gap-4 rounded-2xl p-5"
                  style={{
                    background: "color-mix(in srgb, var(--icon-yellow) 8%, transparent)",
                    border: "1px solid color-mix(in srgb, var(--icon-yellow) 25%, transparent)",
                  }}
                >
                  <Lightbulb size={18} style={{ color: "var(--icon-yellow)", flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <p className="text-sm font-semibold text-foreground">Improve Recovery</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Your Recovery score is the priority gap. Add a tablespoon of tart cherry
                      concentrate or kefir alongside this meal to meaningfully improve your
                      recovery system score.
                    </p>
                  </div>
                </div>

                <p className="mt-5 text-center text-xs text-muted-foreground/60">
                  This is a conceptual preview of the EatoSports performance analysis tool — in development.
                </p>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ── DIVIDER ─────────────────────────────────────── */}
      <div className="section-divider" />

      {/* ── 7. WHO IT'S FOR ─────────────────────────────── */}
      <section className="px-6 py-24 md:py-32">
        <div className="mx-auto max-w-[1200px]">
          <ScrollReveal>
            <p className="text-xs font-bold uppercase tracking-widest text-icon-orange">
              Who It&apos;s For
            </p>
            <h2 className="mt-4 text-pretty font-serif text-4xl font-semibold text-foreground sm:text-5xl md:text-6xl">
              Built for everyone
              <br />
              <span className="brand-gradient-text">who performs.</span>
            </h2>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground">
              EatoSports is for anyone who takes their physical performance seriously —
              from elite athletes to coaches building a team culture around intelligent food.
            </p>
          </ScrollReveal>

          <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {AUDIENCES.map((audience, index) => (
              <ScrollReveal key={audience.label} delay={index * 80}>
                <div className="flex items-start gap-4 rounded-2xl border border-border bg-background p-6 transition-all hover:shadow-md">
                  <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                    style={{ background: SPORTS_GRADIENT }}
                  >
                    <audience.icon size={18} className="text-white" />
                  </div>
                  <div>
                    <p className="font-serif font-semibold text-foreground">{audience.label}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{audience.detail}</p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── DIVIDER ─────────────────────────────────────── */}
      <div className="section-divider" />

      {/* ── 8. PLATFORM / ROADMAP ───────────────────────── */}
      <section className="bg-secondary/40 px-6 py-24 md:py-32">
        <div className="mx-auto max-w-[1200px]">
          <ScrollReveal>
            <p className="text-xs font-bold uppercase tracking-widest text-icon-orange">
              The Platform
            </p>
            <h2 className="mt-4 text-pretty font-serif text-4xl font-semibold text-foreground sm:text-5xl md:text-6xl">
              One framework.
              <br />
              <span className="brand-gradient-text">Multiple expressions.</span>
            </h2>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground">
              EatoSports is more than a page. It is a growing performance food platform —
              built to serve athletes, teams, coaches, and active communities across multiple
              formats and touchpoints.
            </p>
          </ScrollReveal>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {PLATFORMS.map((platform, index) => (
              <ScrollReveal key={platform.number} delay={index * 100}>
                <div className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-background p-6 transition-all hover:shadow-lg">
                  {/* Top gradient */}
                  <div
                    className="absolute top-0 left-0 right-0 h-1"
                    style={{ background: platform.gradient }}
                  />

                  {/* Number + status */}
                  <div className="flex items-start justify-between">
                    <span
                      className="font-serif text-5xl font-bold"
                      style={{ color: platform.accent }}
                    >
                      {platform.number}
                    </span>
                    <span
                      className="mt-1 rounded-full px-2.5 py-1 text-xs font-semibold text-white"
                      style={{ background: platform.gradient }}
                    >
                      {platform.status}
                    </span>
                  </div>

                  {/* Label + title */}
                  <p
                    className="mt-3 text-xs font-bold uppercase tracking-widest"
                    style={{ color: platform.accent }}
                  >
                    {platform.label}
                  </p>
                  <h3 className="mt-1 font-serif text-xl font-semibold text-foreground">
                    {platform.title}
                  </h3>

                  {/* Description */}
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">
                    {platform.description}
                  </p>

                  {/* Hover CTA */}
                  <div
                    className="mt-5 flex items-center gap-1 text-sm font-semibold opacity-40 transition-opacity group-hover:opacity-80"
                    style={{ color: platform.accent }}
                  >
                    Learn more
                    <ArrowUpRight size={14} />
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── DIVIDER ─────────────────────────────────────── */}
      <div className="section-divider" />

      {/* ── 9. THE FOOD SYSTEM ───────────────────────────── */}
      <section className="bg-foreground px-6 py-24 md:py-32">
        <div className="mx-auto max-w-[1200px]">

          {/* Header */}
          <ScrollReveal>
            <p className="text-xs font-bold uppercase tracking-widest text-icon-lime">
              The Food System Inside You
            </p>
            <h2 className="mt-4 text-pretty font-serif text-4xl font-semibold text-background sm:text-5xl md:text-6xl">
              EatoBiotics.
              <br />
              <span className="brand-gradient-text">The foundation EatoSports is built on.</span>
            </h2>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-background/70">
              EatoSports is not a standalone framework. It is the performance expression of a
              deeper food system — one grounded in how food actually works inside the human body.
              That system is EatoBiotics.
            </p>
          </ScrollReveal>
          <ScrollReveal delay={150}>
            <Link
              href="/"
              className="mt-8 inline-flex items-center gap-2 rounded-full border-2 border-icon-lime px-6 py-3 text-sm font-semibold text-background transition-colors hover:bg-icon-lime hover:text-foreground"
            >
              Explore EatoBiotics
              <ArrowUpRight size={14} />
            </Link>
          </ScrollReveal>

          {/* 3 Biotics grid */}
          <div className="mt-16 grid gap-6 sm:grid-cols-3">
            {[
              {
                number: "01",
                title: "Prebiotics",
                accent: "var(--icon-lime)",
                gradient: "linear-gradient(90deg, var(--icon-lime), var(--icon-green))",
                body: "The fibre and plant compounds that feed your gut bacteria. Without a consistent supply of prebiotics, the rest of the system cannot function. They are the raw material — and in sport, where demand is high, their role is foundational.",
                examples: ["Oats", "Bananas", "Garlic", "Leeks", "Asparagus"],
              },
              {
                number: "02",
                title: "Probiotics",
                accent: "var(--icon-green)",
                gradient: "linear-gradient(90deg, var(--icon-green), var(--icon-teal))",
                body: "The live bacteria that populate your gut microbiome. A diverse microbiome responds better to the demands of training, supports immune resilience, and produces the compounds your body relies on for recovery and adaptation.",
                examples: ["Yogurt", "Kefir", "Kimchi", "Sauerkraut", "Tempeh"],
              },
              {
                number: "03",
                title: "Postbiotics",
                accent: "var(--icon-teal)",
                gradient: "linear-gradient(90deg, var(--icon-teal), var(--icon-yellow))",
                body: "The beneficial compounds produced when gut bacteria ferment prebiotic fibre. Short-chain fatty acids, vitamins, and signalling molecules — these are the outputs that reduce inflammation, regulate energy, and support recovery at a cellular level.",
                examples: ["Butyrate", "SCFAs", "B vitamins", "Antioxidants"],
              },
            ].map((biotic, index) => (
              <ScrollReveal key={biotic.title} delay={index * 100}>
                <div
                  className="relative flex flex-col overflow-hidden rounded-2xl p-7"
                  style={{
                    background: `color-mix(in srgb, ${biotic.accent} 8%, var(--foreground))`,
                    border: `1px solid color-mix(in srgb, ${biotic.accent} 25%, transparent)`,
                  }}
                >
                  <div
                    className="absolute top-0 left-0 right-0 h-1"
                    style={{ background: biotic.gradient }}
                  />
                  <span
                    className="font-serif text-4xl font-semibold"
                    style={{ color: biotic.accent }}
                  >
                    {biotic.number}
                  </span>
                  <h3 className="mt-4 font-serif text-xl font-semibold text-background">
                    {biotic.title}
                  </h3>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-background/70">
                    {biotic.body}
                  </p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {biotic.examples.map((ex) => (
                      <span
                        key={ex}
                        className="rounded-full px-3 py-1 text-xs font-semibold"
                        style={{
                          background: `color-mix(in srgb, ${biotic.accent} 18%, transparent)`,
                          color: biotic.accent,
                        }}
                      >
                        {ex}
                      </span>
                    ))}
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>

          <ScrollReveal delay={200}>
            <p className="mt-10 text-center text-sm text-background/50">
              EatoSports applies all three through the 4 Systems of Performance — building a plate that works as hard as you do.
            </p>
          </ScrollReveal>

        </div>
      </section>

      {/* ── DIVIDER ─────────────────────────────────────── */}
      <div className="section-divider" />

      {/* ── 10. FINAL CTA ───────────────────────────────── */}
      <section className="bg-secondary/40 px-6 py-24 md:py-32">
        <div className="mx-auto max-w-[900px]">
          <div className="overflow-hidden rounded-3xl border border-border bg-background">
            {/* Top gradient accent */}
            <div className="h-1.5 w-full" style={{ background: SPORTS_GRADIENT }} />

            <div className="p-10 md:p-16">
              <ScrollReveal className="text-center">
                <p className="text-xs font-bold uppercase tracking-widest text-icon-orange">
                  EatoSports
                </p>
                <h2 className="mt-4 text-balance font-serif text-4xl font-semibold text-foreground sm:text-5xl">
                  Follow EatoSports
                  <br />
                  <span className="brand-gradient-text">as it comes to life</span>
                </h2>
                <p className="mx-auto mt-6 max-w-lg text-base leading-relaxed text-muted-foreground">
                  EatoSports is being built in the open — as part of the wider EatoBiotics
                  ecosystem. Subscribe on Substack to follow the framework, the thinking,
                  and the product as it develops.
                </p>
              </ScrollReveal>

              {/* Perks — what following gets you */}
              <ScrollReveal delay={100}>
                <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
                  {[
                    { label: "Free to follow", detail: "On EatoBiotics Substack" },
                    { label: "In development", detail: "Building in the open" },
                    { label: "For athletes", detail: "And everyone who moves" },
                    { label: "Food-first", detail: "No supplements. No shortcuts." },
                  ].map((item) => (
                    <div key={item.label} className="text-center">
                      <div className="mx-auto mb-2 h-1 w-10 rounded-full" style={{ background: SPORTS_GRADIENT }} />
                      <p className="font-serif text-base font-semibold text-foreground">{item.label}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{item.detail}</p>
                    </div>
                  ))}
                </div>
              </ScrollReveal>

              {/* CTAs */}
              <ScrollReveal delay={200}>
                <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                  <a
                    href="https://eatobiotics.substack.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-full px-8 py-4 text-base font-semibold text-white shadow-lg transition-all hover:opacity-90 hover:shadow-xl"
                    style={{
                      background: SPORTS_GRADIENT,
                      boxShadow: "0 8px 32px color-mix(in srgb, var(--icon-orange) 25%, transparent)",
                    }}
                  >
                    Follow the development
                    <ArrowUpRight size={16} />
                  </a>
                  <Link
                    href="/"
                    className="inline-flex items-center gap-2 rounded-full border border-border px-8 py-4 text-base font-semibold text-foreground transition-all hover:border-icon-green hover:text-icon-green"
                  >
                    Return to EatoBiotics
                  </Link>
                </div>
                <p className="mt-4 text-center text-sm text-muted-foreground">
                  Free to follow. Part of the EatoBiotics Substack.
                </p>
              </ScrollReveal>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
