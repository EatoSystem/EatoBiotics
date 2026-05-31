import { describe, it, expect, afterEach } from "vitest"
import type { NextRequest } from "next/server"
import { verifyCronRequest } from "@/lib/cron-auth"

/** Minimal NextRequest stub exposing only headers.get(), which is all the helper uses. */
function reqWithAuth(authHeader: string | null): NextRequest {
  return {
    headers: { get: (k: string) => (k.toLowerCase() === "authorization" ? authHeader : null) },
  } as unknown as NextRequest
}

describe("verifyCronRequest", () => {
  const original = process.env.CRON_SECRET

  afterEach(() => {
    if (original === undefined) delete process.env.CRON_SECRET
    else process.env.CRON_SECRET = original
  })

  it("fails closed with 503 when CRON_SECRET is not configured", () => {
    delete process.env.CRON_SECRET
    const res = verifyCronRequest(reqWithAuth("Bearer anything"))
    expect(res?.status).toBe(503)
  })

  it("rejects a wrong or missing bearer token with 401", () => {
    process.env.CRON_SECRET = "s3cret"
    expect(verifyCronRequest(reqWithAuth(null))?.status).toBe(401)
    expect(verifyCronRequest(reqWithAuth("Bearer wrong"))?.status).toBe(401)
  })

  it("authorises a correct bearer token (returns null)", () => {
    process.env.CRON_SECRET = "s3cret"
    expect(verifyCronRequest(reqWithAuth("Bearer s3cret"))).toBeNull()
  })
})
