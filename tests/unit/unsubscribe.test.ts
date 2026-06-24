import { describe, it, expect, afterEach } from "vitest"
import {
  unsubscribeToken,
  verifyUnsubscribeToken,
  unsubscribeUrl,
  unsubscribeOneClickUrl,
  unsubscribeHeaders,
} from "@/lib/email/unsubscribe"

const origSecret = process.env.UNSUBSCRIBE_SECRET

afterEach(() => {
  if (origSecret === undefined) delete process.env.UNSUBSCRIBE_SECRET
  else process.env.UNSUBSCRIBE_SECRET = origSecret
})

describe("email unsubscribe tokens", () => {
  it("produces a deterministic sha256-hex token, case/space-insensitive on email", () => {
    process.env.UNSUBSCRIBE_SECRET = "unsub-secret"
    const t = unsubscribeToken("Person@Example.com")
    expect(t).toMatch(/^[0-9a-f]{64}$/)
    expect(unsubscribeToken("  person@example.com ")).toBe(t) // normalised
  })

  it("verifies its own token and rejects wrong/empty tokens", () => {
    process.env.UNSUBSCRIBE_SECRET = "unsub-secret"
    const email = "person@example.com"
    expect(verifyUnsubscribeToken(email, unsubscribeToken(email))).toBe(true)
    expect(verifyUnsubscribeToken(email, "deadbeef")).toBe(false)
    expect(verifyUnsubscribeToken(email, "")).toBe(false)
    expect(verifyUnsubscribeToken(email, null)).toBe(false)
  })

  it("can't reuse one address's token for another", () => {
    process.env.UNSUBSCRIBE_SECRET = "unsub-secret"
    const tokenA = unsubscribeToken("a@example.com")
    expect(verifyUnsubscribeToken("b@example.com", tokenA)).toBe(false)
  })

  it("changes the token when the secret changes", () => {
    process.env.UNSUBSCRIBE_SECRET = "secret-A"
    const a = unsubscribeToken("person@example.com")
    process.env.UNSUBSCRIBE_SECRET = "secret-B"
    expect(verifyUnsubscribeToken("person@example.com", a)).toBe(false)
  })

  it("builds page + one-click URLs and one-click List-Unsubscribe headers", () => {
    process.env.UNSUBSCRIBE_SECRET = "unsub-secret"
    const email = "person+tag@example.com"
    const page = unsubscribeUrl(email)
    const oneClick = unsubscribeOneClickUrl(email)
    expect(page).toContain("/unsubscribe?email=")
    expect(page).toContain("token=")
    expect(page).toContain(encodeURIComponent("person+tag@example.com"))
    expect(oneClick).toContain("/api/unsubscribe?email=")

    const headers = unsubscribeHeaders(email)
    expect(headers["List-Unsubscribe"]).toContain(`<${oneClick}>`)
    expect(headers["List-Unsubscribe"]).toContain("mailto:")
    expect(headers["List-Unsubscribe-Post"]).toBe("List-Unsubscribe=One-Click")
  })
})
