import type { Metadata } from "next"
import Image from "next/image"
import { ScrollReveal } from "@/components/scroll-reveal"
import { GradientText } from "@/components/gradient-text"
import { AudioWaveform } from "@/components/podcast/audio-waveform"
import { QuestionExplorer } from "@/components/podcast/question-explorer"
import { Mic, Play, ArrowUpRight, Quote, Sparkles } from "lucide-react"

export const metadata: Metadata = {
  title: "The Podcast",
  description:
    "EatoBiotics: The Food System Inside You \u2014 a video series and podcast interviewing the world\u2019s greatest minds in business, sport, and entertainment about what they eat, how they live, and the food habits behind their success.",
  openGraph: {
    title: "The Podcast \u2014 EatoBiotics | The Food System Inside You",
    description:
      "World-class conversations about food, health, and performance. Jason Curry interviews leaders in business, sport, and entertainment about the food habits behind their success.",
  },
}

/* ── Static data ─────────────────────────────────────────────────────── */

const guestCategories = [
  { label: "Business Leaders", color: "var(--icon-lime)" },
  { label: "Elite Athletes", color: "var(--icon-green)" },
  { label: "Entertainment", color: "var(--icon-teal)" },
  { label: "Scientists", color: "var(--icon-yellow)" },
  { label: "Chefs", color: "var(--icon-orange)" },
  { label: "Entrepreneurs", color: "var(--icon-lime)" },
  { label: "Musicians", color: "var(--icon-green)" },
  { label: "Coaches", color: "var(--icon-teal)" },
  { label: "Doctors", color: "var(--icon-yellow)" },
  { label: "Authors", color: "var(--icon-orange)" },
  { label: "Activists", color: "var(--icon-lime)" },
  { label: "Innovators", color: "var(--icon-green)" },
]

const archetypes = [
  {
    emoji: "\uD83D\uDC54",
    scenario:
      "The CEO who eats the same breakfast every day for 15 years \u2014 and swears it\u2019s the secret to his clarity.",
    category: "Business",
    gradient: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))",
    accent: "var(--icon-lime)",
  },
  {
    emoji: "\uD83C\uDFCA",
    scenario:
      "The Olympic swimmer who credits fermented foods for cutting her recovery time in half.",
    category: "Sport",
    gradient: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))",
    accent: "var(--icon-green)",
  },
  {
    emoji: "\uD83E\uDDE0",
    scenario:
      "The neuroscientist who reversed his brain fog by rebuilding his microbiome from scratch.",
    category: "Science",
    gradient: "linear-gradient(135deg, var(--icon-teal), var(--icon-yellow))",
    accent: "var(--icon-teal)",
  },
  {
    emoji: "\uD83C\uDFB5",
    scenario:
      "The Grammy-winning musician who traces every great performance back to what she ate that morning.",
    category: "Entertainment",
    gradient: "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange))",
    accent: "var(--icon-yellow)",
  },
]

const platforms = [
  { label: "YouTube", status: "Coming 2026" },
  { label: "Spotify", status: "Coming 2026" },
  { label: "Apple Podcasts", status: "Coming 2026" },
  { label: "Substack", status: "Coming 2026" },
]

const quotes = [
  {
    text: "Let food be thy medicine and medicine be thy food.",
    author: "Hippocrates",
    year: "c.\u00A0400\u00A0BC",
    gradient: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))",
  },
  {
    text: "One cannot think well, love well, sleep well, if one has not dined well.",
    author: "Virginia Woolf",
    year: "1929",
    gradient: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))",
  },
  {
    text: "Man is what he eats.",
    author: "Ludwig Feuerbach",
    year: "1863",
    gradient: "linear-gradient(135deg, var(--icon-teal), var(--icon-yellow))",
  },
  {
    text: "There is no love sincerer than the love of food.",
    author: "George Bernard Shaw",
    year: "1903",
    gradient: "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange))",
  },
  {
    text: "The belly rules the mind.",
    author: "Spanish Proverb",
    year: "",
    gradient: "linear-gradient(135deg, var(--icon-orange), var(--icon-yellow))",
  },
  {
    text: "The discovery of a new dish does more for human happiness than the discovery of a star.",
    author: "Brillat-Savarin",
    year: "1825",
    gradient: "linear-gradient(135deg, var(--icon-lime), var(--icon-teal))",
  },
]

/* ── Static waveform bars for episode preview ────────────────────────── */

const episodeWaveform = Array.from({ length: 80 }, (_, i) => {
  const t = i / 80
  return Math.max(
    0.15,
    Math.min(
      0.95,
      0.35 +
        0.25 * Math.sin(t * Math.PI * 3) +
        0.15 * Math.sin(t * Math.PI * 7 + 2) +
        0.1 * Math.cos(t * Math.PI * 5),
    ),
  )
})

/* ── Page ─────────────────────────────────────────────────────────────── */

export default function PodcastPage() {
  return (
    <>
      {/* ═══════════════════════ HERO ═══════════════════════════════════ */}
      <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 pt-20 pb-16">
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
            <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2">
              <span className="h-2 w-2 animate-pulse rounded-full bg-icon-orange" />
              <p className="text-xs font-semibold uppercase tracking-widest text-icon-orange">
                The Podcast &mdash; Coming 2026
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={200}>
            <h1 className="mt-6 font-serif text-5xl font-semibold tracking-tight text-foreground sm:text-6xl md:text-7xl lg:text-8xl text-balance">
              The food system{" "}
              <GradientText>inside you.</GradientText>
            </h1>
          </ScrollReveal>

          <ScrollReveal delay={300}>
            <p className="mt-6 font-serif text-xl font-medium text-foreground sm:text-2xl">
              Hosted by Jason Curry.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={400}>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
              The world&apos;s greatest minds in business, sport, and
              entertainment &mdash; sitting down to talk about what they eat, how
              they live, and the food habits behind their extraordinary lives.
              One conversation. One plate. One story at a time.
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
                Get notified at launch
                <ArrowUpRight size={16} />
              </a>
              <a
                href="/about"
                className="inline-flex items-center gap-2 rounded-full border-2 border-icon-green px-8 py-4 text-base font-semibold text-foreground transition-colors hover:bg-icon-green hover:text-white"
              >
                Meet Jason
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

          {/* Animated waveform — instantly signals "podcast" */}
          <ScrollReveal delay={700}>
            <div className="mt-8">
              <AudioWaveform />
            </div>
          </ScrollReveal>
        </div>
      </section>

      <div className="section-divider" />

      {/* ═══════════════ THE TABLE — Visual Centrepiece ═════════════════ */}
      <section className="bg-foreground px-6 py-24 md:py-32">
        <div className="mx-auto max-w-[900px]">
          <ScrollReveal>
            <div className="mb-12 flex items-center justify-center gap-8 sm:gap-16">
              {/* Host mic */}
              <div className="flex flex-col items-center gap-3">
                <div
                  className="flex h-16 w-16 items-center justify-center rounded-2xl shadow-lg sm:h-20 sm:w-20"
                  style={{
                    background:
                      "linear-gradient(135deg, var(--icon-lime), var(--icon-green))",
                  }}
                >
                  <Mic size={28} className="text-white" />
                </div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-background/50 sm:text-xs">
                  Host
                </p>
              </div>

              {/* Connecting line — "the table" */}
              <div className="max-w-[200px] flex-1">
                <div className="h-[2px] rounded-full brand-gradient" />
                <div className="mt-3 flex justify-center">
                  <div className="h-1.5 w-1.5 rounded-full bg-icon-teal opacity-60" />
                </div>
              </div>

              {/* Guest mic */}
              <div className="flex flex-col items-center gap-3">
                <div
                  className="flex h-16 w-16 items-center justify-center rounded-2xl shadow-lg sm:h-20 sm:w-20"
                  style={{
                    background:
                      "linear-gradient(135deg, var(--icon-orange), var(--icon-yellow))",
                  }}
                >
                  <Mic size={28} className="text-white" />
                </div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-background/50 sm:text-xs">
                  Guest
                </p>
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={100}>
            <blockquote className="text-center font-serif text-3xl font-semibold leading-tight text-background sm:text-4xl md:text-5xl text-balance">
              Every conversation starts{" "}
              <span className="brand-gradient-text">at the table.</span>
            </blockquote>
            <p className="mx-auto mt-6 max-w-lg text-center text-base leading-relaxed text-background/60">
              One host. One guest. One question: what do you eat, and why? The
              simplest question reveals the most extraordinary stories.
            </p>
          </ScrollReveal>
        </div>
      </section>

      <div className="section-divider" />

      {/* ═══════════════════ THE CONCEPT ════════════════════════════════ */}
      <section className="px-6 py-24 md:py-32">
        <div className="mx-auto max-w-[680px]">
          <ScrollReveal>
            <p className="text-xs font-semibold uppercase tracking-widest text-icon-green">
              The Concept
            </p>
            <h2 className="mt-4 font-serif text-4xl font-semibold text-foreground sm:text-5xl text-balance">
              Everyone eats.{" "}
              <GradientText>Not everyone thinks about it.</GradientText>
            </h2>
          </ScrollReveal>
          <ScrollReveal delay={100}>
            <p className="mt-8 text-base leading-relaxed text-foreground md:text-lg">
              The most successful people in the world have one thing in common
              &mdash; they perform at an extraordinary level, consistently, over
              time. Behind that performance is a body that functions well. And
              behind that body is food.
            </p>
          </ScrollReveal>
          <ScrollReveal delay={200}>
            <p className="mt-6 text-base leading-relaxed text-foreground md:text-lg">
              EatoBiotics: The Food System Inside You brings together world-class
              guests &mdash; CEOs, Olympic athletes, musicians, scientists,
              chefs, entertainers &mdash; to explore one of the most personal
              and universal questions there is: what do you eat, and why?
            </p>
          </ScrollReveal>
          <ScrollReveal delay={300}>
            <p className="mt-6 text-base leading-relaxed text-foreground md:text-lg">
              Not a nutrition show. Not a diet debate. A human conversation about
              the food that shaped them, sustains them, and connects them to the
              world around them.
            </p>
          </ScrollReveal>
          <ScrollReveal delay={400}>
            <blockquote className="mt-10 border-l-4 border-icon-green pl-6">
              <p className="font-serif text-xl font-medium italic text-icon-green md:text-2xl">
                &ldquo;Tell me what you eat, and I&apos;ll tell you who you
                are.&rdquo;
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                &mdash; Jean Anthelme Brillat-Savarin, 1825
              </p>
            </blockquote>
          </ScrollReveal>
        </div>
      </section>

      <div className="section-divider" />

      {/* ═══════════════ THE CONVERSATIONS — Interactive ════════════════ */}
      <section className="px-6 py-24 md:py-32">
        <div className="mx-auto max-w-[1200px]">
          <ScrollReveal className="mb-12 text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-icon-teal">
              The Conversations
            </p>
            <h2 className="mt-4 font-serif text-4xl font-semibold text-foreground sm:text-5xl text-balance">
              Four themes.{" "}
              <GradientText>Every episode.</GradientText>
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-base text-muted-foreground">
              Every guest, every story, every episode is anchored in the same
              four territories. Click a theme to explore the questions.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={100}>
            <QuestionExplorer />
          </ScrollReveal>
        </div>
      </section>

      <div className="section-divider" />

      {/* ═══════════════ EPISODE PREVIEW — Mock Player ═════════════════ */}
      <section className="px-6 py-24 md:py-32">
        <div className="mx-auto max-w-[800px]">
          <ScrollReveal className="mb-12 text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-icon-yellow">
              Episode Preview
            </p>
            <h2 className="mt-4 font-serif text-4xl font-semibold text-foreground sm:text-5xl text-balance">
              What every episode{" "}
              <GradientText>looks like.</GradientText>
            </h2>
          </ScrollReveal>

          <ScrollReveal delay={100}>
            <div className="relative overflow-hidden rounded-3xl border-2 border-border bg-background shadow-2xl">
              {/* Top gradient bar */}
              <div className="h-2 brand-gradient" />

              <div className="p-5 sm:p-8">
                {/* Episode header */}
                <div className="flex items-start gap-4 sm:gap-5">
                  {/* Album art */}
                  <div
                    className="relative flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-2xl shadow-lg sm:h-28 sm:w-28"
                    style={{
                      background:
                        "linear-gradient(135deg, var(--icon-lime), var(--icon-teal))",
                    }}
                  >
                    <Image
                      src="/eatobiotics-icon.webp"
                      alt="EatoBiotics"
                      width={60}
                      height={60}
                      className="h-10 w-10 sm:h-14 sm:w-14"
                    />
                    <div className="absolute -right-1.5 -bottom-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-foreground shadow-lg sm:h-9 sm:w-9">
                      <Play
                        size={14}
                        className="ml-0.5 text-background"
                        fill="currentColor"
                      />
                    </div>
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-icon-orange sm:text-xs">
                      Episode 01 &middot; Coming 2026
                    </p>
                    <h3 className="mt-1 font-serif text-lg font-semibold text-foreground sm:text-2xl">
                      The Food System Inside You
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                      Hosted by Jason Curry
                    </p>
                  </div>
                </div>

                {/* Waveform / progress bar */}
                <div className="mt-6">
                  <div className="relative flex h-10 w-full items-center gap-[1.5px] overflow-hidden rounded-lg bg-secondary/30 px-1 sm:h-12">
                    {episodeWaveform.map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-full"
                        style={{
                          height: `${h * 100}%`,
                          background:
                            i < 24
                              ? "linear-gradient(to top, var(--icon-lime), var(--icon-teal))"
                              : "var(--border)",
                        }}
                      />
                    ))}
                  </div>
                  <div className="mt-2 flex justify-between text-[11px] text-muted-foreground">
                    <span>12:34</span>
                    <span>1:08:45</span>
                  </div>
                </div>

                {/* Theme tags */}
                <div className="mt-4 flex flex-wrap gap-2">
                  {[
                    {
                      label: "What They Eat",
                      gradient:
                        "linear-gradient(135deg, var(--icon-lime), var(--icon-green))",
                    },
                    {
                      label: "How They Feel",
                      gradient:
                        "linear-gradient(135deg, var(--icon-green), var(--icon-teal))",
                    },
                    {
                      label: "Where They Grew Up",
                      gradient:
                        "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange))",
                    },
                    {
                      label: "What They\u2019ve Learned",
                      gradient:
                        "linear-gradient(135deg, var(--icon-teal), var(--icon-yellow))",
                    },
                  ].map((tag) => (
                    <span
                      key={tag.label}
                      className="rounded-full px-3 py-1 text-[11px] font-semibold text-white"
                      style={{ background: tag.gradient }}
                    >
                      {tag.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <div className="section-divider" />

      {/* ═══════════════ THE GUESTS — Archetypes + Host + Pills ════════ */}
      <section className="bg-secondary/40 px-6 py-24 md:py-32">
        <div className="mx-auto max-w-[1200px]">
          <ScrollReveal className="text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-icon-orange">
              The Guests
            </p>
            <h2 className="mt-4 font-serif text-4xl font-semibold text-foreground sm:text-5xl text-balance">
              The world&apos;s greatest{" "}
              <GradientText>minds and plates.</GradientText>
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-base text-muted-foreground">
              No single field, no single background. Every guest has reached the
              top of their world &mdash; and they eat to get there.
            </p>
          </ScrollReveal>

          {/* Guest archetype scenario cards */}
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {archetypes.map((a, i) => (
              <ScrollReveal key={a.category} delay={i * 80}>
                <div className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-background p-6 transition-all hover:shadow-lg">
                  <div
                    className="absolute top-0 right-0 left-0 h-1"
                    style={{ background: a.gradient }}
                  />
                  <span className="text-4xl">{a.emoji}</span>
                  <p
                    className="mt-3 text-[10px] font-semibold uppercase tracking-widest"
                    style={{ color: a.accent }}
                  >
                    {a.category}
                  </p>
                  <p className="mt-2 flex-1 text-sm font-medium leading-relaxed text-foreground italic">
                    &ldquo;{a.scenario}&rdquo;
                  </p>
                  <div
                    className="mt-4 h-1.5 w-12 rounded-full"
                    style={{ background: a.gradient }}
                  />
                </div>
              </ScrollReveal>
            ))}
          </div>

          {/* Category pills */}
          <ScrollReveal delay={200}>
            <div className="mt-12 flex flex-wrap justify-center gap-2.5">
              {guestCategories.map((cat) => (
                <span
                  key={cat.label}
                  className="rounded-full border px-4 py-2 text-sm font-semibold transition-colors"
                  style={{ borderColor: cat.color, color: cat.color }}
                >
                  {cat.label}
                </span>
              ))}
            </div>
          </ScrollReveal>

          {/* Host spotlight card */}
          <ScrollReveal delay={300}>
            <div className="mx-auto mt-16 max-w-[600px]">
              <div className="relative overflow-hidden rounded-2xl border border-border bg-background p-6 sm:p-8">
                <div
                  className="absolute top-0 right-0 left-0 h-1.5"
                  style={{
                    background:
                      "linear-gradient(135deg, var(--icon-lime), var(--icon-orange))",
                  }}
                />
                <div className="flex flex-col items-center text-center sm:flex-row sm:items-start sm:gap-6 sm:text-left">
                  {/* Host icon */}
                  <div
                    className="mb-4 flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-2xl shadow-lg sm:mb-0"
                    style={{
                      background:
                        "linear-gradient(135deg, var(--icon-lime), var(--icon-orange))",
                    }}
                  >
                    <Mic size={32} className="text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-icon-lime">
                      Your Host
                    </p>
                    <h3 className="mt-1 font-serif text-2xl font-semibold text-foreground">
                      Jason Curry
                    </h3>
                    <p className="mt-1 text-sm font-medium text-muted-foreground">
                      Founder, EatoBiotics &amp; EatoSystem
                    </p>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                      Jason built EatoBiotics to answer a question he
                      couldn&apos;t stop asking: what do extraordinary people
                      eat, and how does food shape who they become? The podcast
                      is the next chapter of that question &mdash; live, in
                      conversation.
                    </p>
                    <a
                      href="/about"
                      className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-icon-green transition-colors hover:text-icon-orange"
                    >
                      Read Jason&apos;s story
                      <ArrowUpRight size={14} />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <div className="section-divider" />

      {/* ═══════════════════ QUOTE WALL ═════════════════════════════════ */}
      <section className="px-6 py-24 md:py-32">
        <div className="mx-auto max-w-[1200px]">
          <ScrollReveal className="mb-12 text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-icon-green">
              The Voices
            </p>
            <h2 className="mt-4 font-serif text-4xl font-semibold text-foreground sm:text-5xl text-balance">
              Wisdom that{" "}
              <GradientText>shaped a podcast.</GradientText>
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-base text-muted-foreground">
              Centuries of thinkers arrived at the same truth: food is
              everything. These ideas are the foundation of every conversation.
            </p>
          </ScrollReveal>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {quotes.map((q, i) => (
              <ScrollReveal key={q.author + q.year} delay={i * 60}>
                <div className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-background p-6 transition-all hover:shadow-lg">
                  <div
                    className="absolute bottom-0 left-0 top-0 w-1"
                    style={{ background: q.gradient }}
                  />
                  <Quote
                    size={20}
                    className="mb-3 flex-shrink-0 text-muted-foreground/30"
                  />
                  <p className="flex-1 pl-1 font-serif text-base font-medium leading-relaxed text-foreground italic sm:text-lg">
                    &ldquo;{q.text}&rdquo;
                  </p>
                  <div className="mt-4 pl-1">
                    <p className="text-sm font-semibold text-foreground">
                      {q.author}
                    </p>
                    {q.year && (
                      <p className="text-xs text-muted-foreground">{q.year}</p>
                    )}
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* ═══════════════════ THE FORMAT ═════════════════════════════════ */}
      <section className="px-6 py-24 md:py-32">
        <div className="mx-auto max-w-[1200px]">
          <ScrollReveal className="text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-icon-yellow">
              The Format
            </p>
            <h2 className="mt-4 font-serif text-4xl font-semibold text-foreground sm:text-5xl text-balance">
              Video. Audio.{" "}
              <GradientText>Everywhere.</GradientText>
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-base text-muted-foreground">
              Filmed as a long-form video conversation and released across every
              major audio and video platform. Watch it, listen to it, share it.
            </p>
          </ScrollReveal>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {platforms.map((platform, index) => (
              <ScrollReveal key={platform.label} delay={index * 100}>
                <div className="relative overflow-hidden rounded-2xl border border-border bg-background p-6 text-center transition-shadow hover:shadow-lg">
                  <div className="absolute top-0 right-0 left-0 h-1 brand-gradient" />
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-secondary">
                    <Play size={20} className="text-muted-foreground" />
                  </div>
                  <h3 className="font-serif text-lg font-semibold text-foreground">
                    {platform.label}
                  </h3>
                  <p className="mt-1 text-xs font-medium text-icon-orange">
                    {platform.status}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* ═══════════════ CTA — Newsletter Signup ═══════════════════════ */}
      <section className="bg-foreground px-6 py-24 md:py-32">
        <div className="mx-auto max-w-[720px] text-center">
          <ScrollReveal>
            <div
              className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl shadow-lg"
              style={{
                background:
                  "linear-gradient(135deg, var(--icon-lime), var(--icon-orange))",
              }}
            >
              <Sparkles size={28} className="text-white" />
            </div>
            <h2 className="font-serif text-3xl font-semibold text-background sm:text-4xl md:text-5xl text-balance">
              Be first to hear{" "}
              <span className="brand-gradient-text">every conversation.</span>
            </h2>
          </ScrollReveal>
          <ScrollReveal delay={100}>
            <p className="mx-auto mt-6 max-w-lg text-base leading-relaxed text-background/60">
              The podcast launches in 2026. Subscribe to the EatoBiotics
              Substack to be notified the moment the first episode drops &mdash;
              and to follow the journey as it&apos;s built.
            </p>
          </ScrollReveal>
          <ScrollReveal delay={200}>
            <div className="mt-10 flex flex-col items-center gap-4">
              <a
                href="https://eatobiotics.substack.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border-2 border-icon-green bg-icon-green px-8 py-4 text-base font-semibold text-white shadow-lg shadow-icon-green/30 transition-all hover:bg-icon-green/90 hover:shadow-xl"
              >
                Subscribe on Substack
                <ArrowUpRight size={16} />
              </a>
              <a
                href="/roadmap"
                className="inline-flex items-center gap-2 rounded-full border border-background/20 px-8 py-4 text-base font-semibold text-background/80 transition-colors hover:border-background/40 hover:text-background"
              >
                See the full roadmap
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
