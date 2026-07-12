import { describe, it, expect } from "vitest"
import {
  nextChapterNumber,
  activeChaptersInOrder,
  activeChapterNumbers,
  isArchivedChapter,
  reorderPair,
} from "@/lib/cms/chapter-order"
import { PUBLICATION_TARGETS, isPublicationTarget } from "@/lib/cms/taxonomy"

describe("nextChapterNumber", () => {
  it("returns 1 for an empty book", () => {
    expect(nextChapterNumber([])).toBe(1)
  })
  it("returns one past the current max, regardless of order", () => {
    expect(nextChapterNumber([1, 3, 2])).toBe(4)
  })
})

describe("isArchivedChapter", () => {
  it("is true only for the archived status", () => {
    expect(isArchivedChapter("archived")).toBe(true)
    expect(isArchivedChapter("draft")).toBe(false)
    expect(isArchivedChapter(null)).toBe(false)
    expect(isArchivedChapter(undefined)).toBe(false)
  })
})

describe("activeChaptersInOrder", () => {
  it("excludes archived chapters and orders deterministically by number", () => {
    const chapters = [
      { id: "c", chapter_number: 3, status: "draft" },
      { id: "a", chapter_number: 1, status: "draft" },
      { id: "x", chapter_number: 2, status: "archived" },
      { id: "b", chapter_number: 2, status: "draft" },
    ]
    expect(activeChaptersInOrder(chapters).map((c) => c.id)).toEqual(["a", "b", "c"])
  })

  it("breaks equal chapter_number ties by created_at then id (deterministic)", () => {
    const chapters = [
      { id: "z", chapter_number: 1, status: "draft", created_at: "2026-01-02" },
      { id: "a", chapter_number: 1, status: "draft", created_at: "2026-01-01" },
      { id: "m", chapter_number: 1, status: "draft", created_at: "2026-01-01" },
    ]
    expect(activeChaptersInOrder(chapters).map((c) => c.id)).toEqual(["a", "m", "z"])
  })
})

describe("activeChapterNumbers", () => {
  const chapters = [
    { id: "a", chapter_number: 1, status: "draft" },
    { id: "b", chapter_number: 2, status: "draft" },
    { id: "c", chapter_number: 3, status: "archived" },
  ]
  it("returns numbers of active chapters only (archived freed)", () => {
    expect(activeChapterNumbers(chapters).sort()).toEqual([1, 2])
  })
  it("can exclude one chapter id (the one being edited)", () => {
    expect(activeChapterNumbers(chapters, "b")).toEqual([1])
  })
})

describe("reorderPair", () => {
  const chapters = [
    { id: "a", chapter_number: 1, status: "draft" },
    { id: "b", chapter_number: 2, status: "draft" },
    { id: "c", chapter_number: 3, status: "draft" },
  ]

  it("returns the active neighbour pair for a valid move", () => {
    expect(reorderPair(chapters, "a", 1)).toEqual({ a: "a", b: "b" })
    expect(reorderPair(chapters, "c", -1)).toEqual({ a: "c", b: "b" })
  })

  it("returns null when moving the first chapter up (out of range)", () => {
    expect(reorderPair(chapters, "a", -1)).toBeNull()
  })

  it("returns null when moving the last chapter down (out of range)", () => {
    expect(reorderPair(chapters, "c", 1)).toBeNull()
  })

  it("returns null for an unknown / archived chapter id", () => {
    expect(reorderPair(chapters, "missing", 1)).toBeNull()
    const withArchived = [...chapters, { id: "z", chapter_number: 4, status: "archived" }]
    expect(reorderPair(withArchived, "z", -1)).toBeNull()
  })

  it("skips archived chapters when picking neighbours", () => {
    const mixed = [
      { id: "a", chapter_number: 1, status: "draft" },
      { id: "x", chapter_number: 2, status: "archived" },
      { id: "b", chapter_number: 3, status: "draft" },
    ]
    // a's active neighbour going down is b, not the archived x.
    expect(reorderPair(mixed, "a", 1)).toEqual({ a: "a", b: "b" })
  })
})

describe("isPublicationTarget", () => {
  it("has exactly the 5 taxonomy values", () => {
    expect(PUBLICATION_TARGETS).toHaveLength(5)
    expect(PUBLICATION_TARGETS).toEqual(["website", "substack", "reedsy", "print", "pdf"])
  })

  it("accepts each of the 5 values", () => {
    for (const t of PUBLICATION_TARGETS) {
      expect(isPublicationTarget(t)).toBe(true)
    }
  })

  it("rejects unrelated or editorial-status-shaped strings", () => {
    expect(isPublicationTarget("published")).toBe(false)
    expect(isPublicationTarget("kindle")).toBe(false)
    expect(isPublicationTarget("")).toBe(false)
    expect(isPublicationTarget(42)).toBe(false)
  })
})
