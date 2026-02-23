import Link from "next/link"
import { ArrowLeft, ArrowRight, BookOpen } from "lucide-react"
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
    <nav className="mt-16 border-t border-border pt-10">
      {/* Back to book */}
      <div className="mb-8 flex items-center justify-center">
        <Link
          href="/book"
          className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:border-icon-green hover:text-icon-green"
        >
          <BookOpen size={14} />
          Back to the Book
        </Link>
      </div>

      {/* Prev / Next */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Previous */}
        {prev ? (
          <Link
            href={`/book-chapter-${prev.number}`}
            className="group flex flex-col gap-2 rounded-2xl border border-border bg-background px-6 py-5 transition-colors hover:border-icon-green hover:bg-secondary/40"
          >
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              <ArrowLeft size={12} className="transition-transform group-hover:-translate-x-0.5" />
              Previous
            </div>
            <div className="flex items-baseline gap-3">
              <span
                className="font-serif text-sm font-semibold"
                style={{ color: PART_COLORS[partIndex(prev.part)] }}
              >
                {prev.number}
              </span>
              <p className="text-base font-medium text-foreground">{prev.title}</p>
            </div>
          </Link>
        ) : (
          <div />
        )}

        {/* Next */}
        {next ? (
          <Link
            href={next.status === "published" ? `/book-chapter-${next.number}` : "/book"}
            className="group flex flex-col gap-2 rounded-2xl border border-border bg-background px-6 py-5 text-right transition-colors hover:border-icon-green hover:bg-secondary/40 sm:items-end"
          >
            <div className="flex items-center justify-end gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              {next.status === "published" ? "Next" : "Coming Soon"}
              <ArrowRight size={12} className="transition-transform group-hover:translate-x-0.5" />
            </div>
            <div className="flex items-baseline gap-3">
              <p className="text-base font-medium text-foreground">{next.title}</p>
              <span
                className="font-serif text-sm font-semibold"
                style={{ color: PART_COLORS[partIndex(next.part)] }}
              >
                {next.number}
              </span>
            </div>
          </Link>
        ) : (
          <div />
        )}
      </div>

      {/* Substack prompt */}
      <div className="mt-8 rounded-2xl border border-border bg-secondary/30 px-6 py-6 text-center">
        <p className="text-sm font-medium text-foreground">
          Get each new chapter straight to your inbox.
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Subscribe on Substack — free, one email per chapter.
        </p>
        <a
          href="https://eatobiotics.substack.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: `linear-gradient(135deg, ${color}, var(--icon-teal))` }}
        >
          Subscribe on Substack
        </a>
      </div>
    </nav>
  )
}
