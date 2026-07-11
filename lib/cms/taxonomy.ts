/* ── Content Studio taxonomy — data, not UI hardcoding ────────────────────
   Structured classification axes for every content item. Kept as a data
   module (single source consumed by forms, filters, and validation) so values
   can evolve — and later move into cms_tags rows — without rewriting UI.
   Pathways mirror lib/systems.ts; geography mirrors lib/market.ts + lib/i18n.
──────────────────────────────────────────────────────────────────────── */

export const CONTENT_TYPES = [
  { value: "article",           label: "Article",            phase1: true },
  { value: "substack_post",     label: "Substack post",      phase1: true },
  { value: "newsletter",        label: "Newsletter",         phase1: true },
  { value: "social_post",       label: "Social post",        phase1: true },
  { value: "social_thread",     label: "Social thread",      phase1: true },
  { value: "social_carousel",   label: "Social carousel",    phase1: true },
  { value: "chapter_extract",   label: "Chapter extract",    phase1: true },
  { value: "website_page",      label: "Website content",    phase1: true },
  { value: "campaign_brief",    label: "Campaign brief",     phase1: true },
  { value: "press_release",     label: "Press release",      phase1: true },
  { value: "research_summary",  label: "Research summary",   phase1: true },
  { value: "country_adaptation",label: "Country adaptation", phase1: true },
  { value: "book",              label: "Book",               phase1: false },
  { value: "book_chapter",      label: "Book chapter",       phase1: false },
  { value: "image",             label: "Image",              phase1: false },
  { value: "video",             label: "Video",              phase1: false },
  { value: "audio",             label: "Audio",              phase1: false },
  { value: "advertisement",     label: "Advertisement",      phase1: false },
] as const
export type ContentType = (typeof CONTENT_TYPES)[number]["value"]

export const BRANDS = ["EatoBiotics", "EatoSystem", "EatoBetics", "EatoSports"] as const
export const FOUNDATIONS = ["Feed", "Seed", "Heal", "Prebiotics", "Probiotics", "Postbiotics"] as const
export const JOURNEY_STAGES = [
  "Assessment", "Food System Score", "Personal Insight", "Weekly Action", "Check-in", "Retest", "Progress",
] as const
export const AUDIENCES = ["You", "Family", "Parent", "Professional", "Partner", "Investor", "Media"] as const
export const PATHWAYS = [
  "Stability", "Glucose", "Mind", "Performance", "Recovery", "Longevity", "Sleep", "Heart",
] as const
export const GEOGRAPHY_SCOPES = ["Global", "Country", "Region", "Food Culture", "Language"] as const

export function isContentType(v: unknown): v is ContentType {
  return typeof v === "string" && CONTENT_TYPES.some((t) => t.value === v)
}

export function isPhase1ContentType(v: unknown): boolean {
  return typeof v === "string" && CONTENT_TYPES.some((t) => t.value === v && t.phase1)
}
