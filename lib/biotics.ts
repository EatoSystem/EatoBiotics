/**
 * The 3 Biotics — shared content for the dark "Foundation" section reused
 * across system pages (see components/systems/system-foundation.tsx).
 *
 * Mirrors the copy shape already hand-written per page in app/you/page.tsx
 * and app/family/page.tsx, generalised so it reads correctly regardless of
 * which system page it appears on.
 */

export interface BioticCard {
  number: string
  title: string
  verb: string
  accent: string
  gradient: string
  body: string
  examples: string[]
}

export const BIOTICS_CARDS: BioticCard[] = [
  {
    number: "01",
    title: "Prebiotics",
    verb: "Feed",
    accent: "var(--icon-lime)",
    gradient: "linear-gradient(90deg, var(--icon-lime), var(--icon-green))",
    body: "The fibres and compounds in everyday foods that feed your gut bacteria — the foundation every system builds on.",
    examples: ["Oats", "Bananas", "Garlic", "Beans"],
  },
  {
    number: "02",
    title: "Probiotics",
    verb: "Add",
    accent: "var(--icon-green)",
    gradient: "linear-gradient(90deg, var(--icon-green), var(--icon-teal))",
    body: "Living microorganisms from fermented foods — one of the most powerful ways to diversify your gut bacteria.",
    examples: ["Yogurt", "Kefir", "Cheese", "Kimchi"],
  },
  {
    number: "03",
    title: "Postbiotics",
    verb: "Produce",
    accent: "var(--icon-teal)",
    gradient: "linear-gradient(90deg, var(--icon-teal), var(--icon-yellow))",
    body: "The compounds your gut bacteria produce in return — driving energy, immunity, mood, and long-term health.",
    examples: ["SCFAs", "B vitamins", "Butyrate"],
  },
]
