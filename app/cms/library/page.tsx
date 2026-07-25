import Link from "next/link"
import { getSupabase } from "@/lib/supabase"
import { timeAgo } from "@/app/admin/admin-ui"
import { CONTENT_TYPES } from "@/lib/cms/taxonomy"
import { CONTENT_STATUSES } from "@/lib/cms/statuses"

/* Content Studio library — every canonical content item, filterable by
   status and type. Server component, post-gate, cms_* tables only. */
interface Props {
  searchParams: Promise<{ status?: string; type?: string; q?: string }>
}

const label = (v: string) => v.replace(/_/g, " ")

export default async function CmsLibraryPage({ searchParams }: Props) {
  const { status, type, q } = await searchParams
  const sb = getSupabase()
  if (!sb) return <p className="text-sm text-muted-foreground">Supabase not configured.</p>

  let query = sb
    .from("cms_content")
    .select("id, title, content_type, status, availability_status, brand, pathway, updated_at")
    .order("updated_at", { ascending: false })
    .limit(200)
  if (status) query = query.eq("status", status)
  if (type) query = query.eq("content_type", type)
  if (q) query = query.ilike("title", `%${q.replace(/[%_]/g, "")}%`)

  const { data } = await query
  const items = (data ?? []) as Array<{
    id: string; title: string; content_type: string; status: string
    availability_status: string; brand: string | null; pathway: string | null; updated_at: string
  }>

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-foreground">Library</h1>
          <p className="mt-1 text-sm text-muted-foreground">{items.length} item{items.length === 1 ? "" : "s"}</p>
        </div>
        <Link href="/cms/create" className="brand-gradient rounded-full px-6 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90">
          New content
        </Link>
      </div>

      {/* Filters — plain GET form, keyboard/screen-reader friendly */}
      <form method="GET" className="flex flex-wrap items-end gap-3 rounded-2xl border border-border p-4">
        <div>
          <label htmlFor="f-status" className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Status</label>
          <select id="f-status" name="status" defaultValue={status ?? ""} className="rounded-xl border border-border bg-background px-3 py-2 text-sm">
            <option value="">All</option>
            {CONTENT_STATUSES.map((s) => <option key={s} value={s}>{label(s)}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="f-type" className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Type</label>
          <select id="f-type" name="type" defaultValue={type ?? ""} className="rounded-xl border border-border bg-background px-3 py-2 text-sm">
            <option value="">All</option>
            {CONTENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div className="min-w-[200px] flex-1">
          <label htmlFor="f-q" className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Search title</label>
          <input id="f-q" name="q" defaultValue={q ?? ""} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm" />
        </div>
        <button type="submit" className="rounded-full border border-icon-green/30 bg-icon-green/5 px-5 py-2 text-sm font-semibold text-icon-green">
          Filter
        </button>
      </form>

      {items.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Nothing here yet. <Link href="/cms/create" className="text-icon-green underline underline-offset-2">Create your first item</Link>.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Availability</th>
                <th className="px-4 py-3">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.map((item) => (
                <tr key={item.id} className="transition-colors hover:bg-icon-green/5">
                  <td className="px-4 py-3">
                    <Link href={`/cms/library/${item.id}`} className="font-semibold text-foreground hover:text-icon-green">
                      {item.title}
                    </Link>
                    {(item.brand || item.pathway) && (
                      <span className="ml-2 text-xs text-muted-foreground">{[item.brand, item.pathway].filter(Boolean).join(" · ")}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{label(item.content_type)}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      {label(item.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{label(item.availability_status)}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{timeAgo(item.updated_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
