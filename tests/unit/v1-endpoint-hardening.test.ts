import { describe, it, expect, beforeEach, vi, afterEach } from "vitest"
import { NextRequest } from "next/server"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import ts from "typescript"

import { __resetRateLimitState } from "@/lib/rate-limit"

/**
 * Abuse protection on the five endpoints that had none — V1 step 6.
 *
 * ══ WHY THESE FIVE ═════════════════════════════════════════════════════════
 *
 * Twenty-six routes in this repository already use `lib/rate-limit.ts` with
 * the same `name:${getClientIp(req)}` key. These five were the outliers, and
 * two of them are credential endpoints that compared passwords with `!==`
 * while `lib/admin-auth.ts` had used `timingSafeEqual` for the COOKIE all
 * along — the standard applied to the derived token but not to the secret it
 * stands for.
 */

const ROOT = process.cwd()

vi.mock("@/lib/admin-auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/admin-auth")>()
  return { ...actual, adminCookieToken: () => "test-admin-token" }
})

function post(path: string, body: unknown, ip: string) {
  return new NextRequest(`http://localhost${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": ip },
    body: JSON.stringify(body),
  })
}

beforeEach(() => {
  __resetRateLimitState()
  vi.resetModules()
})

/* ── Credential endpoints ────────────────────────────────────────────────── */

describe("admin sign-in resists guessing", () => {
  const ADMIN_PASSWORD = "the-real-admin-password"

  beforeEach(() => {
    process.env.ADMIN_PASSWORD = ADMIN_PASSWORD
  })
  afterEach(() => {
    delete process.env.ADMIN_PASSWORD
  })

  const load = () => import("@/app/api/admin/login/route")
  const wrong = (ip: string) => post("/api/admin/login", { password: "nope" }, ip)
  const right = (ip: string) => post("/api/admin/login", { password: ADMIN_PASSWORD }, ip)

  /** The redirect target, which is what distinguishes success from refusal. */
  async function destination(res: Response): Promise<string> {
    return new URL(res.headers.get("location") ?? "http://localhost/none").pathname +
      (new URL(res.headers.get("location") ?? "http://localhost/none").search)
  }

  it("the right password works", async () => {
    const { POST } = await load()
    const res = await POST(right("1.1.1.1"))
    expect(await destination(res)).toBe("/admin")
    expect(res.headers.get("set-cookie")).toContain("admin_auth=")
  })

  it("repeated failures from one IP are refused", async () => {
    const { POST } = await load()
    // Ten attempts are allowed per IP; the eleventh is not.
    for (let i = 0; i < 10; i++) await POST(wrong("2.2.2.2"))
    const res = await POST(right("2.2.2.2"))
    expect(
      await destination(res),
      "the per-IP limit did not stop an eleventh attempt",
    ).toBe("/admin?error=1")
  })

  it("failures spread across many IPs still reach the endpoint-wide ceiling", async () => {
    const { POST } = await load()
    // Per-IP allows ten each, so twenty single failures from twenty distinct
    // addresses never trip it — only the failure ceiling can see this shape.
    for (let i = 0; i < 20; i++) await POST(wrong(`10.0.0.${i}`))
    const res = await POST(right("10.0.1.1"))
    expect(
      await destination(res),
      "distributed guessing on one instance was not stopped",
    ).toBe("/admin?error=1")
  })

  it("a correct password still works before the ceiling is reached", async () => {
    const { POST } = await load()
    for (let i = 0; i < 19; i++) await POST(wrong(`10.1.0.${i}`))
    const res = await POST(right("10.1.1.1"))
    expect(await destination(res)).toBe("/admin")
  })

  it("success does not spend the failure budget", async () => {
    const { POST } = await load()
    // Nineteen failures, then many successes, then one more failure. If a
    // success incremented the counter the endpoint would be shut by now.
    for (let i = 0; i < 19; i++) await POST(wrong(`10.2.0.${i}`))
    for (let i = 0; i < 5; i++) await POST(right(`10.2.1.${i}`))
    expect(await destination(await POST(right("10.2.2.1")))).toBe("/admin")
  })

  it("the ceiling is bounded — it cannot be held shut forever", async () => {
    vi.useFakeTimers()
    try {
      const { POST } = await load()
      for (let i = 0; i < 25; i++) await POST(wrong(`10.3.0.${i}`))
      expect(await destination(await POST(right("10.3.1.1")))).toBe("/admin?error=1")
      // The window expires and the endpoint reopens, so an attacker cannot
      // manufacture a permanent lockout of the operator.
      vi.advanceTimersByTime(16 * 60_000)
      expect(await destination(await POST(right("10.3.1.2")))).toBe("/admin")
    } finally {
      vi.useRealTimers()
    }
  })

  it("all three refusals are indistinguishable", async () => {
    const { POST } = await load()
    const wrongPassword = await POST(wrong("3.3.3.1"))

    for (let i = 0; i < 10; i++) await POST(wrong("3.3.3.2"))
    const perIp = await POST(right("3.3.3.2"))

    for (let i = 0; i < 20; i++) await POST(wrong(`10.4.0.${i}`))
    const ceiling = await POST(right("3.3.3.3"))

    const shape = async (r: Response) => `${r.status} ${await destination(r)}`
    // Nothing tells an attacker which wall they hit — in particular, nothing
    // confirms that a password was wrong rather than merely rate-limited.
    expect(await shape(perIp)).toBe(await shape(wrongPassword))
    expect(await shape(ceiling)).toBe(await shape(wrongPassword))
  })
})

describe("the private-beta gate resists guessing", () => {
  const DEV_PASSWORD = "the-real-preview-password"

  beforeEach(() => {
    process.env.DEV_PASSWORD = DEV_PASSWORD
  })
  afterEach(() => {
    delete process.env.DEV_PASSWORD
  })

  const load = () => import("@/app/api/enter/route")
  const wrong = (ip: string) => post("/api/enter", { password: "nope" }, ip)
  const right = (ip: string) => post("/api/enter", { password: DEV_PASSWORD }, ip)

  it("the right password works", async () => {
    const { POST } = await load()
    const res = await POST(right("4.4.4.1"))
    expect(res.status).toBe(200)
    expect(res.headers.get("set-cookie")).toContain("eb_dev_preview_auth_v3=")
  })

  it("repeated failures from one IP are refused", async () => {
    const { POST } = await load()
    for (let i = 0; i < 10; i++) await POST(wrong("4.4.4.2"))
    expect((await POST(right("4.4.4.2"))).status).toBe(401)
  })

  it("failures spread across many IPs reach the endpoint-wide ceiling", async () => {
    const { POST } = await load()
    for (let i = 0; i < 20; i++) await POST(wrong(`20.0.0.${i}`))
    expect((await POST(right("4.4.4.3"))).status).toBe(401)
  })

  it("success does not spend the failure budget", async () => {
    const { POST } = await load()
    for (let i = 0; i < 19; i++) await POST(wrong(`20.1.0.${i}`))
    for (let i = 0; i < 5; i++) await POST(right(`20.1.1.${i}`))
    expect((await POST(right("4.4.4.4"))).status).toBe(200)
  })

  it("a missing DEV_PASSWORD stays a distinct 503, not a failed guess", async () => {
    delete process.env.DEV_PASSWORD
    process.env.EATOBIOTICS_PASSWORD_GATE = "true"
    try {
      const { POST } = await load()
      const res = await POST(wrong("4.4.4.5"))
      // A deployment fault, which the operator who caused it needs to see.
      expect(res.status).toBe(503)
    } finally {
      delete process.env.EATOBIOTICS_PASSWORD_GATE
    }
  })
})

/* ── The comparison itself ───────────────────────────────────────────────── */

describe("the password comparison is timing-safe at the use site", () => {
  /**
   * ══ WHY THIS PARSES ═══════════════════════════════════════════════════════
   *
   * Importing the helper proves nothing; what matters is that the comparison
   * USES it. A grep for "timingSafeEqualStrings" goes green on the import line
   * alone, and both files also mention it in prose. So the handler's syntax
   * tree is read: the helper must be CALLED, and no `!==` may compare the
   * submitted password.
   */
  const ROUTES = [
    ["app/api/admin/login/route.ts", "password"],
    ["app/api/enter/route.ts", "submitted"],
  ] as const

  function comparison(source: string, secretIdent: string) {
    const sf = ts.createSourceFile("route.ts", source, ts.ScriptTarget.ESNext, true)
    let callsHelper = false
    let looseCompare = false
    ;(function visit(node: ts.Node) {
      if (
        ts.isCallExpression(node) &&
        ts.isIdentifier(node.expression) &&
        node.expression.text === "timingSafeEqualStrings"
      ) {
        callsHelper = true
      }
      if (
        ts.isBinaryExpression(node) &&
        (node.operatorToken.kind === ts.SyntaxKind.ExclamationEqualsEqualsToken ||
          node.operatorToken.kind === ts.SyntaxKind.EqualsEqualsEqualsToken) &&
        [node.left, node.right].some((side) => side.getText() === secretIdent)
      ) {
        looseCompare = true
      }
      ts.forEachChild(node, visit)
    })(sf)
    return { callsHelper, looseCompare }
  }

  for (const [file, ident] of ROUTES) {
    it(`${file} compares in constant time`, () => {
      const { callsHelper, looseCompare } = comparison(readFileSync(join(ROOT, file), "utf8"), ident)
      expect(callsHelper, `${file} never calls the timing-safe helper`).toBe(true)
      expect(looseCompare, `${file} still compares ${ident} with ===/!==`).toBe(false)
    })
  }

  it("the parse would catch a reverted comparison", () => {
    // Non-vacuity, against the exact mutation.
    const reverted = `
      export async function POST(req: NextRequest) {
        if (password !== adminPassword) return refuse(req)
      }
    `
    const { callsHelper, looseCompare } = comparison(reverted, "password")
    expect(callsHelper).toBe(false)
    expect(looseCompare).toBe(true)
  })
})

/* ── Money paths ─────────────────────────────────────────────────────────── */

describe("the limit runs before anything expensive", () => {
  /**
   * An execution-order claim, so it is proven by POSITION in the handler's
   * statement list — not by the presence of a `rateLimit` call somewhere in
   * the file. A limit placed after `stripe.checkout.sessions.create` is not a
   * limit, it is a log line.
   */
  const ROUTES = [
    "app/api/checkout/route.ts",
    "app/api/submit-lead/route.ts",
  ]

  /**
   * Positions WITHIN the POST handler, not within the file.
   *
   * The first version measured file-wide offsets and failed on submit-lead,
   * correctly punishing a sloppy guard rather than a sloppy route:
   * `createLotteryPromoCode` is declared ABOVE the handler and calls Stripe,
   * so its offset came first even though it does not run until the handler
   * invokes it. Where a helper sits in the file says nothing about when it
   * runs, and this check is about when.
   *
   * It is also transitive. A handler that calls a helper which calls Stripe
   * has done the expensive thing, so module-level functions whose bodies touch
   * Stripe or a write are treated as expensive at their CALL site.
   */
  function expensiveHelpers(sf: ts.SourceFile): Set<string> {
    const names = new Set<string>()
    for (const st of sf.statements) {
      if (!ts.isFunctionDeclaration(st) || !st.body || !st.name) continue
      if (["GET", "POST", "PUT", "DELETE", "PATCH"].includes(st.name.text)) continue
      let touches = false
      ;(function visit(node: ts.Node) {
        if (ts.isCallExpression(node)) {
          const text = node.expression.getText()
          if (/^stripe\./.test(text) || /\.(insert|upsert)$/.test(text)) touches = true
        }
        ts.forEachChild(node, visit)
      })(st.body)
      if (touches) names.add(st.name.text)
    }
    return names
  }

  function offsets(source: string) {
    const sf = ts.createSourceFile("route.ts", source, ts.ScriptTarget.ESNext, true)
    const helpers = expensiveHelpers(sf)

    let body: ts.Block | undefined
    for (const st of sf.statements) {
      if (ts.isFunctionDeclaration(st) && st.name?.text === "POST" && st.body) body = st.body
    }
    if (!body) return { limiter: Infinity, sideEffect: Infinity, helpers }

    let limiter = Infinity
    let sideEffect = Infinity
    ;(function visit(node: ts.Node) {
      if (ts.isCallExpression(node)) {
        const text = node.expression.getText()
        if (text === "rateLimit") limiter = Math.min(limiter, node.getStart(sf))
        if (/^stripe\./.test(text) || /\.(insert|upsert)$/.test(text) || helpers.has(text)) {
          sideEffect = Math.min(sideEffect, node.getStart(sf))
        }
      }
      ts.forEachChild(node, visit)
    })(body)
    return { limiter, sideEffect, helpers }
  }

  for (const file of ROUTES) {
    it(`${file} limits before its first Stripe call or write`, () => {
      const { limiter, sideEffect } = offsets(readFileSync(join(ROOT, file), "utf8"))
      expect(limiter, `${file} has no rateLimit call in POST`).toBeLessThan(Infinity)
      expect(
        sideEffect,
        `${file} has no side effect in POST — the check would be vacuous`,
      ).toBeLessThan(Infinity)
      expect(limiter, `${file} limits AFTER its first side effect`).toBeLessThan(sideEffect)
    })
  }

  it("the check would see a limiter moved after the side effect", () => {
    const moved = `
      export async function POST(req: NextRequest) {
        const session = await stripe.checkout.sessions.create({})
        const limit = rateLimit("checkout:x", 20, 600000)
      }
    `
    const { limiter, sideEffect } = offsets(moved)
    expect(limiter).toBeGreaterThan(sideEffect)
  })

  it("it sees through a helper, and is not fooled by where the helper sits", () => {
    // The shape that broke the first version: the expensive call is declared
    // above POST, but only runs when POST calls it.
    const viaHelper = `
      async function makePromo(email) { return stripe.promotionCodes.create({}) }
      export async function POST(req: NextRequest) {
        const code = await makePromo("a@b.c")
        const limit = rateLimit("submit-lead:x", 5, 600000)
      }
    `
    const bad = offsets(viaHelper)
    expect(bad.helpers.has("makePromo"), "the helper was not recognised as expensive").toBe(true)
    expect(bad.limiter).toBeGreaterThan(bad.sideEffect)

    const correct = `
      async function makePromo(email) { return stripe.promotionCodes.create({}) }
      export async function POST(req: NextRequest) {
        const limit = rateLimit("submit-lead:x", 5, 600000)
        const code = await makePromo("a@b.c")
      }
    `
    const good = offsets(correct)
    expect(good.limiter).toBeLessThan(good.sideEffect)
  })
})

describe("checkout and submit-lead carry deliberately different limits", () => {
  /**
   * checkout is the €49 path: office NAT and mobile CGNAT put many genuine
   * buyers behind one address, and refusing a real purchase is the most
   * expensive false positive this product has. submit-lead is an anonymous
   * write path and matches its siblings — waitlist, contribute and feedback
   * are all 5/10m. One shared number would be wrong twice.
   */
  function limitOf(file: string): number | null {
    const sf = ts.createSourceFile("route.ts", readFileSync(join(ROOT, file), "utf8"), ts.ScriptTarget.ESNext, true)
    let found: number | null = null
    ;(function visit(node: ts.Node) {
      if (
        ts.isCallExpression(node) &&
        node.expression.getText() === "rateLimit" &&
        found === null
      ) {
        const arg = node.arguments[1]
        if (arg && ts.isNumericLiteral(arg)) found = Number(arg.text)
      }
      ts.forEachChild(node, visit)
    })(sf)
    return found
  }

  it("checkout is the generous one", () => {
    expect(limitOf("app/api/checkout/route.ts")).toBe(20)
  })

  it("submit-lead matches its anonymous-write siblings", () => {
    expect(limitOf("app/api/submit-lead/route.ts")).toBe(5)
  })

  it("they are not the same number", () => {
    // A future "tidy-up" that unified them would be a regression in one
    // direction or the other, so the difference is the assertion.
    expect(limitOf("app/api/checkout/route.ts")).not.toBe(limitOf("app/api/submit-lead/route.ts"))
  })
})

/* ── Magic link ──────────────────────────────────────────────────────────── */

describe("the sign-in link cannot be used to mail strangers", () => {
  it("a malformed address is refused before Supabase or Resend is touched", async () => {
    const { POST } = await import("@/app/api/auth/send-magic-link/route")
    const res = await POST(post("/api/auth/send-magic-link", { email: "not-an-address" }, "5.5.5.1"))
    expect(res.status).toBe(400)
  })

  it("a loop from one address is rate-limited", async () => {
    const { POST } = await import("@/app/api/auth/send-magic-link/route")
    const req = () => post("/api/auth/send-magic-link", { email: "someone@example.com" }, "5.5.5.2")
    for (let i = 0; i < 5; i++) await POST(req())
    expect((await POST(req())).status).toBe(429)
  })
})
