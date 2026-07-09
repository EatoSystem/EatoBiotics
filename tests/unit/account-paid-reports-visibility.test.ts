import { describe, it, expect } from "vitest"
import { ownerOrFilter } from "@/lib/supabase-filters"

/**
 * Proves the app/account/page.tsx fix: the deep_assessments query now matches
 * a report by user_id OR email (via ownerOrFilter), not user_id alone — so a
 * report purchased mid-session (before reconcileAccountAfterAuth has had a
 * chance to backfill user_id) is still found by the buyer's email.
 *
 * The repo's usual Supabase test stub (see foundation-enforcement.test.ts /
 * money-paths.test.ts) treats every query-builder method as a no-op
 * passthrough, so it can't express OR-filter semantics and can't prove this
 * fix. This file adds a small, test-only .or() evaluator that actually
 * applies ownerOrFilter()'s real output against seeded rows, instead of
 * asserting against a mock that would just echo back whatever it's told.
 */

interface Row {
  stripe_session_id: string
  user_id: string | null
  email: string | null
}

/** Parses a single `col.eq."value"` condition, reversing pgQuote's escaping. */
function parseCondition(condition: string): { column: string; value: string } {
  const match = /^(\w+)\.eq\."(.*)"$/.exec(condition)
  if (!match) throw new Error(`Unparseable OR condition: ${condition}`)
  const [, column, quoted] = match
  return { column, value: quoted.replace(/\\"/g, '"').replace(/\\\\/g, "\\") }
}

/** Splits ownerOrFilter()'s comma-joined output at condition boundaries only. */
function parseOrFilter(filter: string): { column: string; value: string }[] {
  return filter.split(/,(?=\w+\.eq\.)/).map(parseCondition)
}

function matchesOrFilter(row: Row, filter: string): boolean {
  return parseOrFilter(filter).some(({ column, value }) => row[column as keyof Row] === value)
}

/** The exact query this test proves: .from("deep_assessments")...or(ownerOrFilter(userId, email)) */
function findPaidReports(rows: Row[], userId: string, email: string | null | undefined): Row[] {
  return rows.filter((row) => matchesOrFilter(row, ownerOrFilter(userId, email)))
}

describe("account page: deep_assessments visibility via ownerOrFilter", () => {
  const userId = "11111111-1111-1111-1111-111111111111"
  const email = "buyer@example.com"

  it("finds a report by email when user_id is null (the bug this fixes)", () => {
    const rows: Row[] = [{ stripe_session_id: "sess_1", user_id: null, email }]
    expect(findPaidReports(rows, userId, email)).toHaveLength(1)
  })

  it("still finds a report by user_id when email differs (existing behavior preserved)", () => {
    const rows: Row[] = [{ stripe_session_id: "sess_2", user_id: userId, email: "other@example.com" }]
    expect(findPaidReports(rows, userId, email)).toHaveLength(1)
  })

  it("does not return another user's unrelated report", () => {
    const rows: Row[] = [
      { stripe_session_id: "sess_3", user_id: "22222222-2222-2222-2222-222222222222", email: "someone-else@example.com" },
    ]
    expect(findPaidReports(rows, userId, email)).toHaveLength(0)
  })

  it("still matches by user_id alone when no email is available", () => {
    const rows: Row[] = [{ stripe_session_id: "sess_4", user_id: userId, email: null }]
    expect(findPaidReports(rows, userId, undefined)).toHaveLength(1)
  })
})
