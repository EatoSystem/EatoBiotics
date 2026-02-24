export type ChapterStatus = "published" | "coming-soon" | "draft"

export interface Chapter {
  number: number
  slug: string          // e.g. "chapter-1"
  part: string          // "I" | "II" | ...
  partTitle: string
  title: string
  description: string
  status: ChapterStatus
  publishedAt?: string  // ISO date string
  readingTime?: number  // minutes
  substackUrl?: string  // link once posted to Substack
}

// Part colours — index matches part order (0-based)
export const PART_COLORS = [
  "var(--icon-lime)",
  "var(--icon-green)",
  "var(--icon-teal)",
  "var(--icon-yellow)",
  "var(--icon-orange)",
]

export const chapters: Chapter[] = [
  // ── PART I ──────────────────────────────────────────────────────────────────
  {
    number: 1,
    slug: "chapter-1",
    part: "I",
    partTitle: "The Food System Inside You",
    title: "The Food System Inside You",
    description: "What the microbiome is, what it controls, and why your gut is the foundation of health.",
    status: "published",
    publishedAt: "2026-02-23",
    readingTime: 25,
  },
  {
    number: 2,
    slug: "chapter-2",
    part: "I",
    partTitle: "The Food System Inside You",
    title: "Modern Diets Broke the System",
    description: "How ultra-processed food, low fiber, stress, poor sleep, alcohol, and antibiotics disrupt your internal ecosystem.",
    status: "published",
    publishedAt: "2026-02-24",
    readingTime: 28,
  },
  {
    number: 3,
    slug: "chapter-3",
    part: "I",
    partTitle: "The Food System Inside You",
    title: "The 3 Biotics Framework",
    description: "Prebiotics, probiotics, postbiotics — your core model, simple and scalable.",
    status: "published",
    publishedAt: "2026-02-24",
    readingTime: 26,
  },
  {
    number: 4,
    slug: "chapter-4",
    part: "I",
    partTitle: "The Food System Inside You",
    title: "The EatoBiotics Method",
    description: "Your daily and weekly rules for rebuilding the system with consistency, not perfection.",
    status: "coming-soon",
  },

  // ── PART II ─────────────────────────────────────────────────────────────────
  {
    number: 5,
    slug: "chapter-5",
    part: "II",
    partTitle: "The EatoBiotics Foods",
    title: "Prebiotic Foods",
    description: "Fiber, resistant starch, legumes, whole grains, vegetables, seeds — the soil your microbiome grows in.",
    status: "coming-soon",
  },
  {
    number: 6,
    slug: "chapter-6",
    part: "II",
    partTitle: "The EatoBiotics Foods",
    title: "Probiotic Foods",
    description: "Fermented foods, live cultures, what to buy, what matters on labels, how to use them every day.",
    status: "coming-soon",
  },
  {
    number: 7,
    slug: "chapter-7",
    part: "II",
    partTitle: "The EatoBiotics Foods",
    title: "Postbiotic Results",
    description: "Short-chain fatty acids, gut lining support, inflammation balance — what your microbiome creates when you feed it well.",
    status: "coming-soon",
  },
  {
    number: 8,
    slug: "chapter-8",
    part: "II",
    partTitle: "The EatoBiotics Foods",
    title: "The Polyphenol Advantage",
    description: "Berries, herbs, spices, cocoa, olive oil, coffee, tea — the upgrade layer that boosts gut performance.",
    status: "coming-soon",
  },
  {
    number: 9,
    slug: "chapter-9",
    part: "II",
    partTitle: "The EatoBiotics Foods",
    title: "Protein & Fat (The EatoBiotics Way)",
    description: "How to include protein and fats without extremes — supporting digestion, blood sugar, and long-term balance.",
    status: "coming-soon",
  },

  // ── PART III ────────────────────────────────────────────────────────────────
  {
    number: 10,
    slug: "chapter-10",
    part: "III",
    partTitle: "The 5 Outcomes",
    title: "Digestion",
    description: "Bloating, regularity, tolerance, meal timing, chewing, and fast wins.",
    status: "coming-soon",
  },
  {
    number: 11,
    slug: "chapter-11",
    part: "III",
    partTitle: "The 5 Outcomes",
    title: "Immunity",
    description: "The gut-immune connection and how to build resilience through food and daily habits.",
    status: "coming-soon",
  },
  {
    number: 12,
    slug: "chapter-12",
    part: "III",
    partTitle: "The 5 Outcomes",
    title: "Energy & Metabolism",
    description: "Blood sugar stability, fiber + protein strategy, and the end of crash eating.",
    status: "coming-soon",
  },
  {
    number: 13,
    slug: "chapter-13",
    part: "III",
    partTitle: "The 5 Outcomes",
    title: "Mood & Mind",
    description: "The gut-brain system: emotional steadiness, clarity, and stress resilience.",
    status: "coming-soon",
  },
  {
    number: 14,
    slug: "chapter-14",
    part: "III",
    partTitle: "The 5 Outcomes",
    title: "Recovery",
    description: "Inflammation, sleep, repair, training support, and building a calmer nervous system through nutrition.",
    status: "coming-soon",
  },

  // ── PART IV ─────────────────────────────────────────────────────────────────
  {
    number: 15,
    slug: "chapter-15",
    part: "IV",
    partTitle: "The Practical System",
    title: "The EatoBiotics Kitchen",
    description: "Your setup, pantry staples, shopping rhythm, and chef shortcuts that make consistency easy.",
    status: "coming-soon",
  },
  {
    number: 16,
    slug: "chapter-16",
    part: "IV",
    partTitle: "The Practical System",
    title: "The EatoBiotics Plate",
    description: "The signature meal formula: 2 plants + protein + fat + ferment + booster.",
    status: "coming-soon",
  },
  {
    number: 17,
    slug: "chapter-17",
    part: "IV",
    partTitle: "The Practical System",
    title: "The 7-Day Reset",
    description: "A realistic reset you can repeat anytime you drift off track.",
    status: "coming-soon",
  },
  {
    number: 18,
    slug: "chapter-18",
    part: "IV",
    partTitle: "The Practical System",
    title: "The 21-Day Build",
    description: "A deeper system to lock in routine and feel a noticeable change.",
    status: "coming-soon",
  },
  {
    number: 19,
    slug: "chapter-19",
    part: "IV",
    partTitle: "The Practical System",
    title: "The EatoBiotics Index",
    description: "Your scoring system for food quality: microbiome support, nutrients, ease, taste, access.",
    status: "coming-soon",
  },

  // ── PART V ──────────────────────────────────────────────────────────────────
  {
    number: 20,
    slug: "chapter-20",
    part: "V",
    partTitle: "Real Life + Long-Term Health",
    title: "The Travel & Busy Life Protocol",
    description: "Airport, hotel, and workday rules to stay consistent anywhere.",
    status: "coming-soon",
  },
  {
    number: 21,
    slug: "chapter-21",
    part: "V",
    partTitle: "Real Life + Long-Term Health",
    title: "Antibiotics: Protect, Support, Rebuild",
    description: "What happens to the microbiome and how to recover food-first.",
    status: "coming-soon",
  },
  {
    number: 22,
    slug: "chapter-22",
    part: "V",
    partTitle: "Real Life + Long-Term Health",
    title: "The EatoBiotics Lifestyle",
    description: "How to live this long-term — without obsession, tracking fatigue, or perfection pressure.",
    status: "coming-soon",
  },
  {
    number: 23,
    slug: "chapter-23",
    part: "V",
    partTitle: "Real Life + Long-Term Health",
    title: "EatoSystem",
    description: "The Food System.",
    status: "coming-soon",
  },
]

export function getChapterBySlug(slug: string): Chapter | undefined {
  return chapters.find((c) => c.slug === slug)
}

export function getChapterByNumber(number: number): Chapter | undefined {
  return chapters.find((c) => c.number === number)
}

export function getPublishedChapters(): Chapter[] {
  return chapters.filter((c) => c.status === "published")
}

export function getPreviousChapter(number: number): Chapter | undefined {
  return chapters.find((c) => c.number === number - 1)
}

export function getNextChapter(number: number): Chapter | undefined {
  return chapters.find((c) => c.number === number + 1)
}

// Map part roman numeral to 0-based index for colour lookup
export function partIndex(part: string): number {
  return ["I", "II", "III", "IV", "V"].indexOf(part)
}
