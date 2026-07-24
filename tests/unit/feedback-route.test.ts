/**
 * /api/feedback (customer feedback capture) handler tests.
 *
 * Runs the real route handler in-process, mocking at the package boundary:
 * auth (getUserFromRequest), the service-role DB, Claude, the AI guard, and
 * the IP rate limiter. Covers: validation, anonymous vs authed cost paths,
 * successful triage + follow-up, and graceful degradation when extraction or
 * the DB fails.
 */
import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

/** Toggled per test. */
let currentUser: { id: string } | null = null
let claudeText = ""
let claudeThrows = false
let guardResult: unknown = null // null = allowed
let rlAllowed = true

vi.mock("@/lib/supabase-server", () => ({
  getUserFromRequest: async () => currentUser,
}))

vi.mock("@/lib/ai-guard", () => ({
  guardAiUsage: async () => guardResult,
}))

vi.mock("@/lib/rate-limit", () => ({
  rateLimit: () => ({ allowed: rlAllowed, remaining: 4, retryAfterSeconds: 600 }),
  getClientIp: () => "127.0.0.1",
  rateLimitResponse: () => ({ body: { error: "rate limited" }, init: { status: 429 } }),
}))

vi.mock("@/lib/anthropic", () => ({
  CLAUDE_MODEL: "claude-test",
  anthropic: {
    messages: {
      create: async () => {
        if (claudeThrows) throw new Error("claude down")
        return { content: [{ type: "text", text: claudeText }] }
      },
    },
  },
}))

const insertSpy = vi.fn()
let insertError: { message: string } | null = null

vi.mock("@/lib/supabase", () => ({
  getSupabase: () => ({
    from: () => ({
      insert: (row: unknown) => {
        insertSpy(row)
        return Promise.resolve({ error: insertError })
      },
    }),
  }),
}))

async function post(bodyObj: unknown) {
  const { POST } = await import("@/app/api/feedback/route")
  const req = new NextRequest("http://localhost/api/feedback", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(bodyObj),
  })
  return POST(req)
}

beforeEach(() => {
  currentUser = null
  claudeText = JSON.stringify({
    category: "bug", sentiment: "negative", severity: "medium",
    feature_area: "meal analysis", summary: "scan was slow",
    suggested_improvement: "speed up the scan", follow_up: "Which meal were you scanning?",
  })
  claudeThrows = false
  guardResult = null
  rlAllowed = true
  insertError = null
  insertSpy.mockClear()
})

describe("/api/feedback validation", () => {
  it("400s on an empty message", async () => {
    const res = await post({ message: "   " })
    expect(res.status).toBe(400)
    expect(insertSpy).not.toHaveBeenCalled()
  })

  it("400s on a missing message", async () => {
    const res = await post({ rating: 5 })
    expect(res.status).toBe(400)
  })
})

describe("/api/feedback anonymous path", () => {
  it("stores a triaged row and returns the follow-up", async () => {
    const res = await post({ message: "the scan was really slow", rating: 2, source_page: "/analyse" })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
    expect(body.stored).toBe(true)
    expect(body.follow_up).toBe("Which meal were you scanning?")
    expect(insertSpy).toHaveBeenCalledTimes(1)
    const row = insertSpy.mock.calls[0][0] as Record<string, unknown>
    expect(row.user_id).toBeNull()
    expect(row.category).toBe("bug")
    expect(row.severity).toBe("medium")
    expect(row.rating).toBe(2)
  })

  it("429s when the per-IP burst limit is exceeded", async () => {
    rlAllowed = false
    const res = await post({ message: "hello" })
    expect(res.status).toBe(429)
    expect(insertSpy).not.toHaveBeenCalled()
  })
})

describe("/api/feedback authed path", () => {
  it("attributes the row to the user and honours the AI daily cap", async () => {
    currentUser = { id: "user-9" }
    const res = await post({ message: "love the new dashboard", rating: 5 })
    expect(res.status).toBe(200)
    const row = insertSpy.mock.calls[0][0] as Record<string, unknown>
    expect(row.user_id).toBe("user-9")
  })

  it("returns the guard's 429 and never calls Claude/DB when capped", async () => {
    currentUser = { id: "user-9" }
    const { NextResponse } = await import("next/server")
    guardResult = NextResponse.json({ error: "capped" }, { status: 429 })
    const res = await post({ message: "still typing feedback" })
    expect(res.status).toBe(429)
    expect(insertSpy).not.toHaveBeenCalled()
  })
})

describe("/api/feedback graceful degradation", () => {
  it("still stores the raw message when extraction throws", async () => {
    claudeThrows = true
    const res = await post({ message: "something odd happened" })
    expect(res.status).toBe(200)
    expect(insertSpy).toHaveBeenCalledTimes(1)
    const row = insertSpy.mock.calls[0][0] as Record<string, unknown>
    expect(row.message).toBe("something odd happened")
    expect(row.category).toBeNull() // no triage, but not lost
  })

  it("thanks the user even if the DB insert fails", async () => {
    insertError = { message: "boom" }
    const res = await post({ message: "hope this saves" })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
    expect(body.stored).toBe(false)
  })
})
