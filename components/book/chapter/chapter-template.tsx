import Image from "next/image"
import Link from "next/link"
import { Clock, BookOpen, Calendar } from "lucide-react"
import type { Chapter } from "@/lib/chapters"
import { PART_COLORS, partIndex } from "@/lib/chapters"

interface ChapterTemplateProps {
  chapter: Chapter
  children: React.ReactNode
}

export function ChapterTemplate({ chapter, children }: ChapterTemplateProps) {
  const color = PART_COLORS[partIndex(chapter.part)] ?? "var(--icon-green)"
  const nextColor = PART_COLORS[(partIndex(chapter.part) + 1) % PART_COLORS.length]

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden px-6 pt-28 pb-14 md:pt-36 md:pb-20">
        {/* Top brand stripe */}
        <div
          className="absolute left-0 right-0 top-0 h-1"
          style={{ background: `linear-gradient(90deg, var(--icon-lime), var(--icon-green), var(--icon-teal), var(--icon-yellow), var(--icon-orange))` }}
        />

        <div className="mx-auto max-w-[720px]">
          {/* Breadcrumb */}
          <div className="mb-6 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <Link href="/book" className="hover:text-foreground transition-colors">
              The Book
            </Link>
            <span>/</span>
            <span
              className="font-semibold"
              style={{ color }}
            >
              Part {chapter.part} — {chapter.partTitle}
            </span>
          </div>

          {/* Part + chapter badge row */}
          <div className="flex flex-wrap items-center gap-3">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-full font-serif text-sm font-bold text-white"
              style={{ backgroundColor: color }}
            >
              {chapter.part}
            </span>
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Chapter {chapter.number}
            </span>
          </div>

          {/* Title */}
          <h1 className="mt-4 font-serif text-4xl font-semibold text-foreground sm:text-5xl text-balance">
            {chapter.title}
          </h1>

          {/* Description */}
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
            {chapter.description}
          </p>

          {/* Meta row */}
          <div className="mt-6 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
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
          <div className="mt-6 flex items-center gap-1.5">
            <span className="h-2 w-10 rounded-full" style={{ backgroundColor: "var(--icon-lime)" }} />
            <span className="h-2 w-7 rounded-full" style={{ backgroundColor: "var(--icon-green)" }} />
            <span className="h-2 w-5 rounded-full" style={{ backgroundColor: "var(--icon-teal)" }} />
            <span className="h-2 w-3 rounded-full" style={{ backgroundColor: "var(--icon-yellow)" }} />
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: "var(--icon-orange)" }} />
          </div>
        </div>
      </section>

      {/* Gradient divider */}
      <div className="section-divider" />

      {/* Content */}
      <article className="px-6 py-16 md:py-20">
        <div className="mx-auto max-w-[720px]">
          <div className="chapter-prose">
            {children}
          </div>
        </div>
      </article>

      {/* Gradient divider */}
      <div className="section-divider" />

      {/* Author row */}
      <section className="px-6 py-10">
        <div className="mx-auto flex max-w-[720px] items-center gap-4">
          <Image
            src="/eatobiotics-icon.webp"
            alt="EatoBiotics"
            width={48}
            height={48}
            className="h-12 w-12 flex-shrink-0"
          />
          <div>
            <p className="text-sm font-semibold text-foreground">Jason Curry</p>
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
              Author of EatoBiotics: The Food System Inside You. Writing each chapter on{" "}
              <a
                href="https://eatobiotics.substack.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-icon-green underline underline-offset-2 hover:no-underline"
              >
                Substack
              </a>
              .
            </p>
          </div>
        </div>
      </section>
    </>
  )
}
