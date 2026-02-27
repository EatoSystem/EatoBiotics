import type { Metadata } from "next"
import { notFound } from "next/navigation"
import fs from "fs"
import path from "path"
import { MDXRemote } from "next-mdx-remote/rsc"

import { getChapterByNumber } from "@/lib/chapters"
import { PrintTemplate } from "@/components/book/print/print-template"
import { printComponents } from "@/components/book/print/print-components"

const CHAPTER_NUMBER = 18

export async function generateMetadata(): Promise<Metadata> {
  const chapter = getChapterByNumber(CHAPTER_NUMBER)
  if (!chapter) return {}
  return {
    title: `Print Export — Chapter ${chapter.number}: ${chapter.title}`,
    robots: { index: false },
  }
}

export default async function BookChapter18PrintPage() {
  const chapter = getChapterByNumber(CHAPTER_NUMBER)
  if (!chapter) return notFound()

  const mdxPath = path.join(process.cwd(), "content", "book", `chapter-${CHAPTER_NUMBER}.mdx`)
  if (!fs.existsSync(mdxPath)) return notFound()

  const source = fs.readFileSync(mdxPath, "utf-8")

  return (
    <PrintTemplate chapter={chapter}>
      <MDXRemote source={source} components={printComponents} />
    </PrintTemplate>
  )
}
