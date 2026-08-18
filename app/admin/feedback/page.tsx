import { cookies } from "next/headers"
import { getSupabase } from "@/lib/supabase"
import { ADMIN_COOKIE, verifyAdminCookie } from "@/lib/admin-auth"
import { AdminLogin } from "../admin-login"
import type { FeedbackRow } from "@/lib/feedback/types"

export const metadata = {
  title: "Feedback — EatoBiotics Admin",
  robots: { index: false, follow: false },
}

export const dynamic = "force-dynamic"

const CATEGORY_COLOR: Record<string, string> = {
  bug: "#EF5350", feature: "#4CB648", ux: "#F5A623", pricing: "#2DAA6E",
  content: "#8BC34A", praise: "#F5C518", other: "#9aa89d",
}
const SENTIMENT_COLOR: Record<string, string> = {
  positive: "#4CB648", neutral: "#9aa89d", negative: "#EF5350",
}

function tally(rows: FeedbackRow[], key: keyof FeedbackRow): [string, number][] {
  const m = new Map<string, number>()
  for (const r of rows) {
    const v = (r[key] as string | null) ?? "—"
    m.set(v, (m.get(v) ?? 0) + 1)
  }
  return [...m.entries()].sort((a, b) => b[1] - a[1])
}

export default async function AdminFeedbackPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const params = await searchParams
  const cookieStore = await cookies()
  if (!verifyAdminCookie(cookieStore.get(ADMIN_COOKIE)?.value)) {
    return <AdminLogin error={params.error === "1"} />
  }

  const db = getSupabase()
  if (!db) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        Supabase not configured.
      </div>
    )
  }

  // Expired rows are excluded by the QUERY, not just by the nightly sweep.
  // Deletion is physical and runs once a day, so between a row's expiry and the
  // next sweep there is a window — up to ~24h — where 90-day-old customer text
  // is still in the table. Reading it in that window would be retention past
  // the stated policy, so every reader filters as well.
  const { data } = await db
    .from("feedback")
    .select("id, user_id, source_page, rating, message, category, sentiment, severity, feature_area, summary, suggested_improvement, status, created_at")
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(300)

  const rows = (data ?? []) as FeedbackRow[]
  const ratings = rows.filter((r) => r.rating != null).map((r) => r.rating as number)
  const avgRating = ratings.length ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) : "—"
  const categories = tally(rows, "category")
  const sentiments = tally(rows, "sentiment")

  return (
    <div className="mx-auto min-h-screen max-w-5xl px-4 py-10 text-[#1B2A20]">
      <div className="mb-1 text-xs font-bold uppercase tracking-[2px] text-[#4CB648]">EatoBiotics Admin</div>
      <h1 className="mb-6 text-3xl font-extrabold">Customer feedback</h1>

      {/* Summary tiles */}
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Tile label="Total" value={String(rows.length)} />
        <Tile label="Avg rating" value={avgRating} />
        <Tile label="Negative" value={String(rows.filter((r) => r.sentiment === "negative").length)} />
        <Tile label="High severity" value={String(rows.filter((r) => r.severity === "high").length)} />
      </div>

      {/* Breakdowns */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2">
        <Breakdown title="By category" items={categories} colors={CATEGORY_COLOR} />
        <Breakdown title="By sentiment" items={sentiments} colors={SENTIMENT_COLOR} />
      </div>

      {/* List */}
      <h2 className="mb-3 text-lg font-bold">Latest {rows.length === 300 ? "300" : rows.length} submissions</h2>
      {rows.length === 0 ? (
        <p className="rounded-lg border border-[#e3e9dd] bg-[#fafcf8] p-6 text-sm text-[#6b7a70]">
          No feedback yet. Once the table exists in production and the widget is live, submissions appear here and the weekly digest emails to the owner.
        </p>
      ) : (
        <ul className="space-y-3">
          {rows.map((r) => (
            <li key={r.id} className="rounded-xl border border-[#e3e9dd] bg-white p-4">
              <div className="mb-1.5 flex flex-wrap items-center gap-2 text-[11px]">
                {r.rating != null && <span className="font-bold text-[#F5A623]">{"★".repeat(r.rating)}</span>}
                {r.category && <Pill text={r.category} color={CATEGORY_COLOR[r.category] ?? "#9aa89d"} />}
                {r.sentiment && <Pill text={r.sentiment} color={SENTIMENT_COLOR[r.sentiment] ?? "#9aa89d"} />}
                {r.severity && <Pill text={`severity: ${r.severity}`} color={r.severity === "high" ? "#EF5350" : "#9aa89d"} />}
                {r.feature_area && <span className="text-[#6b7a70]">· {r.feature_area}</span>}
                <span className="ml-auto text-[#9aa89d]">{new Date(r.created_at).toLocaleString("en-IE")}</span>
              </div>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#2b382f]">{r.message}</p>
              {r.suggested_improvement && (
                <p className="mt-2 border-l-2 border-[#4CB648] pl-2.5 text-[13px] text-[#4a574d]">
                  <span className="font-semibold">Suggested:</span> {r.suggested_improvement}
                </p>
              )}
              <div className="mt-1.5 text-[11px] text-[#9aa89d]">
                {r.user_id ? "member" : "anonymous"}{r.source_page ? ` · ${r.source_page}` : ""}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#e3e9dd] bg-white p-4">
      <div className="text-2xl font-extrabold">{value}</div>
      <div className="text-xs text-[#6b7a70]">{label}</div>
    </div>
  )
}

function Breakdown({ title, items, colors }: { title: string; items: [string, number][]; colors: Record<string, string> }) {
  const max = Math.max(1, ...items.map(([, n]) => n))
  return (
    <div className="rounded-xl border border-[#e3e9dd] bg-white p-4">
      <div className="mb-2 text-sm font-bold">{title}</div>
      {items.length === 0 ? (
        <div className="text-xs text-[#9aa89d]">No data yet</div>
      ) : (
        <div className="space-y-1.5">
          {items.map(([k, n]) => (
            <div key={k} className="flex items-center gap-2 text-xs">
              <span className="w-20 shrink-0 truncate text-[#4a574d]">{k}</span>
              <div className="h-2 flex-1 overflow-hidden rounded bg-[#f0f3ec]">
                <div style={{ width: `${(n / max) * 100}%`, background: colors[k] ?? "#9aa89d" }} className="h-full rounded" />
              </div>
              <span className="w-6 text-right font-semibold text-[#1B2A20]">{n}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function Pill({ text, color }: { text: string; color: string }) {
  return (
    <span className="rounded-full px-2 py-0.5 font-semibold text-white" style={{ background: color }}>
      {text}
    </span>
  )
}
