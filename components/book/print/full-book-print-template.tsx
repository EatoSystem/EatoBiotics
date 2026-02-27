import React from "react"
import Image from "next/image"
import { Printer } from "lucide-react"
import { chapters, PART_COLORS, partIndex } from "@/lib/chapters"
import { PrintButton } from "./print-button"

/* ── Part grouping (same logic as ChapterList) ───────────────────────── */
const parts = Array.from(
  chapters.reduce((map, ch) => {
    if (!map.has(ch.part)) {
      map.set(ch.part, { part: ch.part, title: ch.partTitle, chapters: [] as typeof chapters })
    }
    map.get(ch.part)!.chapters.push(ch)
    return map
  }, new Map<string, { part: string; title: string; chapters: typeof chapters }>()),
).map(([, v]) => v)

/* ── Wrapper for an individual chapter's rendered MDX ────────────────── */
interface ChapterSectionProps {
  number: number
  title: string
  part: string
  partTitle: string
  children: React.ReactNode
}

export function ChapterSection({ number, title, part, partTitle, children }: ChapterSectionProps) {
  const color = PART_COLORS[partIndex(part)] ?? "var(--icon-green)"

  return (
    <section className="print-chapter-start">
      {/* Chapter header */}
      <div className="flex items-center gap-3">
        <span
          className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold text-white"
          style={{ backgroundColor: color }}
        >
          {number}
        </span>
        <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Part {part} — {partTitle}
        </span>
      </div>
      <h1 className="mt-4 font-serif text-3xl font-bold leading-tight text-foreground">
        {title}
      </h1>
      <div className="section-divider my-6" />

      {/* Chapter content */}
      <div className="chapter-prose">
        {children}
      </div>
    </section>
  )
}

/* ── Full-book template wrapper ──────────────────────────────────────── */
interface FullBookPrintTemplateProps {
  children: React.ReactNode
}

export function FullBookPrintTemplate({ children }: FullBookPrintTemplateProps) {
  return (
    <div className="min-h-screen bg-white">

      {/* ── Toolbar (hidden in print) ─────────────────────────────────── */}
      <div className="print-hide sticky top-0 z-50 border-b border-green-200 bg-green-50 px-4 py-3 shadow-sm">
        <div className="mx-auto flex max-w-[720px] flex-wrap items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <Printer size={18} className="mt-0.5 shrink-0 text-green-700" />
            <div>
              <p className="text-sm font-semibold text-green-900">
                Full Book Export — All 25 Chapters
              </p>
              <p className="text-xs text-green-700">
                This is a large document. Print preview may take a moment to render.
              </p>
            </div>
          </div>
          <PrintButton />
        </div>
      </div>

      {/* ── Printable content ──────────────────────────────────────────── */}
      <div className="mx-auto max-w-[720px] px-6 py-14">

        {/* ── Title page ───────────────────────────────────────────────── */}
        <div className="flex min-h-[60vh] flex-col items-center justify-center text-center print-page-break">
          <Image
            src="/eatobiotics-icon.webp"
            alt="EatoBiotics"
            width={80}
            height={80}
            className="mb-8 h-20 w-20"
          />
          <div className="section-divider mb-8 w-48" />
          <h1 className="font-serif text-5xl font-bold leading-tight text-foreground">
            EatoBiotics
          </h1>
          <p className="mt-2 font-serif text-xl text-muted-foreground">
            The Food System Inside You
          </p>
          <div className="mt-8 flex items-center gap-1.5">
            <span className="biotic-pill bg-icon-lime" />
            <span className="biotic-pill bg-icon-green" />
            <span className="biotic-pill bg-icon-teal" />
            <span className="biotic-pill bg-icon-yellow" />
            <span className="biotic-pill bg-icon-orange" />
          </div>
          <p className="mt-10 text-base text-muted-foreground">
            Jason Curry
          </p>
          <p className="mt-1 text-sm text-muted-foreground/60">
            eatobiotics.com
          </p>
        </div>

        {/* ── Table of Contents ─────────────────────────────────────────── */}
        <div className="print-page-break">
          <h2 className="font-serif text-3xl font-bold text-foreground">
            Table of Contents
          </h2>
          <div className="section-divider my-6" />

          {parts.map((part, partIdx) => {
            const color = PART_COLORS[partIdx % PART_COLORS.length]
            return (
              <div key={part.part} className={partIdx > 0 ? "mt-8" : "mt-6"}>
                <div className="flex items-center gap-2">
                  <span
                    className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-semibold text-white"
                    style={{ backgroundColor: color }}
                  >
                    {part.part}
                  </span>
                  <p className="text-sm font-semibold text-foreground">
                    Part {part.part}: {part.title}
                  </p>
                </div>
                <div className="ml-8 mt-2 flex flex-col gap-1">
                  {part.chapters.map((ch) => (
                    <p key={ch.number} className="text-sm text-muted-foreground">
                      <span className="inline-block w-6 text-right font-semibold" style={{ color }}>
                        {ch.number}
                      </span>
                      <span className="ml-3">{ch.title}</span>
                    </p>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {/* ── Chapter content (rendered by page.tsx) ────────────────────── */}
        {children}

        {/* ── Colophon ─────────────────────────────────────────────────── */}
        <div className="print-chapter-start flex min-h-[30vh] flex-col items-center justify-center text-center">
          <div className="section-divider mb-8 w-32" />
          <p className="text-sm italic text-muted-foreground">
            From the EatoBiotics book — eatobiotics.com
          </p>
          <p className="mt-2 text-xs text-muted-foreground/60">
            Seeded in Ireland. Harvested Globally.
          </p>
        </div>
      </div>

      {/* ── Bottom toolbar (hidden in print) ──────────────────────────── */}
      <div className="print-hide border-t border-green-200 bg-green-50 px-4 py-4">
        <div className="mx-auto flex max-w-[720px] items-center justify-between gap-3">
          <p className="text-xs text-green-700">
            Use your browser&apos;s <strong>Print</strong> dialog or <strong>Save as PDF</strong> to export the full book.
          </p>
          <PrintButton />
        </div>
      </div>
    </div>
  )
}
