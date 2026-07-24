import { describe, it, expect } from "vitest"
import {
  buildDigestUser,
  buildExtractionUser,
  digestEmailHtml,
} from "@/lib/feedback/prompts"
import {
  coerceCategory,
  coerceSentiment,
  coerceSeverity,
  type FeedbackRow,
} from "@/lib/feedback/types"

describe("feedback coercion", () => {
  it("keeps valid values, defaults invalid ones", () => {
    expect(coerceCategory("bug")).toBe("bug")
    expect(coerceCategory("nonsense")).toBe("other")
    expect(coerceCategory(undefined)).toBe("other")
    expect(coerceSentiment("negative")).toBe("negative")
    expect(coerceSentiment(42)).toBe("neutral")
    expect(coerceSeverity("high")).toBe("high")
    expect(coerceSeverity("catastrophic")).toBeNull()
  })
})

describe("buildExtractionUser", () => {
  it("includes rating and page only when present", () => {
    expect(buildExtractionUser("great app", 5, "/pricing")).toContain("5/5")
    const bare = buildExtractionUser("great app", null, null)
    expect(bare).toContain("great app")
    expect(bare).not.toContain("rating")
    expect(bare).not.toContain("page")
  })
})

describe("buildDigestUser", () => {
  it("summarises a quiet week", () => {
    expect(buildDigestUser([])).toMatch(/no feedback/i)
  })
  it("lists submissions with their triage fields", () => {
    const rows: FeedbackRow[] = [
      { id: "1", user_id: null, source_page: "/analyse", rating: 2, message: "scan was slow", category: "bug", sentiment: "negative", severity: "medium", feature_area: "meal analysis", summary: null, suggested_improvement: null, status: "new", created_at: "2026-07-20T00:00:00Z" },
    ]
    const out = buildDigestUser(rows)
    expect(out).toContain("1 submission")
    expect(out).toContain("bug")
    expect(out).toContain("scan was slow")
    expect(out).toContain("area:meal analysis")
  })
  it("truncates very long messages", () => {
    const rows: FeedbackRow[] = [
      { id: "1", user_id: null, source_page: null, rating: null, message: "x".repeat(2000), status: "new", created_at: "2026-07-20T00:00:00Z" },
    ]
    // 600-char cap on the quoted body keeps the prompt bounded.
    expect(buildDigestUser(rows).length).toBeLessThan(900)
  })
})

describe("digestEmailHtml", () => {
  it("renders markdown headings/bold/lists and escapes HTML", () => {
    const html = digestEmailHtml({
      reportMarkdown: "# Headline\n**bold** point\n- item one\n- item two\n<script>x</script>",
      count: 3,
      rangeLabel: "1 Jul – 8 Jul",
      adminUrl: "https://eatobiotics.com/admin/feedback",
    })
    expect(html).toContain("<strong>bold</strong>")
    expect(html).toContain("<li")
    expect(html).toContain("3 submissions")
    expect(html).toContain("/admin/feedback")
    // Raw HTML in the report is escaped, not injected.
    expect(html).toContain("&lt;script&gt;")
    expect(html).not.toContain("<script>x</script>")
  })
})
