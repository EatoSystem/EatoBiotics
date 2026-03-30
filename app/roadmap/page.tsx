import type { Metadata } from "next"
import Image from "next/image"
import { ScrollReveal } from "@/components/scroll-reveal"
import { GradientText } from "@/components/gradient-text"
import { BookOpen, Smartphone, PenLine, ArrowUpRight, CheckCircle2, Circle, Clock } from "lucide-react"
import { cn } from "@/lib/utils"

export const metadata: Metadata = {
  title: "Roadmap",
  description:
    "The EatoBiotics roadmap -- from Substack community to published book to companion app. Follow the journey.",
}

const phases = [
  {
    year: "2025",
    label: "Foundation",
    status: "Underway",
    statusColor: "#A8E063",
    statusBg: "rgba(168,224,99,0.12)",
    color: "#A8E063",
    description: "Establish the Substack, begin book development, and define the app concept.",
  },
  {
    year: "2026",
    label: "Growth",
    status: "Coming",
    statusColor: "#2DAA6E",
    statusBg: "rgba(45,170,110,0.10)",
    color: "#2DAA6E",
    description: "Grow the community, publish the book, and begin app development.",
  },
  {
    year: "2027+",
    label: "Scale",
    status: "Future",
    statusColor: "#F5A623",
    statusBg: "rgba(245,166,35,0.10)",
    color: "#F5A623",
    description: "Expand content, release new editions, and launch the app ecosystem.",
  },
]

type MilestoneStatus = "done" | "active" | "planned"

type Milestone = {
  step: string
  label: string
  status: MilestoneStatus
  color: string
  detail: string
}

const substackMilestones: Milestone[] = [
  {
    step: "01",
    label: "Launch & Establish",
    status: "done",
    color: "#A8E063",
    detail:
      "Launch the EatoBiotics Substack as the primary content home. Introduce the biotic framework — prebiotics, probiotics, and postbiotics — through accessible, science-backed writing.",
  },
  {
    step: "02",
    label: "Weekly Content Cadence",
    status: "active",
    color: "#4CB648",
    detail:
      "Publish consistent weekly content covering biotic food education, county food spotlights, seasonal eating guides, and deep dives into individual foods and their microbiome impact.",
  },
  {
    step: "03",
    label: "Community Growth",
    status: "planned",
    color: "#2DAA6E",
    detail:
      "Build an engaged subscriber base through discussions, reader Q&As, and community-driven content. Create a feedback loop where reader questions shape future posts.",
  },
  {
    step: "04",
    label: "Cross-Platform Integration",
    status: "planned",
    color: "#2DAA6E",
    detail:
      "Connect Substack content with the book chapters and app features. Substack becomes the living companion — updating readers as the book publishes and the app takes shape.",
  },
]

const bookMilestones: Milestone[] = [
  {
    step: "01",
    label: "Research & Content Development",
    status: "active",
    color: "#2DAA6E",
    detail:
      "Deep research into the science of prebiotics, probiotics, and postbiotics. Map out the chapter structure from gut foundations through to real-world food application and recipes.",
  },
  {
    step: "02",
    label: "Writing & Editorial",
    status: "active",
    color: "#4CB648",
    detail:
      "Write each chapter as a Substack installment first — testing ideas with the community before they become book content. Cover the biotic framework, food profiles, and the EatoBiotics Plate.",
  },
  {
    step: "03",
    label: "Design & Production",
    status: "planned",
    color: "#2DAA6E",
    detail:
      "Commission illustrations, food photography, and infographics. Design the EatoBiotics Plate visual, chapter layouts, and the cover. Prepare print and digital editions.",
  },
  {
    step: "04",
    label: "Publication & Distribution",
    status: "planned",
    color: "#A8E063",
    detail:
      "Publish 'EatoBiotics: The Food System Inside You' in digital and print formats. Launch to the Substack community first, then expand through wider distribution channels.",
  },
]

const appMilestones: Milestone[] = [
  {
    step: "01",
    label: "Concept & Design",
    status: "active",
    color: "#F5C518",
    detail:
      "Define the app's core purpose: a personal biotic food companion. Design the UI/UX around the Biotics Score, food logging, and the three-pillar framework. Prioritise simplicity and daily habit formation.",
  },
  {
    step: "02",
    label: "Core Features",
    status: "planned",
    color: "#F5A623",
    detail:
      "Build the Biotics Score (daily 0-100), food logging with auto-tagging for prebiotic, probiotic, and postbiotic foods, food system trend tracking, and a searchable food profile library.",
  },
  {
    step: "03",
    label: "Community Features",
    status: "planned",
    color: "#F5C518",
    detail:
      "Add local producer connections, county food maps, seasonal eating suggestions, and social features that connect app users with the broader EatoBiotics community.",
  },
  {
    step: "04",
    label: "Launch & Iteration",
    status: "planned",
    color: "#F5A623",
    detail:
      "Beta test with the Substack community, gather feedback, iterate on features, then launch publicly. Continuous improvement driven by real user data and community input.",
  },
]

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
        Done
      </span>
    )
  }
  if (status === "active") {
    return (
      <span className="inline-flex items-center rounded-full bg-icon-teal/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-icon-teal">
        Active
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
              Where we&apos;re going
            </p>
          </ScrollReveal>

          <ScrollReveal delay={400} className="w-full text-center">
            <p className="mx-auto mt-6 max-w-lg text-sm leading-relaxed text-muted-foreground sm:text-base md:text-lg">
              Three pillars, one mission. From Substack community to published book to
              companion app — each step builds on the last to create a complete
              biotic food system for everyone.
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

      {/* Phase Overview — visual timeline strips */}
      <section className="px-6 py-24 md:py-32">
        <div className="mx-auto max-w-[1200px]">
          <ScrollReveal className="text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-icon-teal">
              Overview
            </p>
            <h2 className="mt-4 font-serif text-3xl font-semibold text-foreground sm:text-4xl md:text-5xl text-balance">
              Three Phases
            </h2>
          </ScrollReveal>

          <div className="mt-16 flex flex-col gap-4">
            {phases.map((phase, index) => (
              <ScrollReveal key={phase.year} delay={index * 100}>
                <div className="relative overflow-hidden rounded-2xl border border-border bg-background p-6 transition-shadow hover:shadow-md">
                  {/* Left accent bar */}
                  <div
                    className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
                    style={{ backgroundColor: phase.color }}
                  />

                  <div className="flex flex-col gap-4 pl-4 sm:flex-row sm:items-center sm:gap-8">
                    {/* Year */}
                    <div className="shrink-0">
                      <p className="font-serif text-4xl font-semibold sm:text-5xl brand-gradient-text">
                        {phase.year}
                      </p>
                    </div>

                    {/* Divider (desktop) */}
                    <div className="hidden h-14 w-px bg-border sm:block" />

                    {/* Label + status */}
                    <div className="shrink-0">
                      <div className="flex items-center gap-2">
                        <p className="font-serif text-xl font-semibold text-foreground">
                          {phase.label}
                        </p>
                        <span
                          className="rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider"
                          style={{
                            color: phase.statusColor,
                            backgroundColor: phase.statusBg,
                          }}
                        >
                          {phase.status}
                        </span>
                      </div>
                    </div>

                    {/* Divider (desktop) */}
                    <div className="hidden h-14 w-px bg-border sm:block" />

                    {/* Description */}
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {phase.description}
                    </p>

                    {/* Arrow */}
                    {index < phases.length - 1 && (
                      <div className="hidden shrink-0 sm:block">
                        <ArrowUpRight size={16} className="text-muted-foreground/30 rotate-45" />
                      </div>
                    )}
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
                <span className="text-xs text-muted-foreground">Done</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-icon-teal" />
                <span className="text-xs text-muted-foreground">Active</span>
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

      {/* Substack Timeline */}
      <TimelineSection
        label="Substack"
        labelColor="var(--icon-lime)"
        phaseStatus="Underway"
        heading="Building the Community"
        icon={PenLine}
        milestones={substackMilestones}
      />

      {/* Gradient divider */}
      <div className="section-divider" />

      {/* Book Timeline */}
      <TimelineSection
        label="The Book"
        labelColor="var(--icon-teal)"
        phaseStatus="In Progress"
        heading="EatoBiotics — The Guide"
        icon={BookOpen}
        milestones={bookMilestones}
      />

      {/* Gradient divider */}
      <div className="section-divider" />

      {/* App Timeline */}
      <TimelineSection
        label="The App"
        labelColor="var(--icon-orange)"
        phaseStatus="Designing"
        heading="Your Biotic Companion"
        icon={Smartphone}
        milestones={appMilestones}
      />

      {/* Gradient divider */}
      <div className="section-divider" />

      {/* Closing CTA */}
      <section className="px-6 py-24 md:py-32">
        <div className="mx-auto max-w-[720px] text-center">
          <ScrollReveal>
            <h2 className="font-serif text-2xl font-semibold text-foreground sm:text-3xl md:text-4xl text-balance">
              Follow the journey from day one.
            </h2>
          </ScrollReveal>
          <ScrollReveal delay={100}>
            <p className="mx-auto mt-6 max-w-lg text-sm leading-relaxed text-muted-foreground sm:text-base">
              Every chapter, every feature, every milestone — shared first with
              the Substack community. Subscribe to stay ahead of the roadmap.
            </p>
          </ScrollReveal>
          <ScrollReveal delay={200}>
            <div className="mt-10">
              <a
                href="https://eatobiotics.substack.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="brand-gradient inline-flex items-center gap-2 rounded-full px-8 py-4 text-base font-semibold text-white shadow-lg shadow-icon-green/20 transition-all hover:shadow-xl hover:shadow-icon-green/30 hover:opacity-90"
              >
                Subscribe on Substack
                <ArrowUpRight size={16} />
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
