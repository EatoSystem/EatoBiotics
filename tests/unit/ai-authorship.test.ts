import { describe, expect, it } from "vitest"
import { readFileSync } from "node:fs"

/**
 * ══ 0R-3 · THE AUTHORSHIP BOUNDARY ══════════════════════════════════════════
 *
 * `P0-TRUST-05` was not bad copy. It was an authorship defect:
 *
 *     product-authored personal premise
 *       → query parameter
 *       → presented as the member's question
 *       → auto-sent on mount
 *       → model answers ON that premise
 *       → generated prose inherits the apparent legitimacy
 *
 * The invariant this file holds:
 *
 *     Authorship is created by the member's explicit submit action, not
 *     inherited from the source of the text in the input box.
 *
 * ── THE THREE CHANNELS, AND WHY ONLY TWO WERE EVER CONFLATED ────────────────
 *
 *   1. USER-AUTHORED TEXT      — what the member typed or explicitly submitted
 *   2. PRODUCT-SUGGESTED TEXT  — wording EatoBiotics offers as a possibility
 *   3. PRODUCT FACT / CONTEXT  — deterministic state supporting an answer
 *
 * Channel 3 was always correct and is NOT touched here: `buildMemberProfile`
 * in `app/api/consult/route.ts` passes deterministic product fact as separate
 * system context, and that route's own prompt already forbids the model from
 * quoting an internal dimension name back to a member. Channels 1 and 2 were
 * the same undifferentiated string.
 *
 * ── WHY THIS IS STRUCTURAL AND NOT A FIELD ──────────────────────────────────
 *
 * The repair does not add an authorship flag for downstream code to remember to
 * inspect. It makes authorship a property of the CONSTRUCTION PATH: a
 * suggestion can only reach `setInput`, and the sender can only be called with
 * the draft. So "product-authored text becomes a user message" is not a mistake
 * a validator has to catch — there is no path by which it can arrive.
 *
 * Gate 6.1 established the rule this follows: remove the prohibited job rather
 * than permit it and validate a label afterwards.
 *
 * ── SCOPE: MEMBER-FACING CHAT CLIENTS ONLY ──────────────────────────────────
 *
 * Server routes also build `{ role: "user", content }` — that is the Anthropic
 * API's turn convention for a prompt the PRODUCT is sending, not a claim about
 * what a member said. Conflating the two would make this guard noise. It scopes
 * to the clients that render a member's own conversation.
 */

const CHAT_CLIENTS = [
  "app/account/consult/consult-client.tsx",
  "app/account/report/[id]/report-client.tsx",
  "components/eatobiotic/text-chat.tsx",
] as const

/** The draft-state identifier a sender is allowed to be called with. */
const DRAFT = "input"

function source(file: string): string {
  return readFileSync(file, "utf-8")
}

/** Source with comments stripped — a comment quoting the old defect is not the defect. */
function rendered(file: string): string {
  return source(file)
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/^\s*\/\/.*$/gm, " ")
}

/**
 * The name of each client's send function, read from its declaration rather
 * than hardcoded, so renaming the function does not silently empty the guard.
 */
function senderName(file: string): string {
  const src = rendered(file)
  const m =
    src.match(/async function (\w+)\s*\(\s*text\s*:/) ??
    src.match(/const (\w+) = useCallback\(async \(\s*text\s*:/) ??
    src.match(/async function (send)\s*\(\s*\)/)
  expect(m?.[1], `${file} — no send function found, so this file would assert nothing`).toBeTruthy()
  return m![1]
}

/**
 * Every argument a sender is CALLED with, excluding its own declaration.
 *
 * ── TWO LEGITIMATE SHAPES, FOUND BY THIS GUARD FAILING ──────────────────────
 *
 * Written first as "the argument must be the draft", which refused
 * `report-client.tsx` — whose `async function send()` takes NO argument and
 * reads `input` from closure. That is the same property in a stronger form: a
 * sender that cannot be handed text cannot be handed product-authored text.
 *
 * So an empty argument list is permitted and a foreign argument is not. The
 * vacuity check moved with it: what would make this assertion hollow is no CALL
 * SITE, not no argument.
 */
function senderCalls(file: string, sender: string): { args: string[]; sites: number } {
  const src = rendered(file)
  const calls = [...src.matchAll(new RegExp(String.raw`(?<![\w.])${sender}\s*\(([^()]*(?:\([^()]*\))?[^()]*)\)`, "g"))]
  const args = calls
    .map((m) => m[1].trim())
    .filter((a) => !a.startsWith("text:") && !a.startsWith("async"))
  return { args: args.filter((a) => a !== ""), sites: args.length }
}

describe("0R-3 · a sender may only ever be called with the member's draft", () => {
  /*
   * THE LOAD-BEARING RULE.
   *
   * `sendMessage(decodeURIComponent(q))`, `sendMessage(q)` and `send(chip)` are
   * all the same defect wearing three faces: a sender called with something
   * other than what the member has in front of them. Pinning the ARGUMENT
   * rather than the call count is what makes all three fail, including shapes
   * nobody has written yet.
   */
  it.each(CHAT_CLIENTS)("%s calls its sender only with the draft", (file) => {
    const sender = senderName(file)
    const { args, sites } = senderCalls(file, sender)

    expect(
      sites,
      `${file} — no call to ${sender}() found, so this assertion is vacuous`,
    ).toBeGreaterThan(0)

    const foreign = args.filter((a) => a !== DRAFT)
    expect(
      foreign,
      `${file} — ${sender}() is called with something other than the member's ` +
        `draft (\`${DRAFT}\`). A suggestion, a query parameter or a seed must be ` +
        `written into the draft with setInput and sent by the member, never ` +
        `passed to the sender directly: that is what turns product-authored ` +
        `text into a user-authored message.`,
    ).toEqual([])
  })
})

describe("0R-3 · nothing auto-sends, and a query parameter can only draft", () => {
  it.each(CHAT_CLIENTS)("%s sends from no effect at all", (file) => {
    const src = rendered(file)
    /*
     * ── WIDER THAN "MOUNT", DELIBERATELY ──────────────────────────────────
     *
     * Written first against `useEffect(… , [])` only, which left a hole this
     * guard's own author could see: `useEffect(() => sendMessage(input), [input])`
     * passes the draft rule — the argument IS the draft — and would fire an AI
     * request on every keystroke. Narrowing the rule to mount would have made
     * the hole permanent.
     *
     * A legitimate send always originates in an event handler, so NO effect in
     * these files may call the sender. That is both simpler and stronger.
     */
    const effects = [...src.matchAll(/useEffect\(\(\)\s*=>\s*\{?([\s\S]*?)\}?\s*,\s*\[[^\]]*\]\s*\)/g)]
    const sender = senderName(file)

    expect(
      effects.length,
      `${file} — no effects found, so this assertion is vacuous`,
    ).toBeGreaterThan(0)

    for (const [, body] of effects) {
      expect(
        new RegExp(String.raw`(?<![\w.])${sender}\s*\(`).test(body),
        `${file} — an effect calls ${sender}(). A render is not a member asking ` +
          `a question; authorship comes from an explicit submit gesture.`,
      ).toBe(false)
    }
  })

  it.each(CHAT_CLIENTS)("%s lets a search param reach only the draft setter", (file) => {
    const src = rendered(file)
    if (!/searchParams\.get\(/.test(src)) return // nothing to constrain

    /*
     * ── SCOPED TO THE EFFECT, BECAUSE THE FILE WAS TOO BROAD ──────────────
     *
     * Written first over the whole file, which reported that the "q" param
     * "flows into map" — because `STARTER_QUESTIONS.map((q) => …)` names its
     * callback parameter `q` too. A NAME COLLISION, not a flow, and a guard
     * that cries wolf is a guard somebody switches off.
     *
     * So the rule reads only the effect that actually performs the param read,
     * which is where a flow could exist at all.
     */
    const effects = [...src.matchAll(/useEffect\(\(\)\s*=>\s*\{([\s\S]*?)\}\s*,\s*\[[^\]]*\]\s*\)/g)]
      .map((m) => m[1])
      .filter((body) => /searchParams\.get\(/.test(body))

    expect(
      effects.length,
      `${file} reads a search param but not inside an effect this rule can see`,
    ).toBeGreaterThan(0)

    for (const body of effects) {
      const keys = [...body.matchAll(/searchParams\.get\((["'`])(\w+)\1\)/g)].map((m) => m[2])
      for (const key of keys) {
        const uses = [...body.matchAll(new RegExp(String.raw`(\w+)\s*\(\s*[^)]*\b${key}\b[^)]*\)`, "g"))]
          .map((m) => m[1])
          // `get`/`decodeURIComponent` are the read itself; `if`/`while`/
          // `return` are language keywords, not sinks — `if (q) setInput(q)`
          // is the permitted shape and must not read as a flow into "if".
          .filter((fn) => !["get", "decodeURIComponent", "if", "while", "return", "switch"].includes(fn))
        const illegal = uses.filter((fn) => fn !== "setInput")
        expect(
          illegal,
          `${file} — the "${key}" search param flows into ${illegal.join(", ")}. ` +
            `A URL may prefill a draft and nothing else: it must not send, ` +
            `construct a user message, persist, summarise or call a model.`,
        ).toEqual([])
      }
    }
  })
})

describe("0R-3 · product context stays on its own channel", () => {
  /*
   * Channel 3 must never be concatenated into channel 1 merely to get it into
   * the model. The clients have no business holding member-profile context at
   * all — it is assembled server-side, as system context, by the route.
   */
  it.each(CHAT_CLIENTS)("%s does not carry member-profile context", (file) => {
    const src = rendered(file)
    for (const forbidden of ["buildMemberProfile", "memberProfile", "STATIC_KNOWLEDGE"]) {
      expect(
        src.includes(forbidden),
        `${file} references ${forbidden}. Deterministic product fact travels ` +
          `server-side as system context; folding it into the member's authored ` +
          `text would make the product the author of their words.`,
      ).toBe(false)
    }
  })
})

describe("0R-3 · NON-VACUITY", () => {
  /*
   * ── BOTH DIRECTIONS ───────────────────────────────────────────────────────
   *
   * The rules are fired against the exact pre-repair shapes, held as literals
   * the way `biotic-claims.test.ts` holds Gate 3.6's shipped sentences. Once the
   * repair lands those shapes exist nowhere, so a test that read its subject
   * from the fixed code would prove only that the code is fixed — not that the
   * rule catches the regression.
   */
  const PRE_REPAIR = [
    // consult-client.tsx:219-225, the auto-send
    "void sendMessage(decodeURIComponent(q))",
    // consult-client.tsx:472, a starter chip speaking for the member
    "onClick={() => sendMessage(q)}",
    // text-chat.tsx:157, the same defect in a second client
    "onClick={() => send(chip)}",
  ]

  it("the draft rule refuses every pre-repair call shape", () => {
    for (const shape of PRE_REPAIR) {
      const sender = shape.includes("sendMessage") ? "sendMessage" : "send"
      const args = [...shape.matchAll(new RegExp(String.raw`(?<![\w.])${sender}\s*\(([^()]*(?:\([^()]*\))?[^()]*)\)`, "g"))]
        .map((m) => m[1].trim())
      expect(args.length, `extracted no argument from: ${shape}`).toBeGreaterThan(0)
      expect(
        args.every((a) => a !== DRAFT),
        `the rule would have allowed: ${shape}`,
      ).toBe(true)
    }
  })

  it("the draft rule permits the genuine submit path", () => {
    for (const ok of ["sendMessage(input)", "onClick={() => void send()}", "send(input)"]) {
      const sender = ok.includes("sendMessage") ? "sendMessage" : "send"
      const args = [...ok.matchAll(new RegExp(String.raw`(?<![\w.])${sender}\s*\(([^()]*)\)`, "g"))]
        .map((m) => m[1].trim())
        .filter((a) => a !== "")
      expect(
        args.every((a) => a === DRAFT),
        `the rule would refuse the legitimate submit path: ${ok}`,
      ).toBe(true)
    }
  })

  it("the effect rule catches both auto-send shapes and ignores a scroll effect", () => {
    const bodies = (src: string) =>
      [...src.matchAll(/useEffect\(\(\)\s*=>\s*\{?([\s\S]*?)\}?\s*,\s*\[[^\]]*\]\s*\)/g)].map((m) => m[1])
    const fires = (src: string) =>
      bodies(src).some((b) => /(?<![\w.])sendMessage\s*\(/.test(b))

    // the shape that shipped
    expect(fires("useEffect(() => { const q = searchParams.get('q'); if (q) sendMessage(q) }, [])")).toBe(true)
    // the shape the narrow rule would have missed
    expect(fires("useEffect(() => { sendMessage(input) }, [input])")).toBe(true)
    // and a legitimate effect is left alone
    expect(fires("useEffect(() => { bottomRef.current?.scrollIntoView() }, [messages])")).toBe(false)
  })

  it("report-client was ALREADY correct, and is the clean control", () => {
    /*
     * `app/account/report/[id]/report-client.tsx:148` has always read
     * `onClick={() => { setInput(q) }}` — a suggestion drafting rather than
     * speaking. It is in CHAT_CLIENTS as a surface that must stay correct, and
     * it doubles as proof the rules are not simply unsatisfiable: a guard every
     * file fails is a guard nobody can keep.
     */
    const file = "app/account/report/[id]/report-client.tsx"
    const { args, sites } = senderCalls(file, senderName(file))
    expect(sites, "the control has no send call, so it proves nothing").toBeGreaterThan(0)
    expect(args.filter((a) => a !== DRAFT)).toEqual([])
  })
})
