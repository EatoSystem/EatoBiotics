import Link from "next/link"
import { ArrowLeft, ArrowRight, BookOpen, ArrowUpRight, FileDown } from "lucide-react"
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
      {/* Gradient divider */}
      <div className="section-divider mb-10" />

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

      {/* Prev / Next */}
      <div className="grid gap-4 sm:grid-cols-2">
        {prev ? (
          <Link
            href={`/book-chapter-${prev.number}`}
            className="group flex flex-col gap-1.5 rounded-2xl border border-border bg-background px-5 py-4 transition-all hover:border-icon-green hover:shadow-sm"
          >
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              <ArrowLeft size={11} className="transition-transform group-hover:-translate-x-0.5" />
              Previous
            </div>
            <p className="font-serif text-base font-semibold text-foreground leading-tight">
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
            className="group flex flex-col gap-1.5 rounded-2xl border border-border bg-background px-5 py-4 text-right transition-all hover:border-icon-green hover:shadow-sm sm:items-end"
          >
            <div className="flex items-center justify-end gap-1.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              {next.status === "published" ? "Next" : "Coming soon"}
              <ArrowRight size={11} className="transition-transform group-hover:translate-x-0.5" />
            </div>
            <p className="font-serif text-base font-semibold text-foreground leading-tight">
              {next.title}
            </p>
            <p className="text-xs text-muted-foreground">Chapter {next.number}</p>
          </Link>
        ) : (
          <div />
        )}
      </div>

      {/* Export links */}
      <div className="mt-8 flex items-center justify-center gap-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
          <FileDown size={11} className="mr-1.5 inline -translate-y-px" />
          Export
        </p>
        <Link
          href={`/book-chapter-${current.number}/substack`}
          className="rounded-full border border-border px-4 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-icon-green hover:text-icon-green"
        >
          Copy for Substack
        </Link>
        <Link
          href={`/book-chapter-${current.number}/reedsy`}
          className="rounded-full border border-border px-4 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-icon-green hover:text-icon-green"
        >
          Copy for Reedsy
        </Link>
        <Link
          href={`/book-chapter-${current.number}/print`}
          className="rounded-full border border-border px-4 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-icon-green hover:text-icon-green"
        >
          Print / PDF
        </Link>
      </div>

      {/* Substack CTA — white card matching site style */}
      <div className="mt-8 overflow-hidden rounded-2xl border border-border bg-background">
        {/* Gradient top accent */}
        <div
          className="h-0.5 w-full"
          style={{ background: `linear-gradient(90deg, ${color}, var(--icon-teal))` }}
        />
        <div className="px-6 py-8 text-center">
          <p className="font-serif text-xl font-semibold text-foreground">
            Get the next chapter in your inbox.
          </p>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
            Subscribe on Substack — free, one email per chapter, no noise.
          </p>
          <a
            href="https://eatobiotics.substack.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center gap-2 rounded-full px-7 py-3 text-sm font-semibold text-white shadow-md shadow-icon-green/20 transition-opacity hover:opacity-90"
            style={{ background: `linear-gradient(135deg, ${color}, var(--icon-teal))` }}
          >
            Subscribe on Substack
            <ArrowUpRight size={14} />
          </a>
        </div>
      </div>
    </nav>
  )
}
