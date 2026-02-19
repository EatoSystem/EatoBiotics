export interface SubstackPost {
  title: string
  description: string
  link: string
  pubDate: string
  tag?: string
}

const FOOD_KEYWORDS = [
  "garlic", "onion", "banana", "oat", "yogurt", "kimchi", "sauerkraut",
  "kefir", "fiber", "ferment", "apple", "bean", "lentil", "asparagus",
  "leek", "artichoke", "honey", "miso", "tempeh", "kombucha", "chicory",
  "whole grain", "barley", "flaxseed", "seaweed", "mushroom", "turmeric",
  "ginger", "berr", "avocado", "almond", "walnut", "olive", "broccoli",
  "spinach", "sweet potato", "cocoa", "chocolate", "cheese", "pickle",
]

function autoTag(title: string): string | undefined {
  const lower = title.toLowerCase()
  if (lower.includes("chapter")) return "CHAPTER"
  for (const keyword of FOOD_KEYWORDS) {
    if (lower.includes(keyword)) return "FOOD PROFILE"
  }
  return undefined
}

function parseDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  } catch {
    return dateStr
  }
}

function parseXml(xml: string): SubstackPost[] {
  const items: SubstackPost[] = []
  const itemRegex = /<item>([\s\S]*?)<\/item>/g
  let match

  while ((match = itemRegex.exec(xml)) !== null) {
    const content = match[1]
    const title = content.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1]
      ?? content.match(/<title>(.*?)<\/title>/)?.[1]
      ?? "Untitled"
    const description =
      content.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/)?.[1]
        ?? content.match(/<description>(.*?)<\/description>/)?.[1]
        ?? ""
    const link = content.match(/<link>(.*?)<\/link>/)?.[1] ?? "#"
    const pubDate = content.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] ?? ""

    // Strip HTML tags from description
    const cleanDescription = description.replace(/<[^>]*>/g, "").trim()

    items.push({
      title,
      description: cleanDescription.substring(0, 200) + (cleanDescription.length > 200 ? "..." : ""),
      link,
      pubDate: parseDate(pubDate),
      tag: autoTag(title),
    })
  }

  return items
}

const MOCK_POSTS: SubstackPost[] = [
  {
    title: "Chapter 12: The Fermentation Kitchen",
    description:
      "How traditional fermentation techniques create living foods that deliver probiotics directly to your gut. A journey through cultures and cuisines that have known this for centuries.",
    link: "https://eatobiotics.substack.com/",
    pubDate: "January 15, 2026",
    tag: "CHAPTER",
  },
  {
    title: "Why Garlic is the Ultimate Prebiotic",
    description:
      "Garlic does more than flavor your food. Its unique inulin and fructooligosaccharides make it one of nature's most powerful prebiotics, feeding the bacteria that keep you healthy.",
    link: "https://eatobiotics.substack.com/",
    pubDate: "January 8, 2026",
    tag: "FOOD PROFILE",
  },
  {
    title: "The Postbiotic Revolution: What Your Bacteria Make For You",
    description:
      "Short-chain fatty acids, vitamins, neurotransmitters — your gut bacteria are a pharmaceutical factory. Understanding postbiotics changes how you think about food.",
    link: "https://eatobiotics.substack.com/",
    pubDate: "December 28, 2025",
  },
]

export async function fetchSubstackPosts(limit = 3): Promise<SubstackPost[]> {
  try {
    const res = await fetch("https://eatobiotics.substack.com/feed", {
      next: { revalidate: 3600 },
    })
    if (!res.ok) throw new Error("Feed fetch failed")
    const xml = await res.text()
    const posts = parseXml(xml)
    return posts.slice(0, limit)
  } catch {
    return MOCK_POSTS.slice(0, limit)
  }
}
