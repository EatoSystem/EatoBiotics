import type { ComponentType } from "react"
import {
  Leaf,
  Compass,
  Activity,
  Dumbbell,
  Brain,
  Users,
  UtensilsCrossed,
  ScanLine,
  Calendar,
  BookOpen,
  Library,
  Zap,
  Mic,
  Smartphone,
} from "lucide-react"

/**
 * lib/nav.ts — single source of truth for site navigation.
 *
 * Consumed by components/nav.tsx (header, desktop + mobile) and
 * components/footer.tsx so the two can never drift apart. Add or move a
 * destination here and both surfaces update together.
 *
 * Grouping model (intent-based):
 * - Programs → the product lines (what you can join / follow)
 * - Food     → daily-use tools
 * - Learn    → content and media
 * Pricing is a standalone top-level link — the money page is always visible.
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

export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Programs",
    items: [
      { href: "/biotics",    label: "Gut Health",      description: "The 3-part Biotics framework",                icon: Leaf },
      { href: "/stability",  label: "Stability™",      description: "Steadier, more predictable digestion",        icon: Compass },
      { href: "/eatobetics", label: "Glucose & GLP-1", description: "EatoBetics — steady glucose, protected muscle", icon: Activity },
      { href: "/eatosports", label: "Sports",          description: "EatoSports — fuel performance from the gut",  icon: Dumbbell },
      { href: "/mind",       label: "Mind",            description: "The food system inside your mind",            icon: Brain },
      { href: "/family",     label: "Family",          description: "The food system for the whole household",     icon: Users },
    ],
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
      { href: "/book",      label: "The Book",          description: "Read EatoBiotics chapter by chapter",      icon: BookOpen },
      { href: "/books",     label: "The Trilogy",       description: "Three books. One complete system.",        icon: Library },
      { href: "/gut-brain", label: "Gut-Brain Science", description: "How your gut shapes your mind",            icon: Zap },
      { href: "/podcast",   label: "The Podcast",       description: "Conversations about food & performance",   icon: Mic },
      { href: "/app",       label: "The App",           description: "Your daily plate companion",               icon: Smartphone },
    ],
  },
]

/** Standalone top-level header links (rendered after the dropdown groups). */
export const NAV_LINKS: Array<{ href: string; label: string }> = [
  { href: "/pricing", label: "Pricing" },
  { href: "/about",   label: "About" },
]
