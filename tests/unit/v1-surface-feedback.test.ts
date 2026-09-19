import { describe, it, expect } from "vitest"
import { readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"
import ts from "typescript"

import { FEEDBACK_CAPTURE_ENABLED } from "@/lib/v1-scope"

/**
 * Feedback capture is outside the V1 surface — V1 scope freeze, step 2.
 *
 * ══ WHAT WENT WRONG, AND WHY A GUARD IS WARRANTED ═══════════════════════════
 *
 * `feedback` (Migration 46) and `reviews` (Migration 45) are drafted and
 * UNAPPLIED — confirmed absent from production — while the widget was mounted
 * on every page through `app/layout.tsx` and the rating prompt was mounted in
 * the live dashboard. Every submission returned 503, and the capture endpoint
 * spent a Claude extraction call BEFORE the failing insert, so each failure
 * cost money and produced an apology.
 *
 * The whole suite was green throughout: 4,959 unit tests pass without ever
 * touching the real schema. That is why this file asserts the SURFACE rather
 * than the behaviour — the behaviour was never the thing that was wrong.
 *
 * ══ ASSERTED AT THE USE SITE, NOT BY SYMBOL PRESENCE ════════════════════════
 *
 * Standing rule from the Phase 4B engagement, learned three times: a guard must
 * prove behaviour where it executes, not that an expected symbol exists
 * somewhere in the file. An import, a declaration, a comment or a helper name
 * must not be able to satisfy anything here.
 *
 * So the mount check looks for JSX ELEMENTS, and the refusal checks prove the
 * gate comes FIRST — before parsing, auth, the rate limiter and the AI call.
 * Ordering is the property: a refusal after the expensive work is not a refusal.
 */

const ROOT = process.cwd()
const STRIP = (s: string) =>
  s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\{\/\*[\s\S]*?\*\/\}/g, "").replace(/(^|[^:])\/\/.*$/gm, "$1")

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (["node_modules", ".next", ".git"].includes(entry.name)) continue
    const full = join(dir, entry.name)
    if (entry.isDirectory()) walk(full, out)
    else if (/\.tsx?$/.test(entry.name)) out.push(full)
  }
  return out
}

describe("the V1 surface mounts no feedback capture", () => {
  it("is switched off", () => {
    expect(FEEDBACK_CAPTURE_ENABLED).toBe(false)
  })

  it("no page or component renders the widget or the rating prompt", () => {
    // JSX ELEMENTS, not identifiers: the components still exist on disk and are
    // still covered by their own contract tests, so an import or a type
    // reference is not evidence that anything is mounted. `<FeedbackWidget` is.
    const mounted: string[] = []
    for (const file of [...walk(join(ROOT, "app")), ...walk(join(ROOT, "components"))]) {
      const code = STRIP(readFileSync(file, "utf8"))
      if (/<\s*(FeedbackWidget|FeedbackPrompt)\b/.test(code)) {
        mounted.push(file.slice(ROOT.length + 1))
      }
    }
    expect(mounted, "these still put feedback capture in front of a user").toEqual([])
  })

  it("the mount check would catch a real remount", () => {
    // Non-vacuity. Assembled from pieces so an edit to the real check cannot
    // quietly rewrite the planted copy alongside it.
    const planted = `<${"Feedback"}Widget />`
    expect(/<\s*(FeedbackWidget|FeedbackPrompt)\b/.test(STRIP(planted))).toBe(true)
    // …and an import alone is NOT a mount.
    const importOnly = `import { ${"Feedback"}Widget } from "@/components/feedback/feedback-widget"`
    expect(/<\s*(FeedbackWidget|FeedbackPrompt)\b/.test(STRIP(importOnly))).toBe(false)
  })
})

describe("the capture endpoints refuse as their FIRST executable action", () => {
  /**
   * ══ WHY THIS IS PARSED AND NOT MATCHED ════════════════════════════════════
   *
   * The first version of this guard located `FEEDBACK_CAPTURE_ENABLED` and
   * checked it appeared before a hardcoded list — `req.json()`, `getUser`,
   * `rateLimit(`, `guardAiUsage`, `anthropic`, `supabase`. That proves the gate
   * precedes SIX KNOWN THINGS. It does not prove the property the test claims,
   * and a realistic mutation walks straight through it:
   *
   *     export async function POST(req: NextRequest) {
   *       const raw = await req.text()          // ← not on the list
   *       if (!FEEDBACK_CAPTURE_ENABLED) return new NextResponse(null, { status: 404 })
   *
   * The request has been consumed before the refusal, and the guard stays
   * green. Extending the list would keep the same weakness and simply move the
   * next hole one identifier further out.
   *
   * So the file is PARSED. `body.statements[0]` is the first executable
   * statement by definition — comments are trivia and never appear, whitespace
   * is irrelevant, imports and declarations elsewhere in the file are different
   * nodes, and a second `FEEDBACK_CAPTURE_ENABLED` further down is not at
   * index 0. Anything inserted above the gate takes that index and the
   * assertion fails, whatever it happens to be called.
   *
   * This is the fifth instance in this engagement of a structural guard
   * proving the presence or relative position of selected symbols rather than
   * the execution relationship it documents. The standing rule is to prove the
   * relationship; here that means reading the syntax tree.
   */

  const ROUTES = [
    { name: "feedback", path: "app/api/feedback/route.ts" },
    { name: "reviews", path: "app/api/reviews/route.ts" },
  ] as const

  /** The `POST` export's body, from the real parser. */
  function postBody(source: string, label: string): ts.Block {
    const sourceFile = ts.createSourceFile(label, source, ts.ScriptTarget.ESNext, true)
    let body: ts.Block | undefined
    for (const statement of sourceFile.statements) {
      if (
        ts.isFunctionDeclaration(statement) &&
        statement.name?.text === "POST" &&
        statement.body
      ) {
        body = statement.body
      }
    }
    expect(body, `${label}: no exported POST function declaration`).toBeDefined()
    return body!
  }

  /** Is this node `!FEEDBACK_CAPTURE_ENABLED`? */
  function isDisabledScopeCheck(node: ts.Expression): boolean {
    return (
      ts.isPrefixUnaryExpression(node) &&
      node.operator === ts.SyntaxKind.ExclamationToken &&
      ts.isIdentifier(node.operand) &&
      node.operand.text === "FEEDBACK_CAPTURE_ENABLED"
    )
  }

  for (const route of ROUTES) {
    it(`${route.name}: statement zero of POST is the disabled-scope refusal`, () => {
      const body = postBody(readFileSync(join(ROOT, route.path), "utf8"), route.path)

      const first = body.statements[0]
      expect(first, `${route.path}: POST has an empty body`).toBeDefined()

      expect(
        ts.isIfStatement(first),
        `${route.path}: the first executable statement is not a conditional — it is ` +
          `\`${first.getText().split("\n")[0].trim()}\``,
      ).toBe(true)

      const gate = first as ts.IfStatement
      expect(
        isDisabledScopeCheck(gate.expression),
        `${route.path}: the first statement is a conditional, but not the V1 scope gate — ` +
          `it tests \`${gate.expression.getText()}\``,
      ).toBe(true)

      // …and it must refuse, with the status the scope decision calls for.
      const refusal = gate.thenStatement.getText()
      expect(refusal, `${route.path}: the gate does not return`).toContain("return")
      expect(refusal, `${route.path}: the gate does not refuse with 404`).toContain("404")
      expect(refusal, `${route.path}: 503 invites a retry that can never succeed`).not.toContain("503")

      // Nothing may precede it, which index 0 already establishes — asserted
      // explicitly so the intent survives a future edit of this test.
      expect(body.statements.indexOf(gate)).toBe(0)
    })
  }

  it("the parse-based check rejects work inserted above the gate", () => {
    /*
     * Non-vacuity, against the exact mutation the previous guard missed.
     * Built as source text here rather than by editing a real file, so the
     * counterfactual runs on every CI pass and not only under the sabotage
     * harness.
     */
    const withPreGateWork = `
      export async function POST(req: NextRequest) {
        const raw = await req.text()
        if (!FEEDBACK_CAPTURE_ENABLED) return new NextResponse(null, { status: 404 })
        return new NextResponse(null, { status: 200 })
      }
    `
    const body = postBody(withPreGateWork, "mutated.ts")
    expect(ts.isIfStatement(body.statements[0])).toBe(false)

    // The same source with nothing above the gate passes, so the check is
    // discriminating rather than simply strict.
    const clean = `
      export async function POST(req: NextRequest) {
        // a comment, which is trivia and must not count as a statement
        if (!FEEDBACK_CAPTURE_ENABLED) return new NextResponse(null, { status: 404 })
        const raw = await req.text()
        return new NextResponse(null, { status: 200 })
      }
    `
    const cleanBody = postBody(clean, "clean.ts")
    expect(ts.isIfStatement(cleanBody.statements[0])).toBe(true)
    expect(isDisabledScopeCheck((cleanBody.statements[0] as ts.IfStatement).expression)).toBe(true)
  })

  it("a later occurrence of the constant cannot satisfy the check", () => {
    // Property 6: the gate must be FIRST, not merely present somewhere.
    const lateGate = `
      export async function POST(req: NextRequest) {
        const raw = await req.text()
        if (!FEEDBACK_CAPTURE_ENABLED) return new NextResponse(null, { status: 404 })
      }
    `
    const body = postBody(lateGate, "late.ts")
    expect(body.statements.some((s) => ts.isIfStatement(s))).toBe(true)
    expect(ts.isIfStatement(body.statements[0])).toBe(false)
  })

  it("the admin dashboard is unreachable while capture is off", () => {
    const code = STRIP(readFileSync(join(ROOT, "app/admin/feedback/page.tsx"), "utf8"))
    expect(code).toMatch(/if\s*\(\s*!\s*FEEDBACK_CAPTURE_ENABLED\s*\)\s*notFound\(\)/)
  })
})

describe("nothing else was changed by taking feedback out of V1", () => {
  it("the drafted migrations are untouched and still unapplied", () => {
    // Reinstatement must stay a small, reviewable change: the schema is
    // written and reviewed, and this step deliberately does not apply it.
    const manifest = JSON.parse(
      readFileSync(join(ROOT, "supabase/applied-schema.json"), "utf8"),
    ) as { applied: string[]; pending: { table: string }[] }
    const pending = manifest.pending.map((p) => p.table)
    for (const table of ["feedback", "reviews"]) {
      expect(pending, `${table} must remain pending`).toContain(table)
      expect(manifest.applied, `${table} must not be marked applied`).not.toContain(table)
    }
  })

  it("the implementation survives, so switching it back on stays small", () => {
    for (const file of [
      "components/feedback/feedback-widget.tsx",
      "components/account/feedback-prompt.tsx",
      "lib/feedback/prompts.ts",
      "lib/feedback/types.ts",
    ]) {
      expect(readFileSync(join(ROOT, file), "utf8").length, file).toBeGreaterThan(0)
    }
  })

  it("the retention sweep is NOT disabled by this step", () => {
    /*
     * Deliberate, and the reason is the whole point of doing this by
     * dependency rather than by feature name.
     *
     * `feedback/retention` is misnamed: it also sweeps `paid_report_intents`,
     * which is a LIVE V1 table written by the €49 checkout and carrying a
     * 30-day retention obligation. Disabling it here as "a feedback job" would
     * have stopped pruning purchase-intent tokens — a privacy regression on the
     * V1 spine caused by a scope decision about something else.
     *
     * It is narrowed and proven in the scheduled-automation step, not this one.
     */
    const retention = readFileSync(join(ROOT, "app/api/feedback/retention/route.ts"), "utf8")
    expect(STRIP(retention).includes("FEEDBACK_CAPTURE_ENABLED"), "retention must not be gated here").toBe(false)

    /*
     * Asserted inside the SWEEP LIST, not anywhere in the file.
     *
     * The first version checked that "paid_report_intents" appeared in the
     * source at all — and a sabotage case that emptied `RETAINED_TABLES`
     * entirely still passed, because the name survives in the
     * `schema-drift-tables:` marker comment above it. Same defect this
     * engagement has now found four times: proving a symbol EXISTS rather than
     * proving it is USED. The table has to be in the list that gets swept.
     */
    const code = STRIP(retention)
    const list = code.slice(code.indexOf("RETAINED_TABLES"))
    const entries = list.slice(0, list.indexOf("]"))
    expect(entries, "paid_report_intents is no longer swept").toContain("paid_report_intents")
    expect(entries, "the sweep list is empty").toMatch(/table:\s*"paid_report_intents"/)
  })
})
