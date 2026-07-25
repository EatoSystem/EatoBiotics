import type { ComponentType } from "react"
import {
  UtensilsCrossed,
  ScanLine,
  Calendar,
  BookOpen,
  Library,
  Zap,
  Mic,
  Smartphone,
  Orbit,
  Route,
} from "lucide-react"
import { SYSTEMS, SYSTEM_KEYS, FAMILY_META, systemsByFamily, type SystemFamily } from "@/lib/systems"

/**
 * lib/nav.ts — single source of truth for site navigation.
 *
 * Consumed by components/nav.tsx (header: mega menu + dropdowns) and
 * components/footer.tsx (full NAV_GROUPS columns) so the two can never drift.
 *
 * Grouping model (product architecture):
 * - Food Systems → the platform itself, generated from the lib/systems.ts
 *   catalog (Foundation / Health / Life) — never hand-listed here.
 * - Food         → daily-use tools
 * - Learn        → content, media, and the how-it-works spine
 * Pricing and About are standalone top-level links; the CTA is always visible.
 */

export interface NavItem {
  href: string
  label: string
  description: string
  icon: ComponentType<{ size?: number; className?: string }>
}

export interface NavGroup {
  label: string
  items: NavItem[]
}

/* ── Food Systems (catalog-driven — the mega menu + footer column) ────────── */

/** A mega-menu entry: a NavItem plus the system's visual identity + status. */
export interface MegaMenuItem extends NavItem {
  accent: string
  gradient: string
  comingSoon: boolean
}

export interface MegaMenuGroup {
  family: SystemFamily
  label: string
  blurb: string
  items: MegaMenuItem[]
}

function toMegaItem(key: (typeof SYSTEM_KEYS)[number]): MegaMenuItem {
  const s = SYSTEMS[key]
  return {
    href: s.href,
    label: s.label,
    description: s.tagline,
    icon: s.icon,
    accent: s.accent,
    gradient: s.gradient,
    comingSoon: s.status !== "live",
  }
}

/** Foundation / Health / Life sections for the header mega menu. */
export const MEGA_MENU_GROUPS: MegaMenuGroup[] = (
  ["foundation", "health", "life"] as SystemFamily[]
).map((family) => ({
  family,
  label: FAMILY_META[family].label,
  blurb: FAMILY_META[family].blurb,
  items: systemsByFamily(family).map((s) => toMegaItem(s.key)),
}))

/* ── Full group config (footer renders all of this) ───────────────────────── */

export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Food Systems",
    // Generated from the catalog so the footer and menus can never drift from
    // the product architecture in lib/systems.ts.
    items: SYSTEM_KEYS.map((k) => {
      const s = SYSTEMS[k]
      return { href: s.href, label: s.label, description: s.tagline, icon: s.icon }
    }),
  },
  {
    label: "Food",
    items: [
      { href: "/food",    label: "Food Library",  description: "Every food profiled for your gut",      icon: UtensilsCrossed },
      { href: "/analyse", label: "Score My Meal", description: "Describe a plate, get its Biotics score", icon: ScanLine },
      { href: "/today",   label: "Today's Food",  description: "A new food spotlight, daily",            icon: Calendar },
    ],
  },
  {
    label: "Learn",
    items: [
      { href: "/digital-twin", label: "Your Food System",  description: "The living model behind EatoBiotics",      icon: Orbit },
      { href: "/method",       label: "How It Works",      description: "The method, step by step",                  icon: Route },
      { href: "/book",         label: "The Book",          description: "Read EatoBiotics chapter by chapter",      icon: BookOpen },
      { href: "/books",        label: "The Trilogy",       description: "Three books. One complete system.",        icon: Library },
      { href: "/gut-brain",    label: "Gut-Brain Science", description: "How your gut shapes your mind",            icon: Zap },
      { href: "/podcast",      label: "The Podcast",       description: "Conversations about food & performance",   icon: Mic },
      { href: "/app",          label: "The App",           description: "Your daily plate companion",               icon: Smartphone },
    ],
  },
]

/** The standard header dropdowns (the Food Systems group gets the mega menu). */
export const HEADER_DROPDOWN_GROUPS: NavGroup[] = NAV_GROUPS.filter(
  (g) => g.label === "Food" || g.label === "Learn",
)

/** Standalone top-level header links rendered after the menus. */
export const NAV_LINKS: Array<{ href: string; label: string }> = [
  { href: "/pricing", label: "Pricing" },
  { href: "/about",   label: "About" },
]

/* ── Chromeless routes ─────────────────────────────────────────────────────
 * Routes that render their own full application shell and must NOT show the
 * public marketing header/footer. Currently the private Content Studio (/cms),
 * which supplies its own header, nav, and footer via app/cms/layout.tsx —
 * without this, /cms would show doubled chrome (marketing nav/footer wrapping
 * the CMS shell).
 *
 * PRESENTATION ONLY — this is NOT a security control. CMS access is enforced
 * server-side and fail-closed by the proxy.ts default-deny (bare 404 without a
 * valid admin cookie), the app/cms/layout.tsx admin gate, and requireCmsAdmin
 * on every /api/cms route. Hiding the marketing chrome changes nothing about
 * who can reach /cms.
 */
export function hidesSiteChrome(pathname: string): boolean {
  return pathname === "/cms" || pathname.startsWith("/cms/")
}
