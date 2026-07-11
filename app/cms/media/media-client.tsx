"use client"

import { useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { getSupabaseBrowser } from "@/lib/supabase-browser"
import { MEDIA_TYPES } from "@/lib/cms/media"
import { UploadCloud, FileText, Film, Music, ImageIcon } from "lucide-react"

export interface MediaRow {
  id: string
  filename: string
  media_type: string
  mime_type: string
  file_size: number | null
  alt_text: string | null
  status: string
  created_at: string
}

const TYPE_ICON: Record<string, typeof FileText> = {
  image: ImageIcon, video: Film, audio: Music, document: FileText,
}

function formatSize(bytes: number | null): string {
  if (!bytes) return "—"
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function MediaLibraryClient({
  items,
  filters,
}: {
  items: MediaRow[]
  filters: { type: string; status: string; q: string }
}) {
  const router = useRouter()
  const fileInput = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)

  async function uploadOne(file: File): Promise<void> {
    // 1. Ask the server for a validated upload slot.
    const slotRes = await fetch("/api/cms/media/upload-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename: file.name, mime: file.type, size: file.size }),
    })
    const slot = await slotRes.json()
    if (!slotRes.ok) throw new Error(slot.error ?? "Upload rejected")

    // 2. Upload bytes directly to the private bucket via the signed URL.
    const supabase = getSupabaseBrowser()
    const { error: upErr } = await supabase.storage
      .from("cms-media")
      .uploadToSignedUrl(slot.storagePath, slot.token, file, { contentType: file.type })
    if (upErr) throw new Error(upErr.message)

    // 3. Confirm — the server verifies the object + real size, then catalogues it.
    const confirmRes = await fetch("/api/cms/media", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        storagePath: slot.storagePath,
        filename: file.name,
        mediaType: slot.mediaType,
        mime: file.type,
      }),
    })
    if (!confirmRes.ok) throw new Error((await confirmRes.json()).error ?? "Could not save upload")
  }

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0 || uploading) return
    setUploading(true)
    setError(null)
    const list = Array.from(files)
    try {
      for (let i = 0; i < list.length; i++) {
        setProgress(`Uploading ${i + 1} of ${list.length}: ${list[i].name}`)
        await uploadOne(list[i])
      }
      setProgress(null)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setUploading(false)
      if (fileInput.current) fileInput.current.value = ""
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-semibold text-foreground">Media library</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {items.length} asset{items.length === 1 ? "" : "s"} · images, video, audio, documents
        </p>
      </div>

      {/* Upload zone — accessible file button + native drag/drop (no dnd library) */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files) }}
        className={`rounded-2xl border-2 border-dashed p-8 text-center transition-colors ${
          dragOver ? "border-icon-green bg-icon-green/5" : "border-border"
        }`}
      >
        <UploadCloud size={28} className="mx-auto text-muted-foreground" aria-hidden />
        <p className="mt-3 text-sm text-muted-foreground">
          Drag files here, or
        </p>
        <button
          type="button"
          onClick={() => fileInput.current?.click()}
          disabled={uploading}
          className="brand-gradient mt-3 rounded-full px-6 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {uploading ? "Uploading…" : "Choose files"}
        </button>
        <input
          ref={fileInput}
          type="file"
          multiple
          accept="image/png,image/jpeg,image/webp,image/gif,image/avif,video/mp4,video/webm,video/quicktime,audio/mpeg,audio/wav,audio/ogg,audio/mp4,application/pdf"
          onChange={(e) => handleFiles(e.target.files)}
          className="sr-only"
        />
        <p className="mt-3 text-xs text-muted-foreground">
          Images 15MB · audio 50MB · documents 25MB · video 500MB. SVG is not accepted.
        </p>
        {progress && <p className="mt-2 text-xs text-icon-teal">{progress}</p>}
        {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
      </div>

      {/* Filters */}
      <form method="GET" className="flex flex-wrap items-end gap-3 rounded-2xl border border-border p-4">
        <div>
          <label htmlFor="m-type" className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Type</label>
          <select id="m-type" name="type" defaultValue={filters.type} className="rounded-xl border border-border bg-background px-3 py-2 text-sm">
            <option value="">All</option>
            {MEDIA_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="m-status" className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Status</label>
          <select id="m-status" name="status" defaultValue={filters.status} className="rounded-xl border border-border bg-background px-3 py-2 text-sm">
            <option value="ready">Ready</option>
            <option value="archived">Archived</option>
            <option value="all">All</option>
          </select>
        </div>
        <div className="min-w-[180px] flex-1">
          <label htmlFor="m-q" className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Search filename</label>
          <input id="m-q" name="q" defaultValue={filters.q} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm" />
        </div>
        <button type="submit" className="rounded-full border border-icon-green/30 bg-icon-green/5 px-5 py-2 text-sm font-semibold text-icon-green">Filter</button>
      </form>

      {/* Grid */}
      {items.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          No assets yet — upload your first above.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((m) => {
            const Icon = TYPE_ICON[m.media_type] ?? FileText
            return (
              <Link
                key={m.id}
                href={`/cms/media/${m.id}`}
                className="flex flex-col rounded-2xl border border-border p-4 transition-shadow hover:shadow-md"
              >
                <div className="flex h-24 items-center justify-center rounded-xl" style={{ background: "color-mix(in srgb, var(--icon-green) 6%, transparent)" }}>
                  <Icon size={26} className="text-icon-teal" aria-hidden />
                </div>
                <p className="mt-3 truncate text-sm font-semibold text-foreground">{m.filename}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {m.media_type} · {formatSize(m.file_size)}
                  {m.status === "archived" && " · archived"}
                </p>
                {!m.alt_text && m.media_type === "image" && (
                  <p className="mt-1 text-[10px] font-semibold uppercase tracking-widest text-icon-orange">Needs alt text</p>
                )}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
