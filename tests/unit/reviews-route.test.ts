/**
 * /api/reviews — PRIVATE account-linked structured feedback (#229).
 *
 * Two things are pinned here beyond the ordinary handler behaviour:
 *
 *   1. There is NO public read. The route used to export a GET returning an
 *      aggregate plus "approved" quotes as social proof. `approved` was a
 *      staff moderation flag, not consent — nobody submitting was told their
 *      words might be published — so approving a quote would have published
 *      text the member never agreed to publish.
 *   2. Success means STORED. A 200 that did not write a row is a lie the
 *      member cannot detect.
 */
import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"
import { readFileSync } from "node:fs"

let sessionUser: { id: string } | null = null
vi.mock("@/lib/supabase-server", () => ({ getUser: async () => sessionUser }))

let rlAllowed = true
vi.mock("@/lib/rate-limit", () => ({
  rateLimit: () => ({ allowed: rlAllowed, remaining: 4, retryAfterSeconds: 600 }),
  getClientIp: () => "127.0.0.1",
  rateLimitResponse: () => ({ body: { error: "rate limited" }, init: { status: 429 } }),
}))

let upsertError: { message: string } | null = null
let dbConfigured = true
const upsertSpy = vi.fn(async (_payload: unknown, _opts: unknown) => ({ error: upsertError }))

vi.mock("@/lib/supabase", () => ({
  getSupabase: () => (dbConfigured ? { from: () => ({ upsert: upsertSpy }) } : null),
}))

async function load() {
  return import("@/app/api/reviews/route")
}

/**
 * Source with comments removed. These guards are about what the code DOES, and
 * the file explains at length why the public read was removed — matching raw
 * text would fail on its own rationale, which is the opposite of useful.
 */
function code(file: string): string {
  return readFileSync(file, "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "")
}
function post(body: unknown) {
  return new NextRequest("http://localhost/api/reviews", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
  })
}

beforeEach(() => {
  sessionUser = null
  rlAllowed = true
  upsertError = null
  dbConfigured = true
  upsertSpy.mockClear()
})

/* ══ No public surface ══════════════════════════════════════════════════ */

describe("reviews are private — there is no public read", () => {
  it("exports no GET handler at all", async () => {
    const mod = (await load()) as Record<string, unknown>
    expect(
      mod.GET,
      "a public testimonial read must not exist — see the consent-based design issue",
    ).toBeUndefined()
  })

  it("does not answer with an empty testimonials array", () => {
    // An endpoint replying `{ testimonials: [] }` reads as a working public
    // surface with no data yet, and invites someone to wire a renderer to it.
    const src = code("app/api/reviews/route.ts")
    expect(src).not.toMatch(/testimonials/)
    expect(src).not.toMatch(/export\s+async\s+function\s+GET/)
  })

  it("has no `approved` publication flag in the route contract", () => {
    const src = code("app/api/reviews/route.ts")
    expect(
      src,
      "moderation is not consent — the flag was removed rather than left to be mistaken for one",
    ).not.toMatch(/approved/)
  })

  it("nothing in the app renders review text", () => {
    // The whole point: no renderer, no public API, no social proof.
    const hits: string[] = []
    for (const f of [
      "components/account/feedback-prompt.tsx",
      "components/feedback/feedback-widget.tsx",
    ]) {
      if (/testimonial|social proof/i.test(code(f))) hits.push(f)
    }
    expect(hits).toEqual([])
  })
})

/* ══ POST contract ══════════════════════════════════════════════════════ */

describe("/api/reviews POST distinguishes stored, refused and unavailable", () => {
  it("401s when not signed in", async () => {
    const { POST } = await load()
    expect((await POST(post({ rating: 5 }))).status).toBe(401)
    expect(upsertSpy).not.toHaveBeenCalled()
  })

  it("400s on an out-of-range rating and never writes", async () => {
    sessionUser = { id: "u1" }
    const { POST } = await load()
    expect((await POST(post({ rating: 7 }))).status).toBe(400)
    expect(upsertSpy).not.toHaveBeenCalled()
  })

  it("400s on an over-length comment", async () => {
    sessionUser = { id: "u1" }
    const { POST } = await load()
    const res = await POST(post({ rating: 4, comment: "x".repeat(501) }))
    expect(res.status).toBe(400)
    expect(upsertSpy).not.toHaveBeenCalled()
  })

  it("stores one row per member and says so explicitly", async () => {
    sessionUser = { id: "u1" }
    const { POST } = await load()
    const res = await POST(post({ rating: 4, comment: "The daily ritual helps", source: "meal" }))

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true, stored: true })
    expect(upsertSpy).toHaveBeenCalledTimes(1)

    const [payload, opts] = upsertSpy.mock.calls[0] as [Record<string, unknown>, Record<string, unknown>]
    expect(payload.user_id).toBe("u1")
    expect(payload.rating).toBe(4)
    expect(payload.comment).toBe("The daily ritual helps")
    expect(opts.onConflict).toBe("user_id")
  })

  it("never sends expires_at — retention is the database's to set", async () => {
    sessionUser = { id: "u1" }
    const { POST } = await load()
    await POST(post({ rating: 5, comment: "good" }))
    const [payload] = upsertSpy.mock.calls[0] as [Record<string, unknown>, unknown]
    expect(
      Object.keys(payload),
      "a client-influenced expiry is not a retention policy",
    ).not.toContain("expires_at")
  })

  it("503s when storage is unavailable, rather than reporting success", async () => {
    sessionUser = { id: "u1" }
    dbConfigured = false
    const { POST } = await load()
    const res = await POST(post({ rating: 5 }))
    expect(res.status).toBe(503)
    expect((await res.json()).stored).toBeUndefined()
  })

  it("503s when the write fails, without leaking the database error", async () => {
    sessionUser = { id: "u1" }
    upsertError = { message: 'relation "reviews" does not exist' }
    const { POST } = await load()
    const res = await POST(post({ rating: 5 }))
    const body = await res.json()

    expect(res.status).toBe(503)
    expect(body.stored).toBeUndefined()
    expect(JSON.stringify(body)).not.toMatch(/relation|does not exist|reviews/)
  })

  it("429s when rate limited", async () => {
    sessionUser = { id: "u1" }
    rlAllowed = false
    const { POST } = await load()
    expect((await POST(post({ rating: 5 }))).status).toBe(429)
    expect(upsertSpy).not.toHaveBeenCalled()
  })
})
