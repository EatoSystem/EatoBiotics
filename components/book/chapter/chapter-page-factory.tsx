import type { Metadata } from "next"
import { notFound } from "next/navigation"
import fs from "fs"
import path from "path"
import { MDXRemote } from "next-mdx-remote/rsc"

import { getChapterByNumber, getPreviousChapter, getNextChapter } from "@/lib/chapters"
import { ChapterTemplate } from "@/components/book/chapter/chapter-template"
import { ChapterNav } from "@/components/book/chapter/chapter-nav"
import { ChapterCallout } from "@/components/book/chapter/chapter-callout"
import { ChapterStat } from "@/components/book/chapter/chapter-stat"
import { ChapterPullQuote } from "@/components/book/chapter/chapter-pull-quote"
import { ChapterKeyTakeaways, Takeaway } from "@/components/book/chapter/chapter-key-takeaways"
import { ImagePlaceholder } from "@/components/book/chapter/image-placeholder"
import { ChapterFoodCard } from "@/components/book/chapter/chapter-food-card"
import { JsonLd } from "@/components/json-ld"
import { generateChapterSchema, generateBreadcrumbSchema } from "@/lib/structured-data"

// Components available inside MDX
const mdxComponents = {
  ChapterCallout,
  ChapterStat,
  ChapterPullQuote,
  ChapterKeyTakeaways,
  Takeaway,
  ImagePlaceholder,
  ChapterFoodCard,
}

/**
 * Builds the `generateMetadata` export for a book chapter route.
 * Each /book-chapter-N route keeps its own URL; only the chapter number differs.
 */
export function generateChapterMetadata(chapterNumber: number): () => Promise<Metadata> {
  return async () => {
    const chapter = getChapterByNumber(chapterNumber)
    if (!chapter) return {}
    return {
      title: `Chapter ${chapter.number}: ${chapter.title}`,
      description: chapter.description,
      openGraph: {
        title: `Chapter ${chapter.number}: ${chapter.title} — EatoBiotics`,
        description: chapter.description,
      },
    }
  }
}

/**
 * Builds the default page component for a book chapter route. Reads the
 * chapter's MDX from content/book/chapter-N.mdx and renders it inside the
 * shared chapter template with prev/next navigation and structured data.
 */
export function createChapterPage(chapterNumber: number) {
  return async function BookChapterPage() {
    const chapter = getChapterByNumber(chapterNumber)
    if (!chapter) return notFound()

    const mdxPath = path.join(process.cwd(), "content", "book", `chapter-${chapterNumber}.mdx`)
    if (!fs.existsSync(mdxPath)) return notFound()

    const source = fs.readFileSync(mdxPath, "utf-8")

    const prev = getPreviousChapter(chapterNumber)
    const next = getNextChapter(chapterNumber)

    return (
      <>
        <JsonLd data={generateChapterSchema(chapter)} />
        <JsonLd data={generateBreadcrumbSchema(chapter)} />
        <ChapterTemplate chapter={chapter}>
          <MDXRemote source={source} components={mdxComponents} />
          <ChapterNav current={chapter} prev={prev} next={next} />
        </ChapterTemplate>
      </>
    )
  }
}
