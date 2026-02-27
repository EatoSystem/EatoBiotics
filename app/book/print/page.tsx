import type { Metadata } from "next"
import fs from "fs"
import path from "path"
import { MDXRemote } from "next-mdx-remote/rsc"

import { chapters, PART_COLORS, partIndex } from "@/lib/chapters"
import { printComponents } from "@/components/book/print/print-components"
import {
  FullBookPrintTemplate,
  ChapterSection,
} from "@/components/book/print/full-book-print-template"

export const metadata: Metadata = {
  title: "Full Book Export — EatoBiotics: The Food System Inside You",
  robots: { index: false },
}

/* ── Group chapters by part ──────────────────────────────────────────── */
const parts = Array.from(
  chapters.reduce((map, ch) => {
    if (!map.has(ch.part)) {
      map.set(ch.part, { part: ch.part, title: ch.partTitle, chapters: [] as typeof chapters })
    }
    map.get(ch.part)!.chapters.push(ch)
    return map
  }, new Map<string, { part: string; title: string; chapters: typeof chapters }>()),
).map(([, v]) => v)

export default async function FullBookPrintPage() {
  /* Load all published chapter MDX files at build time */
  const publishedChapters = chapters.filter((ch) => ch.status === "published")

  const chapterSources = publishedChapters.map((ch) => {
    const mdxPath = path.join(process.cwd(), "content", "book", `chapter-${ch.number}.mdx`)
    const source = fs.existsSync(mdxPath) ? fs.readFileSync(mdxPath, "utf-8") : ""
    return { chapter: ch, source }
  })

  return (
    <FullBookPrintTemplate>
      {parts.map((part, partIdx) => {
        const color = PART_COLORS[partIdx % PART_COLORS.length]

        return (
          <div key={part.part}>
            {/* ── Part divider page ──────────────────────────────────── */}
            <div className="print-chapter-start flex min-h-[40vh] flex-col items-center justify-center text-center">
              <span
                className="flex h-14 w-14 items-center justify-center rounded-2xl font-serif text-xl font-bold text-white"
                style={{ backgroundColor: color }}
              >
                {part.part}
              </span>
              <p className="mt-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Part {part.part}
              </p>
              <h2 className="mt-2 font-serif text-3xl font-semibold text-foreground">
                {part.title}
              </h2>
              <div className="mt-4 flex flex-col gap-1">
                {part.chapters.map((ch) => (
                  <p key={ch.number} className="text-sm text-muted-foreground">
                    Chapter {ch.number}: {ch.title}
                  </p>
                ))}
              </div>
            </div>

            {/* ── Chapters in this part ──────────────────────────────── */}
            {part.chapters.map((ch) => {
              const found = chapterSources.find((cs) => cs.chapter.number === ch.number)
              if (!found || !found.source) return null

              return (
                <ChapterSection
                  key={ch.number}
                  number={ch.number}
                  title={ch.title}
                  part={ch.part}
                  partTitle={ch.partTitle}
                >
                  <MDXRemote source={found.source} components={printComponents} />
                </ChapterSection>
              )
            })}
          </div>
        )
      })}
    </FullBookPrintTemplate>
  )
}
