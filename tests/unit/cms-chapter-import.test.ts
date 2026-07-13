import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { NextRequest } from "next/server"
import {
  resolveChapterImportPlan,
  renderPlanText,
  classifyDivergence,
  mirrorSlug,
  type SourceChapter,
  type ExistingState,
  type ExistingChapter,
  type ExistingMirror,
} from "@/lib/cms/chapter-import"

/* Import-plan resolution + the non-empty-production safety requirement
   (docs/cms-chapter-import-spec.md §4.1 + acceptance criteria). The resolver is
   pure, so these fixtures drive it directly with no DB. The route's fail-closed
   gate is covered at the bottom. */

function makeSource(n: number, over: Partial<SourceChapter> = {}): SourceChapter {
  const slug = `chapter-${n}`
  return {
    number: n,
    sourceSlug: slug,
    mirrorSlug: mirrorSlug(slug),
    sourcePath: `content/book/${slug}.mdx`,
    title: `Chapter ${n}`,
    summary: `Summary ${n}`,
    part: "I",
    partTitle: "Part I",
    body: `# Chapter ${n}\n\nBody.`,
    sourcePublished: true,
    publicationTarget: ["website"],
    sourceSha256: `src-${n}`,
    bodySha256: `body-${n}`,
    metaSha256: `meta-${n}`,
    ...over,
  }
}

const sources25 = Array.from({ length: 25 }, (_, i) => makeSource(i + 1))

function emptyState(over: Partial<ExistingState> = {}): ExistingState {
  return { book: null, targetBookChapters: [], mirrors: [], slugOwners: {}, ...over }
}

const targetChapter = (num: number, status: string): ExistingChapter => ({
  chapterId: `ch-${num}`,
  contentId: `cnt-${num}`,
  chapterNumber: num,
  status,
  mirrorSourcePath: null,
})

const syncedMirror = (n: number): ExistingMirror => ({
  sourcePath: `content/book/chapter-${n}.mdx`,
  chapterId: `ch-${n}`,
  sourceSha256: `src-${n}`,
  bodySha256: `body-${n}`,
  metaSha256: `meta-${n}`,
})

describe("resolveChapterImportPlan — non-empty-production safety fixtures", () => {
  // Fixture 1
  it("1) existing target book with no chapters → reuse book, CREATE 25", () => {
    const plan = resolveChapterImportPlan(sources25, emptyState({ book: { contentId: "bc", bookId: "bk" } }))
    expect(plan.bookAction).toBe("REUSE")
    expect(plan.counts).toEqual({ CREATE: 25, SKIP: 0, UPDATE_AVAILABLE: 0, CONFLICT: 0 })
    expect(plan.verdict).toBe("READY")
  })

  // Fixture 2
  it("2) unrelated manual book with chapters 1–3 → no conflict for the target book", () => {
    // Chapters of a differently-slugged book never enter targetBookChapters.
    const plan = resolveChapterImportPlan(sources25, emptyState({ book: null, targetBookChapters: [] }))
    expect(plan.bookAction).toBe("CREATE")
    expect(plan.counts.CONFLICT).toBe(0)
    expect(plan.counts.CREATE).toBe(25)
    expect(plan.verdict).toBe("READY")
  })

  // Fixture 3
  it("3) existing target book with ACTIVE manual chapters 1–3 → CONFLICT 3, apply blocked", () => {
    const plan = resolveChapterImportPlan(
      sources25,
      emptyState({
        book: { contentId: "bc", bookId: "bk" },
        targetBookChapters: [targetChapter(1, "draft"), targetChapter(2, "draft"), targetChapter(3, "in_review")],
      })
    )
    expect(plan.counts.CONFLICT).toBe(3)
    expect(plan.counts.CREATE).toBe(22)
    expect(plan.verdict).toBe("BLOCKED")
    expect(plan.items.filter((i) => i.action === "CONFLICT").map((i) => i.number)).toEqual([1, 2, 3])
  })

  // Fixture 4
  it("4) ARCHIVED manual chapters 1–3 in the target book → numbers free, no active conflict", () => {
    const plan = resolveChapterImportPlan(
      sources25,
      emptyState({
        book: { contentId: "bc", bookId: "bk" },
        targetBookChapters: [targetChapter(1, "archived"), targetChapter(2, "archived"), targetChapter(3, "archived")],
      })
    )
    expect(plan.counts.CONFLICT).toBe(0)
    expect(plan.counts.CREATE).toBe(25)
    expect(plan.verdict).toBe("READY")
  })

  // Fixture 5
  it("5) global mdx-chapter-1 slug owned by unrelated content → conflict", () => {
    const plan = resolveChapterImportPlan(
      sources25,
      emptyState({
        book: { contentId: "bc", bookId: "bk" },
        slugOwners: { "mdx-chapter-1": { contentId: "foreign", contentType: "article" } },
      })
    )
    expect(plan.counts.CONFLICT).toBe(1)
    expect(plan.items.find((i) => i.number === 1)?.action).toBe("CONFLICT")
    expect(plan.verdict).toBe("BLOCKED")
  })

  // Fixture 6
  it("6) existing valid mirror rows → SKIP when in sync, UPDATE_AVAILABLE when source changed", () => {
    const changedMirror: ExistingMirror = { ...syncedMirror(2), sourceSha256: "OLD-HASH" }
    const plan = resolveChapterImportPlan(
      sources25,
      emptyState({
        book: { contentId: "bc", bookId: "bk" },
        mirrors: [syncedMirror(1), changedMirror],
      })
    )
    expect(plan.items.find((i) => i.number === 1)?.action).toBe("SKIP")
    expect(plan.items.find((i) => i.number === 2)?.action).toBe("UPDATE_AVAILABLE")
    expect(plan.counts).toEqual({ CREATE: 23, SKIP: 1, UPDATE_AVAILABLE: 1, CONFLICT: 0 })
    expect(plan.verdict).toBe("READY") // creates remain, updates are report-only
  })

  // Fixture 7
  it("7) mixed production state → deterministic full plan, no partial assumptions", () => {
    const plan = resolveChapterImportPlan(
      sources25,
      emptyState({
        book: { contentId: "bc", bookId: "bk" },
        targetBookChapters: [targetChapter(2, "draft"), targetChapter(1, "archived")], // 2 active-conflict, 1 archived→free
        mirrors: [syncedMirror(3), { ...syncedMirror(5), sourceSha256: "OLD" }], // 3 SKIP, 5 UPDATE_AVAILABLE
        slugOwners: { "mdx-chapter-4": { contentId: "foreign", contentType: "image" } }, // 4 CONFLICT
      })
    )
    expect(plan.items.find((i) => i.number === 1)?.action).toBe("CREATE")
    expect(plan.items.find((i) => i.number === 2)?.action).toBe("CONFLICT")
    expect(plan.items.find((i) => i.number === 3)?.action).toBe("SKIP")
    expect(plan.items.find((i) => i.number === 4)?.action).toBe("CONFLICT")
    expect(plan.items.find((i) => i.number === 5)?.action).toBe("UPDATE_AVAILABLE")
    expect(plan.counts).toEqual({ CREATE: 21, SKIP: 1, UPDATE_AVAILABLE: 1, CONFLICT: 2 })
    expect(plan.verdict).toBe("BLOCKED")
    // Deterministic ordering by chapter number.
    expect(plan.items.map((i) => i.number)).toEqual(Array.from({ length: 25 }, (_, i) => i + 1))
  })

  it("idempotency: a fully-synced book is a NOOP with no creates", () => {
    const plan = resolveChapterImportPlan(
      sources25,
      emptyState({
        book: { contentId: "bc", bookId: "bk" },
        mirrors: sources25.map((s) => syncedMirror(s.number)),
      })
    )
    expect(plan.counts).toEqual({ CREATE: 0, SKIP: 25, UPDATE_AVAILABLE: 0, CONFLICT: 0 })
    expect(plan.verdict).toBe("NOOP")
  })
})

describe("classifyDivergence", () => {
  const base = { storedSourceSha: "s", storedBodySha: "b" }
  it("in_sync when both match", () => {
    expect(classifyDivergence({ ...base, currentSourceSha: "s", currentBodySha: "b" })).toBe("in_sync")
  })
  it("source_changed when only MDX differs", () => {
    expect(classifyDivergence({ ...base, currentSourceSha: "s2", currentBodySha: "b" })).toBe("source_changed")
  })
  it("cms_changed when only the CMS body differs", () => {
    expect(classifyDivergence({ ...base, currentSourceSha: "s", currentBodySha: "b2" })).toBe("cms_changed")
  })
  it("both_changed when both differ", () => {
    expect(classifyDivergence({ ...base, currentSourceSha: "s2", currentBodySha: "b2" })).toBe("both_changed")
  })
  it("missing_source when the MDX file is gone", () => {
    expect(classifyDivergence({ ...base, currentSourceSha: null, currentBodySha: "b" })).toBe("missing_source")
  })
})

describe("renderPlanText", () => {
  it("dry-run text names no batch id and states no rows written", () => {
    const plan = resolveChapterImportPlan(sources25, emptyState({ book: { contentId: "bc", bookId: "bk" } }))
    const text = renderPlanText(plan, { sourcesScanned: 25, sourcesExpected: 25 })
    expect(text).toContain("[DRY RUN]")
    expect(text).not.toMatch(/batch/i)
    expect(text).toContain("No rows written")
    expect(text).toContain("READY")
  })
})

/* ── Route fail-closed gate ── */
const mockGetSupabase = vi.fn()
vi.mock("@/lib/supabase", () => ({ getSupabase: () => mockGetSupabase() }))

beforeEach(() => {
  vi.resetModules()
  vi.clearAllMocks()
})
afterEach(() => {
  vi.unstubAllEnvs()
})

function req(cookie?: string, body?: unknown): NextRequest {
  const headers: Record<string, string> = {}
  if (cookie) headers.cookie = `admin_auth=${cookie}`
  if (body !== undefined) headers["content-type"] = "application/json"
  return new NextRequest("http://localhost/api/cms/import/chapters", {
    method: "POST",
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
}

describe("/api/cms/import/chapters fail-closed gate", () => {
  it("returns 404 unauthenticated and never touches the database", async () => {
    vi.stubEnv("ADMIN_SESSION_SECRET", "a-test-secret-value")
    const { POST } = await import("@/app/api/cms/import/chapters/route")
    const res = await POST(req(undefined, { mode: "dry_run" }))
    expect(res.status).toBe(404)
    expect(mockGetSupabase).not.toHaveBeenCalled()
  })

  it("fails closed when no admin secret is configured, even with a cookie", async () => {
    vi.stubEnv("ADMIN_SESSION_SECRET", "")
    vi.stubEnv("ADMIN_PASSWORD", "")
    const { POST } = await import("@/app/api/cms/import/chapters/route")
    const res = await POST(req("any-cookie", { mode: "dry_run" }))
    expect(res.status).toBe(404)
    expect(mockGetSupabase).not.toHaveBeenCalled()
  })

  it("a valid admin cookie passes the gate (503 without a database)", async () => {
    vi.stubEnv("ADMIN_SESSION_SECRET", "a-test-secret-value")
    mockGetSupabase.mockReturnValue(null)
    const { adminCookieToken } = await import("@/lib/admin-auth")
    const { POST } = await import("@/app/api/cms/import/chapters/route")
    const res = await POST(req(adminCookieToken() as string, { mode: "dry_run" }))
    expect(res.status).toBe(503)
    expect(mockGetSupabase).toHaveBeenCalled()
  })
})
