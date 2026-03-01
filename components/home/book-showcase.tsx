"use client"

import { useCallback, useEffect, useState, useRef } from "react"
import useEmblaCarousel from "embla-carousel-react"
import Autoplay from "embla-carousel-autoplay"
import { chapters, PART_COLORS } from "@/lib/chapters"
import { ScrollReveal } from "@/components/scroll-reveal"
import { BookOpen, Clock, ArrowRight } from "lucide-react"
import Link from "next/link"

/* ── Group chapters by part ────────────────────────────────────────── */

interface PartData {
  part: string
  partTitle: string
  color: string
  gradient: string
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

/* ── Animated counter ─────────────────────────────────────────────── */

function AnimatedStat({ target, label }: { target: number; label: string }) {
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
      { threshold: 0.3 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [target])

  return (
    <div ref={ref} className="text-center">
      <p className="font-serif text-3xl font-semibold text-foreground sm:text-4xl">
        {value}
      </p>
      <p className="mt-1 text-xs text-muted-foreground sm:text-sm">{label}</p>
    </div>
  )
}

/* ── Main component ───────────────────────────────────────────────── */

export function BookShowcase() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: "center" }, [
    Autoplay({ delay: 5000, stopOnInteraction: true, stopOnMouseEnter: true }),
  ])
  const [selectedIndex, setSelectedIndex] = useState(0)

  const onSelect = useCallback(() => {
    if (!emblaApi) return
    setSelectedIndex(emblaApi.selectedScrollSnap())
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    emblaApi.on("select", onSelect)
    onSelect()
    return () => {
      emblaApi.off("select", onSelect)
    }
  }, [emblaApi, onSelect])

  function scrollTo(index: number) {
    emblaApi?.scrollTo(index)
  }

  return (
    <section className="relative overflow-hidden px-6 py-24 md:py-32">
      {/* Floating decorative elements */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -top-3 right-[4%] h-5 w-36 rotate-[20deg] rounded-full opacity-15"
          style={{ background: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))" }}
        />
        <div
          className="absolute top-[20%] left-[2%] h-5 w-28 rotate-[-25deg] rounded-full opacity-12"
          style={{ background: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))" }}
        />
        <div
          className="absolute bottom-[15%] right-[3%] h-5 w-40 rotate-[-10deg] rounded-full opacity-12"
          style={{ background: "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange))" }}
        />
        <div
          className="absolute bottom-[8%] left-[6%] h-5 w-24 rotate-[50deg] rounded-full opacity-10"
          style={{ background: "linear-gradient(135deg, var(--icon-teal), var(--icon-green))" }}
        />
        <div className="absolute top-[12%] left-[12%] h-6 w-6 rounded-full bg-icon-lime opacity-10" />
        <div className="absolute top-[35%] right-[10%] h-5 w-5 rounded-full bg-icon-orange opacity-10" />
        <div className="absolute bottom-[20%] right-[16%] h-7 w-7 rounded-full bg-icon-yellow opacity-8" />
        <div className="absolute bottom-[30%] left-[8%] h-4 w-4 rounded-full bg-icon-teal opacity-10" />
      </div>

      <div className="relative z-10 mx-auto max-w-[1200px]">
        {/* Header */}
        <ScrollReveal>
          <div className="text-center">
            <div
              className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
              style={{ background: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))" }}
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

        {/* Carousel */}
        <ScrollReveal delay={100}>
          <div className="mt-12">
            <div ref={emblaRef} className="overflow-hidden">
              <div className="flex">
                {PARTS.map((part, i) => (
                  <div
                    key={part.part}
                    className="min-w-0 flex-[0_0_90%] px-3 sm:flex-[0_0_70%] md:flex-[0_0_50%] lg:flex-[0_0_42%]"
                  >
                    <div
                      className={`relative overflow-hidden rounded-2xl border bg-background p-6 transition-all ${
                        i === selectedIndex
                          ? "border-current shadow-lg"
                          : "border-border"
                      }`}
                      style={{
                        borderColor: i === selectedIndex ? part.color : undefined,
                      }}
                    >
                      {/* Gradient top bar */}
                      <div
                        className="absolute top-0 right-0 left-0 h-1.5"
                        style={{ background: part.gradient }}
                      />

                      {/* Part header */}
                      <div className="flex items-center gap-3">
                        <span
                          className="flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold text-white"
                          style={{ background: part.gradient }}
                        >
                          {part.part}
                        </span>
                        <div>
                          <p className="font-serif text-lg font-semibold text-foreground">
                            {part.partTitle}
                          </p>
                          <p className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{part.chapters.length} chapters</span>
                            <span>·</span>
                            <Clock size={10} />
                            <span>{part.totalMinutes} min</span>
                          </p>
                        </div>
                      </div>

                      {/* Chapter list */}
                      <div className="mt-4 space-y-1.5">
                        {part.chapters.map((ch) => (
                          <Link
                            key={ch.number}
                            href={`/book-chapter-${ch.number}`}
                            className="group flex items-center justify-between rounded-lg p-2 text-sm transition-colors hover:bg-muted/50"
                          >
                            <span className="flex items-center gap-2">
                              <span
                                className="flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold text-white"
                                style={{ background: part.gradient }}
                              >
                                {ch.number}
                              </span>
                              <span className="text-foreground">{ch.title}</span>
                            </span>
                            <ArrowRight
                              size={12}
                              className="text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
                            />
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Part dot navigation */}
            <div className="mt-6 flex items-center justify-center gap-2">
              {PARTS.map((part, i) => (
                <button
                  key={part.part}
                  onClick={() => scrollTo(i)}
                  className="h-2.5 rounded-full transition-all"
                  style={{
                    width: i === selectedIndex ? 24 : 10,
                    backgroundColor:
                      i === selectedIndex ? part.color : "var(--border)",
                  }}
                  aria-label={`Go to Part ${part.part}`}
                />
              ))}
            </div>
          </div>
        </ScrollReveal>

        {/* Stats + CTAs */}
        <ScrollReveal delay={200}>
          <div className="mt-12 flex flex-col items-center">
            {/* Animated stat counters */}
            <div className="flex items-center gap-8 sm:gap-12">
              <AnimatedStat target={TOTAL_CHAPTERS} label="Chapters" />
              <div className="h-8 w-px bg-border" />
              <AnimatedStat target={PARTS.length} label="Parts" />
              <div className="h-8 w-px bg-border" />
              <AnimatedStat target={TOTAL_HOURS} label="Hours" />
            </div>

            {/* CTAs */}
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
              <Link
                href="/book-chapter-1"
                className="brand-gradient inline-block rounded-full px-8 py-4 text-base font-semibold text-white shadow-lg shadow-icon-green/20 transition-all hover:shadow-xl hover:shadow-icon-green/30 hover:opacity-90"
              >
                Start Reading Chapter 1
              </Link>
              <Link
                href="/book"
                className="inline-block rounded-full border border-border px-8 py-4 text-base font-semibold text-foreground transition-all hover:bg-muted"
              >
                View All Chapters
              </Link>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
