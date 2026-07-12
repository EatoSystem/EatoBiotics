"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { PUBLICATION_TARGETS } from "@/lib/cms/taxonomy"

/* Renders only when the library editor is viewing a book_chapter row —
   the fields specific to cms_chapters (chapter_number/part/publication_target,
   PATCHed via /api/cms/chapters/[chapterRowId]), a link back to the parent
   book, a "create extract" shortcut into /cms/create pre-linked via
   source_content_id/book_id/chapter_id, and a scoped media-attach mini-UI
   reusing the existing media list + attach routes unchanged. */

interface MediaItem {
  id: string
  filename: string
  media_type: string
}

const label = (v: string) => v.replace(/_/g, " ")

export function ChapterDetailsPanel({
  chapterRowId,
  chapterContentId,
  bookContentId,
  bookId,
  chapterNumber: initialNumber,
  part: initialPart,
  partTitle: initialPartTitle,
  publicationTarget: initialTargets,
  title,
}: {
  chapterRowId: string
  chapterContentId: string
  bookContentId: string | null
  bookId: string
  chapterNumber: number
  part: string
  partTitle: string
  publicationTarget: string[]
  title: string
}) {
  const router = useRouter()
  const [chapterNumber, setChapterNumber] = useState(initialNumber)
  const [part, setPart] = useState(initialPart)
  const [partTitle, setPartTitle] = useState(initialPartTitle)
  const [targets, setTargets] = useState<string[]>(initialTargets)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [mediaOptions, setMediaOptions] = useState<MediaItem[]>([])
  const [selectedMedia, setSelectedMedia] = useState("")
  const [role, setRole] = useState("inline")
  const [attaching, setAttaching] = useState(false)

  useEffect(() => {
    fetch("/api/cms/media?status=ready")
      .then((res) => (res.ok ? res.json() : { items: [] }))
      .then((data) => setMediaOptions(data.items ?? []))
      .catch(() => setMediaOptions([]))
  }, [])

  function toggleTarget(t: string) {
    setTargets((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]))
  }

  async function save() {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/cms/chapters/${chapterRowId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chapter_number: chapterNumber, part: part || null, part_title: partTitle || null, publication_target: targets }),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? "Save failed")
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed")
    } finally {
      setSaving(false)
    }
  }

  async function attachMedia() {
    if (!selectedMedia) return
    setAttaching(true)
    setError(null)
    try {
      const res = await fetch(`/api/cms/content/${chapterContentId}/media`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ media_id: selectedMedia, role }),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? "Attach failed")
      setSelectedMedia("")
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Attach failed")
    } finally {
      setAttaching(false)
    }
  }

  const extractHref =
    `/cms/create?type=chapter_extract` +
    `&source_content_id=${encodeURIComponent(chapterContentId)}` +
    `&book_id=${encodeURIComponent(bookId)}` +
    `&chapter_id=${encodeURIComponent(chapterRowId)}` +
    `&title=${encodeURIComponent(`${title} — extract`)}`

  const inputClass = "rounded-xl border border-border bg-background px-3 py-2 text-sm"

  return (
    <div className="space-y-4 rounded-2xl border border-border p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-serif text-lg font-semibold text-foreground">Chapter details</h2>
        <div className="flex items-center gap-3 text-sm">
          {bookContentId && (
            <Link href={`/cms/books/${bookContentId}`} className="text-muted-foreground hover:text-foreground">
              ← Back to book
            </Link>
          )}
          <Link href={extractHref} className="text-icon-green underline underline-offset-2">
            Create extract from this chapter
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="cd-number" className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Chapter number</label>
          <input id="cd-number" type="number" min={1} value={chapterNumber} onChange={(e) => setChapterNumber(Number(e.target.value))} className={inputClass} />
        </div>
        <div>
          <label htmlFor="cd-part" className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Part</label>
          <input id="cd-part" value={part} onChange={(e) => setPart(e.target.value)} maxLength={50} className={inputClass} />
        </div>
        <div className="min-w-[200px] flex-1">
          <label htmlFor="cd-part-title" className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Part title</label>
          <input id="cd-part-title" value={partTitle} onChange={(e) => setPartTitle(e.target.value)} maxLength={200} className={`${inputClass} w-full`} />
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

      <button
        type="button"
        onClick={save}
        disabled={saving}
        className="rounded-full border border-icon-green/30 bg-icon-green/5 px-5 py-2 text-sm font-semibold text-icon-green disabled:opacity-60"
      >
        {saving ? "Saving…" : "Save chapter details"}
      </button>

      <div className="border-t border-border pt-4">
        <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Attach media</p>
        <div className="flex flex-wrap items-end gap-2">
          <select value={selectedMedia} onChange={(e) => setSelectedMedia(e.target.value)} className={inputClass}>
            <option value="">Select media…</option>
            {mediaOptions.map((m) => (
              <option key={m.id} value={m.id}>{m.filename} ({m.media_type})</option>
            ))}
          </select>
          <select value={role} onChange={(e) => setRole(e.target.value)} className={inputClass}>
            {["hero", "thumbnail", "inline", "social", "advert", "video", "audio", "document"].map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={attachMedia}
            disabled={!selectedMedia || attaching}
            className="rounded-full border border-border px-4 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
          >
            {attaching ? "Attaching…" : "Attach"}
          </button>
        </div>
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
