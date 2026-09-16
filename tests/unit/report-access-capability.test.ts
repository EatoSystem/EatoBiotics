import { describe, it, expect } from "vitest"
import { createHash } from "node:crypto"

import {
  BOOTSTRAP_WINDOW_MS,
  isWithinBootstrapWindow,
} from "@/lib/report/access/bootstrap-window"
import {
  REPORT_ACCESS_COOKIE_NAME,
  REPORT_ROUTE_BASE,
  candidateSecretsFor,
  decodeReportCookie,
  encodeReportCookie,
  hashSecret,
  hashesMatch,
  isHandoffId,
  mintSecret,
  reportCookieAttributes,
  reportCookiePath,
  secretMatchesHash,
} from "@/lib/report/access/capability"

/**
 * Capability primitives and the bootstrap window — Phase 4B-S1.
 *
 * The credential is the one mutable thing in the Report chain. The seal and the
 * canonical Report are immutable authority; this is a secret that has to be
 * rotatable, because minting commits a hash and returns the plaintext once, and
 * a response lost after commit makes that plaintext unrecoverable.
 */

const HANDOFF_A = "11111111-1111-4111-8111-111111111111"
const HANDOFF_B = "22222222-2222-4222-8222-222222222222"

describe("secret generation", () => {
  it("is 256 bits, base64url, unpadded", () => {
    const secret = mintSecret()
    expect(secret).toMatch(/^[A-Za-z0-9_-]{43}$/)
    expect(Buffer.from(secret, "base64url")).toHaveLength(32)
  })

  it("never repeats", () => {
    const seen = new Set(Array.from({ length: 200 }, () => mintSecret()))
    expect(seen.size).toBe(200)
  })

  it("contains no dot, so the cookie separator stays unambiguous", () => {
    for (let i = 0; i < 200; i++) expect(mintSecret()).not.toContain(".")
  })
})

describe("hashing", () => {
  it("is plain SHA-256 hex of the secret", () => {
    const secret = mintSecret()
    expect(hashSecret(secret)).toBe(createHash("sha256").update(secret, "utf8").digest("hex"))
    expect(hashSecret(secret)).toMatch(/^[0-9a-f]{64}$/)
  })

  it("matches a secret against its own committed hash", () => {
    const secret = mintSecret()
    expect(secretMatchesHash(secret, hashSecret(secret))).toBe(true)
  })

  it("rejects a different secret", () => {
    expect(secretMatchesHash(mintSecret(), hashSecret(mintSecret()))).toBe(false)
  })

  it("rejects malformed input rather than throwing", () => {
    // timingSafeEqual throws on unequal lengths, so the shape check has to come
    // first — and a throw here would be a 500 where a refusal belongs.
    expect(() => hashesMatch("short", "a".repeat(64))).not.toThrow()
    expect(hashesMatch("short", "a".repeat(64))).toBe(false)
    expect(hashesMatch("A".repeat(64), "A".repeat(64))).toBe(false) // uppercase is not our form
    expect(secretMatchesHash("not-a-secret", "a".repeat(64))).toBe(false)
    expect(secretMatchesHash(mintSecret(), "nonsense")).toBe(false)
  })

  it("a stored hash never reveals its secret", () => {
    const secret = mintSecret()
    expect(hashSecret(secret)).not.toContain(secret)
  })
})

describe("the cookie value binds a secret to one Report", () => {
  it("round-trips", () => {
    const secret = mintSecret()
    const decoded = decodeReportCookie(encodeReportCookie(HANDOFF_A, secret))
    expect(decoded).toEqual({ handoffId: HANDOFF_A, secret })
  })

  it("rejects anything that is not a handoff and a secret", () => {
    for (const bad of [
      "",
      "no-separator",
      `${HANDOFF_A}.`,
      `.${mintSecret()}`,
      `not-a-uuid.${mintSecret()}`,
      `${HANDOFF_A}.short`,
      `${HANDOFF_A}.${mintSecret()}!`,
    ]) {
      expect(decodeReportCookie(bad), bad).toBeNull()
    }
  })

  it("a cookie minted for Report A never authorises Report B", () => {
    // The binding is inside the VALUE, so this holds whatever a framework does
    // with path scoping.
    const secret = mintSecret()
    const cookie = encodeReportCookie(HANDOFF_A, secret)
    expect(candidateSecretsFor([cookie], HANDOFF_A)).toEqual([secret])
    expect(candidateSecretsFor([cookie], HANDOFF_B)).toEqual([])
  })

  it("considers every presented cookie, not the first", () => {
    // A `Cookie` header carries no path, so a runtime handing back several
    // same-name cookies gives no way to tell which Report each belongs to.
    const secretA = mintSecret()
    const secretB = mintSecret()
    const presented = [
      encodeReportCookie(HANDOFF_B, secretB),
      "garbage",
      encodeReportCookie(HANDOFF_A, secretA),
    ]
    expect(candidateSecretsFor(presented, HANDOFF_A)).toEqual([secretA])
    expect(candidateSecretsFor(presented, HANDOFF_B)).toEqual([secretB])
  })

  it("drops undecodable cookies silently", () => {
    // Reporting on them would tell a caller which of their guesses parsed.
    expect(candidateSecretsFor(["", "x", "a.b"], HANDOFF_A)).toEqual([])
  })

  it("returns nothing for a locator that is not a handoff", () => {
    expect(candidateSecretsFor([encodeReportCookie(HANDOFF_A, mintSecret())], "nope")).toEqual([])
  })
})

describe("cookie scoping is per Report", () => {
  it("paths are distinct and sit under the Report route", () => {
    expect(reportCookiePath(HANDOFF_A)).toBe(`${REPORT_ROUTE_BASE}/${HANDOFF_A}`)
    expect(reportCookiePath(HANDOFF_A)).not.toBe(reportCookiePath(HANDOFF_B))
  })

  it("is never a parent path", () => {
    // A cookie at `/`, or even at the Report route base, is sent to every
    // Report path and shadows the scoped ones. That would destroy coexistence.
    const path = reportCookiePath(HANDOFF_A)
    expect(path).not.toBe("/")
    expect(path).not.toBe(REPORT_ROUTE_BASE)
    expect(path.startsWith(`${REPORT_ROUTE_BASE}/`)).toBe(true)
  })

  it("refuses to build a path from a non-handoff", () => {
    expect(() => reportCookiePath("../..")).toThrow()
    expect(() => reportCookiePath("")).toThrow()
  })

  it("carries the frozen attributes and nothing else", () => {
    const attributes = reportCookieAttributes(HANDOFF_A)
    expect(attributes).toEqual({
      name: REPORT_ACCESS_COOKIE_NAME,
      path: `${REPORT_ROUTE_BASE}/${HANDOFF_A}`,
      httpOnly: true,
      secure: true,
      sameSite: "lax",
    })
  })

  it("uses Lax rather than Strict", () => {
    // The customer arrives by following a link from an email. Strict would
    // withhold the cookie on exactly that navigation and send a paying customer
    // to a 404 on their own Report.
    expect(reportCookieAttributes(HANDOFF_A).sameSite).toBe("lax")
  })
})

describe("handoff ids", () => {
  it("accepts the shape we issue", () => {
    expect(isHandoffId(HANDOFF_A)).toBe(true)
    // With hex letters too, not just the all-digit fixtures above.
    expect(isHandoffId("a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d")).toBe(true)
  })

  it("rejects uppercase hex", () => {
    // Deliberately a literal rather than `HANDOFF_A.toUpperCase()`: the
    // fixtures are all digits, so that call returns the input unchanged and the
    // assertion would pass while testing nothing.
    expect(isHandoffId("A1B2C3D4-E5F6-4A7B-8C9D-0E1F2A3B4C5D")).toBe(false)
  })

  it("rejects everything else", () => {
    for (const bad of ["", "nope", `${HANDOFF_A}x`, HANDOFF_A.slice(1), `  ${HANDOFF_A}  `]) {
      expect(isHandoffId(bad), bad).toBe(false)
    }
  })
})

describe("the bootstrap window", () => {
  const finalisedAt = "2026-09-16T12:00:00.000Z"
  const at = (offsetMs: number) => new Date(Date.parse(finalisedAt) + offsetMs)

  it("is sixty minutes", () => {
    expect(BOOTSTRAP_WINDOW_MS).toBe(60 * 60 * 1000)
  })

  it("admits the moment of finalisation and the exact boundary", () => {
    expect(isWithinBootstrapWindow({ finalisedAt, serverNow: at(0) })).toBe(true)
    expect(isWithinBootstrapWindow({ finalisedAt, serverNow: at(BOOTSTRAP_WINDOW_MS) })).toBe(true)
  })

  it("closes one millisecond later", () => {
    expect(isWithinBootstrapWindow({ finalisedAt, serverNow: at(BOOTSTRAP_WINDOW_MS + 1) })).toBe(
      false,
    )
  })

  it("rejects a future finalisation rather than extending the window", () => {
    // Accepting it would turn a clock problem, or a tampered timestamp, into
    // LONGER-lived credential minting.
    expect(isWithinBootstrapWindow({ finalisedAt, serverNow: at(-1) })).toBe(false)
    expect(isWithinBootstrapWindow({ finalisedAt, serverNow: at(-BOOTSTRAP_WINDOW_MS) })).toBe(false)
  })

  it("fails closed on anything it cannot parse", () => {
    expect(isWithinBootstrapWindow({ finalisedAt: "", serverNow: at(0) })).toBe(false)
    expect(isWithinBootstrapWindow({ finalisedAt: "not a date", serverNow: at(0) })).toBe(false)
    expect(isWithinBootstrapWindow({ finalisedAt, serverNow: new Date("nope") })).toBe(false)
  })

  it("is long past by the time an old session id turns up in a log", () => {
    expect(isWithinBootstrapWindow({ finalisedAt, serverNow: at(72 * 60 * 60 * 1000) })).toBe(false)
  })
})
