"use client"

import { useState, useRef, useEffect } from "react"
import { chapters, PART_COLORS } from "@/lib/chapters"
import { ScrollReveal } from "@/components/scroll-reveal"
import { BookOpen, Clock, ArrowRight, ChevronRight } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

/* ── Part data ────────────────────────────────────────────────────────── */

interface PartData {
  part: string
  partTitle: string
  color: string
  gradient: string
  hook: string
  chapters: { number: number; title: string; readingTime?: number }[]
  totalMinutes: number
}

const PART_GRADIENTS = [
  "linear-gradient(135deg, var(--icon-lime), var(--icon-green))",
  "linear-gradient(135deg, var(--icon-green), var(--icon-teal))",
  "linear-gradient(135deg, var(--icon-teal), var(--icon-yellow))",
  "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange))",
  "linear-gradient(135deg, var(--icon-orange), var(--icon-yellow))",
  "linear-gradient(135deg, var(--icon-lime), var(--icon-green))",
]

const PART_HOOKS: Record<string, string> = {
  I: "Discover what your microbiome really is, why modern diets broke it, and the simple framework to rebuild it.",
  II: "The complete guide to prebiotic, probiotic, and postbiotic foods \u2014 what to eat, why it works, and how to use them daily.",
  III: "See how feeding your gut transforms digestion, immunity, energy, mood, and recovery \u2014 the five outcomes you\u2019ll feel.",
  IV: "Your kitchen setup, meal formula, 7-day reset, 21-day build, and scoring system \u2014 everything to make it stick.",
  V: "Travel protocols, antibiotic recovery, movement, breathwork, and building a sustainable lifestyle without perfection pressure.",
  VI: "The complete picture \u2014 how everything connects into one unified approach to food, health, and the broader EatoSystem vision.",
}

function buildParts(): PartData[] {
  const partsMap = new Map<string, PartData>()
  const partOrder: string[] = []

  for (const ch of chapters) {
    if (!partsMap.has(ch.part)) {
      const idx = partOrder.length
      partOrder.push(ch.part)
      partsMap.set(ch.part, {
        part: ch.part,
        partTitle: ch.partTitle,
        color: PART_COLORS[idx] ?? "var(--icon-green)",
        gradient: PART_GRADIENTS[idx] ?? PART_GRADIENTS[0],
        hook: PART_HOOKS[ch.part] ?? "",
        chapters: [],
        totalMinutes: 0,
      })
    }
    const p = partsMap.get(ch.part)!
    p.chapters.push({ number: ch.number, title: ch.title, readingTime: ch.readingTime })
    p.totalMinutes += ch.readingTime ?? 0
  }

  return partOrder.map((k) => partsMap.get(k)!)
}

const PARTS = buildParts()
const TOTAL_CHAPTERS = chapters.length
const TOTAL_MINUTES = chapters.reduce((a, c) => a + (c.readingTime ?? 0), 0)
const TOTAL_HOURS = Math.round(TOTAL_MINUTES / 60)

/* ── Animated counter ─────────────────────────────────────────────────── */

function AnimatedStat({
  target,
  label,
  suffix,
}: {
  target: number
  label: string
  suffix?: string
}) {
  const [value, setValue] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const hasAnimated = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true
          const duration = 1200
          const steps = 50
          const increment = target / steps
          let current = 0
          const timer = setInterval(() => {
            current += increment
            if (current >= target) {
              setValue(target)
              clearInterval(timer)
            } else {
              setValue(Math.round(current))
            }
          }, duration / steps)
        }
      },
      { threshold: 0.3 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [target])

  return (
    <div ref={ref} className="text-center">
      <p className="font-serif text-2xl font-semibold text-foreground sm:text-3xl">
        {value}
        {suffix}
      </p>
      <p className="mt-1 text-[11px] text-muted-foreground sm:text-xs">{label}</p>
    </div>
  )
}

/* ── Main component ───────────────────────────────────────────────────── */

export function BookShowcase() {
  const [activePart, setActivePart] = useState(0)
  const part = PARTS[activePart]

  return (
    <section className="relative overflow-hidden px-6 py-24 md:py-32">
<div className="relative z-10 mx-auto max-w-[1200px]">
        {/* Header */}
        <ScrollReveal>
          <div className="text-center">
            <div
              className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
              style={{
                background: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))",
              }}
            >
              <BookOpen size={26} className="text-white" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-widest text-icon-lime">
              The Book
            </p>
            <h2 className="mt-4 font-serif text-3xl font-semibold text-foreground sm:text-4xl md:text-5xl text-balance">
              The Food System Inside You
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              25 chapters across 6 parts — from understanding your microbiome to building
              the practical food system that supports it every day.
            </p>
          </div>
        </ScrollReveal>

        {/* Two-column: Book Cover + Part Explorer */}
        <div className="mt-16 flex flex-col items-center gap-12 lg:flex-row lg:items-start lg:gap-16">
          {/* Left: Book Cover + Stats */}
          <ScrollReveal>
            <div className="flex flex-col items-center lg:sticky lg:top-32">
              {/* Book Cover */}
              <div className="relative">
                <div className="w-[200px] sm:w-[240px]">
                  <div className="relative w-full overflow-hidden rounded-xl shadow-2xl">
                    <Image
                      src="/book-cover.png"
                      alt="EatoBiotics: The Food System Inside You by Jason Curry"
                      width={600}
                      height={800}
                      className="w-full h-auto"
                      priority
                    />
                  </div>
                </div>
              </div>

              {/* Stats under book */}
              <div className="mt-8 flex items-center gap-5 sm:gap-7">
                <AnimatedStat target={TOTAL_CHAPTERS} label="Chapters" />
                <div className="h-8 w-px bg-border" />
                <AnimatedStat target={PARTS.length} label="Parts" />
                <div className="h-8 w-px bg-border" />
                <AnimatedStat target={TOTAL_HOURS} label="Hours" suffix="+" />
              </div>

              {/* CTA below stats — hidden while chapters are not linked */}
            </div>
          </ScrollReveal>

          {/* Right: Part Explorer */}
          <div className="w-full flex-1">
            {/* Part selector tabs */}
            <ScrollReveal delay={100}>
              <div className="flex flex-wrap gap-2">
                {PARTS.map((p, i) => {
                  const isActive = i === activePart
                  return (
                    <button
                      key={p.part}
                      onClick={() => setActivePart(i)}
                      className={`relative overflow-hidden rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-300 ${
                        isActive
                          ? "text-white shadow-md"
                          : "border border-border text-muted-foreground hover:border-current/20"
                      }`}
                      style={{
                        background: isActive ? p.gradient : undefined,
                        color: isActive ? "white" : p.color,
                      }}
                    >
                      <span className="relative z-10">Part {p.part}</span>
                    </button>
                  )
                })}
              </div>
            </ScrollReveal>

            {/* Active part card */}
            <ScrollReveal delay={150}>
              <div
                className="mt-5 overflow-hidden rounded-2xl border border-border bg-background shadow-sm transition-all"
                key={part.part}
              >
                {/* Gradient top bar */}
                <div className="h-1.5" style={{ background: part.gradient }} />

                <div className="p-5 sm:p-7">
                  {/* Part header */}
                  <div className="flex items-start gap-4">
                    <span
                      className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl text-lg font-bold text-white shadow-sm sm:h-14 sm:w-14 sm:text-xl"
                      style={{ background: part.gradient }}
                    >
                      {part.part}
                    </span>
                    <div>
                      <h3 className="font-serif text-lg font-semibold text-foreground sm:text-xl">
                        {part.partTitle}
                      </h3>
                      <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{part.chapters.length} chapters</span>
                        <span className="opacity-40">|</span>
                        <span className="flex items-center gap-1">
                          <Clock size={11} />
                          {part.totalMinutes} min read
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Hook / teaser text */}
                  <p
                    className="mt-5 border-l-2 pl-4 text-sm leading-relaxed text-muted-foreground italic"
                    style={{ borderColor: part.color }}
                  >
                    {part.hook}
                  </p>

                  {/* Chapters */}
                  <div className="mt-5 space-y-0.5">
                    {part.chapters.map((ch) => (
                      <div
                        key={ch.number}
                        className="flex items-center gap-3 rounded-xl p-2.5 sm:p-3"
                      >
                        <span
                          className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-[11px] font-bold text-white sm:h-8 sm:w-8 sm:text-xs"
                          style={{ background: part.gradient }}
                        >
                          {ch.number}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-foreground sm:text-[15px]">
                            {ch.title}
                          </p>
                          {ch.readingTime && (
                            <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                              <Clock size={10} />
                              {ch.readingTime} min
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </ScrollReveal>

            {/* Bottom CTAs */}
            <ScrollReveal delay={200}>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/book"
                  className="inline-flex items-center justify-center rounded-full border border-border px-8 py-4 text-base font-semibold text-foreground transition-all hover:bg-muted"
                >
                  View All Chapters
                </Link>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </div>
    </section>
  )
}
