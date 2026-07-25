import Link from "next/link"
import { getSupabase } from "@/lib/supabase"
import { timeAgo } from "@/app/admin/admin-ui"
import { NewBookForm } from "./new-book-form"

/* Content Studio — books. Every book is a cms_content row (content_type
   'book') with a matching cms_books row for its subtitle. Server component,
   post-gate, cms_* tables only. Mirrors /cms/library's list shape, scoped
   to books. */

const label = (v: string) => v.replace(/_/g, " ")

type BookRow = {
  id: string
  title: string
  status: string
  updated_at: string
  cms_books: { id: string; subtitle: string | null } | { id: string; subtitle: string | null }[] | null
}

export default async function CmsBooksPage() {
  const sb = getSupabase()
  if (!sb) return <p className="text-sm text-muted-foreground">Supabase not configured.</p>

  const { data } = await sb
    .from("cms_content")
    .select("id, title, status, updated_at, cms_books(id, subtitle)")
    .eq("content_type", "book")
    .order("updated_at", { ascending: false })
    .limit(200)

  const books = (data ?? []) as BookRow[]

  // Chapter counts per book (single lightweight query, computed in JS — scale
  // here is small enough that a per-book count query isn't worth the round-trips).
  const bookIds = books
    .map((b) => (Array.isArray(b.cms_books) ? b.cms_books[0]?.id : b.cms_books?.id))
    .filter((id): id is string => Boolean(id))
  const { data: chapterRows } = bookIds.length
    ? await sb.from("cms_chapters").select("book_id").in("book_id", bookIds)
    : { data: [] as { book_id: string }[] }
  const chapterCounts = new Map<string, number>()
  for (const row of chapterRows ?? []) {
    chapterCounts.set(row.book_id as string, (chapterCounts.get(row.book_id as string) ?? 0) + 1)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-foreground">Books</h1>
          <p className="mt-1 text-sm text-muted-foreground">{books.length} book{books.length === 1 ? "" : "s"}</p>
        </div>
        <NewBookForm />
      </div>

      {books.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          No books yet — create one above to start adding chapters.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Chapters</th>
                <th className="px-4 py-3">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {books.map((b) => {
                const book = Array.isArray(b.cms_books) ? b.cms_books[0] : b.cms_books
                return (
                  <tr key={b.id} className="transition-colors hover:bg-icon-green/5">
                    <td className="px-4 py-3">
                      <Link href={`/cms/books/${b.id}`} className="font-semibold text-foreground hover:text-icon-green">
                        {b.title}
                      </Link>
                      {book?.subtitle && <span className="ml-2 text-xs text-muted-foreground">{book.subtitle}</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        {label(b.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {book ? chapterCounts.get(book.id) ?? 0 : 0}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{timeAgo(b.updated_at)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
