/* ── redirect() must survive its own try/catch ─────────────────────────────
   redirect() interrupts rendering by throwing a plain Error tagged with a
   NEXT_REDIRECT digest — Next's framework catches it higher up the call
   stack to perform the actual navigation. app/assessment/report/page.tsx and
   app/assessment/deep/page.tsx both wrap a redirect() call in a try, and both
   used to catch it with a bare `catch {}` that never inspected or rethrew
   what it caught. That silently discarded the intended redirect and ran the
   catch's own `redirect("/assessment")` instead — including the #129
   redirects (resume-questionnaire and send-to-existing-report), which this
   bug undid without either page's own logic ever being wrong.

   Two different things are proven here, deliberately not one:

   1. The PATTERN — using the real `redirect`/`unstable_rethrow` from
      next/navigation, not a reimplementation. redirect() throws unconditionally
      regardless of request context, so this needs no Stripe/Supabase mocking
      and is a direct behavioural proof, not a simulation.
   2. That the two real files ACTUALLY USE that pattern — a source-level check,
      because the behavioural proof above says nothing about which shape ships.
      Reading source is the only way to close that gap without the heavy mocks
      #124's route tests needed, which would test everything upstream of the
      catch rather than the catch itself.
──────────────────────────────────────────────────────────────────────── */
import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { redirect, unstable_rethrow } from "next/navigation"

const PAGES = [
  "app/assessment/report/page.tsx",
  "app/assessment/deep/page.tsx",
]

function source(relPath: string): string {
  return readFileSync(join(process.cwd(), relPath), "utf8")
}

/** Strips comments before structural checks, so this fix's own explanatory
 *  comment — which quotes the old bare-`catch {}` shape in prose — cannot
 *  make the "no bare catch left" check match itself. */
function codeOnly(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/\/\/.*$/gm, " ")
}

describe("the redirect() pattern itself", () => {
  it("is really discarded by a bare catch{} — the bug, reproduced", () => {
    function bareCatchShape(): string {
      try {
        redirect("/assessment/deep?session_id=abc") // the intended redirect
      } catch {
        try {
          redirect("/assessment") // the catch's own fallback
        } catch (fallback) {
          return (fallback as { digest: string }).digest
        }
      }
      return "not reached"
    }
    const digest = bareCatchShape()
    expect(digest).toContain(";/assessment;")
    expect(digest).not.toContain("/assessment/deep")
  })

  it("survives unstable_rethrow, and a genuine error still reaches the fallback", () => {
    function fixedShape(throwRealError: boolean): string {
      try {
        if (throwRealError) throw new Error("stripe retrieve failed")
        redirect("/assessment/report?session_id=abc") // the intended redirect
      } catch (error) {
        unstable_rethrow(error)
        return `fallback: ${(error as Error).message}`
      }
      return "not reached"
    }

    let redirectDigest = ""
    try {
      fixedShape(false)
      expect.unreachable("redirect() must throw")
    } catch (error) {
      redirectDigest = (error as { digest: string }).digest
    }
    expect(redirectDigest).toContain(";/assessment/report");
    expect(fixedShape(true)).toBe("fallback: stripe retrieve failed")
  })
})

describe.each(PAGES)("%s", (relPath) => {
  const src = source(relPath)

  it("imports unstable_rethrow from next/navigation", () => {
    expect(src).toMatch(/import\s*\{[^}]*\bunstable_rethrow\b[^}]*\}\s*from\s*"next\/navigation"/)
  })

  it("has no bare `catch {` left — every catch binds its error", () => {
    // A bare catch (no parameter) cannot call unstable_rethrow at all, so its
    // presence alone means a redirect() above it is still unprotected. Checked
    // against code with comments stripped, since this fix's own explanatory
    // comment quotes that exact old shape in prose.
    expect(codeOnly(src)).not.toMatch(/catch\s*\{/)
  })

  it("calls unstable_rethrow as the first statement of its catch block", () => {
    const opening = src.match(/\}\s*catch\s*\(([a-zA-Z_$][\w$]*)\)\s*\{([\s\S]*)/)
    expect(opening, `${relPath} has no catch(error) {...} block`).not.toBeNull()
    const [, param, body] = opening!

    // Skip blank lines and `//` comments — this fix is documented with one —
    // to find the first real statement, not the first line.
    const firstStatement = body
      .split("\n")
      .map((line) => line.trim())
      .find((line) => line.length > 0 && !line.startsWith("//"))

    expect(firstStatement).toBe(`unstable_rethrow(${param})`)
  })
})
