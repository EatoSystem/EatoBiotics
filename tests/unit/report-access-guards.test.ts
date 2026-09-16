import { describe, it, expect } from "vitest"
import { readFileSync, readdirSync, statSync } from "node:fs"
import { join, sep } from "node:path"

/**
 * What Phase 4B-S1 must NOT have done.
 *
 * S1 builds the authority layer and leaves it completely dark. The customer
 * boundary is wired in 4B-S4's controlled activation change, after the schema
 * exists in production. These guards are what "dark" means, checked rather than
 * asserted in a PR description — and they are written to FAIL if the scan
 * itself breaks, because a guard that silently examines nothing is worse than
 * no guard at all.
 */

const ROOT = process.cwd()
const ACCESS_DIR = join(ROOT, "lib/report/access")

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry === ".next" || entry === ".git") continue
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) walk(full, out)
    else if (/\.(ts|tsx)$/.test(full)) out.push(full)
  }
  return out
}

const accessFiles = walk(ACCESS_DIR)
const appFiles = walk(join(ROOT, "app"))
const libFiles = walk(join(ROOT, "lib"))

/**
 * Comments quote the very identifiers these guards search for — this file is
 * full of prose about `ensurePersistedConsultationReport` and `getSupabase`.
 * A guard that scanned raw source would match its own explanation and fail,
 * and the tempting fix is to delete the prose. Strip the comments instead: the
 * explanation is the most valuable part of a guard.
 */
function code(path: string): string {
  return readFileSync(path, "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:])\/\/.*$/gm, "$1")
}

describe("the scan itself is healthy", () => {
  it("found the access layer and a realistic repository", () => {
    expect(accessFiles.length).toBeGreaterThanOrEqual(8)
    expect(appFiles.length).toBeGreaterThan(50)
    expect(libFiles.length).toBeGreaterThan(50)
  })
})

describe("nothing reachable imports the access layer", () => {
  it("no app route, page or handler imports it", () => {
    for (const file of appFiles) {
      expect(code(file).includes("report/access"), file).toBe(false)
    }
  })

  it("no component imports it", () => {
    for (const file of walk(join(ROOT, "components"))) {
      expect(code(file).includes("report/access"), file).toBe(false)
    }
  })

  it("only the access layer itself imports the access layer", () => {
    const importers = libFiles.filter(
      (file) => !file.startsWith(ACCESS_DIR) && code(file).includes("report/access"),
    )
    expect(importers).toEqual([])
  })
})

describe("S4 stays uncalled through S1", () => {
  it("the access layer does not call the persistence service", () => {
    // S1 is authorisation. Calling S4 here would make the authority layer a
    // delivery path, and the two are separated on purpose.
    for (const file of accessFiles) {
      expect(code(file).includes("ensurePersistedConsultationReport"), file).toBe(false)
    }
  })

  it("no app file calls it either, exactly as before this phase", () => {
    for (const file of appFiles) {
      expect(code(file).includes("ensurePersistedConsultationReport"), file).toBe(false)
    }
  })
})

describe("the access layer imports no I/O at its leaves", () => {
  it("no Supabase client", () => {
    // Reads are injected, following S4's `ensure-core` shape, so the authority
    // logic can be exercised exhaustively without a database and cannot acquire
    // a client by accident.
    for (const file of accessFiles) {
      const source = code(file)
      expect(source.includes("@/lib/supabase"), file).toBe(false)
      expect(source.includes("createClient"), file).toBe(false)
    }
  })

  it("no Stripe import and no Stripe SDK call", () => {
    // Stripe may bootstrap a credential inside a finite window. It is never
    // consulted to READ a Report, and this layer is the read path.
    //
    // Narrowed to imports and calls rather than the substring "stripe": the
    // resolver legitimately names the COLUMN `stripe_session_id`, which is a
    // database identifier, not a dependency. A bare substring scan matched it
    // and would have been "fixed" by renaming a column or deleting a guard.
    for (const file of accessFiles) {
      const source = code(file)
      expect(/from\s+["']stripe["']/.test(source), file).toBe(false)
      expect(/from\s+["']@\/lib\/stripe/.test(source), file).toBe(false)
      expect(/\bStripe\./.test(source), file).toBe(false)
      // A client method call. `stripe_session_id` cannot match: it has an
      // underscore where this needs a dot.
      expect(/\bstripe\.\w/.test(source), file).toBe(false)
    }
  })

  it("that narrowing is not a hole — a real Stripe import would still fail", () => {
    // Non-vacuity. The patterns above must reject the thing they exist to
    // reject, or narrowing them would have quietly disabled the guard.
    const planted = [
      'import Stripe from "stripe"',
      'import { stripe } from "@/lib/stripe-server"',
      "const s = Stripe.Webhook",
      "await stripe.checkout.sessions.retrieve(id)",
    ]
    for (const line of planted) {
      const matched =
        /from\s+["']stripe["']/.test(line) ||
        /from\s+["']@\/lib\/stripe/.test(line) ||
        /\bStripe\./.test(line) ||
        /\bstripe\.\w/.test(line)
      expect(matched, line).toBe(true)
    }
    // ...and the legitimate column name must still pass.
    const column = "readonly stripe_session_id: string"
    expect(/\bstripe\.\w/.test(column)).toBe(false)
    expect(/from\s+["']stripe["']/.test(column)).toBe(false)
  })

  it("no framework, no network, no filesystem", () => {
    for (const file of accessFiles) {
      const source = code(file)
      for (const forbidden of ["next/", "node:fs", "fetch(", "NextResponse"]) {
        expect(source.includes(forbidden), `${file} :: ${forbidden}`).toBe(false)
      }
    }
  })
})

describe("secrets do not leak", () => {
  it("the access layer logs nothing at all", () => {
    // The simplest form of "never log a secret" that cannot be got wrong later
    // by someone adding a debug line next to one.
    for (const file of accessFiles) {
      expect(code(file).includes("console."), file).toBe(false)
    }
  })

  it("no analytics call anywhere in the layer", () => {
    for (const file of accessFiles) {
      const source = code(file)
      expect(source.includes("logServerEvent"), file).toBe(false)
      expect(source.includes("posthog"), file).toBe(false)
    }
  })

  it("the only place a secret is created is the mint", () => {
    const creators = accessFiles.filter((file) => code(file).includes("randomBytes"))
    expect(creators.map((f) => f.slice(ROOT.length + 1))).toEqual([
      `lib${sep}report${sep}access${sep}capability.ts`,
    ])
  })
})

describe("the two maps cannot see each other", () => {
  /**
   * Structural enforcement of the rule that severity never changes what a
   * customer is told. Asserting the OUTPUTS are independent is not enough: a
   * sabotage case that merely IMPORTED the severity map into the external one
   * slipped past the behavioural tests, because importing it changes no output
   * — it just puts the branch within reach of the next person to edit the file.
   *
   * Siblings, not a stack. Neither may depend on the other.
   */
  const external = join(ROOT, "lib/report/access/external-outcome.ts")
  const severity = join(ROOT, "lib/report/access/operational-severity.ts")

  it("the customer outcome map cannot reach the severity map", () => {
    const source = code(external)
    expect(source.includes("operational-severity"), external).toBe(false)
    expect(source.includes("OperationalSeverity"), external).toBe(false)
    expect(source.includes("OPERATIONAL_SEVERITY_BY_REFUSAL"), external).toBe(false)
  })

  it("the severity map cannot reach the customer outcome map", () => {
    const source = code(severity)
    expect(source.includes("external-outcome"), severity).toBe(false)
    expect(source.includes("ExternalReportCategory"), severity).toBe(false)
    expect(source.includes("EXTERNAL_CATEGORY_BY_REFUSAL"), severity).toBe(false)
  })

  it("both read the refusal union, and that is their only shared dependency", () => {
    // Non-vacuity: the assertions above would also pass on two empty files.
    for (const file of [external, severity]) {
      expect(code(file).includes("@/lib/report/persisted/outcomes"), file).toBe(true)
      expect(code(file).includes("EnsureReportRefusal"), file).toBe(true)
    }
  })
})

describe("the cookie is never set at a parent path", () => {
  it("no parent-path constant exists in the layer", () => {
    // A cookie at `/`, or at the Report route base, is sent to every Report
    // path and shadows the scoped ones — which would destroy the coexistence
    // that lets a customer hold two purchased Reports.
    for (const file of accessFiles) {
      const source = code(file)
      expect(source.includes('path: "/"'), file).toBe(false)
      expect(source.includes("Path=/;"), file).toBe(false)
    }
  })
})

describe("nothing customer-facing changed", () => {
  const unchanged = [
    "app/api/consultation/finalise/route.ts",
    "app/api/account/export/route.ts",
    "app/api/account/delete/route.ts",
    "app/assessment/report/page.tsx",
  ]

  it("the finalise route does not know about the capability table", () => {
    // The recovery-email invariant is an S4 ACTIVATION requirement. Wiring it
    // now would have this route query a table that does not exist.
    const source = readFileSync(join(ROOT, "app/api/consultation/finalise/route.ts"), "utf8")
    expect(source).not.toContain("report_access_capabilities")
    expect(source).not.toContain("report/access")
  })

  it("the live account routes are untouched by this phase", () => {
    for (const path of unchanged) {
      const source = readFileSync(join(ROOT, path), "utf8")
      expect(source.includes("report_access_capabilities"), path).toBe(false)
      expect(source.includes("report/access"), path).toBe(false)
    }
  })

  it("no Report route exists yet", () => {
    expect(readdirSync(join(ROOT, "app/api/consultation"))).not.toContain("report")
    const assessmentRoutes = readdirSync(join(ROOT, "app/assessment"))
    expect(assessmentRoutes).not.toContain("food-system-report")
  })
})

describe("Migration 50 is drafted, not applied", () => {
  const sql = readFileSync(join(ROOT, "supabase/migrations.sql"), "utf8")
  const manifest = JSON.parse(readFileSync(join(ROOT, "supabase/applied-schema.json"), "utf8")) as {
    applied: string[]
    pending: Array<{ table: string; migration: number }>
  }

  it("the table is pending and not applied", () => {
    expect(manifest.applied).not.toContain("report_access_capabilities")
    const pending = manifest.pending.find((p) => p.table === "report_access_capabilities")
    expect(pending?.migration).toBe(50)
  })

  it("its two dependencies are still pending too", () => {
    // 48 -> 49 -> 50. Applying out of order is an error, not a degraded state.
    expect(manifest.applied).not.toContain("consultation_reports")
  })

  it("nothing in the repository applies it", () => {
    for (const file of [...appFiles, ...libFiles]) {
      expect(code(file).includes("report_access_capabilities"), file).toBe(false)
    }
    expect(sql).toContain("-- Migration 50:")
  })
})
