import Link from "next/link"
import { getSupabase } from "@/lib/supabase"
import { StatCard, timeAgo } from "@/app/admin/admin-ui"
import { FilePlus2, FileText, CheckCircle2, Eye } from "lucide-react"

/* Content Studio dashboard — "What am I creating, what needs approval, and
   what is publishing next?" Phase 1 answers the first two; publishing arrives
   with the scheduling phase. All queries are server-side, post-gate, and
   touch cms_* tables only. */
export default async function CmsDashboard() {
  const sb = getSupabase()
  if (!sb) {
    return <p className="text-sm text-muted-foreground">Supabase not configured.</p>
  }

  const countBy = async (status?: string) => {
    let q = sb.from("cms_content").select("id", { count: "exact", head: true })
    if (status) q = q.eq("status", status)
    const { count } = await q
    return count ?? 0
  }

  const [total, drafts, inReview, approved, recentRes, auditRes] = await Promise.all([
    countBy(),
    countBy("draft"),
    countBy("in_review"),
    countBy("approved"),
    sb
      .from("cms_content")
      .select("id, title, content_type, status, updated_at")
      .neq("status", "archived")
      .order("updated_at", { ascending: false })
      .limit(8),
    sb
      .from("cms_audit_log")
      .select("id, action, entity_id, metadata_json, created_at")
      .order("created_at", { ascending: false })
      .limit(8),
  ])

  const recent = (recentRes.data ?? []) as Array<{
    id: string; title: string; content_type: string; status: string; updated_at: string
  }>
  const audit = (auditRes.data ?? []) as Array<{
    id: string; action: string; entity_id: string | null; metadata_json: Record<string, unknown>; created_at: string
  }>

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-foreground">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Create once. Adapt intelligently. Publish everywhere.
          </p>
        </div>
        <Link
          href="/cms/create"
          className="brand-gradient inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          <FilePlus2 size={15} /> New content
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="All content" value={total} icon={FileText} />
        <StatCard label="Drafts" value={drafts} icon={FilePlus2} color="var(--icon-yellow)" />
        <StatCard label="Awaiting review" value={inReview} icon={Eye} color="var(--icon-orange)" />
        <StatCard label="Approved" value={approved} icon={CheckCircle2} color="var(--icon-teal)" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-border p-5">
          <h2 className="font-serif text-lg font-semibold text-foreground">Recently updated</h2>
          {recent.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">
              Nothing yet — <Link href="/cms/create" className="text-icon-green underline underline-offset-2">create your first item</Link>.
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-border">
              {recent.map((item) => (
                <li key={item.id}>
                  <Link href={`/cms/library/${item.id}`} className="flex items-center justify-between gap-3 py-2.5 transition-colors hover:text-icon-green">
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-foreground">{item.title}</span>
                      <span className="text-xs text-muted-foreground">{item.content_type.replace(/_/g, " ")} · {timeAgo(item.updated_at)}</span>
                    </span>
                    <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      {item.status.replace(/_/g, " ")}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-border p-5">
          <h2 className="font-serif text-lg font-semibold text-foreground">Recent activity</h2>
          {audit.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">The audit trail will appear here.</p>
          ) : (
            <ul className="mt-3 divide-y divide-border">
              {audit.map((entry) => (
                <li key={entry.id} className="py-2.5">
                  <p className="text-sm text-foreground">{entry.action.replace(/_/g, " ")}</p>
                  <p className="text-xs text-muted-foreground">{timeAgo(entry.created_at)}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
