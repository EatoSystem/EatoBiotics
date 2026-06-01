import { describe, it, expect, afterEach } from "vitest"
import { adminCookieToken, verifyAdminCookie } from "@/lib/admin-auth"

const origSecret = process.env.ADMIN_SESSION_SECRET
const origPassword = process.env.ADMIN_PASSWORD

afterEach(() => {
  if (origSecret === undefined) delete process.env.ADMIN_SESSION_SECRET
  else process.env.ADMIN_SESSION_SECRET = origSecret
  if (origPassword === undefined) delete process.env.ADMIN_PASSWORD
  else process.env.ADMIN_PASSWORD = origPassword
})

describe("admin-auth", () => {
  it("produces a deterministic, non-trivial token from the secret", () => {
    process.env.ADMIN_SESSION_SECRET = "s3cret-value"
    const token = adminCookieToken()
    expect(token).toMatch(/^[0-9a-f]{64}$/) // sha256 hex
    expect(adminCookieToken()).toBe(token) // deterministic
  })

  it("validates its own token and rejects the old static sentinel", () => {
    process.env.ADMIN_SESSION_SECRET = "s3cret-value"
    const token = adminCookieToken()!
    expect(verifyAdminCookie(token)).toBe(true)
    // The previously-forgeable constant must no longer pass.
    expect(verifyAdminCookie("eatobiotics-admin-ok")).toBe(false)
    expect(verifyAdminCookie("")).toBe(false)
    expect(verifyAdminCookie(null)).toBe(false)
  })

  it("changes the token when the secret changes (can't forge across secrets)", () => {
    process.env.ADMIN_SESSION_SECRET = "secret-A"
    const a = adminCookieToken()!
    process.env.ADMIN_SESSION_SECRET = "secret-B"
    expect(verifyAdminCookie(a)).toBe(false)
  })

  it("falls back to ADMIN_PASSWORD when no dedicated secret is set", () => {
    delete process.env.ADMIN_SESSION_SECRET
    process.env.ADMIN_PASSWORD = "pw"
    expect(verifyAdminCookie(adminCookieToken())).toBe(true)
  })

  it("fails closed when no secret is configured", () => {
    delete process.env.ADMIN_SESSION_SECRET
    delete process.env.ADMIN_PASSWORD
    expect(adminCookieToken()).toBeNull()
    expect(verifyAdminCookie("anything")).toBe(false)
  })
})
