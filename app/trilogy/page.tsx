import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { ScrollReveal } from "@/components/scroll-reveal"
import { GradientText } from "@/components/gradient-text"
import { ArrowRight, ArrowUpRight, BookOpen } from "lucide-react"

export const metadata: Metadata = {
  title: "The Trilogy",
  description:
    "Three books. One complete system. EatoBiotics explores the food system inside you, inside your family, and inside your mind — a trilogy written for the way we actually live.",
  openGraph: {
    title: "The EatoBiotics Trilogy",
    description: "Three books. One complete system for food, health, and the people you love.",
  },
}

const BOOKS = [
  {
    number: "01",
    title: "EatoBiotics",
    subtitle: "The Food System Inside You",
    href: "/book",
    cover: "/book-cover-you.png",
    alt: "EatoBiotics: The Food System Inside You",
    accent: "var(--icon-lime)",
    gradient: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))",
    label: "The Foundation",
    tagline: "Start here. Understand yourself.",
    description:
      "The original EatoBiotics book. 25 chapters on the science and practice of prebiotics, probiotics, and postbiotics — and a complete framework for rebuilding your microbiome from the inside out. Written for anyone who wants to understand what's happening inside their body and build a food system that actually works.",
    chapters: 25,
    parts: 6,
    focus: "Your gut, your system, your health",
    cta: "Read Book 01",
  },
  {
    number: "02",
    title: "EatoBiotics",
    subtitle: "The Food System Inside Your Family",
    href: "/book-family",
    cover: "/book-cover-family.png",
    alt: "EatoBiotics: The Food System Inside Your Family",
    accent: "var(--icon-green)",
    gradient: "linear-gradient(135deg, var(--icon-lime), var(--icon-green), var(--icon-teal))",
    label: "The Household",
    tagline: "Bring the system home.",
    description:
      "Once you understand the system inside you, the natural next question is: how do I share it with the people I love? Book 02 takes the same framework and applies it to the whole household — from building a microbiome-friendly family kitchen to realistic strategies for children, busy weekdays, picky eaters, and eating together.",
    chapters: 25,
    parts: 6,
    focus: "Your home, your household, your people",
    cta: "Read Book 02",
  },
  {
    number: "03",
    title: "EatoBiotics",
    subtitle: "The Food System Inside Your Mind",
    href: "/book-mind",
    cover: "/book-cover-mind.png",
    alt: "EatoBiotics: The Food System Inside Your Mind",
    accent: "var(--icon-teal)",
    gradient: "linear-gradient(135deg, var(--icon-teal), var(--icon-green))",
    label: "The Mind",
    tagline: "Steadiness through food.",
    description:
      "The gut-brain connection is one of the most important and least understood areas of modern health. Book 03 applies the EatoBiotics framework to mental wellbeing — carefully and credibly. Not a replacement for professional care. A food-first approach to calm, clarity, mood stability, stress resilience, and recovery.",
    chapters: 25,
    parts: 6,
    focus: "Your gut-brain axis, your steadiness, your resilience",
    cta: "Read Book 03",
  },
]

export default function TrilogyPage() {
  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden px-6 pt-32 pb-20 md:pt-40 md:pb-28">
        {/* Radial glow */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 55% at 50% 0%, color-mix(in srgb, var(--icon-green) 8%, transparent), transparent 70%)",
          }}
        />

        <div className="relative mx-auto max-w-[720px] text-center">
          <ScrollReveal>
            <Image
              src="/eatobiotics-icon.webp"
              alt=""
              width={48}
              height={48}
              className="mx-auto mb-6 h-12 w-12"
            />
            <p className="text-xs font-semibold uppercase tracking-widest text-icon-green">
              The EatoBiotics Series
            </p>
            <h1 className="mt-4 font-serif text-5xl font-semibold tracking-tight text-foreground sm:text-6xl md:text-7xl text-balance">
              <GradientText>Three books.</GradientText>
              <br />
              One system.
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              EatoBiotics began as a framework for understanding your own microbiome. It became
              a trilogy — one book for you, one for your family, one for your mind. Each stands
              alone. Together they build something complete.
            </p>
          </ScrollReveal>

          {/* Three cover thumbnails */}
          <ScrollReveal delay={150}>
            <div className="mt-14 flex items-end justify-center gap-4 sm:gap-6">
              {BOOKS.map((book, i) => (
                <Link
                  key={book.number}
                  href={book.href}
                  className={`group relative overflow-hidden rounded-xl shadow-lg transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl ${
                    i === 1 ? "w-[110px] sm:w-[130px]" : "w-[90px] sm:w-[110px]"
                  }`}
                  style={{
                    boxShadow: i === 1
                      ? `0 8px 32px color-mix(in srgb, ${book.accent} 20%, transparent)`
                      : undefined,
                  }}
                >
                  <Image
                    src={book.cover}
                    alt={book.alt}
                    width={260}
                    height={347}
                    className="w-full h-auto"
                    priority
                  />
                  {/* Number badge */}
                  <div
                    className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold text-white"
                    style={{ background: book.accent }}
                  >
                    {book.number}
                  </div>
                </Link>
              ))}
            </div>
            <p className="mt-6 text-xs text-muted-foreground/60">
              All three books coming 2026 — follow on Substack
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* Gradient divider */}
      <div className="section-divider" />

      {/* ── The Story ────────────────────────────────────────────────────── */}
      <section className="px-6 py-16 md:py-24">
        <div className="mx-auto max-w-[720px]">
          <ScrollReveal>
            <p className="text-xs font-semibold uppercase tracking-widest text-icon-orange">
              Why a trilogy
            </p>
            <h2 className="mt-4 font-serif text-3xl font-semibold text-foreground sm:text-4xl text-balance">
              Food is never just about{" "}
              <GradientText>one person.</GradientText>
            </h2>
          </ScrollReveal>

          <div className="mt-8 space-y-6 text-base leading-relaxed text-muted-foreground">
            <ScrollReveal delay={80}>
              <p>
                The first book started with a single question: what is actually happening inside
                your gut, and why does it matter so much? The answer turned into 25 chapters
                covering the science of the microbiome, the 3 Biotics framework, and a complete
                practical system for rebuilding your food life from the inside out.
              </p>
            </ScrollReveal>
            <ScrollReveal delay={120}>
              <p>
                But food doesn&apos;t happen in isolation. You eat with your family. You cook for
                people you love. You worry about what your children eat, and whether you&apos;re
                building the right habits in your home. The second book takes the same framework
                and scales it to the household — without pretending that family life is simple
                or that children eat what you put in front of them.
              </p>
            </ScrollReveal>
            <ScrollReveal delay={160}>
              <p>
                The third book goes deeper into something harder to talk about. The gut-brain
                connection is real, well-documented, and profoundly underused in conversations
                about mental wellbeing. Book 03 approaches this carefully — it is not a
                self-help book, it does not replace professional support, and it does not
                overclaim. It is a food-first framework for steadiness, clarity, and recovery,
                built on the same foundation as everything else in the series.
              </p>
            </ScrollReveal>
            <ScrollReveal delay={200}>
              <p>
                Three books. The same 3 Biotics pillars. The same honesty about what food can
                and cannot do. One complete picture of how food shapes your health, your family,
                and your mind — written for real people living real lives.
              </p>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Gradient divider */}
      <div className="section-divider" />

      {/* ── The Three Books ───────────────────────────────────────────────── */}
      <section className="px-6 py-16 md:py-24">
        <div className="mx-auto max-w-[1100px]">
          <ScrollReveal>
            <p className="text-xs font-semibold uppercase tracking-widest text-icon-teal">
              The Series
            </p>
            <h2 className="mt-4 font-serif text-3xl font-semibold text-foreground sm:text-4xl">
              The three books
            </h2>
          </ScrollReveal>

          <div className="mt-10 flex flex-col gap-8">
            {BOOKS.map((book, i) => (
              <ScrollReveal key={book.number} delay={i * 80}>
                <div
                  className="group relative overflow-hidden rounded-3xl border border-border transition-all duration-300 hover:shadow-xl"
                  style={{
                    boxShadow: `0 0 0 0 transparent`,
                  }}
                >
                  {/* Gradient accent bar — top */}
                  <div
                    className="h-1 w-full"
                    style={{ background: book.gradient }}
                  />

                  <div className="flex flex-col gap-8 p-7 sm:flex-row sm:items-start sm:gap-10 md:p-10">
                    {/* Cover */}
                    <div className="shrink-0">
                      <Link href={book.href} className="block">
                        <div
                          className="relative overflow-hidden rounded-xl shadow-lg transition-transform duration-300 group-hover:-translate-y-1 group-hover:shadow-xl"
                          style={{ width: "140px" }}
                        >
                          <Image
                            src={book.cover}
                            alt={book.alt}
                            width={280}
                            height={373}
                            className="w-full h-auto"
                          />
                        </div>
                      </Link>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {/* Book number + label */}
                      <div className="flex items-center gap-3">
                        <span
                          className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-white"
                          style={{ background: book.accent }}
                        >
                          {book.number}
                        </span>
                        <span
                          className="text-[10px] font-bold uppercase tracking-widest"
                          style={{ color: book.accent }}
                        >
                          {book.label}
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="mt-3 font-serif text-2xl font-semibold text-foreground sm:text-3xl">
                        {book.title}
                      </h3>
                      <p className="mt-1 font-serif text-base font-medium text-muted-foreground">
                        {book.subtitle}
                      </p>

                      {/* Tagline */}
                      <p
                        className="mt-3 text-sm font-semibold italic"
                        style={{ color: book.accent }}
                      >
                        {book.tagline}
                      </p>

                      {/* Description */}
                      <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
                        {book.description}
                      </p>

                      {/* Meta row */}
                      <div className="mt-5 flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <BookOpen size={12} style={{ color: book.accent }} />
                          <span>{book.chapters} chapters · {book.parts} parts</span>
                        </div>
                        <div
                          className="h-1 w-1 rounded-full bg-border"
                          aria-hidden
                        />
                        <span className="text-xs text-muted-foreground">{book.focus}</span>
                      </div>

                      {/* CTA */}
                      <div className="mt-6">
                        <Link
                          href={book.href}
                          className="inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                          style={{ background: book.gradient }}
                        >
                          {book.cta}
                          <ArrowRight size={14} />
                        </Link>
                      </div>
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

      {/* ── What connects them ───────────────────────────────────────────── */}
      <section className="px-6 py-16 md:py-24">
        <div className="mx-auto max-w-[720px]">
          <ScrollReveal>
            <p className="text-xs font-semibold uppercase tracking-widest text-icon-orange">
              The thread
            </p>
            <h2 className="mt-4 font-serif text-3xl font-semibold text-foreground sm:text-4xl text-balance">
              The same 3 Biotics.{" "}
              <GradientText>Three different lives.</GradientText>
            </h2>
          </ScrollReveal>

          <ScrollReveal delay={80}>
            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {[
                {
                  icon: "🌱",
                  label: "Prebiotics",
                  color: "var(--icon-lime)",
                  text: "The plant fibre that feeds your gut bacteria. Every book. Every household. Every chapter of life.",
                },
                {
                  icon: "🦠",
                  label: "Probiotics",
                  color: "var(--icon-green)",
                  text: "Live cultures from fermented foods. Consistent, realistic, and adaptable to any kitchen or life stage.",
                },
                {
                  icon: "✨",
                  label: "Postbiotics",
                  color: "var(--icon-teal)",
                  text: "What your microbiome produces when you feed it well. The outcomes that run through all three books.",
                },
              ].map((b) => (
                <div
                  key={b.label}
                  className="rounded-2xl border border-border bg-background p-6"
                >
                  <span
                    className="flex h-10 w-10 items-center justify-center rounded-xl text-xl"
                    style={{ background: `color-mix(in srgb, ${b.color} 12%, transparent)` }}
                  >
                    {b.icon}
                  </span>
                  <p
                    className="mt-3 text-sm font-semibold"
                    style={{ color: b.color }}
                  >
                    {b.label}
                  </p>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    {b.text}
                  </p>
                </div>
              ))}
            </div>
          </ScrollReveal>

          <ScrollReveal delay={120}>
            <div
              className="mt-8 rounded-2xl p-6"
              style={{
                background: "color-mix(in srgb, var(--icon-green) 5%, var(--card))",
                border: "1px solid color-mix(in srgb, var(--icon-green) 15%, transparent)",
              }}
            >
              <p className="text-sm leading-relaxed text-muted-foreground">
                Each book applies the same core framework — the 3 Biotics pillars, the 5 outcomes,
                the practical system — to a different context. Read one or read all three.
                The books are self-contained, but they compound. The more of the system you
                understand, the more useful each individual piece becomes.
              </p>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Gradient divider */}
      <div className="section-divider" />

      {/* ── Waitlist CTA ─────────────────────────────────────────────────── */}
      <section className="bg-foreground px-6 py-16 md:py-20">
        <div className="mx-auto max-w-[720px] text-center">
          <ScrollReveal>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-icon-lime/30 bg-icon-lime/10 px-4 py-1.5">
              <BookOpen size={13} className="text-icon-lime" />
              <span className="text-xs font-semibold uppercase tracking-widest text-icon-lime">
                All three coming 2026
              </span>
            </div>
            <h2 className="mt-4 font-serif text-3xl font-semibold text-background sm:text-4xl md:text-5xl text-balance">
              Follow the trilogy.{" "}
              <span className="brand-gradient-text">From the start.</span>
            </h2>
            <p className="mx-auto mt-6 max-w-lg text-base leading-relaxed text-background/60">
              Subscribe on Substack to follow each book chapter by chapter as it&apos;s written
              — and be first in line when all three launch in 2026.
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
                Subscribe on Substack
                <ArrowUpRight size={16} />
              </a>
              <Link
                href="/waitlist"
                className="inline-flex items-center gap-2 rounded-full border-2 border-background/20 px-8 py-4 text-base font-semibold text-background transition-colors hover:border-icon-lime hover:text-icon-lime"
              >
                See all launches
              </Link>
            </div>
            <p className="mt-4 text-sm text-background/40">Free to subscribe. Unsubscribe anytime.</p>
          </ScrollReveal>

          {/* Three book links */}
          <ScrollReveal delay={160}>
            <div className="mt-10 grid gap-3 sm:grid-cols-3">
              {BOOKS.map((book) => (
                <Link
                  key={book.number}
                  href={book.href}
                  className="flex items-center justify-between gap-2 rounded-2xl border border-background/10 bg-background/5 px-4 py-3 text-left transition-colors hover:bg-background/10"
                >
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: book.accent }}>
                      Book {book.number}
                    </p>
                    <p className="mt-0.5 text-xs font-medium text-background leading-snug">
                      {book.subtitle}
                    </p>
                  </div>
                  <ArrowRight size={13} className="shrink-0 text-background/30" />
                </Link>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>
    </>
  )
}
