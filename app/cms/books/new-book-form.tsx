"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

/* Inline "New book" form on /cms/books. POSTs JSON to /api/cms/books
   (matching the fetch-based create pattern used across the CMS — a plain
   <form method=POST> would submit form-encoded data, which the JSON API
   route can't parse) and redirects into the new book's detail page. */
export function NewBookForm() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [subtitle, setSubtitle] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || saving) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch("/api/cms/books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), subtitle: subtitle.trim() || undefined }),
      })
      const data = await res.json()
      if (!res.ok || !data.id) throw new Error(data.error ?? "Create failed")
      router.push(`/cms/books/${data.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed")
      setSaving(false)
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="brand-gradient rounded-full px-6 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
      >
        New book
      </button>
    )
  }

  return (
    <div className="w-full max-w-md rounded-2xl border border-border p-5">
      <form onSubmit={handleCreate} className="space-y-3">
        <div>
          <label htmlFor="nb-title" className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Title</label>
          <input
            id="nb-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            maxLength={300}
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="nb-subtitle" className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Subtitle (optional)</label>
          <input
            id="nb-subtitle"
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            maxLength={300}
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
          />
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
        <div className="flex items-center gap-2">
          <button
            type="submit"
            disabled={saving || !title.trim()}
            className="rounded-full border border-icon-green/30 bg-icon-green/5 px-5 py-2 text-sm font-semibold text-icon-green disabled:opacity-60"
          >
            {saving ? "Creating…" : "Create"}
          </button>
          <button type="button" onClick={() => setOpen(false)} className="text-sm text-muted-foreground hover:text-foreground">
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
