import React from "react"
import Image from "next/image"
import { BookOpen, Printer } from "lucide-react"
import type { Chapter } from "@/lib/chapters"
import { PART_COLORS, partIndex } from "@/lib/chapters"
import { PrintButton } from "./print-button"

interface PrintTemplateProps {
  chapter: Chapter
  children: React.ReactNode
}

export function PrintTemplate({ chapter, children }: PrintTemplateProps) {
  const color = PART_COLORS[partIndex(chapter.part)] ?? "var(--icon-green)"

  return (
    <div className="min-h-screen bg-white">

      {/* ── Toolbar banner — hidden when printing ────────────────────────────── */}
      <div className="print-hide sticky top-0 z-50 border-b border-green-200 bg-green-50 px-4 py-3 shadow-sm">
        <div className="mx-auto flex max-w-[720px] flex-wrap items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <Printer size={18} className="mt-0.5 shrink-0 text-green-700" />
            <div>
              <p className="text-sm font-semibold text-green-900">
                Print Export — Chapter {chapter.number}: {chapter.title}
              </p>
              <p className="text-xs text-green-700">
                Click <strong>Print / Save as PDF</strong> to save as a 7&times;10&Prime; PDF
              </p>
            </div>
          </div>
          <PrintButton />
        </div>
      </div>

      {/* ── Printable content area ───────────────────────────────────────────── */}
      <article className="mx-auto max-w-[720px] px-6 py-14">

        {/* Chapter header */}
        <div className="flex items-center gap-3">
          <Image
            src="/eatobiotics-icon.webp"
            alt="EatoBiotics"
            width={36}
            height={36}
            className="h-9 w-9"
          />
          <div className="h-4 w-px bg-border" />
          <span
            className="rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-white"
            style={{ backgroundColor: color }}
          >
            Chapter {chapter.number}
          </span>
          <span className="text-xs font-semibold text-muted-foreground">
            Part {chapter.part} — {chapter.partTitle}
          </span>
        </div>

        {/* Title */}
        <h1 className="mt-6 font-serif text-4xl font-bold leading-tight text-foreground">
          {chapter.title}
        </h1>

        {/* Description */}
        <p className="mt-3 text-base leading-relaxed text-muted-foreground">
          {chapter.description}
        </p>

        {/* Gradient divider */}
        <div className="section-divider my-8" />

        {/* MDX content — rendered with the same rich styled components as main page */}
        <div className="chapter-prose">
          {children}
        </div>

        {/* Post footer */}
        <div className="section-divider my-10" />
        <p className="text-sm italic text-muted-foreground">
          From the EatoBiotics book —{" "}
          <a href="https://eatobiotics.com" className="underline">
            eatobiotics.com
          </a>
        </p>
      </article>

      {/* ── Bottom toolbar — hidden when printing ────────────────────────────── */}
      <div className="print-hide border-t border-green-200 bg-green-50 px-4 py-4">
        <div className="mx-auto flex max-w-[720px] items-center justify-between gap-3">
          <p className="text-xs text-green-700">
            Use your browser&apos;s <strong>Print</strong> dialog or <strong>Save as PDF</strong> to export this chapter.
          </p>
          <PrintButton />
        </div>
      </div>

    </div>
  )
}
