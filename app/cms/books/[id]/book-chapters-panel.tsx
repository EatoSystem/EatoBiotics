"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { PUBLICATION_TARGETS } from "@/lib/cms/taxonomy"
import { nextChapterNumber, swapChapterNumbers } from "@/lib/cms/chapter-order"

/* Book detail's chapter management panel: subtitle (the one cms_books-only
   field), the ordered chapter list with Move Up/Down (two sequential PATCHes
   built from swapChapterNumbers — no server-side reorder endpoint), and an
   inline "Add chapter" form. */

interface Chapter {
  id: string // cms_chapters.id
  chapter_number: number
  part: string
  part_title: string
  publication_target: string[]
  content_id: string // the chapter's own cms_content.id
  title: string
  status: string
}

const label = (v: string) => v.replace(/_/g, " ")

export function BookChaptersPanel({
  bookContentId,
  subtitle: initialSubtitle,
  chapters,
}: {
  bookContentId: string
  subtitle: string
  chapters: Chapter[]
}) {
  const router = useRouter()
  const [subtitle, setSubtitle] = useState(initialSubtitle)
  const [savingSubtitle, setSavingSubtitle] = useState(false)
  const [reordering, setReordering] = useState<string | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function saveSubtitle() {
    setSavingSubtitle(true)
    try {
      const res = await fetch(`/api/cms/books/${bookContentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subtitle: subtitle.trim() || null }),
      })
      if (!res.ok) throw new Error("Save failed")
      router.refresh()
    } catch {
      setError("Failed to save subtitle")
    } finally {
      setSavingSubtitle(false)
    }
  }

  async function move(index: number, direction: -1 | 1) {
    const pair = swapChapterNumbers(chapters, index, index + direction)
    if (!pair) return
    setReordering(chapters[index].id)
    setError(null)
    try {
      for (const { id, chapter_number } of pair) {
        const res = await fetch(`/api/cms/chapters/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chapter_number }),
        })
        if (!res.ok) throw new Error("Reorder failed")
      }
      router.refresh()
    } catch {
      setError("Failed to reorder — refresh and try again")
    } finally {
      setReordering(null)
    }
  }

  return (
    <div className="space-y-6 rounded-2xl border border-border p-5">
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[240px] flex-1">
          <label htmlFor="book-subtitle" className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Subtitle
          </label>
          <input
            id="book-subtitle"
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            maxLength={300}
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
          />
        </div>
        <button
          type="button"
          onClick={saveSubtitle}
          disabled={savingSubtitle}
          className="rounded-full border border-icon-green/30 bg-icon-green/5 px-5 py-2 text-sm font-semibold text-icon-green disabled:opacity-60"
        >
          {savingSubtitle ? "Saving…" : "Save subtitle"}
        </button>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-lg font-semibold text-foreground">Chapters</h2>
          <button
            type="button"
            onClick={() => setShowAdd((v) => !v)}
            className="rounded-full border border-border px-4 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
          >
            {showAdd ? "Cancel" : "+ Add chapter"}
          </button>
        </div>

        {showAdd && (
          <AddChapterForm
            bookContentId={bookContentId}
            nextNumber={nextChapterNumber(chapters.map((c) => c.chapter_number))}
            onCreated={() => {
              setShowAdd(false)
              router.refresh()
            }}
          />
        )}

        {chapters.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No chapters yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-border">
            {chapters.map((c, i) => (
              <li key={c.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-muted-foreground">#{c.chapter_number}</span>
                    <Link href={`/cms/library/${c.content_id}`} className="truncate font-semibold text-foreground hover:text-icon-green">
                      {c.title}
                    </Link>
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      {label(c.status)}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {[c.part && `Part ${c.part}`, c.part_title].filter(Boolean).join(" — ")}
                    {c.publication_target.length > 0 && (
                      <span className="ml-2">{c.publication_target.map(label).join(", ")}</span>
                    )}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    disabled={i === 0 || reordering !== null}
                    onClick={() => move(i, -1)}
                    className="rounded-full border border-border px-2.5 py-1 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground disabled:opacity-30"
                    aria-label="Move up"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    disabled={i === chapters.length - 1 || reordering !== null}
                    onClick={() => move(i, 1)}
                    className="rounded-full border border-border px-2.5 py-1 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground disabled:opacity-30"
                    aria-label="Move down"
                  >
                    ↓
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

function AddChapterForm({
  bookContentId,
  nextNumber,
  onCreated,
}: {
  bookContentId: string
  nextNumber: number
  onCreated: () => void
}) {
  const [title, setTitle] = useState("")
  const [chapterNumber, setChapterNumber] = useState(nextNumber)
  const [part, setPart] = useState("")
  const [partTitle, setPartTitle] = useState("")
  const [targets, setTargets] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function toggleTarget(t: string) {
    setTargets((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || saving) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/cms/books/${bookContentId}/chapters`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          chapter_number: chapterNumber,
          part: part.trim() || undefined,
          part_title: partTitle.trim() || undefined,
          publication_target: targets,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Create failed")
      onCreated()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed")
    } finally {
      setSaving(false)
    }
  }

  const inputClass = "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-3 rounded-2xl border border-dashed border-border p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="ch-title" className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Title</label>
          <input id="ch-title" value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={300} className={inputClass} />
        </div>
        <div>
          <label htmlFor="ch-number" className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Chapter number</label>
          <input
            id="ch-number"
            type="number"
            min={1}
            value={chapterNumber}
            onChange={(e) => setChapterNumber(Number(e.target.value))}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="ch-part" className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Part (optional)</label>
          <input id="ch-part" value={part} onChange={(e) => setPart(e.target.value)} maxLength={50} className={inputClass} />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="ch-part-title" className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Part title (optional)</label>
          <input id="ch-part-title" value={partTitle} onChange={(e) => setPartTitle(e.target.value)} maxLength={200} className={inputClass} />
        </div>
      </div>

      <div>
        <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Publication target</p>
        <div className="flex flex-wrap gap-2">
          {PUBLICATION_TARGETS.map((t) => (
            <label key={t} className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground">
              <input type="checkbox" checked={targets.includes(t)} onChange={() => toggleTarget(t)} />
              {label(t)}
            </label>
          ))}
        </div>
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      <button
        type="submit"
        disabled={saving || !title.trim()}
        className="rounded-full border border-icon-green/30 bg-icon-green/5 px-5 py-2 text-sm font-semibold text-icon-green disabled:opacity-60"
      >
        {saving ? "Creating…" : "Create chapter"}
      </button>
    </form>
  )
}
