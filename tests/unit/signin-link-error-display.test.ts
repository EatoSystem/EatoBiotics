/* ── The magic-link error actually reaches the sign-in form ───────────────
   linkErrorMessage is unit tested in auth-link-error.test.ts, but a correct
   message that never renders is still the bug this fixes: a user whose link
   expired lands back on a blank form with no idea why.

   Unlike app/assessment/report/page.tsx, SignInClient needs no extraction to
   be testable — its only awkward dependency is useSearchParams, so mocking
   next/navigation renders the real shipped component. That is worth the mock:
   it proves the seeding (URL param -> useState initialiser -> rendered copy),
   which is the whole mechanism, rather than proving a presentational component
   in isolation and leaving the wiring uncovered.

   useState's lazy initialiser runs during SSR; useEffect does not, so the
   auto-send effect never fires here and no fetch is needed.

   Test env is `environment: "node"` with no jsdom, and vitest's include is
   tests/**\/*.test.ts — hence createElement + renderToStaticMarkup rather than
   JSX, matching food-system-section.test.ts and delivery-pending-notice.test.ts.
──────────────────────────────────────────────────────────────────────── */
import { describe, it, expect, vi, beforeEach } from "vitest"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { readFileSync } from "node:fs"
import { join } from "node:path"

/** Rewritten per test; the mock below reads it at render time. */
let query = ""

/* vitest hoists vi.mock above the imports below, so a static import of the
   component still receives the mocked module. A top-level `await import` would
   also work at runtime but this tsconfig rejects top-level await (TS1378) —
   caught by `tsc`, not by the test run, which is why both are in the gate. */
vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(query),
}))

import { SignInClient } from "@/app/account/signin/signin-client"
import { linkErrorMessage } from "@/lib/auth-link-error"

function renderWith(search: string): string {
  query = search
  return renderToStaticMarkup(createElement(SignInClient)).replace(/\s+/g, " ")
}

describe("SignInClient — magic-link error display", () => {
  beforeEach(() => {
    query = ""
  })

  it("tells a user with an expired link why they are back here", () => {
    const html = renderWith("error=link_expired")
    expect(html).toContain("That sign-in link has expired or was already used.")
    expect(html).toContain("send you a fresh one")
  })

  it("explains an invalid link", () => {
    const html = renderWith("error=link_invalid")
    expect(html).toContain("That sign-in link didn&#x27;t work.")
    expect(html).toContain("send you a new one")
  })

  /* The floor: without asserting the form is present, a component that threw
     or rendered nothing would satisfy the two `not.toContain` checks below and
     read as a pass. Same reasoning as the extraction floors in
     helpers/marketing-language.ts. */
  it("shows no error on a clean visit, and still renders the form", () => {
    const html = renderWith("")
    expect(html).toContain("Send sign-in link")
    expect(html).toContain('type="email"')
    expect(html).not.toContain("That sign-in link")
  })

  it("never echoes an unrecognised code into the page", () => {
    const hostile = '<img src=x onerror=alert(1)>'
    const html = renderWith(`error=${encodeURIComponent(hostile)}`)
    expect(html).toContain("That sign-in link didn&#x27;t work.")
    expect(html).not.toContain("onerror")
    expect(html).not.toContain("<img")
  })

  /* Drift guard for the producers in app/auth/callback/page.tsx. #199 added a
     fourth redirect there (the absent-Supabase-client case) after this fix was
     written; it reused link_invalid, so it needed no new copy. A future
     producer inventing a *new* code would silently inherit the link_invalid
     wording, which may be wrong for it — this fails instead, forcing the
     decision. Deliberately asserts the code set, not the redirect count: extra
     sites reusing an existing code are fine. */
  it("covers every error code the auth callback can emit", () => {
    const callback = readFileSync(
      join(process.cwd(), "app/auth/callback/page.tsx"),
      "utf8",
    )
    const codes = [
      ...new Set(
        [...callback.matchAll(/\/account\/signin\?error=([a-z_]+)/g)].map((m) => m[1]),
      ),
    ].sort()

    expect(codes, "no ?error= producers found — the regex has drifted").not.toHaveLength(0)
    expect(codes).toEqual(["link_expired", "link_invalid"])

    for (const code of codes) {
      expect(linkErrorMessage(code), `no message for ${code}`).toBeTruthy()
      expect(renderWith(`error=${code}`), `${code} renders no message`).toContain(
        "That sign-in link",
      )
    }
  })
})
