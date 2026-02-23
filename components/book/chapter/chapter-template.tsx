import Image from "next/image"
import Link from "next/link"
import { Clock, BookOpen, Calendar, ArrowUpRight } from "lucide-react"
import type { Chapter } from "@/lib/chapters"
import { PART_COLORS, partIndex } from "@/lib/chapters"
import { GradientText } from "@/components/gradient-text"

interface ChapterTemplateProps {
  chapter: Chapter
  children: React.ReactNode
}

export function ChapterTemplate({ chapter, children }: ChapterTemplateProps) {
  const pIdx = partIndex(chapter.part)
  const color = PART_COLORS[pIdx] ?? "var(--icon-green)"

  // Last 1–2 words of title get the gradient; rest is plain foreground
  const titleWords = chapter.title.split(" ")
  const splitAt = titleWords.length <= 3 ? titleWords.length - 1 : titleWords.length - 2
  const plainTitle = titleWords.slice(0, splitAt).join(" ")
  const gradientTitle = titleWords.slice(splitAt).join(" ")

  return (
    <>
      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section className="relative px-6 pt-32 pb-20 md:pt-40 md:pb-28">
        <div className="mx-auto max-w-[720px]">
          {/* Breadcrumb */}
          <nav className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <Link href="/book" className="transition-colors hover:text-foreground">
              The Book
            </Link>
            <span>/</span>
            <span className="font-semibold" style={{ color }}>
              Part {chapter.part} — {chapter.partTitle}
            </span>
          </nav>

          {/* Icon + chapter badge */}
          <div className="mt-8 flex items-center gap-3">
            <Image
              src="/eatobiotics-icon.webp"
              alt="EatoBiotics"
              width={40}
              height={40}
              className="h-10 w-10"
            />
            <div className="h-5 w-px bg-border" />
            <span
              className="rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-white"
              style={{ backgroundColor: color }}
            >
              Chapter {chapter.number}
            </span>
          </div>

          {/* Title */}
          <h1 className="mt-6 font-serif text-5xl font-semibold leading-[1.1] text-foreground sm:text-6xl text-balance">
            {plainTitle}{" "}
            <GradientText>{gradientTitle}</GradientText>
          </h1>

          {/* Description */}
          <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
            {chapter.description}
          </p>

          {/* Meta row */}
          <div className="mt-6 flex flex-wrap items-center gap-5 text-xs text-muted-foreground">
            {chapter.readingTime && (
              <span className="flex items-center gap-1.5">
                <Clock size={12} />
                {chapter.readingTime} min read
              </span>
            )}
            {chapter.publishedAt && (
              <span className="flex items-center gap-1.5">
                <Calendar size={12} />
                {new Date(chapter.publishedAt).toLocaleDateString("en-IE", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <BookOpen size={12} />
              EatoBiotics Book
            </span>
          </div>

          {/* Biotic pill decoration */}
          <div className="mt-7 flex items-center gap-1 sm:gap-1.5">
            <span className="biotic-pill bg-icon-lime" />
            <span className="biotic-pill bg-icon-green" />
            <span className="biotic-pill bg-icon-teal" />
            <span className="biotic-pill bg-icon-yellow" />
            <span className="biotic-pill bg-icon-orange" />
          </div>
        </div>
      </section>

      {/* Gradient divider */}
      <div className="section-divider" />

      {/* ── Dark context strip ─────────────────────────────────────────── */}
      <section className="bg-foreground px-6 py-10">
        <div className="mx-auto flex max-w-[720px] flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div
              className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl font-serif text-sm font-bold text-foreground"
              style={{ backgroundColor: color }}
            >
              {chapter.part}
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-white/50">
                {chapter.partTitle}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-white/70">
                Chapter {chapter.number} of 23. Each chapter builds on the last.
              </p>
            </div>
          </div>
          <a
            href="https://eatobiotics.substack.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-white/70 transition-all hover:border-white/40 hover:text-white"
          >
            Follow on Substack
            <ArrowUpRight size={11} />
          </a>
        </div>
      </section>

      {/* Gradient divider */}
      <div className="section-divider" />

      {/* ── Article ────────────────────────────────────────────────────── */}
      <article className="px-6 py-16 md:py-24">
        <div className="mx-auto max-w-[720px]">
          <div className="chapter-prose">{children}</div>
        </div>
      </article>

      {/* Gradient divider */}
      <div className="section-divider" />

      {/* ── Author strip ───────────────────────────────────────────────── */}
      <section className="px-6 py-10">
        <div className="mx-auto flex max-w-[720px] items-center gap-4">
          <Image
            src="/eatobiotics-icon.webp"
            alt="EatoBiotics"
            width={44}
            height={44}
            className="h-11 w-11 flex-shrink-0"
          />
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">Jason Curry</p>
            <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">
              Author of{" "}
              <em>EatoBiotics: The Food System Inside You</em>.{" "}
              Writing each chapter live on{" "}
              <a
                href="https://eatobiotics.substack.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-icon-green underline underline-offset-2 hover:no-underline"
              >
                Substack
              </a>
              .
            </p>
          </div>
          <a
            href="https://eatobiotics.substack.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="brand-gradient hidden shrink-0 items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-icon-green/20 transition-opacity hover:opacity-90 sm:inline-flex"
          >
            Subscribe
            <ArrowUpRight size={14} />
          </a>
        </div>
      </section>
    </>
  )
}
