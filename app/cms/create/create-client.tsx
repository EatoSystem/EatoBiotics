"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  CONTENT_TYPES, BRANDS, AUDIENCES, PATHWAYS, FOUNDATIONS, isContentType, type ContentType,
} from "@/lib/cms/taxonomy"
import { AVAILABILITY_STATUSES } from "@/lib/cms/statuses"

const labelFor = (v: string) => v.replace(/_/g, " ")

interface Initial {
  type?: string
  title?: string
  source_content_id?: string
  book_id?: string
  chapter_id?: string
}

export function CreateClient({ initial }: { initial?: Initial } = {}) {
  const router = useRouter()
  const [type, setType] = useState<ContentType | null>(
    initial?.type && isContentType(initial.type) ? initial.type : null
  )
  const [title, setTitle] = useState(initial?.title ?? "")
  const [summary, setSummary] = useState("")
  const [brand, setBrand] = useState("EatoBiotics")
  const [audience, setAudience] = useState("")
  const [pathway, setPathway] = useState("")
  const [foundation, setFoundation] = useState("")
  const [availability, setAvailability] = useState("our_direction")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!type || !title.trim() || saving) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch("/api/cms/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          content_type: type,
          summary: summary.trim() || undefined,
          status: "draft",
          availability_status: availability,
          brand: brand || null,
          audience: audience || null,
          pathway: pathway || null,
          foundation: foundation || null,
          source_content_id: initial?.source_content_id || undefined,
          book_id: initial?.book_id || undefined,
          chapter_id: initial?.chapter_id || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.id) throw new Error(data.error ?? "Create failed")
      router.push(`/cms/library/${data.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed")
      setSaving(false)
    }
  }

  const selectClass =
    "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-icon-green focus:outline-none"

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-semibold text-foreground">What are you creating?</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Every item starts as a draft. AI can help later — approval is always yours.
        </p>
      </div>

      {/* Type picker */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {CONTENT_TYPES.map((t) => {
          const disabled = !t.phase1
          const selected = type === t.value
          return (
            <button
              key={t.value}
              type="button"
              disabled={disabled}
              onClick={() => setType(t.value)}
              className={`rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition-colors ${
                selected
                  ? "border-icon-green bg-icon-green/5 text-icon-green"
                  : disabled
                    ? "cursor-not-allowed border-dashed border-border text-muted-foreground/50"
                    : "border-border text-foreground hover:border-icon-green/50"
              }`}
            >
              {t.label}
              {disabled && (
                <span className="mt-0.5 block text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                  Phase 2
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Metadata form (appears once a type is chosen) */}
      {type && (
        <form onSubmit={handleCreate} className="space-y-4 rounded-2xl border border-border p-6">
          <div>
            <label htmlFor="cms-title" className="mb-1 block text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Title
            </label>
            <input
              id="cms-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              maxLength={300}
              placeholder={`Working title for this ${labelFor(type)}`}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-icon-green focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="cms-summary" className="mb-1 block text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Summary <span className="font-normal normal-case">(optional)</span>
            </label>
            <textarea
              id="cms-summary"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={2}
              maxLength={2000}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground focus:border-icon-green focus:outline-none"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="cms-brand" className="mb-1 block text-xs font-bold uppercase tracking-widest text-muted-foreground">Brand</label>
              <select id="cms-brand" value={brand} onChange={(e) => setBrand(e.target.value)} className={selectClass}>
                {BRANDS.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="cms-audience" className="mb-1 block text-xs font-bold uppercase tracking-widest text-muted-foreground">Audience</label>
              <select id="cms-audience" value={audience} onChange={(e) => setAudience(e.target.value)} className={selectClass}>
                <option value="">—</option>
                {AUDIENCES.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="cms-pathway" className="mb-1 block text-xs font-bold uppercase tracking-widest text-muted-foreground">Pathway</label>
              <select id="cms-pathway" value={pathway} onChange={(e) => setPathway(e.target.value)} className={selectClass}>
                <option value="">—</option>
                {PATHWAYS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="cms-foundation" className="mb-1 block text-xs font-bold uppercase tracking-widest text-muted-foreground">Foundation</label>
              <select id="cms-foundation" value={foundation} onChange={(e) => setFoundation(e.target.value)} className={selectClass}>
                <option value="">—</option>
                {FOUNDATIONS.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="cms-availability" className="mb-1 block text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Product availability described
              </label>
              <select id="cms-availability" value={availability} onChange={(e) => setAvailability(e.target.value)} className={selectClass}>
                {AVAILABILITY_STATUSES.map((a) => <option key={a} value={a}>{labelFor(a)}</option>)}
              </select>
              <p className="mt-1 text-xs text-muted-foreground">
                Separate from the editorial workflow — an approved post may describe a feature that is still &ldquo;future&rdquo;.
              </p>
            </div>
          </div>

          {error && <p className="text-xs text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={saving || !title.trim()}
            className="brand-gradient rounded-full px-6 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {saving ? "Creating…" : "Create draft →"}
          </button>
        </form>
      )}
    </div>
  )
}
