import { createChapterPage, generateChapterMetadata } from "@/components/book/chapter/chapter-page-factory"

export const generateMetadata = generateChapterMetadata(20)
export default createChapterPage(20)
