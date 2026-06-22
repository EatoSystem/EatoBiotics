/* ── Market resolution ───────────────────────────────────────────────────
 * Maps a country (ISO-2 code, a friendly URL slug, or a display name) onto a
 * "market" — the per-country personalisation profile used by the waitlist quiz,
 * the mini report, and the /c/[country] landing pages. Many countries collapse
 * onto a handful of cultural FOOD_PROFILEs so we author ~8 sets, not 200.
 *
 * Currency is carried for a future multi-currency phase; we do NOT render
 * converted prices yet (that needs real Stripe prices/FX).
 */

export type FoodProfile =
  | "western_eu" | "nordic" | "east_asian" | "south_asian"
  | "latin" | "mena" | "anz" | "north_america"

export type Hemisphere = "north" | "south"
export type Units = "metric" | "imperial"

export interface Market {
  code: string         // ISO-2 (e.g. "IE"); "" when unknown
  name: string         // display name (matches the quiz country dropdown where applicable)
  flag: string         // emoji flag
  foodProfile: FoodProfile
  hemisphere: Hemisphere
  currency: string     // ISO-4217, for a future phase
  currencySymbol: string
  units: Units
  locale: string       // language code — "en" for now
}

export const DEFAULT_MARKET: Market = {
  code: "", name: "your country", flag: "🌍",
  foodProfile: "western_eu", hemisphere: "north",
  currency: "EUR", currencySymbol: "€", units: "metric", locale: "en",
}

function m(p: Partial<Market> & Pick<Market, "code" | "name" | "flag" | "foodProfile" | "hemisphere">): Market {
  return { ...DEFAULT_MARKET, ...p }
}

/** Keyed by ISO-2 country code. Unlisted countries fall back to DEFAULT_MARKET. */
export const MARKETS: Record<string, Market> = {
  IE: m({ code: "IE", name: "Ireland", flag: "🇮🇪", foodProfile: "western_eu", hemisphere: "north" }),
  GB: m({ code: "GB", name: "United Kingdom", flag: "🇬🇧", foodProfile: "western_eu", hemisphere: "north", currency: "GBP", currencySymbol: "£" }),
  US: m({ code: "US", name: "United States", flag: "🇺🇸", foodProfile: "north_america", hemisphere: "north", currency: "USD", currencySymbol: "$", units: "imperial" }),
  CA: m({ code: "CA", name: "Canada", flag: "🇨🇦", foodProfile: "north_america", hemisphere: "north", currency: "CAD", currencySymbol: "$" }),
  AU: m({ code: "AU", name: "Australia", flag: "🇦🇺", foodProfile: "anz", hemisphere: "south", currency: "AUD", currencySymbol: "$" }),
  NZ: m({ code: "NZ", name: "New Zealand", flag: "🇳🇿", foodProfile: "anz", hemisphere: "south", currency: "NZD", currencySymbol: "$" }),
  DE: m({ code: "DE", name: "Germany", flag: "🇩🇪", foodProfile: "western_eu", hemisphere: "north", locale: "de" }),
  FR: m({ code: "FR", name: "France", flag: "🇫🇷", foodProfile: "western_eu", hemisphere: "north", locale: "fr" }),
  ES: m({ code: "ES", name: "Spain", flag: "🇪🇸", foodProfile: "western_eu", hemisphere: "north", locale: "es" }),
  IT: m({ code: "IT", name: "Italy", flag: "🇮🇹", foodProfile: "western_eu", hemisphere: "north" }),
  NL: m({ code: "NL", name: "Netherlands", flag: "🇳🇱", foodProfile: "western_eu", hemisphere: "north" }),
  PT: m({ code: "PT", name: "Portugal", flag: "🇵🇹", foodProfile: "western_eu", hemisphere: "north" }),
  SE: m({ code: "SE", name: "Sweden", flag: "🇸🇪", foodProfile: "nordic", hemisphere: "north", currency: "SEK", currencySymbol: "kr" }),
  NO: m({ code: "NO", name: "Norway", flag: "🇳🇴", foodProfile: "nordic", hemisphere: "north", currency: "NOK", currencySymbol: "kr" }),
  DK: m({ code: "DK", name: "Denmark", flag: "🇩🇰", foodProfile: "nordic", hemisphere: "north", currency: "DKK", currencySymbol: "kr" }),
  FI: m({ code: "FI", name: "Finland", flag: "🇫🇮", foodProfile: "nordic", hemisphere: "north" }),
  IS: m({ code: "IS", name: "Iceland", flag: "🇮🇸", foodProfile: "nordic", hemisphere: "north", currency: "ISK", currencySymbol: "kr" }),
  KR: m({ code: "KR", name: "South Korea", flag: "🇰🇷", foodProfile: "east_asian", hemisphere: "north", currency: "KRW", currencySymbol: "₩", locale: "en" }),
  JP: m({ code: "JP", name: "Japan", flag: "🇯🇵", foodProfile: "east_asian", hemisphere: "north", currency: "JPY", currencySymbol: "¥" }),
  CN: m({ code: "CN", name: "China", flag: "🇨🇳", foodProfile: "east_asian", hemisphere: "north", currency: "CNY", currencySymbol: "¥" }),
  SG: m({ code: "SG", name: "Singapore", flag: "🇸🇬", foodProfile: "east_asian", hemisphere: "north", currency: "SGD", currencySymbol: "$" }),
  IN: m({ code: "IN", name: "India", flag: "🇮🇳", foodProfile: "south_asian", hemisphere: "north", currency: "INR", currencySymbol: "₹" }),
  PK: m({ code: "PK", name: "Pakistan", flag: "🇵🇰", foodProfile: "south_asian", hemisphere: "north", currency: "PKR", currencySymbol: "₨" }),
  BR: m({ code: "BR", name: "Brazil", flag: "🇧🇷", foodProfile: "latin", hemisphere: "south", currency: "BRL", currencySymbol: "R$" }),
  MX: m({ code: "MX", name: "Mexico", flag: "🇲🇽", foodProfile: "latin", hemisphere: "north", currency: "MXN", currencySymbol: "$" }),
  AR: m({ code: "AR", name: "Argentina", flag: "🇦🇷", foodProfile: "latin", hemisphere: "south", currency: "ARS", currencySymbol: "$" }),
  AE: m({ code: "AE", name: "United Arab Emirates", flag: "🇦🇪", foodProfile: "mena", hemisphere: "north", currency: "AED", currencySymbol: "د.إ" }),
  SA: m({ code: "SA", name: "Saudi Arabia", flag: "🇸🇦", foodProfile: "mena", hemisphere: "north", currency: "SAR", currencySymbol: "﷼" }),
  ZA: m({ code: "ZA", name: "South Africa", flag: "🇿🇦", foodProfile: "anz", hemisphere: "south", currency: "ZAR", currencySymbol: "R" }),
}

/** Friendly URL slugs for the /c/[country] landing pages → ISO-2 code. */
export const COUNTRY_SLUGS: Record<string, string> = {
  ie: "IE", uk: "GB", gb: "GB", us: "US", ca: "CA", au: "AU", nz: "NZ",
}

/** The curated set of slugs we statically build landing pages for. */
export const LANDING_SLUGS = ["ie", "uk", "us", "ca", "au", "nz"]

export function resolveMarket(code?: string | null): Market {
  if (!code) return DEFAULT_MARKET
  return MARKETS[code.toUpperCase()] ?? { ...DEFAULT_MARKET, code: code.toUpperCase() }
}

export function marketBySlug(slug: string): Market | null {
  const code = COUNTRY_SLUGS[slug.toLowerCase()]
  return code ? (MARKETS[code] ?? null) : null
}

export function marketByName(name?: string | null): Market | null {
  if (!name) return null
  const target = name.trim().toLowerCase()
  return Object.values(MARKETS).find((mk) => mk.name.toLowerCase() === target) ?? null
}

export interface CountryRank { name: string; count: number; flag: string; rank: number }

/** Tally a list of country names into a flagged, ranked leaderboard (desc by count). */
export function rankCountries(names: Array<string | null | undefined>): CountryRank[] {
  const counts = new Map<string, number>()
  for (const n of names) {
    const c = n?.trim()
    if (c) counts.set(c, (counts.get(c) ?? 0) + 1)
  }
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count, flag: marketByName(name)?.flag ?? "🌍" }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .map((e, i) => ({ ...e, rank: i + 1 }))
}
