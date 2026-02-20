import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { ScrollReveal } from "@/components/scroll-reveal"
import { GradientText } from "@/components/gradient-text"
import { ArrowUpRight, Check } from "lucide-react"

export const metadata: Metadata = {
  title: "The Course",
  description:
    "The EatoBiotics Course — five modules, five pillars. The complete framework for rebuilding your gut health, turned into a structured online course with practical weekly actions.",
  openGraph: {
    title: "The Course — EatoBiotics",
    description: "Five modules. Five pillars. The complete EatoBiotics framework as a structured online course.",
  },
}

const modules = [
  {
    number: "01",
    title: "Understanding Your Microbiome",
    accent: "var(--icon-lime)",
    gradient: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))",
    duration: "4 lessons",
    description:
      "The foundations. What your microbiome is, why it matters, and how the 3 Biotics framework — prebiotics, probiotics, postbiotics — gives you a practical model to work with.",
    lessons: [
      "What is the microbiome and why does it matter",
      "The 3 Biotics framework explained",
      "How food becomes medicine in your gut",
      "Assessing your current gut health baseline",
    ],
  },
  {
    number: "02",
    title: "Building Your Plate",
    accent: "var(--icon-green)",
    gradient: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))",
    duration: "5 lessons",
    description:
      "The EatoBiotics Plate — how to build it, why it works, and how to make it sustainable week after week. The core practical skill of the entire framework.",
    lessons: [
      "The four quadrants of the EatoBiotics Plate",
      "Building your first plate — step by step",
      "How to rotate plates week by week for diversity",
      "Dinner freedom — how variety at night works",
      "Shopping, prep, and making it effortless",
    ],
  },
  {
    number: "03",
    title: "The Fasting Window",
    accent: "var(--icon-teal)",
    gradient: "linear-gradient(135deg, var(--icon-teal), var(--icon-yellow))",
    duration: "4 lessons",
    description:
      "The migrating motor complex, the cleaning wave, and why 18 hours of fasting every day is not restriction — it's giving your gut the time it needs to produce.",
    lessons: [
      "What happens in your gut when you stop eating",
      "The migrating motor complex explained",
      "How to find your fasting window",
      "Breaking the fast — what to eat and when",
    ],
  },
  {
    number: "04",
    title: "The Morning Practice",
    accent: "var(--icon-yellow)",
    gradient: "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange))",
    duration: "4 lessons",
    description:
      "The vagus nerve, the gut-brain axis, and why 20 minutes of breathwork every morning is the single most powerful thing you can do for your gut health — before you eat a thing.",
    lessons: [
      "The gut-brain axis and the vagus nerve",
      "The waking breathwork protocol — step by step",
      "Cold exposure and the parasympathetic state",
      "Building the habit — making it daily",
    ],
  },
  {
    number: "05",
    title: "The Walk and the System",
    accent: "var(--icon-orange)",
    gradient: "linear-gradient(135deg, var(--icon-orange), var(--icon-yellow))",
    duration: "3 lessons",
    description:
      "10,000 steps, gut motility, and how movement reinforces everything else. Plus — how to connect your personal food system to the food system around you.",
    lessons: [
      "Movement and gut health — the evidence",
      "Making 10,000 steps a non-negotiable",
      "Connecting your plate to the world around you",
    ],
  },
]

const included = [
  "5 modules, 20 lessons",
  "Practical weekly actions for each module",
  "The EatoBiotics Plate builder guide",
  "The complete breathwork protocol",
  "The food library — all foods explained",
  "Direct access to Jason during the cohort",
  "Community of fellow students",
  "Lifetime access to all materials",
]

export default function CoursePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 pt-20 pb-20">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-2 left-[5%] h-5 w-44 rotate-[-35deg] rounded-full opacity-20" style={{ background: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))" }} />
          <div className="absolute top-[8%] right-[6%] h-5 w-36 rotate-[25deg] rounded-full opacity-15" style={{ background: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))" }} />
          <div className="absolute top-[25%] left-[10%] h-6 w-28 rotate-[55deg] rounded-full opacity-15" style={{ background: "linear-gradient(135deg, var(--icon-teal), var(--icon-green))" }} />
          <div className="absolute bottom-[20%] left-[2%] h-5 w-32 rotate-[40deg] rounded-full opacity-15" style={{ background: "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange))" }} />
          <div className="absolute bottom-[8%] right-[4%] h-5 w-48 rotate-[-20deg] rounded-full opacity-20" style={{ background: "linear-gradient(135deg, var(--icon-orange), var(--icon-yellow))" }} />
          <div className="absolute top-[18%] left-[16%] h-8 w-8 rounded-full bg-icon-lime opacity-15" />
          <div className="absolute top-[40%] right-[10%] h-6 w-6 rounded-full bg-icon-orange opacity-15" />
        </div>

        <div className="relative z-10 mx-auto flex max-w-[760px] flex-col items-center text-center">
          <ScrollReveal>
            <Image src="/eatobiotics-icon.webp" alt="EatoBiotics" width={200} height={200} priority className="h-24 w-24 sm:h-28 sm:w-28 md:h-32 md:w-32" />
          </ScrollReveal>

          <ScrollReveal delay={100}>
            <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2">
              <span className="h-2 w-2 animate-pulse rounded-full bg-icon-orange" />
              <p className="text-xs font-semibold uppercase tracking-widest text-icon-orange">
                Coming 2026
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={200}>
            <h1 className="mt-6 font-serif text-5xl font-semibold tracking-tight text-foreground sm:text-6xl md:text-7xl lg:text-8xl text-balance">
              The{" "}
              <GradientText>EatoBiotics</GradientText>{" "}
              Course
            </h1>
          </ScrollReveal>

          <ScrollReveal delay={300}>
            <p className="mt-4 font-serif text-xl font-medium text-foreground sm:text-2xl">
              Five modules. Five pillars. One transformation.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={400}>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
              The complete EatoBiotics framework — the plate, the fast, the breathwork, the walk,
              and the system — turned into a structured online course with practical weekly actions,
              direct access to Jason, and a community of people doing the same work.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={500}>
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
              <a
                href="https://eatobiotics.substack.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="brand-gradient inline-flex items-center gap-2 rounded-full px-8 py-4 text-base font-semibold text-white shadow-lg shadow-icon-green/20 transition-all hover:shadow-xl hover:shadow-icon-green/30 hover:opacity-90"
              >
                Join the waitlist
                <ArrowUpRight size={16} />
              </a>
              <Link
                href="/waitlist"
                className="inline-flex items-center gap-2 rounded-full border-2 border-icon-green px-8 py-4 text-base font-semibold text-foreground transition-colors hover:bg-icon-green hover:text-white"
              >
                See all launches
              </Link>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">Free to join. Waitlist pricing guaranteed.</p>
          </ScrollReveal>

          <ScrollReveal delay={600}>
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

      {/* The 5 modules */}
      <section className="px-6 py-24 md:py-32">
        <div className="mx-auto max-w-[1200px]">
          <ScrollReveal>
            <p className="text-xs font-semibold uppercase tracking-widest text-icon-green">
              The Curriculum
            </p>
            <h2 className="mt-4 font-serif text-4xl font-semibold text-foreground sm:text-5xl text-balance">
              Five modules.{" "}
              <GradientText>Twenty lessons.</GradientText>
            </h2>
            <p className="mt-4 max-w-lg text-base text-muted-foreground">
              Each module covers one pillar of the daily practice — building on the last
              until you have a complete, sustainable system that works for you.
            </p>
          </ScrollReveal>

          <div className="mt-16 flex flex-col gap-6">
            {modules.map((module, index) => (
              <ScrollReveal key={module.number} delay={index * 80}>
                <div className="relative overflow-hidden rounded-2xl border border-border bg-background p-6 transition-shadow hover:shadow-lg md:p-8">
                  <div className="absolute top-0 left-0 right-0 h-1" style={{ background: module.gradient }} />

                  <div className="flex flex-col gap-6 md:flex-row md:gap-10">
                    {/* Left */}
                    <div className="md:w-[300px] md:shrink-0">
                      <div className="flex items-center gap-3">
                        <span className="font-serif text-5xl font-bold" style={{ color: module.accent }}>
                          {module.number}
                        </span>
                        <span
                          className="rounded-full px-2.5 py-1 text-xs font-semibold text-white"
                          style={{ background: module.gradient }}
                        >
                          {module.duration}
                        </span>
                      </div>
                      <h3 className="mt-3 font-serif text-xl font-semibold text-foreground">
                        {module.title}
                      </h3>
                      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                        {module.description}
                      </p>
                    </div>

                    {/* Right: lessons */}
                    <div className="flex-1">
                      <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                        Lessons
                      </p>
                      <ul className="flex flex-col gap-2">
                        {module.lessons.map((lesson) => (
                          <li key={lesson} className="flex items-start gap-2">
                            <Check size={14} className="mt-0.5 shrink-0" style={{ color: module.accent }} />
                            <span className="text-sm text-foreground">{lesson}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Gradient divider */}
      <div className="section-divider" />

      {/* What's included */}
      <section className="bg-secondary/40 px-6 py-24 md:py-32">
        <div className="mx-auto max-w-[1200px]">
          <div className="flex flex-col gap-16 lg:flex-row lg:items-center lg:gap-20">
            <div className="lg:w-[420px] lg:shrink-0">
              <ScrollReveal>
                <p className="text-xs font-semibold uppercase tracking-widest text-icon-orange">
                  What&apos;s Included
                </p>
                <h2 className="mt-4 font-serif text-4xl font-semibold text-foreground sm:text-5xl text-balance">
                  Everything you need.{" "}
                  <GradientText>Nothing you don&apos;t.</GradientText>
                </h2>
                <p className="mt-6 text-base leading-relaxed text-muted-foreground">
                  No upsells. No hidden extras. One price, everything included —
                  and lifetime access to all materials as they&apos;re updated.
                </p>
              </ScrollReveal>
              <ScrollReveal delay={150}>
                <div className="mt-8 rounded-2xl border border-border bg-background p-6 text-center">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Waitlist Price</p>
                  <p className="mt-2 font-serif text-5xl font-bold brand-gradient-text">€97</p>
                  <p className="mt-1 text-sm text-muted-foreground">Early bird — locked in for waitlist members</p>
                  <p className="mt-1 text-xs text-muted-foreground">(Full price €197 at launch)</p>
                  <a
                    href="https://eatobiotics.substack.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-6 block brand-gradient rounded-full px-6 py-3 text-sm font-semibold text-white transition-all hover:opacity-90"
                  >
                    Join to lock in this price
                  </a>
                </div>
              </ScrollReveal>
            </div>

            <div className="flex-1">
              <ScrollReveal delay={100}>
                <div className="grid gap-3 sm:grid-cols-2">
                  {included.map((item, index) => (
                    <div key={item} className="flex items-start gap-3 rounded-xl border border-border bg-background p-4">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full brand-gradient">
                        <Check size={12} className="text-white" />
                      </div>
                      <span className="text-sm font-medium text-foreground">{item}</span>
                    </div>
                  ))}
                </div>
              </ScrollReveal>
            </div>
          </div>
        </div>
      </section>

      {/* Gradient divider */}
      <div className="section-divider" />

      {/* CTA */}
      <section className="px-6 py-24 md:py-32">
        <div className="mx-auto max-w-[720px] text-center">
          <ScrollReveal>
            <h2 className="font-serif text-3xl font-semibold text-foreground sm:text-4xl md:text-5xl text-balance">
              Be first in.{" "}
              <GradientText>Pay less. Get more.</GradientText>
            </h2>
            <p className="mx-auto mt-6 max-w-lg text-base leading-relaxed text-muted-foreground">
              Waitlist members get the course at €97 — half the launch price of €197 —
              plus early access and direct access to Jason during the first cohort.
              Join the Substack to secure your place.
            </p>
          </ScrollReveal>
          <ScrollReveal delay={100}>
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <a
                href="https://eatobiotics.substack.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="brand-gradient inline-flex items-center gap-2 rounded-full px-8 py-4 text-base font-semibold text-white shadow-lg shadow-icon-green/20 transition-all hover:opacity-90"
              >
                Join the waitlist — it&apos;s free
                <ArrowUpRight size={16} />
              </a>
              <Link
                href="/waitlist"
                className="inline-flex items-center gap-2 rounded-full border border-border px-8 py-4 text-base font-semibold text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
              >
                See all launches
              </Link>
            </div>
          </ScrollReveal>
          <ScrollReveal delay={200}>
            <div className="mt-12 flex items-center justify-center gap-1.5">
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
