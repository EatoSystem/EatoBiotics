import Link from "next/link"
import { ArrowLeft, ArrowRight, BookOpen, ArrowUpRight } from "lucide-react"
import type { Chapter } from "@/lib/chapters"
import { PART_COLORS, partIndex } from "@/lib/chapters"

interface ChapterNavProps {
  current: Chapter
  prev?: Chapter
  next?: Chapter
}

export function ChapterNav({ current, prev, next }: ChapterNavProps) {
  const color = PART_COLORS[partIndex(current.part)] ?? "var(--icon-green)"

  return (
    <nav className="mt-16">
      {/* Divider */}
      <div
        className="mb-10 h-px rounded-full"
        style={{
          background: "linear-gradient(90deg, var(--icon-lime), var(--icon-green), var(--icon-teal), transparent)",
        }}
      />

      {/* Back to book */}
      <div className="mb-8 flex justify-center">
        <Link
          href="/book"
          className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:border-icon-green hover:text-icon-green"
        >
          <BookOpen size={14} />
          Table of Contents
        </Link>
      </div>

      {/* Prev / Next grid */}
      <div className="grid gap-4 sm:grid-cols-2">
        {prev ? (
          <Link
            href={`/book-chapter-${prev.number}`}
            className="group flex flex-col gap-2 rounded-2xl border border-border bg-background px-6 py-5 transition-all hover:border-icon-green hover:shadow-sm"
          >
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              <ArrowLeft
                size={12}
                className="transition-transform group-hover:-translate-x-0.5"
              />
              Previous chapter
            </div>
            <p className="font-serif text-base font-semibold text-foreground">
              {prev.title}
            </p>
            <p className="text-xs text-muted-foreground">Chapter {prev.number}</p>
          </Link>
        ) : (
          <div />
        )}

        {next ? (
          <Link
            href={next.status === "published" ? `/book-chapter-${next.number}` : "/book"}
            className="group flex flex-col gap-2 rounded-2xl border border-border bg-background px-6 py-5 text-right transition-all hover:border-icon-green hover:shadow-sm sm:items-end"
          >
            <div className="flex items-center justify-end gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              {next.status === "published" ? "Next chapter" : "Coming soon"}
              <ArrowRight
                size={12}
                className="transition-transform group-hover:translate-x-0.5"
              />
            </div>
            <p className="font-serif text-base font-semibold text-foreground">
              {next.title}
            </p>
            <p className="text-xs text-muted-foreground">Chapter {next.number}</p>
          </Link>
        ) : (
          <div />
        )}
      </div>

      {/* Substack CTA — dark section matching book page style */}
      <div className="mt-8 overflow-hidden rounded-2xl bg-foreground px-6 py-8 text-center">
        <p className="font-serif text-xl font-semibold text-white">
          Get the next chapter in your inbox.
        </p>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-white/60">
          Subscribe on Substack — free, one email per chapter, no noise.
        </p>
        <a
          href="https://eatobiotics.substack.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-flex items-center gap-2 rounded-full px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-icon-green/20 transition-opacity hover:opacity-90"
          style={{
            background: `linear-gradient(135deg, ${color}, var(--icon-teal))`,
          }}
        >
          Subscribe on Substack
          <ArrowUpRight size={14} />
        </a>
      </div>
    </nav>
  )
}
