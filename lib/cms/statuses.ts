/* ── Content Studio editorial lifecycle ───────────────────────────────────
   The workflow status and the product-availability classification are two
   deliberately separate axes: an approved social post may describe a feature
   whose availability is still "future". Phase 1 exposes the editorial statuses
   up to approval + archive; the scheduling/publishing states exist in the
   schema but are NOT reachable through transitions yet (no channels exist).
   Core rule: AI drafts, the founder reviews — approval is always an explicit
   human action, and nothing can reach a publishing state without it.
──────────────────────────────────────────────────────────────────────── */

export const CONTENT_STATUSES = [
  "idea", "outline", "draft", "in_review", "changes_requested", "approved",
  "scheduled", "publishing", "published", "failed", "cancelled", "archived",
] as const
export type ContentStatus = (typeof CONTENT_STATUSES)[number]

export const AVAILABILITY_STATUSES = [
  "available_now", "needs_manual_verification", "in_development", "our_direction", "future",
] as const
export type AvailabilityStatus = (typeof AVAILABILITY_STATUSES)[number]

/** Phase-1 transition map. Scheduling/publishing states are deliberately
 *  unreachable until channels + the publish pipeline exist (later phase). */
const TRANSITIONS: Record<ContentStatus, ContentStatus[]> = {
  idea:               ["outline", "draft", "archived"],
  outline:            ["draft", "idea", "archived"],
  draft:              ["in_review", "outline", "archived"],
  in_review:          ["approved", "changes_requested", "archived"],
  changes_requested:  ["draft", "in_review", "archived"],
  approved:           ["in_review", "archived"],   // scheduling arrives in a later phase
  scheduled:          ["approved", "cancelled"],   // \
  publishing:         [],                          //  > reserved for the publish pipeline
  published:          ["archived"],                // /
  failed:             ["scheduled", "cancelled"],
  cancelled:          ["draft", "archived"],
  archived:           ["draft"],
}

export function canTransition(from: ContentStatus, to: ContentStatus): boolean {
  return (TRANSITIONS[from] ?? []).includes(to)
}

/** Statuses a Phase-1 admin can set via the UI/API (publish pipeline states excluded). */
export const PHASE1_SETTABLE: ContentStatus[] = [
  "idea", "outline", "draft", "in_review", "changes_requested", "approved", "archived",
]

export function isContentStatus(v: unknown): v is ContentStatus {
  return typeof v === "string" && (CONTENT_STATUSES as readonly string[]).includes(v)
}

export function isAvailabilityStatus(v: unknown): v is AvailabilityStatus {
  return typeof v === "string" && (AVAILABILITY_STATUSES as readonly string[]).includes(v)
}

/* ── Small content helpers ─────────────────────────────────────────────── */

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 80) || "untitled"
}

export function wordCount(markdown: string): number {
  const text = markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/[#>*_`~\-|[\]()!]/g, " ")
  const words = text.split(/\s+/).filter(Boolean)
  return words.length
}

/** Reading time in whole minutes at ~220 wpm, minimum 1 for non-empty content. */
export function readingTimeMinutes(markdown: string): number {
  const words = wordCount(markdown)
  if (words === 0) return 0
  return Math.max(1, Math.round(words / 220))
}
