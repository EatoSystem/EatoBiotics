/**
 * The Terms of Service promise a 16+ Service; the forms used to offer
 * "Under 20" as their lowest bracket, so a 12-year-old could answer the health
 * questionnaire truthfully and be accepted.
 *
 * Two things are pinned here, and they fail for different reasons on purpose:
 *
 *  1. The bracket list is defined once. Six components carried their own copy,
 *     which is how the list and the Terms drifted apart without anyone editing
 *     either. A re-introduced literal fails the first block below even if the
 *     age floor still works, because the next drift starts with the copy.
 *
 *  2. The floor is enforced where rows are written, not only in the form. The
 *     age is self-declared either way — the point of the server checks is that
 *     a form control is not an enforcement point, and every one of these routes
 *     is reachable directly.
 */
import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"
import { readFileSync, readdirSync, statSync } from "node:fs"
import { join } from "node:path"
import {
  AGE_BRACKETS,
  MINIMUM_AGE,
  UNDER_MINIMUM_AGE_BRACKET,
  UNDER_MINIMUM_AGE_MESSAGE,
  isUnderMinimumAge,
} from "@/lib/age-brackets"

/* ── Mocks: these routes are only being asked to refuse, so nothing they would
      call on the accept path needs to be real. A null Supabase would let a
      route bail for the wrong reason, so it is a working stub. ───────────── */
const mockFrom = vi.fn()
vi.mock("@/lib/supabase", () => ({ getSupabase: () => ({ from: (...a: unknown[]) => mockFrom(...a) }) }))
vi.mock("@/lib/supabase-server", () => ({ getUser: () => Promise.resolve({ id: "user-1", email: "a@b.com" }) }))
vi.mock("@/lib/stripe-server", () => ({ stripe: { checkout: { sessions: { create: vi.fn() } } } }))
vi.mock("@/lib/email/send", () => ({ sendEmail: vi.fn().mockResolvedValue({ ok: true }) }))
vi.mock("@/lib/statsig-server", () => ({ logServerEvent: vi.fn() }))
vi.mock("@/lib/rate-limit", () => ({
  // Shaped like the real RateLimitResult. An `{ ok: true }` stub reads as
  // *blocked* (`!limit.allowed`) and then destructures to an undefined init,
  // which turns the rate-limit branch into a 200 — a route that never reached
  // the age check would have looked like a passing accept path.
  rateLimit: () => ({ allowed: true, remaining: 5, retryAfterSeconds: 0 }),
  getClientIp: () => "127.0.0.1",
  rateLimitResponse: (result: { retryAfterSeconds: number }) => ({
    body: { error: "Too many requests." },
    init: { status: 429, headers: { "Retry-After": String(result.retryAfterSeconds) } },
  }),
}))

beforeEach(() => {
  vi.clearAllMocks()
  mockFrom.mockImplementation(() => {
    const chain: Record<string, unknown> = {}
    for (const m of ["select", "eq", "in", "order", "limit", "insert", "update", "upsert"]) {
      chain[m] = () => chain
    }
    chain.maybeSingle = () => Promise.resolve({ data: null, error: null })
    chain.single = () => Promise.resolve({ data: null, error: null })
    chain.then = (resolve: (v: unknown) => void) => resolve({ data: null, error: null })
    return chain
  })
})

function post(url: string, body: unknown): NextRequest {
  return new NextRequest(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

/* ── 1. One definition ──────────────────────────────────────────────────── */

const AGE_BRACKET_CONSUMERS = [
  "components/assessment/assessment-intro.tsx",
  "components/mind-assessment/mind-assessment-intro.tsx",
  "components/family-assessment/family-assessment-intro.tsx",
  "components/waitlist/discover-flow.tsx",
  "components/account/live-dashboard.tsx",
  "components/account/settings-client.tsx",
]

describe("the age brackets are defined once", () => {
  it("offers a bracket below the age floor so the floor is answerable", () => {
    // "Under 20" straddles the line: it cannot be accepted or refused without
    // guessing. The split is what makes the Terms enforceable at all.
    expect(AGE_BRACKETS).toContain(UNDER_MINIMUM_AGE_BRACKET)
    expect(AGE_BRACKETS).not.toContain("Under 20")
    expect(UNDER_MINIMUM_AGE_BRACKET).toBe(`Under ${MINIMUM_AGE}`)
  })

  it("is imported by every surface that renders the list", () => {
    for (const file of AGE_BRACKET_CONSUMERS) {
      expect(
        readFileSync(file, "utf8"),
        `${file} must import the shared brackets, not declare its own`,
      ).toContain('from "@/lib/age-brackets"')
    }
  })

  it("has no second copy of the list anywhere in the tree", () => {
    // Scans rather than checking the six known files: the drift this prevents is
    // a *seventh* surface being added with its own literal.
    const roots = ["app", "components", "lib"]
    const offenders: string[] = []
    const walk = (dir: string) => {
      for (const entry of readdirSync(dir)) {
        const full = join(dir, entry)
        if (entry === "node_modules" || entry.startsWith(".")) continue
        if (statSync(full).isDirectory()) {
          walk(full)
          continue
        }
        if (!/\.(ts|tsx)$/.test(entry)) continue
        if (full === join("lib", "age-brackets.ts")) continue
        const source = readFileSync(full, "utf8")
        // Two adjacent range-shaped labels, anywhere in the file. Deliberately
        // not anchored to the array's opening bracket: the real list starts with
        // "Under 20"/"Under 16", which is not range-shaped, so an anchored
        // pattern matched nothing and the guard passed against a restored
        // duplicate. Matching the ranges themselves is what makes it bite.
        if (/"\d0[–-]\d9"\s*,\s*"\d0[–-]\d9"/.test(source)) offenders.push(full)
      }
    }
    for (const root of roots) walk(root)
    expect(offenders, "age brackets must come from lib/age-brackets.ts").toEqual([])
  })
})

describe("isUnderMinimumAge", () => {
  it("is true only for the under-age bracket", () => {
    expect(isUnderMinimumAge(UNDER_MINIMUM_AGE_BRACKET)).toBe(true)
    expect(isUnderMinimumAge(` ${UNDER_MINIMUM_AGE_BRACKET} `)).toBe(true)
    for (const bracket of AGE_BRACKETS.filter((b) => b !== UNDER_MINIMUM_AGE_BRACKET)) {
      expect(isUnderMinimumAge(bracket), `${bracket} must not be treated as under-age`).toBe(false)
    }
  })

  it("gives a straight answer for values that are not brackets", () => {
    // It runs on request bodies, so undefined/number/unknown-string must not
    // throw and must not be treated as under-age — those are the caller's own
    // validation to make, not a silent age refusal.
    for (const value of [undefined, null, 15, {}, [], "Under 20", ""]) {
      expect(isUnderMinimumAge(value)).toBe(false)
    }
  })
})

/* ── 2. Enforced where rows are written ─────────────────────────────────── */

describe("the age floor is enforced server-side", () => {
  it("submit-lead refuses an under-age lead and writes nothing", async () => {
    const { POST } = await import("@/app/api/submit-lead/route")
    const res = await POST(
      post("http://localhost/api/submit-lead", {
        name: "Test",
        email: "child@example.com",
        ageBracket: UNDER_MINIMUM_AGE_BRACKET,
      }),
    )

    expect(res.status).toBe(400)
    expect(await res.json()).toMatchObject({ code: "under_minimum_age" })
    // The consequential half: no lead row, so no email plus health scores stored.
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it("waitlist refuses an under-age signup and writes nothing", async () => {
    const { POST } = await import("@/app/api/waitlist/route")
    const res = await POST(
      post("http://localhost/api/waitlist", {
        email: "child@example.com",
        ageBracket: UNDER_MINIMUM_AGE_BRACKET,
      }),
    )

    expect(res.status).toBe(400)
    expect(await res.json()).toMatchObject({ code: "under_minimum_age" })
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it("account settings refuses an under-age edit and writes nothing", async () => {
    const { PATCH } = await import("@/app/api/account/settings/route")
    const res = await PATCH(
      post("http://localhost/api/account/settings", { age_bracket: UNDER_MINIMUM_AGE_BRACKET }),
    )

    expect(res.status).toBe(400)
    expect(await res.json()).toMatchObject({ code: "under_minimum_age" })
    // Without this the account surfaces would be a way around the intro check.
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it("still accepts an in-range bracket", async () => {
    // Guards against the refusal being written so broadly that it rejects
    // everyone — a test suite that only proves refusals would pass on that bug.
    const { POST } = await import("@/app/api/submit-lead/route")
    const res = await POST(
      post("http://localhost/api/submit-lead", {
        name: "Test",
        email: "adult@example.com",
        ageBracket: "40–49",
      }),
    )

    expect(res.status).toBe(200)
    expect(mockFrom).toHaveBeenCalled()
  })

  it("account settings reports a failed profile write instead of claiming success", async () => {
    // An awaited PostgREST call resolves with { error } rather than throwing, so
    // the route returned ok:true for a write that never landed — the person sees
    // their new name or age bracket in the form and it is gone on the next load.
    mockFrom.mockImplementation(() => {
      const chain: Record<string, unknown> = {}
      for (const m of ["select", "eq", "update"]) chain[m] = () => chain
      chain.then = (resolve: (v: unknown) => void) =>
        resolve({ data: null, error: { message: "profiles exploded" } })
      return chain
    })

    const { PATCH } = await import("@/app/api/account/settings/route")
    const res = await PATCH(post("http://localhost/api/account/settings", { age_bracket: "40–49" }))

    expect(res.status).toBe(503)
    expect(JSON.stringify(await res.json())).not.toContain("exploded")
  })

  it("refuses with copy that names the age, not a bare error code", () => {
    expect(UNDER_MINIMUM_AGE_MESSAGE).toContain(String(MINIMUM_AGE))
  })
})
