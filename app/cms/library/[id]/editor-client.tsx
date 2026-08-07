"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { BRANDS, AUDIENCES, PATHWAYS, FOUNDATIONS } from "@/lib/cms/taxonomy"
import { AVAILABILITY_STATUSES, PHASE1_SETTABLE, canTransition, type ContentStatus } from "@/lib/cms/statuses"

/* Content Studio editor — Markdown/MDX body + metadata + guarded workflow
   actions. Autosaves 2s after typing stops; warns on unload with unsaved
   changes; "Save version" snapshots the saved state append-only. Approval is
   a deliberate, separate action. */

interface Item {
  id: string
  title: string
  summary: string
  body: string
  content_type: string
  status: string
  availability_status: string
  brand: string
  audience: string
  pathway: string
  foundation: string
}

const label = (v: string) => v.replace(/_/g, " ")

export function EditorClient({ item }: { item: Item }) {
  const router = useRouter()
  const [title, setTitle] = useState(item.title)
  const [summary, setSummary] = useState(item.summary)
  const [body, setBody] = useState(item.body)
  const [availability, setAvailability] = useState(item.availability_status)
  const [brand, setBrand] = useState(item.brand)
  const [audience, setAudience] = useState(item.audience)
  const [pathway, setPathway] = useState(item.pathway)
  const [foundation, setFoundation] = useState(item.foundation)
  const [status, setStatus] = useState(item.status)
  const [dirty, setDirty] = useState(false)
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle")
  const [actionError, setActionError] = useState<string | null>(null)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Warn before leaving with unsaved changes.
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault()
      }
    }
    window.addEventListener("beforeunload", handler)
    return () => window.removeEventListener("beforeunload", handler)
  }, [dirty])

  async function save(fields: Record<string, unknown>): Promise<boolean> {
    setSaveState("saving")
    try {
      const res = await fetch(`/api/cms/content/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? "Save failed")
      setSaveState("saved")
      setDirty(false)
      return true
    } catch (err) {
      setSaveState("error")
      setActionError(err instanceof Error ? err.message : "Save failed")
      return false
    }
  }

  function queueAutosave(next: Partial<Record<"title" | "summary" | "body", string>>) {
    setDirty(true)
    setActionError(null)
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      const ok = await save({
        title: next.title ?? title,
        summary: next.summary ?? summary,
        body: next.body ?? body,
      })
      if (ok) router.refresh()
    }, 2000)
  }

  async function saveMetadata() {
    const ok = await save({
      availability_status: availability,
      brand: brand || null,
      audience: audience || null,
      pathway: pathway || null,
      foundation: foundation || null,
    })
    if (ok) router.refresh()
  }

  async function saveVersion() {
    // Flush any pending edits first so the snapshot matches what's on screen.
    if (dirty) {
      const flushed = await save({ title, summary, body })
      if (!flushed) return
    }
    const note = window.prompt("Version note (optional):") ?? undefined
    const res = await fetch(`/api/cms/content/${item.id}/versions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ change_note: note || undefined }),
    })
    if (res.ok) router.refresh()
    else setActionError("Snapshot failed")
  }

  async function transition(to: ContentStatus) {
    setActionError(null)
    if (to === "archived" && !window.confirm("Archive this item? It leaves all working views but is never deleted.")) {
      return
    }
    if (dirty) {
      const flushed = await save({ title, summary, body })
      if (!flushed) return
    }
    const ok = await save({ status: to })
    if (ok) {
      setStatus(to)
      router.refresh()
    }
  }

  const availableTransitions = PHASE1_SETTABLE.filter(
    (to) => to !== status && canTransition(status as ContentStatus, to)
  )

  const selectClass =
    "rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-icon-green focus:outline-none"

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/cms/library" className="text-sm text-muted-foreground hover:text-foreground">← Library</Link>
          <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            {label(item.content_type)}
          </span>
          <span
            className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white"
            style={{ background: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))" }}
          >
            {label(status)}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {saveState === "saving" && "Saving…"}
          {saveState === "saved" && !dirty && "All changes saved"}
          {dirty && saveState !== "saving" && "Unsaved changes"}
          {saveState === "error" && <span className="text-red-600">Save failed — retrying on next edit</span>}
        </div>
      </div>

      {/* Title + summary + body */}
      <input
        aria-label="Title"
        value={title}
        onChange={(e) => { setTitle(e.target.value); queueAutosave({ title: e.target.value }) }}
        maxLength={300}
        className="w-full rounded-xl border border-border bg-background px-4 py-3 font-serif text-2xl font-semibold text-foreground focus:border-icon-green focus:outline-none"
      />
      <textarea
        aria-label="Summary"
        value={summary}
        onChange={(e) => { setSummary(e.target.value); queueAutosave({ summary: e.target.value }) }}
        rows={2}
        maxLength={2000}
        placeholder="Summary (used for previews, extracts, and adaptations)"
        className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-icon-green focus:outline-none"
      />
      <textarea
        aria-label="Body (Markdown)"
        value={body}
        onChange={(e) => { setBody(e.target.value); queueAutosave({ body: e.target.value }) }}
        rows={18}
        placeholder={"Write in Markdown. Headings (#), **bold**, _italic_, [links](https://…), > quotes, lists, --- dividers."}
        className="w-full rounded-xl border border-border bg-background px-4 py-3 font-mono text-sm leading-relaxed text-foreground placeholder:text-muted-foreground/60 focus:border-icon-green focus:outline-none"
      />

      {/* Metadata + workflow */}
      <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-border p-4">
        <div>
          <label htmlFor="e-availability" className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Availability described</label>
          <select id="e-availability" value={availability} onChange={(e) => setAvailability(e.target.value)} className={selectClass}>
            {AVAILABILITY_STATUSES.map((a) => <option key={a} value={a}>{label(a)}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="e-brand" className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Brand</label>
          <select id="e-brand" value={brand} onChange={(e) => setBrand(e.target.value)} className={selectClass}>
            <option value="">—</option>
            {BRANDS.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="e-audience" className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Audience</label>
          <select id="e-audience" value={audience} onChange={(e) => setAudience(e.target.value)} className={selectClass}>
            <option value="">—</option>
            {AUDIENCES.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="e-pathway" className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Pathway</label>
          <select id="e-pathway" value={pathway} onChange={(e) => setPathway(e.target.value)} className={selectClass}>
            <option value="">—</option>
            {PATHWAYS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="e-foundation" className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Foundation</label>
          <select id="e-foundation" value={foundation} onChange={(e) => setFoundation(e.target.value)} className={selectClass}>
            <option value="">—</option>
            {FOUNDATIONS.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
        <button type="button" onClick={saveMetadata} className="rounded-full border border-icon-green/30 bg-icon-green/5 px-5 py-2 text-sm font-semibold text-icon-green">
          Save metadata
        </button>
      </div>

      {/* Workflow actions */}
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border p-4">
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Workflow</span>
        {availableTransitions.map((to) => (
          <button
            key={to}
            type="button"
            onClick={() => transition(to)}
            className={
              to === "approved"
                ? "brand-gradient rounded-full px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                : "rounded-full border border-border px-4 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
            }
          >
            {to === "approved" ? "Approve" : `→ ${label(to)}`}
          </button>
        ))}
        <button
          type="button"
          onClick={saveVersion}
          className="ml-auto rounded-full border border-border px-4 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
        >
          Save version
        </button>
      </div>

      {actionError && <p className="text-xs text-red-600">{actionError}</p>}
    </div>
  )
}
