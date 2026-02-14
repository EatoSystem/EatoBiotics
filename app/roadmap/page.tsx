import type { Metadata } from "next"
import Image from "next/image"
import { ScrollReveal } from "@/components/scroll-reveal"
import { GradientText } from "@/components/gradient-text"
import { BookOpen, Smartphone, PenLine, ArrowUpRight } from "lucide-react"

export const metadata: Metadata = {
  title: "Roadmap",
  description:
    "The EatoBiotics roadmap -- from Substack community to published book to companion app. Follow the journey.",
}

const phases = [
  {
    year: "2025",
    label: "Foundation",
    color: "#A8E063",
    description:
      "Establish the Substack, begin book development, and define the app concept.",
  },
  {
    year: "2026",
    label: "Growth",
    color: "#2DAA6E",
    description:
      "Grow the community, publish the book, and begin app development.",
  },
  {
    year: "2027+",
    label: "Scale",
    color: "#F5A623",
    description:
      "Expand content, release new editions, and launch the app ecosystem.",
  },
]

const substackMilestones = [
  {
    step: "01",
    label: "Launch & Establish",
    color: "#A8E063",
    detail:
      "Launch the EatoBiotics Substack as the primary content home. Introduce the biotic framework -- prebiotics, probiotics, and postbiotics -- through accessible, science-backed writing.",
  },
  {
    step: "02",
    label: "Weekly Content Cadence",
    color: "#4CB648",
    detail:
      "Publish consistent weekly content covering biotic food education, county food spotlights, seasonal eating guides, and deep dives into individual foods and their microbiome impact.",
  },
  {
    step: "03",
    label: "Community Growth",
    color: "#2DAA6E",
    detail:
      "Build an engaged subscriber base through discussions, reader Q&As, and community-driven content. Create a feedback loop where reader questions shape future posts.",
  },
  {
    step: "04",
    label: "Cross-Platform Integration",
    color: "#2DAA6E",
    detail:
      "Connect Substack content with the book chapters and app features. Substack becomes the living companion -- updating readers as the book publishes and the app takes shape.",
  },
]

const bookMilestones = [
  {
    step: "01",
    label: "Research & Content Development",
    color: "#2DAA6E",
    detail:
      "Deep research into the science of prebiotics, probiotics, and postbiotics. Map out the chapter structure from gut foundations through to real-world food application and recipes.",
  },
  {
    step: "02",
    label: "Writing & Editorial",
    color: "#4CB648",
    detail:
      "Write each chapter as a Substack installment first -- testing ideas with the community before they become book content. Cover the biotic framework, food profiles, and the EatoBiotics Plate.",
  },
  {
    step: "03",
    label: "Design & Production",
    color: "#2DAA6E",
    detail:
      "Commission illustrations, food photography, and infographics. Design the EatoBiotics Plate visual, chapter layouts, and the cover. Prepare print and digital editions.",
  },
  {
    step: "04",
    label: "Publication & Distribution",
    color: "#A8E063",
    detail:
      "Publish 'EatoBiotics: The Food System Inside You' in digital and print formats. Launch to the Substack community first, then expand through wider distribution channels.",
  },
]

const appMilestones = [
  {
    step: "01",
    label: "Concept & Design",
    color: "#F5C518",
    detail:
      "Define the app's core purpose: a personal biotic food companion. Design the UI/UX around the Biotics Score, food logging, and the three-pillar framework. Prioritise simplicity and daily habit formation.",
  },
  {
    step: "02",
    label: "Core Features",
    color: "#F5A623",
    detail:
      "Build the Biotics Score (daily 0-100), food logging with auto-tagging for prebiotic, probiotic, and postbiotic foods, gut health trend tracking, and a searchable food profile library.",
  },
  {
    step: "03",
    label: "Community Features",
    color: "#F5C518",
    detail:
      "Add local producer connections, county food maps, seasonal eating suggestions, and social features that connect app users with the broader EatoBiotics community.",
  },
  {
    step: "04",
    label: "Launch & Iteration",
    color: "#F5A623",
    detail:
      "Beta test with the Substack community, gather feedback, iterate on features, then launch publicly. Continuous improvement driven by real user data and community input.",
  },
]

function TimelineSection({
  label,
  labelColor,
  heading,
  icon: Icon,
  milestones,
}: {
  label: string
  labelColor: string
  heading: string
  icon: typeof BookOpen
  milestones: typeof substackMilestones
}) {
  return (
    <section className="px-6 py-24 md:py-32">
      <div className="mx-auto max-w-[1200px]">
        <div className="flex flex-col items-start gap-12 md:flex-row md:gap-20">
          {/* Left: heading */}
          <ScrollReveal className="md:sticky md:top-32 md:w-[320px] md:shrink-0">
            <p
              className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: labelColor }}
            >
              {label}
            </p>
            <h2 className="mt-4 font-serif text-3xl font-semibold text-foreground sm:text-4xl text-balance">
              {heading}
            </h2>
            <div
              className="mt-6 flex h-14 w-14 items-center justify-center rounded-2xl"
              style={{ backgroundColor: labelColor }}
            >
              <Icon size={28} className="text-white" />
            </div>
          </ScrollReveal>

          {/* Right: timeline */}
          <div className="flex-1">
            <div className="flex flex-col gap-0">
              {milestones.map((item, index) => (
                <ScrollReveal key={item.step} delay={index * 120}>
                  <div className="flex gap-6">
                    <div className="flex flex-col items-center">
                      <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                        style={{ backgroundColor: item.color }}
                      >
                        {item.step}
                      </div>
                      {index < milestones.length - 1 && (
                        <div className="w-0.5 flex-1 bg-border" />
                      )}
                    </div>
                    <div className={index < milestones.length - 1 ? "pb-10" : ""}>
                      <p className="font-serif text-lg font-semibold text-foreground">
                        {item.label}
                      </p>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
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
              Where we{"'"}re going
            </p>
          </ScrollReveal>

          <ScrollReveal delay={400} className="w-full text-center">
            <p className="mx-auto mt-6 max-w-lg text-sm leading-relaxed text-muted-foreground sm:text-base md:text-lg">
              Three pillars, one mission. From Substack community to published book to
              companion app -- each step builds on the last to create a complete
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

      {/* Horizontal Phase Overview */}
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

          <div className="mt-16 flex flex-col items-center gap-6 md:flex-row md:gap-0">
            {phases.map((phase, index) => (
              <ScrollReveal key={phase.year} delay={index * 150} className="flex-1">
                <div className="rounded-2xl border border-border bg-background p-6 text-center transition-shadow hover:shadow-lg">
                  <div
                    className="mx-auto mb-4 h-1.5 w-full rounded-full"
                    style={{ backgroundColor: phase.color }}
                  />
                  <p className="font-serif text-4xl font-semibold">
                    <span className="brand-gradient-text">{phase.year}</span>
                  </p>
                  <h3 className="mt-2 font-serif text-lg font-semibold text-foreground">
                    {phase.label}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {phase.description}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>

          {/* Arrows between phases (desktop only) */}
          <div className="mt-8 hidden items-center justify-center gap-0 md:flex">
            <div className="flex-1 text-center">
              <p className="text-xs font-medium text-muted-foreground">Substack + Research</p>
            </div>
            <span className="text-2xl text-muted-foreground">{"\u2192"}</span>
            <div className="flex-1 text-center">
              <p className="text-xs font-medium text-muted-foreground">Book + App Dev</p>
            </div>
            <span className="text-2xl text-muted-foreground">{"\u2192"}</span>
            <div className="flex-1 text-center">
              <p className="text-xs font-medium text-muted-foreground">App Launch + Expansion</p>
            </div>
          </div>
        </div>
      </section>

      {/* Gradient divider */}
      <div className="section-divider" />

      {/* Substack Timeline */}
      <TimelineSection
        label="Substack"
        labelColor="var(--icon-lime)"
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
        heading="EatoBiotics -- The Guide"
        icon={BookOpen}
        milestones={bookMilestones}
      />

      {/* Gradient divider */}
      <div className="section-divider" />

      {/* App Timeline */}
      <TimelineSection
        label="The App"
        labelColor="var(--icon-orange)"
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
              Every chapter, every feature, every milestone -- shared first with
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
