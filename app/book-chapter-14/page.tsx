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

const CHAPTER_NUMBER = 14

const mdxComponents = {
  ChapterCallout,
  ChapterStat,
  ChapterPullQuote,
  ChapterKeyTakeaways,
  Takeaway,
  ImagePlaceholder,
  ChapterFoodCard,
}

export async function generateMetadata(): Promise<Metadata> {
  const chapter = getChapterByNumber(CHAPTER_NUMBER)
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

export default async function BookChapter14Page() {
  const chapter = getChapterByNumber(CHAPTER_NUMBER)
  if (!chapter) return notFound()

  const mdxPath = path.join(process.cwd(), "content", "book", `chapter-${CHAPTER_NUMBER}.mdx`)
  if (!fs.existsSync(mdxPath)) return notFound()

  const source = fs.readFileSync(mdxPath, "utf-8")

  const prev = getPreviousChapter(CHAPTER_NUMBER)
  const next = getNextChapter(CHAPTER_NUMBER)

  return (
    <>
      <ChapterTemplate chapter={chapter}>
        <MDXRemote source={source} components={mdxComponents} />
        <ChapterNav current={chapter} prev={prev} next={next} />
      </ChapterTemplate>
    </>
  )
}
