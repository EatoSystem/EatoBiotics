import React from "react"
import { BookOpen } from "lucide-react"
import type { Chapter } from "@/lib/chapters"
import { CopyButton } from "../substack/copy-button"

interface ReedsyTemplateProps {
  chapter: Chapter
  children: React.ReactNode
}

export function ReedsyTemplate({ chapter, children }: ReedsyTemplateProps) {
  return (
    <div className="min-h-screen bg-white">

      {/* ── Instruction banner — NOT part of copy area ────────────────────────── */}
      <div className="sticky top-0 z-50 border-b border-blue-200 bg-blue-50 px-4 py-3 shadow-sm">
        <div className="mx-auto flex max-w-2xl flex-wrap items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <BookOpen size={18} className="mt-0.5 shrink-0 text-blue-700" />
            <div>
              <p className="text-sm font-semibold text-blue-900">
                Reedsy Export — Chapter {chapter.number}: {chapter.title}
              </p>
              <p className="text-xs text-blue-700">
                Click <strong>Copy for Reedsy</strong>, then paste into Reedsy Studio
              </p>
            </div>
          </div>
          <CopyButton
            targetId="reedsy-content"
            label="Copy for Reedsy"
            copiedLabel="Copied! Paste into Reedsy"
          />
        </div>
      </div>

      {/* ── Copyable content area ─────────────────────────────────────────────── */}
      <article
        id="reedsy-content"
        className="mx-auto max-w-2xl px-6 py-14"
      >
        {/* Single H1 — Reedsy chapter title */}
        <h1 className="font-serif text-4xl font-bold leading-tight text-gray-900">
          {chapter.title}
        </h1>
        <hr className="my-8 border-gray-200" />

        {/* MDX content — rendered with Reedsy-optimised component variants */}
        <div
          className={[
            // Headings — serif, book-safe
            "[&_h2]:mb-3 [&_h2]:mt-10 [&_h2]:font-serif [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-gray-900",
            "[&_h3]:mb-2 [&_h3]:mt-7 [&_h3]:font-serif [&_h3]:text-xl [&_h3]:font-bold [&_h3]:text-gray-900",
            // Paragraphs
            "[&_p]:my-4 [&_p]:text-base [&_p]:leading-[1.8] [&_p]:text-gray-800",
            // Lists
            "[&_ul]:my-4 [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-6",
            "[&_ol]:my-4 [&_ol]:list-decimal [&_ol]:space-y-1.5 [&_ol]:pl-6",
            "[&_li]:text-base [&_li]:leading-[1.8] [&_li]:text-gray-800",
            // Inline
            "[&_strong]:font-semibold [&_strong]:text-gray-900",
            "[&_em]:italic",
            // Blockquotes — clean book-safe styling
            "[&_blockquote]:my-6 [&_blockquote]:border-l-4 [&_blockquote]:border-gray-300 [&_blockquote]:pl-5 [&_blockquote]:text-gray-700",
            // Rules
            "[&_hr]:my-8 [&_hr]:border-gray-200",
            // Tables
            "[&_table]:my-4 [&_table]:w-full [&_table]:border-collapse",
            "[&_th]:border-b [&_th]:border-gray-300 [&_th]:py-1.5 [&_th]:text-left [&_th]:font-semibold",
            "[&_td]:border-b [&_td]:border-gray-200 [&_td]:py-1.5",
          ].join(" ")}
        >
          {children}
        </div>

        {/* Post footer */}
        <hr className="my-10 border-gray-200" />
        <p className="text-sm italic text-gray-400">
          From the EatoBiotics book —{" "}
          <a href="https://eatobiotics.com" className="underline">
            eatobiotics.com
          </a>
        </p>
      </article>

      {/* ── Bottom copy reminder ──────────────────────────────────────────────── */}
      <div className="border-t border-blue-200 bg-blue-50 px-4 py-4">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3">
          <p className="text-xs text-blue-700">
            Ready to import? Copy the chapter above and paste it into Reedsy Studio.
          </p>
          <CopyButton
            targetId="reedsy-content"
            label="Copy for Reedsy"
            copiedLabel="Copied! Paste into Reedsy"
          />
        </div>
      </div>

    </div>
  )
}
