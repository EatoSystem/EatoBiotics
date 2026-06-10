"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const TABS = [
  { href: "/stability/assessment", label: "Assessment" },
  { href: "/stability/tracker", label: "Tracker" },
  { href: "/stability/insights", label: "Insights" },
  { href: "/stability/report", label: "Report" },
]

export function StabilitySubnav() {
  const path = usePathname()
  return (
    <div className="mx-auto mb-8 flex max-w-2xl flex-wrap items-center justify-center gap-2">
      {TABS.map((t) => {
        const active = path === t.href || (t.href === "/stability/assessment" && path === "/stability/results")
        return (
          <Link key={t.href} href={t.href}
            className="rounded-full px-4 py-2 text-sm font-semibold transition-colors"
            style={{
              background: active ? "linear-gradient(135deg, var(--icon-green), var(--icon-teal))" : "transparent",
              color: active ? "white" : "var(--muted-foreground)",
              border: active ? "none" : "1px solid var(--border)",
            }}>
            {t.label}
          </Link>
        )
      })}
    </div>
  )
}
