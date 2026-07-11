import { describe, it, expect } from "vitest"
import { linkErrorMessage } from "@/lib/auth-link-error"

/**
 * The auth callback (app/auth/callback/page.tsx) redirects failed magic-link
 * sign-ins to /account/signin?error=link_expired|link_invalid. These messages
 * are what the sign-in page shows for each code — previously the codes were
 * generated but never displayed, leaving users on a blank form.
 */
describe("linkErrorMessage", () => {
  it("explains an expired or reused link and points to resending", () => {
    const msg = linkErrorMessage("link_expired")
    expect(msg).toMatch(/expired or was already used/i)
    expect(msg).toMatch(/send you a fresh one/i)
  })

  it("gives the generic message for an invalid link", () => {
    const msg = linkErrorMessage("link_invalid")
    expect(msg).toMatch(/didn't work/i)
    expect(msg).toMatch(/send you a new one/i)
  })

  it("never echoes an unrecognised code back to the page", () => {
    const hostile = "<img src=x onerror=alert(1)>"
    const msg = linkErrorMessage(hostile)
    expect(msg).toMatch(/didn't work/i)
    expect(msg).not.toContain(hostile)
  })

  it("returns null when there is no error code", () => {
    expect(linkErrorMessage(null)).toBeNull()
    expect(linkErrorMessage("")).toBeNull()
  })
})
