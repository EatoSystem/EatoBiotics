import type { MetadataRoute } from "next"
import { chapters } from "@/lib/chapters"
import { foods } from "@/lib/foods"
import { FOOD_GOAL_SLUGS } from "@/lib/food-goals"
import { getSupabase } from "@/lib/supabase"

const SITE_URL = "https://eatobiotics.com"

// Re-query published recipes at most hourly so new content appears without a redeploy.
export const revalidate = 3600

type ChangeFreq = MetadataRoute.Sitemap[number]["changeFrequency"]

/** Curated public, indexable pages with crawl priority. */
const STATIC_PATHS: Array<{ path: string; priority: number; changeFrequency: ChangeFreq }> = [
  { path: "",                   priority: 1.0, changeFrequency: "weekly"  },
  { path: "/you",               priority: 0.8, changeFrequency: "monthly" },
  { path: "/assessment",        priority: 0.9, changeFrequency: "monthly" },
  { path: "/pricing",           priority: 0.9, changeFrequency: "monthly" },
  { path: "/book",              priority: 0.8, changeFrequency: "weekly"  },
  { path: "/books",             priority: 0.6, changeFrequency: "monthly" },
  { path: "/about",             priority: 0.6, changeFrequency: "monthly" },
  { path: "/eatosystem",        priority: 0.6, changeFrequency: "monthly" },
  { path: "/biotics",           priority: 0.6, changeFrequency: "monthly" },
  { path: "/glucose",           priority: 0.7, changeFrequency: "monthly" },
  { path: "/food",              priority: 0.6, changeFrequency: "monthly" },
  { path: "/gut-brain",         priority: 0.6, changeFrequency: "monthly" },
  { path: "/assessment-family", priority: 0.6, changeFrequency: "monthly" },
  { path: "/assessment-mind",   priority: 0.6, changeFrequency: "monthly" },
  { path: "/family",            priority: 0.5, changeFrequency: "monthly" },
  { path: "/mind",              priority: 0.5, changeFrequency: "monthly" },
  { path: "/performance",       priority: 0.5, changeFrequency: "monthly" },
  { path: "/anxiety",           priority: 0.5, changeFrequency: "monthly" },
  { path: "/adhd",              priority: 0.5, changeFrequency: "monthly" },
  { path: "/depression",        priority: 0.5, changeFrequency: "monthly" },
  { path: "/bipolar",           priority: 0.5, changeFrequency: "monthly" },
  { path: "/podcast",           priority: 0.5, changeFrequency: "monthly" },
  { path: "/roadmap",           priority: 0.4, changeFrequency: "monthly" },
  { path: "/privacy",           priority: 0.3, changeFrequency: "yearly"  },
  { path: "/terms",             priority: 0.3, changeFrequency: "yearly"  },
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.map((p) => ({
    url: `${SITE_URL}${p.path}`,
    lastModified: now,
    changeFrequency: p.changeFrequency,
    priority: p.priority,
  }))

  // Programmatic food content — individual profiles + "best foods for X" pages.
  const foodEntries: MetadataRoute.Sitemap = foods.map((f) => ({
    url: `${SITE_URL}/food/${f.slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.5,
  }))

  const goalEntries: MetadataRoute.Sitemap = FOOD_GOAL_SLUGS.map((g) => ({
    url: `${SITE_URL}/food/for/${g}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.6,
  }))

  // Only published book chapters — drafts and coming-soon are excluded from indexing.
  const chapterEntries: MetadataRoute.Sitemap = chapters
    .filter((c) => c.status === "published")
    .map((c) => ({
      url: `${SITE_URL}/book-chapter-${c.number}`,
      lastModified: c.publishedAt ? new Date(c.publishedAt) : now,
      changeFrequency: "yearly",
      priority: 0.7,
    }))

  // Published recipes from the database. Wrapped so a DB outage at build/ISR
  // time degrades gracefully to a still-valid sitemap rather than failing.
  let recipeEntries: MetadataRoute.Sitemap = []
  try {
    const supabase = getSupabase()
    if (supabase) {
      const { data } = await supabase
        .from("plate_recipes")
        .select("slug")
        .eq("is_published", true)
      recipeEntries = (data ?? [])
        .filter((r: { slug: string | null }) => !!r.slug)
        .map((r: { slug: string }) => ({
          url: `${SITE_URL}/recipe/${r.slug}`,
          lastModified: now,
          changeFrequency: "monthly",
          priority: 0.6,
        }))
    }
  } catch (err) {
    console.error("[sitemap] Failed to load recipes:", err)
  }

  return [...staticEntries, ...foodEntries, ...goalEntries, ...chapterEntries, ...recipeEntries]
}
