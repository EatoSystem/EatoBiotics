import type { ComponentType } from "react"
import {
  UtensilsCrossed,
  BookOpen,
  Library,
  Mic,
  Route,
  LifeBuoy,
} from "lucide-react"

/**
 * lib/nav.ts — single source of truth for site navigation.
 *
 * Consumed by components/nav.tsx (header) and components/footer.tsx (full
 * NAV_GROUPS columns) so the two can never drift.
 *
 * ══ WHAT V1 NAVIGATION IS FOR ═══════════════════════════════════════════════
 *
 * V1 sells three things: the free Food System Assessment, the €49 Personal
 * Food System Consultation, and EatoBiotics Member. Navigation exists to make
 * that funnel findable and to let someone read the public library. It does not
 * exist to advertise the platform's future.
 *
 * ══ WHY THE FOOD SYSTEMS MEGA MENU IS GONE ══════════════════════════════════
 *
 * It was generated from the lib/systems.ts catalog, and every destination in it
 * — You, Family, Stability, Glucose, Mind, Performance, Recovery, Longevity,
 * Pregnancy, Birth, Baby — is outside the V1 launch product and now refuses at
 * runtime (see lib/v1-surface.ts). A menu of eleven doors that all answer 404
 * is worse than no menu, and "Coming soon" on nine of them was already telling
 * a launch visitor that most of what they can see is not for sale.
 *
 * The catalog itself is untouched. lib/systems.ts is still the product
 * architecture, still drives the system landing pages, and reinstating the
 * menu after launch means restoring this file's group and the routes'
 * classification — not rebuilding anything.
 *
 * Grouping model, as it now stands:
 * - Food  → the public food library
 * - Learn → content, media, and the how-it-works spine
 * Pricing, About and Help are standalone top-level links; the CTA is always
 * visible.
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

/* ── Group config (footer renders all of this) ────────────────────────────── */

export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Food",
    items: [
      { href: "/food", label: "Food Library", description: "Every food profiled for your gut", icon: UtensilsCrossed },
    ],
  },
  {
    label: "Learn",
    items: [
      { href: "/method",    label: "How It Works",      description: "The method, step by step",              icon: Route },
      { href: "/book",      label: "The Book",          description: "Read EatoBiotics chapter by chapter",   icon: BookOpen },
      { href: "/books",     label: "The Trilogy",       description: "Three books. One complete system.",     icon: Library },
      { href: "/podcast",   label: "The Podcast",       description: "Conversations about food & performance", icon: Mic },
      { href: "/help",      label: "Help",              description: "Answers, and how to reach us",          icon: LifeBuoy },
    ],
  },
]

/** The header dropdowns. */
export const HEADER_DROPDOWN_GROUPS: NavGroup[] = NAV_GROUPS

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
