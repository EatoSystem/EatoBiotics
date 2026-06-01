import { createChapterPage, generateChapterMetadata } from "@/components/book/chapter/chapter-page-factory"

export const generateMetadata = generateChapterMetadata(5)
export default createChapterPage(5)
