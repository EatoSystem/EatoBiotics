import React from "react"
import { BookOpen } from "lucide-react"
import type { Chapter } from "@/lib/chapters"
import { CopyButton } from "./copy-button"

interface SubstackTemplateProps {
  chapter: Chapter
  children: React.ReactNode
}

export function SubstackTemplate({ chapter, children }: SubstackTemplateProps) {
  return (
    <div className="min-h-screen bg-white">

      {/* ── Instruction banner — NOT part of copy area ────────────────────────── */}
      <div className="sticky top-0 z-50 border-b border-amber-200 bg-amber-50 px-4 py-3 shadow-sm">
        <div className="mx-auto flex max-w-2xl flex-wrap items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <BookOpen size={18} className="mt-0.5 shrink-0 text-amber-700" />
            <div>
              <p className="text-sm font-semibold text-amber-900">
                Substack Export — Chapter {chapter.number}: {chapter.title}
              </p>
              <p className="text-xs text-amber-700">
                Click <strong>Copy Chapter</strong>, then paste into a new Substack post editor
              </p>
            </div>
          </div>
          <CopyButton targetId="substack-content" />
        </div>
      </div>

      {/* ── Copyable content area ─────────────────────────────────────────────── */}
      {/*
          id="substack-content" is what CopyButton targets.
          Everything inside here is copied as rich HTML.
          The Nav and Footer from the root layout are OUTSIDE this div — never pasted.
      */}
      <article
        id="substack-content"
        className="mx-auto max-w-2xl px-6 py-14"
      >
        {/* Chapter header */}
        <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
          Chapter {chapter.number} · Part {chapter.part} — {chapter.partTitle}
        </p>
        <h1 className="mt-3 font-serif text-4xl font-bold leading-tight text-gray-900">
          {chapter.title}
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-gray-600">
          {chapter.description}
        </p>
        <hr className="my-8 border-gray-200" />

        {/* MDX content — rendered with Substack-optimised component variants */}
        <div
          className={[
            // Headings
            "[&_h2]:mb-3 [&_h2]:mt-10 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-gray-900",
            "[&_h3]:mb-2 [&_h3]:mt-7 [&_h3]:text-lg [&_h3]:font-bold [&_h3]:text-gray-900",
            // Paragraphs
            "[&_p]:my-4 [&_p]:text-base [&_p]:leading-[1.75] [&_p]:text-gray-800",
            // Lists
            "[&_ul]:my-4 [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-6",
            "[&_ol]:my-4 [&_ol]:list-decimal [&_ol]:space-y-1.5 [&_ol]:pl-6",
            "[&_li]:text-base [&_li]:leading-[1.75] [&_li]:text-gray-800",
            // Inline
            "[&_strong]:font-semibold [&_strong]:text-gray-900",
            "[&_em]:italic",
            // Blockquotes
            "[&_blockquote]:my-6 [&_blockquote]:border-l-4 [&_blockquote]:border-gray-300 [&_blockquote]:pl-5 [&_blockquote]:text-gray-700",
            // Rules
            "[&_hr]:my-8 [&_hr]:border-gray-200",
            // Code
            "[&_code]:rounded [&_code]:bg-gray-100 [&_code]:px-1 [&_code]:text-sm",
          ].join(" ")}
        >
          {children}
        </div>

        {/* Post footer */}
        <hr className="my-10 border-gray-200" />
        <p className="text-sm text-gray-400">
          <em>
            From the EatoBiotics book —{" "}
            <a href="https://eatobiotics.com" className="underline">
              eatobiotics.com
            </a>
          </em>
        </p>
      </article>

      {/* ── Bottom copy reminder ──────────────────────────────────────────────── */}
      <div className="border-t border-amber-200 bg-amber-50 px-4 py-4">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3">
          <p className="text-xs text-amber-700">
            Ready to post? Copy the chapter above and paste it into Substack.
          </p>
          <CopyButton targetId="substack-content" />
        </div>
      </div>

    </div>
  )
}
