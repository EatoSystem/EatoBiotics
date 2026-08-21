/**
 * Feedback capture UI contract (#229).
 *
 * Both surfaces used to thank the customer unconditionally — on a network
 * error, on a 500, on `{ stored: false }`. "Fails soft in every direction"
 * sounded generous and was the opposite: someone could write a considered
 * paragraph, read "Thank you", and have it discarded with no way to tell. The
 * review card was worse still, because it also wrote "done" to localStorage,
 * so the failed submission was both lost and unrepeatable.
 *
 * There is no React test harness in this repo, so these read source. That
 * catches a DELETED branch, not a DEAD one — stated plainly rather than
 * implying more coverage than exists. Rendered behaviour is covered by the
 * build, typecheck and the 390px/1440px render pass recorded in the PR.
 */
import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"

const WIDGET = "components/feedback/feedback-widget.tsx"
const PROMPT = "components/account/feedback-prompt.tsx"

/** Source with comments stripped — these files explain the old bug at length. */
function code(file: string): string {
  return readFileSync(file, "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "")
}

/** The body of a named function, braces balanced. */
function fn(file: string, signature: string): string {
  const src = code(file)
  const start = src.indexOf(signature)
  expect(start, `${signature} must exist in ${file}`).toBeGreaterThan(-1)
  const open = src.indexOf("{", start)
  let depth = 0
  for (let i = open; i < src.length; i++) {
    if (src[i] === "{") depth++
    else if (src[i] === "}" && --depth === 0) return src.slice(open, i + 1)
  }
  throw new Error(`unbalanced braces after ${signature}`)
}

describe.each([
  { name: "feedback widget", file: WIDGET, submit: "async function submit(" },
  { name: "review prompt", file: PROMPT, submit: "async function submit(" },
])("$name only claims success when the row was stored", ({ file, submit }) => {
  const body = fn(file, submit)

  it("requires both a 2xx and an explicit stored flag", () => {
    expect(body, "a 200 that stored nothing is still a failure").toMatch(/res\.ok/)
    expect(body).toMatch(/stored\s*!==\s*true/)
  })

  it("does not treat a thrown request as success", () => {
    // Only the catch BLOCK, brace-balanced — slicing to the end of the
    // function would sweep in the success path that legitimately says "done".
    const at = body.indexOf("} catch")
    expect(at, "a try/catch block must exist").toBeGreaterThan(-1)
    const open = body.indexOf("{", at + 1)
    let depth = 0
    let handler = ""
    for (let i = open; i < body.length; i++) {
      if (body[i] === "{") depth++
      else if (body[i] === "}" && --depth === 0) { handler = body.slice(open, i + 1); break }
    }
    expect(handler).not.toMatch(/setPhase\("done"\)/)
  })

  it("marks a failure state the UI can render", () => {
    expect(body).toMatch(/setFailed\(true\)/)
  })

  it("never clears the customer's text on failure", () => {
    const afterFail = body.slice(body.indexOf("setFailed(true)"))
    expect(afterFail, "wiping the box on failure loses what they wrote").not.toMatch(
      /set(Message|FollowText|Comment)\(""\)/,
    )
  })

  it("guards against a duplicate submit while a request is in flight", () => {
    expect(body).toMatch(/if\s*\(.*(sending|phase === "sending").*\)\s*return/)
  })

  it("does not put the server's own error text on screen", () => {
    const src = code(file)
    expect(src).not.toMatch(/data\??\.\s*error/)
    expect(src).not.toMatch(/\{\s*(err|error)\s*\}/)
  })
})

describe("the failure state is visible and restrained", () => {
  it.each([WIDGET, PROMPT])("%s renders a status message when a send failed", (file) => {
    const src = code(file)
    expect(src).toMatch(/failed\s*&&/)
    expect(src, "an announced failure needs a live region").toMatch(/role="status"/)
  })

  it.each([WIDGET, PROMPT])("%s offers a retry affordance", (file) => {
    expect(code(file)).toMatch(/Try again/)
  })
})

describe("the customer is told what this is before they type", () => {
  it.each([WIDGET, PROMPT])("%s says the feedback is private, not published", (file) => {
    const src = code(file)
    expect(src).toMatch(/never shown publicly/)
  })

  it.each([WIDGET, PROMPT])("%s asks for no personal, medical or payment details", (file) => {
    const src = code(file)
    expect(src).toMatch(/personal, medical or payment/)
  })
})

describe("a failed review submission can be tried again", () => {
  it("does not remember 'done' unless the row was stored", () => {
    const body = fn(PROMPT, "async function submit(")
    const doneIdx = body.indexOf('remember("done")')
    const failIdx = body.indexOf("setFailed(true)")
    expect(doneIdx).toBeGreaterThan(-1)
    expect(
      failIdx < doneIdx,
      "remembering 'done' on failure hides the card forever and loses the feedback",
    ).toBe(true)
    // The failure path returns before reaching it.
    expect(body.slice(failIdx, doneIdx)).toMatch(/return/)
  })
})
