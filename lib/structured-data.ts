import type { Chapter } from "./chapters"

const SITE_URL = "https://eatobiotics.com"
const SITE_NAME = "EatoBiotics"
const AUTHOR_NAME = "Jason Curry"
const BOOK_TITLE = "EatoBiotics: The Food System Inside You"
const BOOK_DESCRIPTION =
  "A practical guide to the foods that strengthen your microbiome and improve how you feel day to day — digestion, immunity, energy, mood, and recovery."

/* ── Organisation (appears on every page via layout.tsx) ─────────────── */
export function generateOrganizationSchema() {
  return {
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: {
      "@type": "ImageObject",
      url: `${SITE_URL}/eatobiotics-icon.webp`,
    },
    sameAs: [
      "https://eatobiotics.substack.com/",
    ],
  }
}

/* ── Book (appears on /book) ─────────────────────────────────────────── */
export function generateBookSchema() {
  return {
    "@type": "Book",
    name: BOOK_TITLE,
    description: BOOK_DESCRIPTION,
    author: {
      "@type": "Person",
      name: AUTHOR_NAME,
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
    },
    url: `${SITE_URL}/book`,
    inLanguage: "en",
    numberOfPages: 25,
    bookFormat: "https://schema.org/EBook",
  }
}

/* ── Chapter / Article (appears on each /book-chapter-N) ─────────────── */
export function generateChapterSchema(chapter: Chapter) {
  const url = `${SITE_URL}/book-chapter-${chapter.number}`
  const wordCount = chapter.readingTime ? chapter.readingTime * 238 : undefined
  const timeRequired = chapter.readingTime
    ? `PT${chapter.readingTime}M`
    : undefined

  return {
    "@type": "Article",
    headline: `Chapter ${chapter.number}: ${chapter.title}`,
    description: chapter.description,
    author: {
      "@type": "Person",
      name: AUTHOR_NAME,
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/eatobiotics-icon.webp`,
      },
    },
    url,
    mainEntityOfPage: url,
    datePublished: chapter.publishedAt ?? undefined,
    inLanguage: "en",
    isPartOf: {
      "@type": "Book",
      name: BOOK_TITLE,
    },
    ...(wordCount ? { wordCount } : {}),
    ...(timeRequired ? { timeRequired } : {}),
  }
}

/* ── Breadcrumbs (appears on /book and /book-chapter-N) ──────────────── */
export function generateBreadcrumbSchema(chapter?: Chapter) {
  const items: { position: number; name: string; item: string }[] = [
    { position: 1, name: "Home", item: SITE_URL },
    { position: 2, name: "The Book", item: `${SITE_URL}/book` },
  ]

  if (chapter) {
    items.push({
      position: 3,
      name: `Chapter ${chapter.number}: ${chapter.title}`,
      item: `${SITE_URL}/book-chapter-${chapter.number}`,
    })
  }

  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item) => ({
      "@type": "ListItem",
      position: item.position,
      name: item.name,
      item: item.item,
    })),
  }
}
