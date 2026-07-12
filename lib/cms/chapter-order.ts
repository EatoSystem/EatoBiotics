/* ── Chapter ordering (pure, testable) ─────────────────────────────────────
   Ordering is a plain chapter_number on each chapter's own cms_chapters row —
   not an array on the book — so it never needs array surgery when a chapter is
   inserted or archived out of band.

   Archived chapters (their cms_content row is status 'archived') are excluded
   from every "active" calculation here: active ordering, the next chapter
   number, duplicate detection, and reorder neighbours. A number freed by
   archiving is therefore reusable, and archived rows never take part in
   reordering. Reordering itself is ONE atomic server-side swap
   (POST /api/cms/books/[id]/chapters/reorder → the cms_swap_chapter_order
   transaction), not two client requests. */

const ARCHIVED_STATUS = "archived"

export interface OrderableChapter {
  id: string
  chapter_number: number
  status?: string | null
  created_at?: string | null
}

export function isArchivedChapter(status: string | null | undefined): boolean {
  return status === ARCHIVED_STATUS
}

/** Active chapters (archived excluded) in a fully deterministic order:
 *  chapter_number, then created_at, then id. The secondary/tertiary keys mean
 *  equal chapter_numbers (only possible transiently) never reorder
 *  unpredictably between two reads. */
export function activeChaptersInOrder<T extends OrderableChapter>(chapters: T[]): T[] {
  return chapters
    .filter((c) => !isArchivedChapter(c.status))
    .slice()
    .sort(
      (a, b) =>
        a.chapter_number - b.chapter_number ||
        String(a.created_at ?? "").localeCompare(String(b.created_at ?? "")) ||
        String(a.id).localeCompare(String(b.id))
    )
}

/** chapter_number values already used by ACTIVE chapters (archived excluded),
 *  optionally ignoring one chapter id (the one being edited). */
export function activeChapterNumbers(chapters: OrderableChapter[], excludeId?: string): number[] {
  return chapters
    .filter((c) => !isArchivedChapter(c.status) && c.id !== excludeId)
    .map((c) => c.chapter_number)
}

export function nextChapterNumber(existing: number[]): number {
  return existing.length === 0 ? 1 : Math.max(...existing) + 1
}

/** The pair of chapter ids to swap for a one-step move in `direction` among the
 *  ACTIVE chapters, or null if the move is out of range or the chapter isn't an
 *  active, movable chapter. The caller applies the swap atomically — this only
 *  decides which two rows exchange their chapter_number. */
export function reorderPair(
  chapters: OrderableChapter[],
  chapterId: string,
  direction: -1 | 1
): { a: string; b: string } | null {
  const ordered = activeChaptersInOrder(chapters)
  const index = ordered.findIndex((c) => c.id === chapterId)
  if (index < 0) return null
  const target = index + direction
  if (target < 0 || target >= ordered.length) return null
  return { a: ordered[index].id, b: ordered[target].id }
}
