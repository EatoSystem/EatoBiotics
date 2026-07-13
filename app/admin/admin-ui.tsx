/**
 * app/admin/admin-ui.tsx
 *
 * Small presentational primitives shared across the admin dashboards
 * (admin-dashboard.tsx and waitlist/waitlist-ops-client.tsx) so the two views
 * stay visually consistent and don't drift.
 *
 * Deliberately NOT "use client" — none of these exports use hooks, event
 * handlers, or browser APIs, and app/cms/page.tsx (a Server Component) also
 * imports from here. A "use client" file's exports become opaque client
 * references on the server: a plain function call (timeAgo(...)) or a bare
 * component reference passed as a prop (icon={FileText}) both throw when
 * that happens from server-rendered code. Keeping this module boundary-free
 * is what makes it safe to use from both Server and Client components.
 */

/** Relative "time ago" label from an ISO timestamp. */
export function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return "Today"
  if (days === 1) return "Yesterday"
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months}mo ago`
  return `${Math.floor(months / 12)}y ago`
}

/** Coloured 0–100 score pill (green / yellow / orange bands). */
export function ScoreBadge({ score }: { score: number | null }) {
  if (score === null) return <span className="text-muted-foreground text-xs">—</span>
  const color = score >= 70 ? "var(--icon-green)" : score >= 45 ? "var(--icon-yellow)" : "var(--icon-orange)"
  return (
    <span
      className="inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-bold tabular-nums"
      style={{ background: `color-mix(in srgb, ${color} 15%, transparent)`, color }}
    >
      {score}
    </span>
  )
}

/** Headline metric tile.
 *
 *  `icon` takes an already-rendered element (e.g. `<FileText size={16} style={{ color }} />`),
 *  not a component type. Server Components (like app/cms/page.tsx) render this
 *  Client Component — passing a bare component/function reference as a prop
 *  across that boundary isn't serializable and throws at render time; a
 *  resolved React element is. Callers render their own icon so they control
 *  its size/color, matching how the icon and the background swatch have
 *  always shared `color`. */
export function StatCard({
  icon,
  value,
  label,
  sub,
  color = "var(--icon-green)",
}: {
  icon: React.ReactNode
  value: string | number
  label: string
  sub?: string
  color?: string
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-start justify-between mb-3">
        <div
          className="flex h-9 w-9 items-center justify-center rounded-xl"
          style={{ background: `color-mix(in srgb, ${color} 15%, transparent)` }}
        >
          {icon}
        </div>
      </div>
      <p className="text-3xl font-bold tabular-nums">{value}</p>
      <p className="mt-0.5 text-sm font-medium text-foreground/80">{label}</p>
      {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
    </div>
  )
}
