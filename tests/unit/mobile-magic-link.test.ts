/**
 * Companion magic-link: branded send-magic-link with a flag, not an open redirect.
 */
import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

process.env.SUPABASE_URL = "https://test.supabase.co"
process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role"
process.env.NEXT_PUBLIC_SITE_URL = "https://eatobiotics.com"
delete process.env.RESEND_API_KEY

const generateLink = vi.fn(async () => ({
  data: { properties: { action_link: "https://test.supabase.co/auth/v1/verify?token=abc" } },
  error: null,
}))

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    auth: { admin: { generateLink } },
  }),
}))

vi.mock("@/lib/rate-limit", () => ({
  rateLimit: () => ({ allowed: true, remaining: 4, resetAt: Date.now() + 60_000 }),
  getClientIp: () => "203.0.113.9",
  rateLimitResponse: () => ({ body: { error: "rate limited" }, init: { status: 429 } }),
}))

async function post(body: unknown) {
  const { POST } = await import("@/app/api/auth/send-magic-link/route")
  const req = new NextRequest("http://localhost/api/auth/send-magic-link", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  return POST(req)
}

beforeEach(() => {
  generateLink.mockClear()
})

describe("send-magic-link mobile client", () => {
  it("web default still lands on /auth/callback with no client flag", async () => {
    const res = await post({ email: "member@example.com" })
    expect(res.status).toBe(200)
    expect(generateLink).toHaveBeenCalledWith({
      type: "magiclink",
      email: "member@example.com",
      options: { redirectTo: "https://eatobiotics.com/auth/callback" },
    })
  })

  it("client=mobile hops through /auth/callback?client=mobile, not a supplied URL", async () => {
    const res = await post({
      email: "member@example.com",
      client: "mobile",
      redirectTo: "https://evil.example/steal",
    })
    expect(res.status).toBe(200)
    expect(generateLink).toHaveBeenCalledWith({
      type: "magiclink",
      email: "member@example.com",
      options: { redirectTo: "https://eatobiotics.com/auth/callback?client=mobile" },
    })
  })

  it("unknown client is refused", async () => {
    const res = await post({ email: "member@example.com", client: "evil" })
    expect(res.status).toBe(400)
    expect(generateLink).not.toHaveBeenCalled()
  })
})
