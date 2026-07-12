import { describe, it, expect } from "vitest"
import { nextChapterNumber, swapChapterNumbers } from "@/lib/cms/chapter-order"
import { PUBLICATION_TARGETS, isPublicationTarget } from "@/lib/cms/taxonomy"

describe("nextChapterNumber", () => {
  it("returns 1 for an empty book", () => {
    expect(nextChapterNumber([])).toBe(1)
  })
  it("returns one past the current max, regardless of order", () => {
    expect(nextChapterNumber([1, 3, 2])).toBe(4)
  })
})

describe("swapChapterNumbers", () => {
  const chapters = [
    { id: "a", chapter_number: 1 },
    { id: "b", chapter_number: 2 },
    { id: "c", chapter_number: 3 },
  ]

  it("swaps the chapter_number of two adjacent chapters", () => {
    const result = swapChapterNumbers(chapters, 0, 1)
    expect(result).toEqual([
      { id: "a", chapter_number: 2 },
      { id: "b", chapter_number: 1 },
    ])
  })

  it("returns null when moving the first chapter up (out of range)", () => {
    expect(swapChapterNumbers(chapters, 0, -1)).toBeNull()
  })

  it("returns null when moving the last chapter down (out of range)", () => {
    expect(swapChapterNumbers(chapters, 2, 3)).toBeNull()
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
