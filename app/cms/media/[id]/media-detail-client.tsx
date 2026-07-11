"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export interface MediaDetail {
  id: string
  filename: string
  media_type: string
  mime_type: string
  file_size: number | null
  status: string
  alt_text: string
  caption: string
  generation_prompt: string
  source: string
  copyright_owner: string
  licence: string
  usage_restrictions: string
}

type StringField =
  | "alt_text" | "caption" | "copyright_owner" | "licence"
  | "usage_restrictions" | "source" | "generation_prompt"

const FIELDS: Array<{ key: StringField; label: string; textarea?: boolean }> = [
  { key: "alt_text", label: "Alt text" },
  { key: "caption", label: "Caption" },
  { key: "copyright_owner", label: "Copyright owner" },
  { key: "licence", label: "Licence" },
  { key: "usage_restrictions", label: "Usage restrictions", textarea: true },
  { key: "source", label: "Source / provenance" },
  { key: "generation_prompt", label: "Generation prompt (if AI-made)", textarea: true },
]

export function MediaDetailClient({ detail }: { detail: MediaDetail }) {
  const router = useRouter()
  const [values, setValues] = useState<MediaDetail>(detail)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function set(key: StringField, v: string) {
    setValues((prev) => ({ ...prev, [key]: v }))
    setSaved(false)
  }

  async function save() {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/cms/media/${detail.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          alt_text: values.alt_text || null,
          caption: values.caption || null,
          copyright_owner: values.copyright_owner || null,
          licence: values.licence || null,
          usage_restrictions: values.usage_restrictions || null,
          source: values.source || null,
          generation_prompt: values.generation_prompt || null,
        }),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? "Save failed")
      setSaved(true)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed")
    } finally {
      setSaving(false)
    }
  }

  async function archive() {
    if (!window.confirm("Archive this asset? It leaves the library but is never deleted, so any content already using it keeps working.")) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/cms/media/${detail.id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Archive failed")
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Archive failed")
    } finally {
      setSaving(false)
    }
  }

  const inputClass =
    "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-icon-green focus:outline-none"

  return (
    <section className="rounded-2xl border border-border p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-lg font-semibold text-foreground">Details</h2>
        <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          {values.status}
        </span>
      </div>

      <div className="mt-4 space-y-3">
        {FIELDS.map((f) => (
          <div key={f.key}>
            <label htmlFor={`md-${f.key}`} className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              {f.label}
            </label>
            {f.textarea ? (
              <textarea id={`md-${f.key}`} value={values[f.key]} onChange={(e) => set(f.key, e.target.value)} rows={2} className={inputClass} />
            ) : (
              <input id={`md-${f.key}`} value={values[f.key]} onChange={(e) => set(f.key, e.target.value)} className={inputClass} />
            )}
          </div>
        ))}
      </div>

      {values.media_type === "image" && !values.alt_text && (
        <p className="mt-3 text-xs font-semibold text-icon-orange">Add alt text before this image is published anywhere.</p>
      )}
      {error && <p className="mt-3 text-xs text-red-500">{error}</p>}

      <div className="mt-5 flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="brand-gradient rounded-full px-6 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {saving ? "Saving…" : saved ? "✓ Saved" : "Save details"}
        </button>
        {values.status !== "archived" && (
          <button
            type="button"
            onClick={archive}
            disabled={saving}
            className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
          >
            Archive
          </button>
        )}
      </div>
    </section>
  )
}
