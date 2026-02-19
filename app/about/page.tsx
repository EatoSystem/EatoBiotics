import type { Metadata } from "next"
import Image from "next/image"
import { ScrollReveal } from "@/components/scroll-reveal"
import { GradientText } from "@/components/gradient-text"
import { ArrowUpRight } from "lucide-react"

export const metadata: Metadata = {
  title: "About",
  description:
    "Meet Jason, the founder of EatoBiotics. Nearly 50, never healthier — built from a weekly lunch plate, an 18-hour fasting window, a decade of daily breathwork, and 10,000 steps.",
  openGraph: {
    title: "About — EatoBiotics | The Food System Inside You",
    description:
      "The story behind EatoBiotics: how one person's daily practice became a framework for rebuilding your gut health — and eventually a vision for transforming Ireland's food system.",
  },
}

const practiceCards = [
  {
    number: "01",
    title: "The Weekly Lunch Plate",
    label: "EAT",
    accent: "var(--icon-green)",
    body: "I eat the same lunch every day for a week, then rotate to a new plate the following week. One build decision per week. Five days of consistency. Then change. Consistency builds depth in specific bacterial populations. Weekly rotation builds diversity across the whole microbiome.",
  },
  {
    number: "02",
    title: "Varied Evening Meals",
    label: "DIVERSIFY",
    accent: "var(--icon-green)",
    body: "Dinner is different every night. No tracking, no logging, no pressure. Different plant families, different proteins, different cuisines. The lunch plate carries all the structure. Dinner carries all the freedom. Together they give my gut both depth and breadth.",
  },
  {
    number: "03",
    title: "The Fasting Window",
    label: "REST",
    accent: "var(--icon-yellow)",
    body: "I eat between roughly 1–2pm and 7pm. That's an 18–19 hour fast every day. My gut's \"cleaning wave\" — the migrating motor complex — only activates during fasting. I get 3–4 full cycles in that window. It's not restriction. It's giving my gut time to clean up and my bacteria time to produce.",
  },
  {
    number: "04",
    title: "The Morning Practice",
    label: "BREATHE",
    accent: "var(--icon-orange)",
    body: "Every morning for nearly ten years — without missing a day — I do a 20+ minute waking meditation. 36 deep breaths in and out through the nose. Then a breath hold — four minutes on average. Three rounds. That's 12+ minutes of controlled oxygen deprivation that has profoundly strengthened my vagus nerve — the direct line between my brain and my gut. Then I finish with a shower ending in two minutes of ice-cold water.",
  },
  {
    number: "05",
    title: "The Walk",
    label: "MOVE",
    accent: "var(--icon-orange)",
    body: "10,000+ steps every day. Outside, moving through the world. It stimulates gut motility, reduces inflammation, and reinforces the parasympathetic state my morning practice initiated. It requires nothing except the decision to move.",
  },
]

const journeyCards = [
  {
    year: "2015",
    title: "The Practice",
    accent: "var(--icon-lime)",
    body: "Started the daily waking meditation, breathwork, and cold exposure protocol. Nearly ten years without missing a single day.",
  },
  {
    year: "2025",
    title: "The Foundation",
    accent: "var(--icon-green)",
    body: "Began developing the 3 Biotics framework, the EatoBiotics Plate, and the Substack. Started writing the book.",
  },
  {
    year: "2026",
    title: "The Build",
    accent: "var(--icon-yellow)",
    body: "Publishing the book, launching the app, starting the podcast, and growing the community. Building the tools that make this accessible to everyone.",
  },
  {
    year: "2027+",
    title: "The System",
    accent: "var(--icon-orange)",
    body: "EatoSystem launches across Ireland's 32 counties. The personal framework meets the systemic transformation. Seeded in Ireland. Harvested globally.",
  },
]

export default function AboutPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 pt-20 pb-20">
        {/* Floating background pills — matches homepage hero */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div
            className="absolute -top-2 left-[5%] h-5 w-44 rotate-[-35deg] rounded-full opacity-20"
            style={{ background: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))" }}
          />
          <div
            className="absolute top-[8%] right-[6%] h-5 w-36 rotate-[25deg] rounded-full opacity-15"
            style={{ background: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))" }}
          />
          <div
            className="absolute top-[25%] left-[10%] h-6 w-28 rotate-[55deg] rounded-full opacity-15"
            style={{ background: "linear-gradient(135deg, var(--icon-teal), var(--icon-green))" }}
          />
          <div
            className="absolute bottom-[20%] left-[2%] h-5 w-32 rotate-[40deg] rounded-full opacity-15"
            style={{ background: "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange))" }}
          />
          <div
            className="absolute bottom-[8%] right-[4%] h-5 w-48 rotate-[-20deg] rounded-full opacity-20"
            style={{ background: "linear-gradient(135deg, var(--icon-orange), var(--icon-yellow))" }}
          />
          <div
            className="absolute top-[55%] right-[15%] h-6 w-24 rotate-[60deg] rounded-full opacity-15"
            style={{ background: "linear-gradient(135deg, var(--icon-lime), var(--icon-teal))" }}
          />
          <div className="absolute top-[18%] left-[16%] h-8 w-8 rounded-full bg-icon-lime opacity-15" />
          <div className="absolute top-[40%] right-[10%] h-6 w-6 rounded-full bg-icon-orange opacity-15" />
          <div className="absolute bottom-[30%] right-[20%] h-9 w-9 rounded-full bg-icon-yellow opacity-10" />
          <div className="absolute bottom-[22%] left-[18%] h-5 w-5 rounded-full bg-icon-teal opacity-15" />
          <div className="absolute top-[65%] left-[8%] h-7 w-7 rounded-full bg-icon-green opacity-10" />
          <div className="absolute top-[12%] right-[30%] h-4 w-4 rounded-full bg-icon-lime opacity-15" />
        </div>

        <div className="relative z-10 mx-auto flex max-w-[760px] flex-col items-center text-center">
          <ScrollReveal>
            <Image
              src="/eatobiotics-icon.webp"
              alt="EatoBiotics"
              width={200}
              height={200}
              priority
              className="h-24 w-24 sm:h-28 sm:w-28 md:h-32 md:w-32"
            />
          </ScrollReveal>

          <ScrollReveal delay={100}>
            <p className="mt-8 text-xs font-semibold uppercase tracking-widest text-icon-green">
              About
            </p>
          </ScrollReveal>

          <ScrollReveal delay={200}>
            <h1 className="mt-4 font-serif text-5xl font-semibold tracking-tight text-foreground sm:text-6xl md:text-7xl lg:text-8xl text-balance">
              The food system{" "}
              <GradientText>inside you</GradientText>{" "}
              is broken.
            </h1>
          </ScrollReveal>

          <ScrollReveal delay={300}>
            <p className="mt-6 font-serif text-xl font-medium text-foreground sm:text-2xl">
              Here&apos;s how to rebuild it.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={400}>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
              I&apos;m Jason — founder of EatoBiotics and EatoSystem. Nearly 50, never healthier.
              Built from a weekly lunch plate, an 18-hour fast, a decade of daily breathwork,
              and 10,000 steps. No shortcuts. No supplements. Just a system that works.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={500}>
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
              <a
                href="#story"
                className="brand-gradient rounded-full px-8 py-4 text-base font-semibold text-white shadow-lg shadow-icon-green/20 transition-all hover:shadow-xl hover:shadow-icon-green/30 hover:opacity-90"
              >
                Read the story
              </a>
              <a
                href="https://eatobiotics.substack.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border-2 border-icon-green px-8 py-4 text-base font-semibold text-foreground transition-colors hover:bg-icon-green hover:text-white"
              >
                Subscribe
              </a>
            </div>
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

      {/* The Story */}
      <section id="story" className="px-6 py-24 md:py-32">
        <div className="mx-auto max-w-[680px]">
          <ScrollReveal>
            <p className="text-base leading-relaxed text-foreground md:text-lg">
              I&apos;m Jason. I&apos;m nearly 50. I look considerably younger than that, and I&apos;ve never been healthier. Not because I found some secret or bought some supplement — but because I stopped outsourcing my health to a food system that wasn&apos;t designed to feed me well.
            </p>
          </ScrollReveal>
          <ScrollReveal delay={100}>
            <p className="mt-6 text-base leading-relaxed text-foreground md:text-lg">
              I started asking a simple question: what&apos;s actually happening inside my body when I eat? Not the calories. Not the macros. The living ecosystem — the trillions of microorganisms that digest my food, produce my vitamins, regulate my immunity, and influence my mood every single day.
            </p>
          </ScrollReveal>
          <ScrollReveal delay={200}>
            <p className="mt-6 text-base leading-relaxed text-foreground md:text-lg">
              What I found changed how I eat, how I think about food, and eventually led me to build everything you see here.
            </p>
          </ScrollReveal>
          <ScrollReveal delay={300}>
            <blockquote className="mt-10 border-l-4 border-icon-green pl-6">
              <p className="font-serif text-xl font-medium italic text-icon-green md:text-2xl">
                &ldquo;I didn&apos;t need a new diet. I needed to understand the food system inside me — and then feed it properly.&rdquo;
              </p>
            </blockquote>
          </ScrollReveal>

          {/* TODO: Add personal photo — Jason in kitchen, on walk, or with food */}
          <ScrollReveal delay={400}>
            <div className="mt-12 w-full rounded-2xl border border-border bg-muted" style={{ height: "280px" }} />
          </ScrollReveal>
        </div>
      </section>

      {/* Gradient divider */}
      <div className="section-divider" />

      {/* My Daily Practice */}
      <section className="px-6 py-24 md:py-32">
        <div className="mx-auto max-w-[1200px]">
          <ScrollReveal className="text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-icon-green">
              My Daily Practice
            </p>
            <h2 className="mt-4 font-serif text-4xl font-semibold text-foreground sm:text-5xl text-balance">
              Five pillars.{" "}
              <GradientText>Every day.</GradientText>
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-base text-muted-foreground">
              No extreme protocols. No supplements stack. No biohacking gadgets. Just rhythms — repeated with consistency for nearly a decade.
            </p>
          </ScrollReveal>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {practiceCards.map((card, index) => (
              <ScrollReveal key={card.number} delay={index * 100}>
                <div className="flex h-full flex-col rounded-2xl border border-border bg-background p-6 transition-shadow hover:shadow-lg">
                  <div
                    className="mb-4 h-1 w-full rounded-full"
                    style={{ backgroundColor: card.accent }}
                  />
                  <p
                    className="font-serif text-5xl font-bold"
                    style={{ color: card.accent }}
                  >
                    {card.number}
                  </p>
                  <p
                    className="mt-3 text-xs font-bold uppercase tracking-widest"
                    style={{ color: card.accent }}
                  >
                    {card.label}
                  </p>
                  <h3 className="mt-1 font-serif text-lg font-semibold text-foreground">
                    {card.title}
                  </h3>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">
                    {card.body}
                  </p>
                  <div
                    className="mt-6 h-0.5 w-full rounded-full opacity-30"
                    style={{ backgroundColor: card.accent }}
                  />
                </div>
              </ScrollReveal>
            ))}
          </div>

          <ScrollReveal delay={600}>
            <blockquote className="mx-auto mt-16 max-w-[680px] border-l-4 border-icon-orange pl-6">
              <p className="font-serif text-xl font-medium italic text-icon-orange md:text-2xl">
                &ldquo;The morning practice rewires the system. The walk maintains it. The plate feeds it. That&apos;s the whole thing.&rdquo;
              </p>
            </blockquote>
          </ScrollReveal>
        </div>
      </section>

      {/* Gradient divider */}
      <div className="section-divider" />

      {/* The Framework */}
      <section className="px-6 py-24 md:py-32">
        <div className="mx-auto max-w-[680px]">
          <ScrollReveal>
            <p className="text-xs font-semibold uppercase tracking-widest text-icon-teal">
              The Framework
            </p>
            <h2 className="mt-4 font-serif text-4xl font-semibold text-foreground sm:text-5xl text-balance">
              Feed. Add.{" "}
              <GradientText>Produce.</GradientText>
            </h2>
          </ScrollReveal>
          <ScrollReveal delay={100}>
            <p className="mt-8 text-base leading-relaxed text-foreground md:text-lg">
              Prebiotics feed your beneficial bacteria. Probiotics add living cultures to diversify them. And when you get those two right, your microbiome produces the things that actually make you feel better — short-chain fatty acids, vitamins, neurotransmitters. That&apos;s the 3 Biotics framework. Feed. Add. Produce.
            </p>
          </ScrollReveal>
          <ScrollReveal delay={200}>
            <p className="mt-6 text-base leading-relaxed text-foreground md:text-lg">
              The EatoBiotics Plate is the visual model that makes this practical. Four quadrants — Fiber Foundation, Quality Protein, Fermented Foods, and Healthy Fats — that you build once a week and eat for five days. It&apos;s the simplest possible expression of what your gut needs. And it&apos;s the tool I use myself, every week, to this day.
            </p>
          </ScrollReveal>
          <ScrollReveal delay={300}>
            <p className="mt-6 text-base leading-relaxed text-foreground md:text-lg">
              This framework became a book, a Substack, an app, and a podcast — not because I planned a brand, but because the ideas were too useful to keep to myself.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* Gradient divider */}
      <div className="section-divider" />

      {/* What I'm Building */}
      <section className="px-6 py-24 md:py-32">
        <div className="mx-auto max-w-[1200px]">
          <ScrollReveal className="max-w-[680px]">
            <p className="text-xs font-semibold uppercase tracking-widest text-icon-yellow">
              What I&apos;m Building
            </p>
            <h2 className="mt-4 font-serif text-4xl font-semibold text-foreground sm:text-5xl text-balance">
              Two ecosystems.{" "}
              <GradientText>One story.</GradientText>
            </h2>
          </ScrollReveal>
          <ScrollReveal delay={100}>
            <p className="mt-8 max-w-[680px] text-base leading-relaxed text-foreground md:text-lg">
              EatoBiotics is the personal framework — the tools to rebuild the food system inside you. But I realised that personal frameworks operate inside systems. The quality of the food available to you shapes how sustainable any of this is. If the food system keeps producing nutrient-depleted, heavily processed food as its default, every individual effort to eat well becomes harder.
            </p>
          </ScrollReveal>
          <ScrollReveal delay={200}>
            <p className="mt-6 max-w-[680px] text-base leading-relaxed text-foreground md:text-lg">
              That&apos;s why I&apos;m also building EatoSystem — Ireland&apos;s regenerative food transformation initiative. County by county, community by community, redesigning how food is grown, processed, and distributed so that the food system around you supports the food system inside you.
            </p>
          </ScrollReveal>

          <div className="mt-16 grid gap-6 md:grid-cols-2">
            {/* EatoBiotics card */}
            <ScrollReveal delay={100}>
              <div className="flex h-full flex-col rounded-2xl border border-border bg-background p-8 transition-shadow hover:shadow-lg">
                <div className="mb-4 h-1 w-full rounded-full bg-icon-green" />
                <p className="text-xs font-bold uppercase tracking-widest text-icon-green">
                  The Food System Inside You
                </p>
                <h3 className="mt-2 font-serif text-2xl font-semibold text-foreground">
                  EatoBiotics
                </h3>
                <p className="mt-4 flex-1 text-sm leading-relaxed text-muted-foreground">
                  The book, the plate, the app, the podcast, the Substack. Everything you need to rebuild your internal food system through the 3 Biotics framework.
                </p>
              </div>
            </ScrollReveal>

            {/* EatoSystem card */}
            <ScrollReveal delay={200}>
              <div className="flex h-full flex-col rounded-2xl border border-border bg-background p-8 transition-shadow hover:shadow-lg">
                <div className="mb-4 h-1 w-full rounded-full bg-icon-yellow" />
                <p className="text-xs font-bold uppercase tracking-widest text-icon-yellow">
                  The Food System Around You
                </p>
                <h3 className="mt-2 font-serif text-2xl font-semibold text-foreground">
                  EatoSystem
                </h3>
                <p className="mt-4 flex-1 text-sm leading-relaxed text-muted-foreground">
                  Ireland&apos;s regenerative food transformation. 32 counties. Local farmers, local knowledge, local food — rebuilding the external system so the internal one has something worthy to work with.
                </p>
              </div>
            </ScrollReveal>
          </div>

          <ScrollReveal delay={300}>
            <blockquote className="mt-16 border-l-4 border-icon-green pl-6">
              <p className="font-serif text-xl font-medium italic text-icon-green md:text-2xl">
                &ldquo;Build the food system inside you… and help build the food system around you.&rdquo;
              </p>
            </blockquote>
          </ScrollReveal>
        </div>
      </section>

      {/* Gradient divider */}
      <div className="section-divider" />

      {/* The Journey */}
      <section className="px-6 py-24 md:py-32">
        <div className="mx-auto max-w-[1200px]">
          <ScrollReveal className="text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-icon-lime">
              The Journey
            </p>
            <h2 className="mt-4 font-serif text-4xl font-semibold text-foreground sm:text-5xl text-balance">
              Where this is{" "}
              <GradientText>going.</GradientText>
            </h2>
          </ScrollReveal>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {journeyCards.map((card, index) => (
              <ScrollReveal key={card.year} delay={index * 120}>
                <div className="flex h-full flex-col rounded-2xl border border-border bg-background p-6 transition-shadow hover:shadow-lg">
                  <div
                    className="mb-4 h-1 w-full rounded-full"
                    style={{ backgroundColor: card.accent }}
                  />
                  <p className="font-serif text-4xl font-bold brand-gradient-text">
                    {card.year}
                  </p>
                  <h3 className="mt-2 font-serif text-lg font-semibold text-foreground">
                    {card.title}
                  </h3>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">
                    {card.body}
                  </p>
                </div>
              </ScrollReveal>
            ))}
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
              Start with{" "}
              <GradientText>your plate.</GradientText>
            </h2>
          </ScrollReveal>
          <ScrollReveal delay={100}>
            <p className="mx-auto mt-6 max-w-lg text-base leading-relaxed text-muted-foreground">
              Build your personal EatoBiotics Plate in 30 seconds, subscribe to the Substack for weekly insights, or explore the bigger vision.
            </p>
          </ScrollReveal>
          <ScrollReveal delay={200}>
            <div className="mt-10 flex flex-col items-center gap-4">
              <a
                href="/myplate"
                className="brand-gradient inline-flex items-center gap-2 rounded-full px-8 py-4 text-base font-semibold text-white shadow-lg shadow-icon-green/20 transition-all hover:shadow-xl hover:shadow-icon-green/30 hover:opacity-90"
              >
                Build Your Plate
                <ArrowUpRight size={16} />
              </a>
              <a
                href="https://eatobiotics.substack.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border-2 border-icon-green px-8 py-4 text-base font-semibold text-foreground transition-colors hover:bg-icon-green hover:text-white"
              >
                Subscribe on Substack
                <ArrowUpRight size={16} />
              </a>
              <a
                href="https://www.eatosystem.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-border px-8 py-4 text-base font-semibold text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
              >
                Explore EatoSystem
                <ArrowUpRight size={16} />
              </a>
            </div>
          </ScrollReveal>
          <ScrollReveal delay={300}>
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
