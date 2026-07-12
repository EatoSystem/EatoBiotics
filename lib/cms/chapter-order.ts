/* ── Chapter ordering (pure, testable) ─────────────────────────────────────
   Ordering is a plain chapter_number on each chapter's own cms_chapters row —
   not an array on the book — so it never needs array surgery when a chapter
   is inserted or archived out of band. Reordering is two sequential PATCHes
   built from the pair these helpers return; there is no server-side reorder
   endpoint. */

export function nextChapterNumber(existing: number[]): number {
  return existing.length === 0 ? 1 : Math.max(...existing) + 1
}

export function swapChapterNumbers(
  chapters: { id: string; chapter_number: number }[],
  indexA: number,
  indexB: number
): { id: string; chapter_number: number }[] | null {
  if (
    indexA < 0 || indexB < 0 ||
    indexA >= chapters.length || indexB >= chapters.length
  ) {
    return null
  }
  const a = chapters[indexA]
  const b = chapters[indexB]
  return [
    { id: a.id, chapter_number: b.chapter_number },
    { id: b.id, chapter_number: a.chapter_number },
  ]
}
