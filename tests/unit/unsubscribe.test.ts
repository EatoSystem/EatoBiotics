import { describe, it, expect, afterEach } from "vitest"
import { readFileSync } from "node:fs"
import ts from "typescript"
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

/* ── The forgeable fallback, and its removal ─────────────────────────────── */

describe("the signing secret fails closed", () => {
  /**
   * ══ WHAT WAS HERE ═════════════════════════════════════════════════════════
   *
   * `secret()` used to end in the literal "eatobiotics-unsubscribe-fallback".
   * A signing secret committed to the repository is not a secret: anyone who
   * could read the file could mint a valid one-click token for ANY address and
   * opt a stranger out of their own mail. The token exists precisely to stop
   * that, so the default did not weaken the control — it removed it while
   * leaving something shaped like one.
   */
  const noSecret = () => {
    delete process.env.UNSUBSCRIBE_SECRET
    delete process.env.ADMIN_SESSION_SECRET
    delete process.env.ADMIN_PASSWORD
  }

  it("the literal is gone from the source", () => {
    /*
     * Parsed, not matched.
     *
     * The first version of this check was a regex for the quoted literal, and
     * it failed immediately — on the COMMENT in unsubscribe.ts explaining why
     * the fallback was removed. A guard that cannot tell a string from a
     * sentence about a string is the defect class this engagement keeps
     * finding, and here it would have been caught by its own documentation.
     *
     * String literals are nodes; comments are trivia and are not. So the file
     * is parsed and every StringLiteral is read.
     */
    const src = readFileSync("lib/email/unsubscribe.ts", "utf8")
    const sf = ts.createSourceFile("unsubscribe.ts", src, ts.ScriptTarget.ESNext, true)
    const literals: string[] = []
    ;(function visit(node: ts.Node) {
      if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
        literals.push(node.text)
      }
      ts.forEachChild(node, visit)
    })(sf)

    expect(literals.length, "no string literals found — the check would be vacuous").toBeGreaterThan(0)
    expect(literals).not.toContain("eatobiotics-unsubscribe-fallback")
    // …and the prose that explains it is still there, which is what the naive
    // version tripped over.
    expect(src).toContain("eatobiotics-unsubscribe-fallback")
  })

  it("no secret means no token", () => {
    noSecret()
    expect(unsubscribeToken("person@example.com")).toBeNull()
  })

  it("no secret means no one-click URL and no header", () => {
    noSecret()
    expect(unsubscribeOneClickUrl("person@example.com")).toBeNull()
    // Nothing, rather than an unsigned URL. An open unsubscribe endpoint
    // advertised in a header to every mail client that reads it would be worse
    // than not offering one-click at all.
    expect(unsubscribeHeaders("person@example.com")).toEqual({})
  })

  it("no secret still leaves a working human opt-out link", () => {
    noSecret()
    const url = unsubscribeUrl("person@example.com")
    expect(url).toContain("/unsubscribe?email=person%40example.com")
    expect(url).not.toContain("token=")
  })

  it("nothing verifies without a secret — not even an empty token", () => {
    noSecret()
    expect(verifyUnsubscribeToken("person@example.com", "anything")).toBe(false)
    expect(verifyUnsubscribeToken("person@example.com", "")).toBe(false)
  })

  it("an admin secret is NOT an implicit substitute", () => {
    noSecret()
    process.env.ADMIN_SESSION_SECRET = "an-unrelated-credential"
    process.env.ADMIN_PASSWORD = "also-unrelated"
    try {
      expect(unsubscribeToken("person@example.com")).toBeNull()
    } finally {
      delete process.env.ADMIN_SESSION_SECRET
      delete process.env.ADMIN_PASSWORD
    }
  })

  it("a configured secret round-trips, and a wrong one does not", () => {
    process.env.UNSUBSCRIBE_SECRET = "the-real-one"
    const email = "person@example.com"
    const token = unsubscribeToken(email)
    expect(token).toMatch(/^[0-9a-f]{64}$/)
    expect(verifyUnsubscribeToken(email, token)).toBe(true)

    process.env.UNSUBSCRIBE_SECRET = "a-different-one"
    expect(verifyUnsubscribeToken(email, token)).toBe(false)
  })
})

describe("the launch checklist requires the secret", () => {
  it("GO-LIVE.md names UNSUBSCRIBE_SECRET in its required-secrets list", () => {
    // The release gate itself is step 10; this is the documented requirement
    // that gate will enforce, guarded so it cannot quietly disappear first.
    const goLive = readFileSync("GO-LIVE.md", "utf8")
    const section = goLive.slice(
      goLive.indexOf("## 2. Environment secrets"),
      goLive.indexOf("## 3."),
    )
    expect(section.length, "GO-LIVE.md section 2 not found").toBeGreaterThan(0)
    expect(section).toContain("UNSUBSCRIBE_SECRET")
  })

  it("it no longer tells anyone to delete a fallback that is already gone", () => {
    const gate = readFileSync("lib/dev-password-gate.ts", "utf8")
    expect(gate).not.toMatch(/return\s+["'`][^"'`]+["'`]\s*$/m)  // no hardcoded password return
    const goLive = readFileSync("GO-LIVE.md", "utf8")
    expect(goLive).not.toContain("contains a TEMPORARY hardcoded fallback")
  })
})
