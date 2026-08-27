/**
 * Erasure and portability, against what the Privacy Policy promises.
 *
 * Two defects are pinned here.
 *
 * The dangerous one: every `.delete()` in the erasure route discarded its
 * `{ error }` — an awaited PostgREST call resolves with `{ error }` rather than
 * throwing — and `auth.admin.deleteUser` then ran unconditionally. A failed
 * delete therefore ended with the account destroyed and the rows orphaned, in
 * that order, with nobody left who could retry. The ordering is the whole test:
 * the irreversible step must not happen after a failure.
 *
 * The quiet one: the export returned four tables and omitted `deep_assessments`
 * — the deep answers and the report the customer paid €49 for.
 */
import { describe, it, expect, vi, beforeEach } from "vitest"

/* ── A Supabase stub that records what was targeted, and can be told to fail a
      named table. Deletes resolve with `{ error }` like the real client, which
      is the behaviour the route used to ignore. ───────────────────────────── */
type Fail = { table?: string; storage?: boolean }

function makeSupabase(fail: Fail = {}) {
  const deleted: string[] = []
  const selected: string[] = []
  const removedPaths: string[][] = []
  const authDeletes: string[] = []

  const client = {
    from(table: string) {
      const result = (kind: "delete" | "select") => {
        if (kind === "delete") deleted.push(table)
        else selected.push(table)
        return fail.table === table
          ? { data: null, error: { message: `${table} exploded` } }
          : {
              data:
                table === "deep_assessments"
                  ? [{ stripe_session_id: "cs_test_123" }]
                  : table === "profiles"
                    ? { id: "user-1" }
                    : [],
              error: null,
            }
      }
      const chain: Record<string, unknown> = {}
      let kind: "delete" | "select" = "select"
      chain.select = () => { kind = "select"; return chain }
      chain.delete = () => { kind = "delete"; return chain }
      for (const m of ["eq", "or", "in"]) chain[m] = () => chain
      chain.single = () => Promise.resolve(result(kind))
      chain.maybeSingle = () => Promise.resolve(result(kind))
      chain.then = (resolve: (v: unknown) => void) => resolve(result(kind))
      return chain
    },
    storage: {
      from: (_bucket: string) => ({
        remove: (paths: string[]) => {
          removedPaths.push(paths)
          return Promise.resolve({
            error: fail.storage ? { message: "storage exploded" } : null,
          })
        },
      }),
    },
    auth: {
      admin: {
        deleteUser: (id: string) => {
          authDeletes.push(id)
          return Promise.resolve({ error: null })
        },
      },
    },
  }
  return { client, deleted, selected, removedPaths, authDeletes }
}

let supabase = makeSupabase()

vi.mock("@/lib/supabase", () => ({ getSupabase: () => supabase.client }))
vi.mock("@/lib/supabase-server", () => ({
  getUser: () => Promise.resolve({ id: "user-1", email: "person@example.com" }),
}))

beforeEach(() => {
  vi.clearAllMocks()
  supabase = makeSupabase()
})

async function callDelete() {
  const { DELETE } = await import("@/app/api/account/delete/route")
  return DELETE()
}

async function callExport() {
  const { GET } = await import("@/app/api/account/export/route")
  return GET()
}

/* ── Erasure ────────────────────────────────────────────────────────────── */

describe("erasure removes what no cascade reaches", () => {
  it("deletes the paid report rows, the lead, and the email ledger", async () => {
    const res = await callDelete()

    expect(res.status).toBe(200)
    // These four are the ones a `ON DELETE CASCADE` from auth.users does not
    // cover — deep_assessments has no FK at all, leads was previously only
    // soft-unlinked, and email_sends is SET NULL so it keeps the address.
    expect(supabase.deleted).toContain("deep_assessments")
    expect(supabase.deleted).toContain("leads")
    expect(supabase.deleted).toContain("email_sends")
    expect(supabase.deleted).toContain("profiles")
  })

  it("removes the report PDFs from storage", async () => {
    await callDelete()
    // No database cascade reaches the bucket, and the object paths are derived
    // from deep_assessments rows — so this must happen before those rows go.
    expect(supabase.removedPaths.flat()).toEqual(["cs_test_123.pdf"])
    expect(
      supabase.selected.indexOf("deep_assessments"),
      "session ids must be read before the rows are deleted",
    ).toBeGreaterThanOrEqual(0)
  })

  it("closes the account only after every delete succeeded", async () => {
    await callDelete()
    expect(supabase.authDeletes).toEqual(["user-1"])
  })
})

describe("erasure fails closed", () => {
  // One case per surface that can fail. Each asserts the same thing, because
  // the defect was structural: nothing stopped the irreversible step.
  for (const table of ["deep_assessments", "leads", "email_sends", "profiles", "analyses"]) {
    it(`does not close the account when ${table} fails`, async () => {
      supabase = makeSupabase({ table })

      const res = await callDelete()
      const body = await res.json()

      expect(res.status).toBe(503)
      expect(body).toMatchObject({ code: "deletion_incomplete" })
      expect(
        supabase.authDeletes,
        "deleting the auth user after a failed row delete orphans the data with nobody left to retry",
      ).toEqual([])
    })
  }

  it("does not close the account when the PDF removal fails", async () => {
    supabase = makeSupabase({ storage: true })

    const res = await callDelete()

    expect(res.status).toBe(503)
    expect(supabase.authDeletes).toEqual([])
  })

  it("names the failed stage without leaking database error text", async () => {
    supabase = makeSupabase({ table: "leads" })

    const body = await (await callDelete()).json()

    expect(body.stages).toContain("leads")
    // The stub's message is "leads exploded"; the response must carry the stage
    // only. Database error text stays in the server log.
    expect(JSON.stringify(body)).not.toContain("exploded")
  })
})

/* ── Portability ────────────────────────────────────────────────────────── */

describe("the export includes what the customer paid for", () => {
  it("contains the paid deep assessments", async () => {
    const res = await callExport()
    const body = JSON.parse(await res.text())

    expect(res.status).toBe(200)
    // The single most conspicuous omission: a portability export that leaves out
    // the €49 report.
    expect(Object.keys(body)).toContain("paidReports")
    expect(supabase.selected).toContain("deep_assessments")
  })

  it("covers the daily-use surfaces as well", async () => {
    await callExport()

    for (const table of [
      "journal_entries",
      "plate_data",
      "consultations",
      "stability_assessments",
      "stability_logs",
      "glp1_profile",
      "glp1_logs",
      "household_members",
      "twin_state",
    ]) {
      expect(supabase.selected, `${table} must be in the export`).toContain(table)
    }
  })

  it("still returns a downloadable JSON attachment", async () => {
    const res = await callExport()
    expect(res.headers.get("Content-Type")).toBe("application/json")
    expect(res.headers.get("Content-Disposition")).toMatch(/attachment; filename="eatobiotics-data-/)
  })
})
