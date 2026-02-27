import type { Metadata } from "next"
import { notFound } from "next/navigation"
import fs from "fs"
import path from "path"
import { MDXRemote } from "next-mdx-remote/rsc"

import { getChapterByNumber } from "@/lib/chapters"
import { ReedsyTemplate } from "@/components/book/reedsy/reedsy-template"
import { reedsyComponents } from "@/components/book/reedsy/reedsy-components"

const CHAPTER_NUMBER = 22

export async function generateMetadata(): Promise<Metadata> {
  const chapter = getChapterByNumber(CHAPTER_NUMBER)
  if (!chapter) return {}
  return {
    title: `Reedsy Export — Chapter ${chapter.number}: ${chapter.title}`,
    robots: { index: false },
  }
}

export default async function BookChapter22ReedsyPage() {
  const chapter = getChapterByNumber(CHAPTER_NUMBER)
  if (!chapter) return notFound()

  const mdxPath = path.join(process.cwd(), "content", "book", `chapter-${CHAPTER_NUMBER}.mdx`)
  if (!fs.existsSync(mdxPath)) return notFound()

  const source = fs.readFileSync(mdxPath, "utf-8")

  return (
    <ReedsyTemplate chapter={chapter}>
      <MDXRemote source={source} components={reedsyComponents} />
    </ReedsyTemplate>
  )
}
