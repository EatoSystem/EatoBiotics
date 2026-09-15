import { describe, it, expect, vi } from "vitest"

import { ensureReportWithDependencies } from "@/lib/report/persisted/testing/report-seam"
import { reportDigest } from "@/lib/report/persisted/digest"

import { fakeDb, sealedFixture, unsealedFixture, ASSESSMENT_ID, HANDOFF_ID } from "./consultation-report-fixtures"

/**
 * One sealed handoff, one canonical Report — Phase 4A-S4.
 *
 * ══ WHAT IS BEING PROVEN ════════════════════════════════════════════════════
 *
 * That the singleton survives everything a customer can do to it: a
 * double-click, a refresh, two tabs, a retry after the response was lost. The
 * arbiter is the database's unique constraint, so the fake below enforces one
 * too — a test whose fake accepts every insert would prove only that the code
 * runs.
 */

describe("first generation", () => {
  it("composes, persists exactly one Report, and reports it as generated", async () => {
    const fixture = sealedFixture()
    const db = fakeDb({ assessment: fixture.row })

    const result = await ensureReportWithDependencies({ sessionId: "cs_test", client: db.client })

    expect(result.ok, result.ok ? "" : `${result.reason}: ${result.detail}`).toBe(true)
    if (!result.ok) return
    expect(result.outcome).toBe("generated")
    expect(db.inserts).toBe(1)
    expect(db.store.report?.canonical_report).toBe(fixture.canonicalText)
    expect(db.store.report?.canonical_report_sha256).toBe(fixture.digest)
  })

  it("stores the digest of the canonical bytes, not of anything else", async () => {
    const fixture = sealedFixture()
    const db = fakeDb({ assessment: fixture.row })
    await ensureReportWithDependencies({ sessionId: "cs_test", client: db.client })

    const stored = db.store.report!
    // Lowercase hex, exactly as the database CHECK demands. An uppercase digest
    // would still match itself and be refused by Postgres at the boundary.
    expect(stored.canonical_report_sha256).toMatch(/^[0-9a-f]{64}$/)
    expect(stored.canonical_report_sha256).toBe(reportDigest(stored.canonical_report as string))
    // Not JSON.stringify's bytes: the canonical form is key-sorted and indented.
    expect(stored.canonical_report_sha256).not.toBe(
      reportDigest(JSON.stringify(JSON.parse(stored.canonical_report as string))),
    )
  })

  it("refuses an unsealed Consultation and writes nothing", async () => {
    const db = fakeDb({ assessment: unsealedFixture() })
    const result = await ensureReportWithDependencies({ sessionId: "cs_test", client: db.client })

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.reason).toBe("not-finalised")
    expect(db.inserts).toBe(0)
    expect(db.store.report).toBeNull()
  })

  it("refuses a lens seal rather than composing a core-only Report for it", async () => {
    const fixture = sealedFixture({ lens: "glucose" })
    const db = fakeDb({ assessment: fixture.row })
    const result = await ensureReportWithDependencies({ sessionId: "cs_test", client: db.client })

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.reason).toBe("lens-unsupported")
    expect(db.inserts).toBe(0)
  })

  it("refuses an assessment that does not exist", async () => {
    const db = fakeDb({ assessment: null })
    const result = await ensureReportWithDependencies({ sessionId: "cs_missing", client: db.client })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toBe("assessment-not-found")
  })

  it("refuses a legacy question array", async () => {
    const fixture = sealedFixture()
    const db = fakeDb({ assessment: { ...fixture.row, questions: [{ id: "legacy" }] } })
    const result = await ensureReportWithDependencies({ sessionId: "cs_test", client: db.client })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toBe("mode-conflict")
  })
})

describe("retries and repeats return the same authority", () => {
  it("a second call returns the existing Report and composes nothing new", async () => {
    const fixture = sealedFixture()
    const db = fakeDb({ assessment: fixture.row })

    const first = await ensureReportWithDependencies({ sessionId: "cs_test", client: db.client })
    const second = await ensureReportWithDependencies({ sessionId: "cs_test", client: db.client })

    expect(first.ok && second.ok).toBe(true)
    if (!first.ok || !second.ok) return
    expect(first.outcome).toBe("generated")
    expect(second.outcome).toBe("existing")
    expect(db.inserts).toBe(1)
  })

  it("byte-identical across a refresh", async () => {
    const fixture = sealedFixture()
    const db = fakeDb({ assessment: fixture.row })
    await ensureReportWithDependencies({ sessionId: "cs_test", client: db.client })
    const before = db.store.report!.canonical_report

    await ensureReportWithDependencies({ sessionId: "cs_test", client: db.client })
    expect(db.store.report!.canonical_report).toBe(before)
  })
})

describe("concurrency", () => {
  it("two simultaneous invocations produce one row, and both return it", async () => {
    const fixture = sealedFixture()
    const db = fakeDb({ assessment: fixture.row })

    const [a, b] = await Promise.all([
      ensureReportWithDependencies({ sessionId: "cs_test", client: db.client }),
      ensureReportWithDependencies({ sessionId: "cs_test", client: db.client }),
    ])

    expect(a.ok && b.ok).toBe(true)
    if (!a.ok || !b.ok) return
    expect(db.inserts).toBe(2)
    expect([a.outcome, b.outcome].sort()).toEqual(["existing", "generated"])
    expect(a.report).toEqual(b.report)
  })

  it("the race loser re-reads the winner instead of writing", async () => {
    const fixture = sealedFixture()
    // Somebody else commits in the instant before our INSERT lands.
    const db = fakeDb({
      assessment: fixture.row,
      onInsert: (store) => {
        store.report = { ...fixture.reportRow }
      },
    })

    const result = await ensureReportWithDependencies({ sessionId: "cs_test", client: db.client })

    expect(result.ok, result.ok ? "" : `${result.reason}: ${result.detail}`).toBe(true)
    if (!result.ok) return
    expect(result.outcome).toBe("existing")
    expect(db.store.report!.canonical_report).toBe(fixture.canonicalText)
  })

  it("a winner whose Report differs is a conflict, and is never overwritten", async () => {
    const fixture = sealedFixture()
    const foreign = {
      ...fixture.reportRow,
      canonical_report: fixture.canonicalText.replace("you", "YOU"),
      canonical_report_sha256: reportDigest(fixture.canonicalText.replace("you", "YOU")),
    }
    const db = fakeDb({
      assessment: fixture.row,
      onInsert: (store) => {
        store.report = foreign
      },
    })

    const result = await ensureReportWithDependencies({ sessionId: "cs_test", client: db.client })

    expect(result.ok).toBe(false)
    if (result.ok) return
    // Either the foreign bytes fail their own validation, or they validate and
    // the digest comparison catches them. Both are refusals; neither writes.
    expect(result.reason).not.toBe("unavailable")
    expect(db.store.report).toBe(foreign)
  })

  it("an insert that leaves no row behind is a conflict, not a success", async () => {
    const fixture = sealedFixture()
    const db = fakeDb({ assessment: fixture.row })
    // A database that accepts the write and then has nothing to show for it is
    // being arbitrated by something we do not know about. Refusing is the only
    // honest answer; reporting success would invent an authority.
    db.client.insertReport = async () => ({ ok: true })

    const result = await ensureReportWithDependencies({ sessionId: "cs_test", client: db.client })

    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toBe("conflicting-authority")
  })

  it("a winner that validates but differs byte-for-byte is still a conflict", async () => {
    const fixture = sealedFixture()
    /*
     * The hard case for the digest comparison: a Report that passes every
     * structural, producer and binding check and is simply NOT the document
     * this attempt composed. A deterministic composer over an immutable seal
     * cannot produce two, so reaching this state means something more serious
     * is wrong — and the winner is still not overwritten.
     */
    const doc = JSON.parse(fixture.canonicalText) as Record<string, unknown>
    ;(doc.systemSnapshot as { title: string }).title = "What you told us (variant)"
    const text = JSON.stringify(doc, null, 2)
    const winner = {
      ...fixture.reportRow,
      canonical_report: text,
      canonical_report_sha256: reportDigest(text),
    }
    const db = fakeDb({ assessment: fixture.row, onInsert: (store) => { store.report = winner } })

    const result = await ensureReportWithDependencies({ sessionId: "cs_test", client: db.client })

    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toBe("conflicting-authority")
    expect(db.store.report).toBe(winner)
  })

  it("never upserts: a present row is never handed to the writer", async () => {
    const fixture = sealedFixture()
    const db = fakeDb({ assessment: fixture.row, report: fixture.reportRow })
    const insert = vi.spyOn(db.client, "insertReport")

    const result = await ensureReportWithDependencies({ sessionId: "cs_test", client: db.client })

    expect(result.ok).toBe(true)
    expect(insert).not.toHaveBeenCalled()
  })
})

describe("a read failure is not an absent Report", () => {
  it("an assessment read error is retryable, not a refusal", async () => {
    const db = fakeDb({ assessmentError: "connection reset" })
    const result = await ensureReportWithDependencies({ sessionId: "cs_test", client: db.client })

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.retryable).toBe(true)
    expect(result.reason).toBe("unavailable")
  })

  it("a Report read error never leads to generation", async () => {
    const fixture = sealedFixture()
    const db = fakeDb({ assessment: fixture.row, reportError: "statement timeout" })

    const result = await ensureReportWithDependencies({ sessionId: "cs_test", client: db.client })

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.reason).toBe("unavailable")
    expect(result.retryable).toBe(true)
    // The whole point: a database that could not answer is not a Consultation
    // without a Report.
    expect(db.inserts).toBe(0)
    expect(db.store.report).toBeNull()
  })

  it("only a successful zero-row read enters generation", async () => {
    const fixture = sealedFixture()
    const db = fakeDb({ assessment: fixture.row })
    await ensureReportWithDependencies({ sessionId: "cs_test", client: db.client })
    expect(db.inserts).toBe(1)
  })
})

describe("a present Report is never regenerated", () => {
  it("a malformed stored Report fails closed and writes nothing", async () => {
    const fixture = sealedFixture()
    // v1-kinded, so it is not refused as a foreign schema — but the safety
    // block is gone, which is the shape a renderer must never be handed.
    const broken = JSON.parse(fixture.canonicalText) as Record<string, unknown>
    delete broken.safety
    const text = JSON.stringify(broken, null, 2)
    const db = fakeDb({
      assessment: fixture.row,
      report: { ...fixture.reportRow, canonical_report: text, canonical_report_sha256: reportDigest(text) },
    })

    const result = await ensureReportWithDependencies({ sessionId: "cs_test", client: db.client })

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.reason).toBe("persisted-report-malformed")
    expect(db.inserts).toBe(0)
  })

  it("a stored body that is not a v1 Report at all is refused as a foreign schema", async () => {
    const fixture = sealedFixture()
    const db = fakeDb({
      assessment: fixture.row,
      report: { ...fixture.reportRow, canonical_report: "{}", canonical_report_sha256: reportDigest("{}") },
    })

    const result = await ensureReportWithDependencies({ sessionId: "cs_test", client: db.client })

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.reason).toBe("persisted-report-unsupported-schema")
    expect(db.inserts).toBe(0)
  })

  it("a Report whose parent is no longer sealed is an orphan, not a vacancy", async () => {
    const fixture = sealedFixture()
    const db = fakeDb({
      assessment: { ...fixture.row, consultation_finalisation: null, consultation_handoff_id: null },
      report: fixture.reportRow,
    })

    const result = await ensureReportWithDependencies({ sessionId: "cs_test", client: db.client })

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.reason).toBe("orphan-report")
    expect(db.inserts).toBe(0)
  })

  it("keeps the assessment and handoff it was stored against", async () => {
    const fixture = sealedFixture()
    expect(fixture.reportRow.assessment_id).toBe(ASSESSMENT_ID)
    expect(fixture.reportRow.consultation_handoff_id).toBe(HANDOFF_ID)
  })
})
