"use client"

/**
 * ExperienceNav — the three-experience spine of the account.
 *
 * Today · This Week · My Food System — the product's three ways of looking at
 * the same living Food System (what happened today / how I'm changing / the
 * complete system). A slim pill row that highlights the active route; rendered
 * at the top of each experience page so they read as one product, not three
 * pages. Dark or light variant to sit on the stage or the cream canvas.
 */

import Link from "next/link"
import { usePathname } from "next/navigation"
import { CalendarDays, TrendingUp, Activity } from "lucide-react"

const EXPERIENCES = [
  { href: "/account/today", label: "Today", icon: CalendarDays },
  { href: "/account/this-week", label: "This Week", icon: TrendingUp },
  { href: "/account/twin", label: "My Food System", icon: Activity },
] as const

export function ExperienceNav({ variant = "light" }: { variant?: "light" | "dark" }) {
  const pathname = usePathname()
  const dark = variant === "dark"

  return (
    <nav aria-label="Your Food System experiences" className="flex flex-wrap items-center gap-1.5">
      {EXPERIENCES.map(({ href, label, icon: Icon }) => {
        const active = pathname === href
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors"
            style={
              active
                ? { background: "linear-gradient(135deg, #4CB648, #2DAA6E)", color: "white", boxShadow: "0 3px 10px rgba(45,170,110,0.35)" }
                : dark
                  ? { background: "rgba(253,251,247,0.06)", color: "rgba(253,251,247,0.7)", border: "1px solid rgba(253,251,247,0.14)" }
                  : { background: "white", color: "var(--muted-foreground)", border: "1px solid var(--border)" }
            }
          >
            <Icon size={13} /> {label}
          </Link>
        )
      })}
    </nav>
  )
}
