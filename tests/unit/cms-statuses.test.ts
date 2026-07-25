import { describe, it, expect } from "vitest"
import {
  AVAILABILITY_STATUSES, CONTENT_STATUSES, PHASE1_SETTABLE,
  canTransition, isAvailabilityStatus, readingTimeMinutes, slugify, wordCount,
} from "@/lib/cms/statuses"
import { isPhase1ContentType } from "@/lib/cms/taxonomy"

/* Guards the Content Studio's core rules: approval is an explicit, guarded
   transition; publishing states are unreachable in Phase 1; the editorial
   workflow and the product-availability classification are separate axes. */

describe("cms status transitions", () => {
  it("approval is granted only from in_review (scheduled→approved is the unschedule rollback)", () => {
    for (const from of CONTENT_STATUSES) {
      const allowed = canTransition(from, "approved")
      expect(allowed, `from=${from}`).toBe(from === "in_review" || from === "scheduled")
    }
  })

  it("no Phase-1 settable path reaches scheduled/publishing/published", () => {
    for (const from of PHASE1_SETTABLE) {
      expect(canTransition(from, "scheduled"), `from=${from}`).toBe(false)
      expect(canTransition(from, "publishing"), `from=${from}`).toBe(false)
      expect(canTransition(from, "published"), `from=${from}`).toBe(false)
    }
  })

  it("drafts go to review, review can request changes, changes return to draft", () => {
    expect(canTransition("draft", "in_review")).toBe(true)
    expect(canTransition("in_review", "changes_requested")).toBe(true)
    expect(canTransition("changes_requested", "draft")).toBe(true)
  })

  it("archived content is recoverable to draft, and archive is reachable from working states", () => {
    expect(canTransition("archived", "draft")).toBe(true)
    for (const from of ["idea", "draft", "in_review", "approved"] as const) {
      expect(canTransition(from, "archived"), `from=${from}`).toBe(true)
    }
  })

  it("an item cannot jump straight from idea to approved", () => {
    expect(canTransition("idea", "approved")).toBe(false)
    expect(canTransition("draft", "approved")).toBe(false)
  })
})

describe("availability classification (separate axis)", () => {
  it("accepts exactly the five honesty labels", () => {
    expect(AVAILABILITY_STATUSES).toHaveLength(5)
    for (const a of AVAILABILITY_STATUSES) expect(isAvailabilityStatus(a)).toBe(true)
    expect(isAvailabilityStatus("published")).toBe(false) // workflow value, not availability
    expect(isAvailabilityStatus("approved")).toBe(false)
  })
})

describe("phase-1 content types", () => {
  it("text types are creatable; media types are deferred", () => {
    expect(isPhase1ContentType("article")).toBe(true)
    expect(isPhase1ContentType("substack_post")).toBe(true)
    expect(isPhase1ContentType("video")).toBe(false)
    expect(isPhase1ContentType("image")).toBe(false)
    expect(isPhase1ContentType("not_a_type")).toBe(false)
  })
})

describe("content helpers", () => {
  it("slugify produces url-safe, bounded slugs", () => {
    expect(slugify("Chapter 3: The Gut — Brain Axis!")).toBe("chapter-3-the-gut-brain-axis")
    expect(slugify("   ")).toBe("untitled")
    expect(slugify("x".repeat(200)).length).toBeLessThanOrEqual(80)
  })

  it("word count ignores markdown syntax", () => {
    expect(wordCount("# Title\n\nSome **bold** text here.")).toBe(5)
    expect(wordCount("")).toBe(0)
  })

  it("reading time is 0 for empty, minimum 1 otherwise, ~220wpm", () => {
    expect(readingTimeMinutes("")).toBe(0)
    expect(readingTimeMinutes("a few words only")).toBe(1)
    expect(readingTimeMinutes(Array(660).fill("word").join(" "))).toBe(3)
  })
})
