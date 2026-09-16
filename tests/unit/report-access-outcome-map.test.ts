import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"

import {
  EXTERNAL_CATEGORY_BY_REFUSAL,
  EXTERNAL_NOT_FOUND,
  EXTERNAL_TEMPORARILY_UNAVAILABLE,
  externalOutcomeForFailure,
  externalOutcomeForRefusal,
} from "@/lib/report/access/external-outcome"
import {
  OPERATIONAL_SEVERITY_BY_REFUSAL,
  operationalSeverityForFailure,
} from "@/lib/report/access/operational-severity"
import type { EnsureReportRefusal } from "@/lib/report/persisted/outcomes"

/**
 * The two maps, and the thing that makes them trustworthy — Phase 4B-S1.
 *
 * ══ WHY THE REASONS ARE PARSED, NOT LISTED ══════════════════════════════════
 *
 * A test that hard-codes thirty-five strings passes forever after somebody adds
 * a thirty-sixth to S4 — it asserts that the list it was given matches the list
 * it was given. Reading the union out of `outcomes.ts` makes S4 the source of
 * truth, so the day that union grows, this file fails and somebody has to
 * decide what the new reason means to a customer and to an operator.
 *
 * The total `Record` types are the real exhaustiveness check and they run at
 * compile time. These tests prove the compiler was not bypassed — by a cast, by
 * an index signature, or by the union and the maps drifting apart.
 */

const OUTCOMES_SRC = readFileSync(
  join(process.cwd(), "lib/report/persisted/outcomes.ts"),
  "utf8",
)

/** The union members, taken from S4's source rather than from memory. */
function declaredRefusals(): string[] {
  const start = OUTCOMES_SRC.indexOf("export type EnsureReportRefusal =")
  const end = OUTCOMES_SRC.indexOf("export type EnsureReportResult")
  expect(start, "EnsureReportRefusal must be declared").toBeGreaterThan(-1)
  expect(end, "EnsureReportResult must follow it").toBeGreaterThan(start)
  const block = OUTCOMES_SRC.slice(start, end)
  return [...block.matchAll(/^\s*\|\s*"([a-z0-9-]+)"\s*$/gm)].map((m) => m[1])
}

describe("the refusal union is read from S4, not restated", () => {
  it("parses a non-empty, duplicate-free list", () => {
    const reasons = declaredRefusals()
    // A sentinel, because a parser that silently matches nothing would make
    // every assertion below vacuously true.
    expect(reasons.length).toBeGreaterThan(30)
    expect(new Set(reasons).size).toBe(reasons.length)
  })

  it("is exactly thirty-five reasons", () => {
    // Pinned deliberately. Growing the union is allowed; growing it WITHOUT
    // classifying the new member is not, and this is the line that says so.
    expect(declaredRefusals()).toHaveLength(35)
  })

  it("`unavailable` is not one of them", () => {
    // It is the retryable branch, not a refusal, and the difference is the
    // whole of S4's read-error rule. A map key for it would blur that.
    expect(declaredRefusals()).not.toContain("unavailable")
  })
})

describe("every declared reason is mapped, both ways", () => {
  it("the external map covers the union exactly", () => {
    expect(Object.keys(EXTERNAL_CATEGORY_BY_REFUSAL).sort()).toEqual(declaredRefusals().sort())
  })

  it("the severity map covers the union exactly", () => {
    expect(Object.keys(OPERATIONAL_SEVERITY_BY_REFUSAL).sort()).toEqual(declaredRefusals().sort())
  })

  it("no reason maps to undefined", () => {
    for (const reason of declaredRefusals() as EnsureReportRefusal[]) {
      expect(EXTERNAL_CATEGORY_BY_REFUSAL[reason], reason).toBeDefined()
      expect(OPERATIONAL_SEVERITY_BY_REFUSAL[reason], reason).toBeDefined()
    }
  })
})

describe("the external contract", () => {
  it("uses exactly four categories and no more", () => {
    const used = new Set(Object.values(EXTERNAL_CATEGORY_BY_REFUSAL))
    used.add(EXTERNAL_TEMPORARILY_UNAVAILABLE.category)
    expect([...used].sort()).toEqual([
      "report_cannot_be_produced",
      "report_not_found",
      "report_not_ready",
      "report_temporarily_unavailable",
    ])
  })

  it("splits 2 / 1 / 32 across the non-retryable categories", () => {
    const counts: Record<string, number> = {}
    for (const category of Object.values(EXTERNAL_CATEGORY_BY_REFUSAL)) {
      counts[category] = (counts[category] ?? 0) + 1
    }
    expect(counts.report_not_found).toBe(2)
    expect(counts.report_not_ready).toBe(1)
    expect(counts.report_cannot_be_produced).toBe(32)
    // Nothing non-retryable may present as retryable.
    expect(counts.report_temporarily_unavailable).toBeUndefined()
  })

  it("only the two genuine no-Report cases are not-found", () => {
    // Anything else mapped here would tell an unauthorised caller that a
    // particular assessment exists in a particular state.
    const notFound = Object.entries(EXTERNAL_CATEGORY_BY_REFUSAL)
      .filter(([, category]) => category === "report_not_found")
      .map(([reason]) => reason)
      .sort()
    expect(notFound).toEqual(["assessment-not-found", "mode-conflict"])
  })

  it("retryability is true for exactly one outcome", () => {
    expect(EXTERNAL_TEMPORARILY_UNAVAILABLE.retryable).toBe(true)
    expect(EXTERNAL_NOT_FOUND.retryable).toBe(false)
    for (const reason of declaredRefusals() as EnsureReportRefusal[]) {
      expect(externalOutcomeForRefusal(reason).retryable, reason).toBe(false)
    }
  })

  it("carries the frozen statuses, with 409 shared and the code as discriminator", () => {
    expect(EXTERNAL_NOT_FOUND.status).toBe(404)
    expect(EXTERNAL_TEMPORARILY_UNAVAILABLE.status).toBe(503)
    expect(externalOutcomeForRefusal("not-finalised").status).toBe(409)
    expect(externalOutcomeForRefusal("digest-mismatch").status).toBe(409)
    // Same status, different machine code. That is the contract, not an accident.
    expect(externalOutcomeForRefusal("not-finalised").category).toBe("report_not_ready")
    expect(externalOutcomeForRefusal("digest-mismatch").category).toBe("report_cannot_be_produced")
  })

  it("never uses 422 or 500", () => {
    // 422 describes a request the server cannot process; the request is fine and
    // the defect is in stored state. 500 frames a permanent defect as transient.
    const statuses = new Set(
      (declaredRefusals() as EnsureReportRefusal[]).map((r) => externalOutcomeForRefusal(r).status),
    )
    expect(statuses.has(422 as never)).toBe(false)
    expect(statuses.has(500 as never)).toBe(false)
  })

  it("maps S4's unavailable branch to the retryable category", () => {
    const outcome = externalOutcomeForFailure({
      ok: false,
      retryable: true,
      reason: "unavailable",
      detail: "database is not configured",
    })
    expect(outcome).toEqual(EXTERNAL_TEMPORARILY_UNAVAILABLE)
  })

  it("carries no detail, reason or severity to the customer", () => {
    const outcome = externalOutcomeForFailure({
      ok: false,
      retryable: false,
      reason: "digest-mismatch",
      detail: "stored digest 0000 does not match recomputed aaaa",
    })
    expect(Object.keys(outcome).sort()).toEqual(["category", "retryable", "status"])
    expect(JSON.stringify(outcome)).not.toContain("digest")
    expect(JSON.stringify(outcome)).not.toContain("0000")
    expect(JSON.stringify(outcome)).not.toContain("integrity")
  })
})

describe("the operational contract", () => {
  it("splits 7 / 9 / 19 across the three refusal severities", () => {
    const counts: Record<string, number> = {}
    for (const severity of Object.values(OPERATIONAL_SEVERITY_BY_REFUSAL)) {
      counts[severity] = (counts[severity] ?? 0) + 1
    }
    expect(counts.expected).toBe(7)
    expect(counts.compatibility).toBe(9)
    expect(counts.integrity).toBe(19)
    // `unavailable` is the only infrastructure case and is not in this map.
    expect(counts.infrastructure).toBeUndefined()
  })

  it("does not page on the engine behaving correctly", () => {
    // The failure mode this split exists to prevent: a pager that fires on
    // correct behaviour is a pager people learn to swipe away.
    for (const reason of [
      "lens-unsupported",
      "safety-contradiction",
      "no-authorised-content",
      "proposition-refused",
    ] as const) {
      expect(OPERATIONAL_SEVERITY_BY_REFUSAL[reason], reason).toBe("expected")
    }
  })

  it("pages on an artifact disagreeing with itself", () => {
    for (const reason of [
      "digest-mismatch",
      "canonical-form-mismatch",
      "parent-mismatch",
      "handoff-mismatch",
      "report-finalisation-mismatch",
      "conflicting-authority",
      "self-check-failed",
    ] as const) {
      expect(OPERATIONAL_SEVERITY_BY_REFUSAL[reason], reason).toBe("integrity")
    }
  })

  it("treats pre-write identity drift as compatibility, not corruption", () => {
    // It fires before anything is persisted, so nothing corrupt exists.
    expect(OPERATIONAL_SEVERITY_BY_REFUSAL["generation-identity-mismatch"]).toBe("compatibility")
    // The bank moved under a seal that still names it — a deploy fact.
    expect(OPERATIONAL_SEVERITY_BY_REFUSAL["unsupported-answer-value"]).toBe("compatibility")
  })

  it("treats a constraint-impossible state as an alarm", () => {
    // Migration 48's CHECKs make these unwritable, so seeing one live means a
    // constraint is missing or was bypassed.
    expect(OPERATIONAL_SEVERITY_BY_REFUSAL["seal-incoherent"]).toBe("integrity")
    expect(OPERATIONAL_SEVERITY_BY_REFUSAL["state-unreadable"]).toBe("integrity")
  })

  it("maps unavailable to infrastructure without a map entry", () => {
    expect(
      operationalSeverityForFailure({
        ok: false,
        retryable: true,
        reason: "unavailable",
        detail: "read failed",
      }),
    ).toBe("infrastructure")
  })
})

describe("severity and customer outcome are independent", () => {
  it("all three severities appear under one customer category", () => {
    // The point of two maps. `lens-unsupported`, `bank-unsupported` and
    // `digest-mismatch` are one sentence to a customer and three different
    // nights for an operator.
    const severities = new Set(
      (Object.entries(EXTERNAL_CATEGORY_BY_REFUSAL) as [EnsureReportRefusal, string][])
        .filter(([, category]) => category === "report_cannot_be_produced")
        .map(([reason]) => OPERATIONAL_SEVERITY_BY_REFUSAL[reason]),
    )
    expect([...severities].sort()).toEqual(["compatibility", "expected", "integrity"])
  })

  it("the external outcome is identical whatever the severity", () => {
    const expectedSeverity = externalOutcomeForRefusal("lens-unsupported")
    const integrity = externalOutcomeForRefusal("digest-mismatch")
    const compatibility = externalOutcomeForRefusal("bank-unsupported")
    expect(expectedSeverity).toEqual(integrity)
    expect(integrity).toEqual(compatibility)
  })
})
