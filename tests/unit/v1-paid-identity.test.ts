/**
 * A paid row must stay findable — Step 7, defect 1.
 *
 * ══ THE DEFECT ══════════════════════════════════════════════════════════════
 *
 * `reconcileAccountAfterAuth` links paid rows to an account BY EMAIL, and that
 * link is the only thing that grants the 30 days of access sold with the €49
 * Report. Until Step 7 the Stripe webhook was the ONLY writer that set
 * `deep_assessments.email`.
 *
 * So if the webhook body never ran — a delayed payment, a misconfigured
 * endpoint, a handler failure — the row created by the questionnaire carried a
 * null email, no account could ever be linked to it, and the buyer silently
 * received the Report but never the access. The Report still worked, because
 * it is addressed by session id. That is exactly what made it invisible: every
 * surface the customer could see was fine.
 *
 * ══ THE REPAIR ══════════════════════════════════════════════════════════════
 *
 * `email` joined the shared projection `ownedPaidAssessmentFields`, which every
 * row-CREATING writer already spreads. One description of the purchase, so the
 * writers cannot disagree about a row whose content depends on which of them
 * won the race.
 *
 * ══ WHY submit-deep-assessment IS DELIBERATELY UNCHANGED ════════════════════
 *
 * It only ever UPSERTS onto a row that already exists: `tier` and `free_scores`
 * are NOT NULL with no default (verified against production), so an upsert
 * carrying neither cannot create a row. It therefore never produces a row
 * lacking an email, and adding a conditional email write there would risk
 * replacing a good value with null for no proven gain.
 */
import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import ts from "typescript"
import {
  ownedPaidAssessmentFields,
  normalisePaidEmail,
  type PaidReportSummary,
} from "@/lib/paid-report-session"
import type { SupabaseClient } from "@supabase/supabase-js"
import {
  decideTrialActivation,
  latestPurchaseAt,
  reconcileAccountAfterAuth,
} from "@/lib/auth/reconcile-account"
import { PostgrestDouble } from "./support/postgrest-double"

const SUMMARY: PaidReportSummary = {
  tier: "personal",
  overall: 56,
  subScores: { prebiotics: 44 },
  profile: { type: "Emerging Balance", tagline: "t", description: "d" },
  email: "  Buyer@Example.COM ",
  foundationType: "you",
  selectedAddon: null,
}

describe("the shared paid-row projection carries identity", () => {
  it("includes the buyer's address, normalised", () => {
    expect(ownedPaidAssessmentFields(SUMMARY).email).toBe("buyer@example.com")
  })

  it("still describes what was bought", () => {
    const owned = ownedPaidAssessmentFields(SUMMARY)
    expect(owned.tier).toBe("personal")
    expect(owned.free_scores).toMatchObject({ overall: 56, foundationType: "you" })
  })

  it("yields null rather than a junk address when the session carries none", () => {
    for (const value of [null, undefined, "", "   ", 42, {}]) {
      expect(normalisePaidEmail(value)).toBeNull()
    }
    expect(ownedPaidAssessmentFields({ ...SUMMARY, email: null }).email).toBeNull()
  })
})

/* ══ The invariant, end to end, without the webhook ═══════════════════════ */

describe("a purchase stays claimable when the webhook never runs", () => {
  it("a row written by the questionnaire is findable by email and grants the bought window", () => {
    const purchasedAt = "2026-01-01T00:00:00.000Z"
    // What generate-deep-questions now writes, with no webhook involved.
    const row = {
      stripe_session_id: "cs_test_no_webhook",
      ...ownedPaidAssessmentFields(SUMMARY),
      created_at: purchasedAt,
    }

    // reconcileAccountAfterAuth matches on exactly this column.
    expect(row.email).toBe("buyer@example.com")

    // And the entitlement it then grants is the one that was bought — measured
    // from the purchase, even though reconciliation happens 10 days later.
    const decision = decideTrialActivation(
      "free",
      null,
      latestPurchaseAt([row]),
      Date.parse(purchasedAt) + 10 * 24 * 60 * 60 * 1000,
    )
    expect(decision.activate).toBe(true)
    expect(decision.expiresAt).toBe("2026-01-31T00:00:00.000Z")
  })

  it("a row with no address cannot be linked — which is the failure being prevented", () => {
    const orphan = { ...ownedPaidAssessmentFields({ ...SUMMARY, email: null }) }
    expect(orphan.email).toBeNull()
    // Stated as the counterfactual rather than left implicit: this is what
    // every non-webhook row looked like before Step 7.
  })
})

/* ══ The structural guard: no writer may create a paid row without it ═════ */

const ROW_CREATING_WRITERS = [
  "app/api/generate-deep-questions/route.ts",
  "lib/consultation/session-claim.ts",
]

/** Object literals passed to `.insert(...)` on a `deep_assessments` query. */
function deepAssessmentInsertLiterals(
  source: string,
): { literals: ts.ObjectLiteralExpression[]; sf: ts.SourceFile } {
  const sf = ts.createSourceFile("w.ts", source, ts.ScriptTarget.Latest, true)
  const found: ts.ObjectLiteralExpression[] = []

  const mentionsDeepAssessments = (node: ts.Node): boolean => {
    let hit = false
    const walk = (n: ts.Node) => {
      if (
        ts.isCallExpression(n) &&
        ts.isPropertyAccessExpression(n.expression) &&
        n.expression.name.text === "from" &&
        n.arguments.some((a) => ts.isStringLiteral(a) && a.text === "deep_assessments")
      ) {
        hit = true
      }
      if (!hit) ts.forEachChild(n, walk)
    }
    walk(node)
    return hit
  }

  const visit = (node: ts.Node) => {
    if (
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      node.expression.name.text === "insert" &&
      mentionsDeepAssessments(node.expression.expression)
    ) {
      for (const arg of node.arguments) {
        if (ts.isObjectLiteralExpression(arg)) found.push(arg)
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(sf)
  return { literals: found, sf }
}

/**
 * The two names that ARE the shared projection: the library function, and the
 * thin per-route mapping onto it. Anything else is a hand-built row.
 */
const PROJECTION_FNS = new Set(["ownedPaidAssessmentFields", "ownedAssessmentFields"])

/**
 * Does this literal spread the shared projection?
 *
 * The spread is usually a variable (`...owned`), not an inline call, so the
 * identifier is RESOLVED to its initialiser before judging it. Accepting a
 * bare `...identifier` would pass for any object at all, which would make this
 * guard prove nothing — the recurring failure this engagement keeps finding.
 */
function spreadsOwnedProjection(
  literal: ts.ObjectLiteralExpression,
  sf: ts.SourceFile,
): boolean {
  const initialiserOf = (name: string): ts.Expression | null => {
    let found: ts.Expression | null = null
    const visit = (n: ts.Node) => {
      if (
        ts.isVariableDeclaration(n) &&
        ts.isIdentifier(n.name) &&
        n.name.text === name &&
        n.initializer
      ) {
        found = n.initializer
      }
      if (!found) ts.forEachChild(n, visit)
    }
    visit(sf)
    return found
  }

  const isProjectionCall = (expr: ts.Expression): boolean => {
    const call = ts.isAwaitExpression(expr) ? expr.expression : expr
    return (
      ts.isCallExpression(call) &&
      ts.isIdentifier(call.expression) &&
      PROJECTION_FNS.has(call.expression.text)
    )
  }

  return literal.properties.some((p) => {
    if (!ts.isSpreadAssignment(p)) return false
    if (isProjectionCall(p.expression)) return true
    if (ts.isIdentifier(p.expression)) {
      const init = initialiserOf(p.expression.text)
      return init ? isProjectionCall(init) : false
    }
    return false
  })
}

describe("every writer that CREATES a paid row spreads the shared projection", () => {
  it.each(ROW_CREATING_WRITERS)("%s", (file) => {
    const { literals, sf } = deepAssessmentInsertLiterals(readFileSync(file, "utf-8"))
    expect(literals.length).toBeGreaterThan(0) // non-vacuity: the walk found the site
    for (const literal of literals) {
      expect(spreadsOwnedProjection(literal, sf)).toBe(true)
    }
  })

  it("NON-VACUITY: a literal that sets the columns by hand is caught", () => {
    const sabotaged = `
      const x = await supabase.from("deep_assessments").insert({
        stripe_session_id: sessionId,
        tier: "personal",
        free_scores: scores,
        status: "questions_generated",
      })
    `
    const { literals, sf } = deepAssessmentInsertLiterals(sabotaged)
    expect(literals).toHaveLength(1)
    expect(spreadsOwnedProjection(literals[0], sf)).toBe(false)
  })

  it("NON-VACUITY: spreading an unrelated variable does not satisfy the guard", () => {
    const sabotaged = `
      const owned = { tier: "personal", free_scores: scores }
      await supabase.from("deep_assessments").insert({ stripe_session_id, ...owned })
    `
    const { literals, sf } = deepAssessmentInsertLiterals(sabotaged)
    expect(literals).toHaveLength(1)
    expect(spreadsOwnedProjection(literals[0], sf)).toBe(false)
  })

  it("NON-VACUITY: the walk does not match an insert into another table", () => {
    const other = `await supabase.from("leads").insert({ email })`
    expect(deepAssessmentInsertLiterals(other).literals).toHaveLength(0)
  })
})

describe("the projection itself cannot quietly drop identity", () => {
  it("names email among the columns it returns", () => {
    const source = readFileSync("lib/paid-report-session.ts", "utf-8")
    const sf = ts.createSourceFile("s.ts", source, ts.ScriptTarget.Latest, true)

    let returnsEmail = false
    const visit = (node: ts.Node) => {
      if (ts.isFunctionDeclaration(node) && node.name?.text === "ownedPaidAssessmentFields") {
        node.body?.forEachChild((stmt) => {
          if (!ts.isReturnStatement(stmt) || !stmt.expression) return
          if (!ts.isObjectLiteralExpression(stmt.expression)) return
          returnsEmail = stmt.expression.properties.some(
            (p) => p.name && ts.isIdentifier(p.name) && p.name.text === "email",
          )
        })
      }
      ts.forEachChild(node, visit)
    }
    visit(sf)
    expect(returnsEmail).toBe(true)
  })
})

/* ══ The sign-in path, end to end against the database double ════════════
 *
 * DOUBLE, not Supabase: see tests/unit/support/postgrest-double.ts for exactly
 * what it models. What is proven here is the handler's behaviour.
 */

const DAY = 24 * 60 * 60 * 1000
/** Three days ago: inside the window a real buyer would be signing in during. */
const PURCHASE_AT = new Date(Date.now() - 3 * DAY).toISOString()

function accountDb(rowOverrides: Record<string, unknown> = {}) {
  return new PostgrestDouble({
    leads: { primaryKey: "email", rows: [] },
    deep_assessments: {
      primaryKey: "stripe_session_id",
      rows: [
        {
          stripe_session_id: "cs_test_reconcile",
          email: "buyer@example.com",
          tier: "personal",
          free_scores: { overall: 56 },
          user_id: null,
          created_at: PURCHASE_AT,
          ...rowOverrides,
        },
      ],
    },
    profiles: {
      primaryKey: "id",
      rows: [
        { id: "user_1", email: "buyer@example.com", membership_tier: "free", trial_expires_at: null },
      ],
    },
  })
}

async function signIn(db: PostgrestDouble) {
  return reconcileAccountAfterAuth(
    db.client() as unknown as SupabaseClient,
    "user_1",
    "Buyer@Example.com",
  )
}

describe("reconcileAccountAfterAuth grants the purchase window, once", () => {
  it("links the paid row by email and grants access ending 30 days after the PURCHASE", async () => {
    const db = accountDb()
    const result = await signIn(db)

    expect(result.linkedReports).toBe(1)
    expect(result.trialGranted).toBe(true)

    const profile = db.rowsOf("profiles")[0]
    expect(profile.membership_tier).toBe("trial")
    expect(new Date(profile.trial_expires_at as string).getTime()).toBe(
      Date.parse(PURCHASE_AT) + 30 * DAY,
    )
  })

  it("does not move the expiry on any later sign-in", async () => {
    const db = accountDb()
    await signIn(db)
    const first = db.rowsOf("profiles")[0].trial_expires_at

    for (let i = 0; i < 5; i++) await signIn(db)

    expect(db.rowsOf("profiles")[0].trial_expires_at).toBe(first)
  })

  it("cannot find a paid row that carries no email — the defect being prevented", async () => {
    const db = accountDb({ email: null })
    const result = await signIn(db)

    expect(result.linkedReports).toBe(0)
    expect(result.trialGranted).toBe(false)
    expect(db.rowsOf("profiles")[0].membership_tier).toBe("free")
  })
})
