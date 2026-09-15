import { describe, it, expect, vi, afterEach } from "vitest"

import { ensureReportWithDependencies } from "@/lib/report/persisted/testing/report-seam"
import { reportDigest } from "@/lib/report/persisted/digest"
import { decodePersistedReportV1 } from "@/lib/report/persisted/decode-report"
import {
  decodeHistoricalFinalisationV1,
  decodeHistoricalSnapshotV1,
  decodeHistoricalStateV1,
  readHistoricalSealV1,
} from "@/lib/report/persisted/decode-consultation"
import { readConsultationFinalisation } from "@/lib/consultation/finalisation"
import { readConsultationSeal } from "@/lib/consultation/seal"
import { readDeterministicConsultationSnapshot } from "@/lib/consultation/session-envelope"

import { fakeDb, sealedFixture, unsealedFixture } from "./consultation-report-fixtures"

/**
 * A persisted Report is read as itself — Phase 4A-S4.
 *
 * ══ THE RULE BEING PROVEN ═══════════════════════════════════════════════════
 *
 * A Report that has already been written stays readable when the live world
 * moves on: a re-adjudicated Science Contract, a revised add-on vocabulary, a
 * bank that has been retired, a newer composer. None of those is a fact about
 * the artifact, and a reader that consulted them would make a customer's paid
 * Report vanish on a day nothing happened to them.
 *
 * The tests below move the live world and then read the Report anyway. They are
 * only meaningful because the historical path imports none of it — the source
 * guard in `consultation-report-authority.test.ts` is what makes that true, and
 * these are what make it matter.
 */

afterEach(() => {
  vi.restoreAllMocks()
  vi.resetModules()
})

/* ══ Moving the live world ═════════════════════════════════════════════════ */

describe("an existing Report survives the live world moving", () => {
  it("reads when the live Science Contract has been re-adjudicated", async () => {
    const fixture = sealedFixture()
    const db = fakeDb({ assessment: fixture.row, report: fixture.reportRow })

    const science = await import("@/lib/consultation/science-contract")
    vi.spyOn(science, "SCIENCE_CONTRACT_VERSION", "get").mockReturnValue(
      "science-contract-v1.1" as never,
    )

    /*
     * Not vacuous: the LIVE reader now refuses this very payload. If the stub
     * did not bite, this assertion fails and the test below would be proving
     * nothing at all.
     */
    const live = readConsultationFinalisation(fixture.row.consultation_finalisation)
    expect(live.ok).toBe(false)
    if (!live.ok) expect(live.reason).toBe("unsupported-version")

    const result = await ensureReportWithDependencies({ sessionId: "cs_test", client: db.client })
    expect(result.ok, result.ok ? "" : `${result.reason}: ${result.detail}`).toBe(true)
    if (result.ok) expect(result.outcome).toBe("existing")
  })

  it("reads when the live add-on vocabulary would reject its lens value", async () => {
    const fixture = sealedFixture()
    const db = fakeDb({ assessment: fixture.row, report: fixture.reportRow })

    const addons = await import("@/lib/addon-types")
    vi.spyOn(addons, "asAddonType").mockReturnValue(null)
    vi.spyOn(addons, "isAddon").mockReturnValue(false)

    /*
     * Not vacuous, and narrower than it first looked. Stubbing the namespace
     * export changes what THIS module sees; it does not reach the binding
     * `session-envelope` captured at import time, so the live reader is not a
     * usable control here — an earlier draft asserted it was and this caught
     * it. What is proved instead is the thing that actually matters: the frozen
     * vocabulary answers for itself, with no live registry involved.
     */
    expect(addons.asAddonType("glucose")).toBeNull()
    expect(
      decodeHistoricalSnapshotV1({
        ...(fixture.row.questions as Record<string, unknown>),
        entitledLens: "glucose",
      }).ok,
    ).toBe(true)

    const result = await ensureReportWithDependencies({ sessionId: "cs_test", client: db.client })
    expect(result.ok).toBe(true)
  })

  it("reads when the live composer version has moved on", async () => {
    const fixture = sealedFixture()
    const db = fakeDb({ assessment: fixture.row, report: fixture.reportRow })

    const types = await import("@/lib/report/deterministic/report-types")
    vi.spyOn(types, "COMPOSER_VERSION", "get").mockReturnValue("composer-v3" as never)
    // Not vacuous: the live constant really has moved.
    expect(types.COMPOSER_VERSION).toBe("composer-v3")

    const result = await ensureReportWithDependencies({ sessionId: "cs_test", client: db.client })
    expect(result.ok).toBe(true)
  })

  it("reads when the live bank support list has been emptied", async () => {
    const fixture = sealedFixture()
    const db = fakeDb({ assessment: fixture.row, report: fixture.reportRow })

    const bank = await import("@/lib/report/deterministic/report-bank")
    vi.spyOn(bank, "reportBankSupport").mockReturnValue({
      ok: false,
      reason: "bank-unsupported",
      detail: "stubbed away",
    })

    const result = await ensureReportWithDependencies({ sessionId: "cs_test", client: db.client })
    expect(result.ok).toBe(true)
  })

  it("does not call the live composer to serve an existing Report", async () => {
    const fixture = sealedFixture()
    const db = fakeDb({ assessment: fixture.row, report: fixture.reportRow })

    const compose = await import("@/lib/report/deterministic/compose")
    const spy = vi.spyOn(compose, "composePersonalFoodSystemReport")

    const result = await ensureReportWithDependencies({ sessionId: "cs_test", client: db.client })
    expect(result.ok).toBe(true)
    expect(spy).not.toHaveBeenCalled()
  })
})

/* ══ The frozen decoders agree with the live readers, today ════════════════ */

describe("the frozen decoders and the live readers agree today", () => {
  const fixture = sealedFixture()

  it("on a valid snapshot", () => {
    const frozen = decodeHistoricalSnapshotV1(fixture.row.questions)
    const live = readDeterministicConsultationSnapshot(fixture.row.questions)
    expect(frozen.ok).toBe(true)
    expect(live).not.toBeNull()
    if (frozen.ok && live) {
      expect(frozen.snapshot.foundation).toBe(live.foundation)
      expect(frozen.snapshot.entitledLens).toBe(live.entitledLens)
      expect(frozen.snapshot.bankVersion).toBe(live.bankVersion)
      expect(frozen.snapshot.bankFingerprint).toBe(live.bankFingerprint)
    }
  })

  it("on the seal, across a matrix of row shapes", () => {
    const state = decodeHistoricalStateV1(fixture.row.answers)
    expect(state.ok).toBe(true)
    if (!state.ok) return

    const cases: { row: Record<string, unknown>; phase: string; cursor: string | null }[] = [
      { row: { consultation_finalisation: {}, consultation_handoff_id: "h" }, phase: "ready-for-report", cursor: null },
      { row: { consultation_finalisation: null, consultation_handoff_id: null }, phase: "review", cursor: null },
      { row: { consultation_finalisation: {}, consultation_handoff_id: null }, phase: "ready-for-report", cursor: null },
      { row: { consultation_finalisation: null, consultation_handoff_id: "h" }, phase: "review", cursor: null },
      { row: { consultation_finalisation: {}, consultation_handoff_id: 7 }, phase: "ready-for-report", cursor: null },
      { row: { consultation_finalisation: {}, consultation_handoff_id: "h" }, phase: "ready-for-report", cursor: "q1" },
      { row: { consultation_finalisation: {}, consultation_handoff_id: "h" }, phase: "review", cursor: null },
      { row: { consultation_finalisation: null, consultation_handoff_id: null }, phase: "ready-for-report", cursor: null },
    ]

    for (const c of cases) {
      const frozen = readHistoricalSealV1(c.row, { phase: c.phase, currentQuestionId: c.cursor })
      const live = readConsultationSeal(c.row, {
        phase: c.phase as "questions" | "review" | "ready-for-report",
        currentQuestionId: c.cursor,
      })
      expect(frozen.status, JSON.stringify(c)).toBe(live.status)
      if (frozen.status === "incoherent" && live.status === "incoherent") {
        expect(frozen.detail).toBe(live.detail)
      }
    }
  })
})

/* ══ The frozen finalisation decoder ═══════════════════════════════════════ */

describe("the historical finalisation decoder", () => {
  const fixture = sealedFixture()
  const snapshot = decodeHistoricalSnapshotV1(fixture.row.questions)
  const valid = snapshot.ok ? snapshot.snapshot : null

  it("reads a real sealed payload", () => {
    const result = decodeHistoricalFinalisationV1(fixture.row.consultation_finalisation, valid!)
    expect(result.ok).toBe(true)
  })

  it("refuses a future contract as unsupported, not malformed", () => {
    const payload = {
      ...(fixture.row.consultation_finalisation as Record<string, unknown>),
      scienceContractVersion: "science-contract-v2.0",
    }
    const result = decodeHistoricalFinalisationV1(payload, valid!)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toBe("unsupported-version")
  })

  it("refuses an extra key", () => {
    const payload = {
      ...(fixture.row.consultation_finalisation as Record<string, unknown>),
      handoffId: "smuggled",
    }
    const result = decodeHistoricalFinalisationV1(payload, valid!)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toBe("malformed")
  })

  it("refuses an unknown lens rather than narrowing it to null", () => {
    const payload = {
      ...(fixture.row.consultation_finalisation as Record<string, unknown>),
      entitledLens: "sleep",
    }
    const result = decodeHistoricalFinalisationV1(payload, valid!)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toBe("malformed")
  })

  it("refuses a payload describing another session", () => {
    const result = decodeHistoricalFinalisationV1(fixture.row.consultation_finalisation, {
      ...valid!,
      bankFingerprint: "0".repeat(32),
    })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toBe("identity-mismatch")
  })
})

/* ══ Integrity and binding ═════════════════════════════════════════════════ */

describe("storage integrity", () => {
  const fixture = sealedFixture()

  it("refuses a digest that does not describe the bytes", async () => {
    const db = fakeDb({
      assessment: fixture.row,
      report: { ...fixture.reportRow, canonical_report_sha256: "a".repeat(64) },
    })
    const result = await ensureReportWithDependencies({ sessionId: "cs", client: db.client })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toBe("digest-mismatch")
  })

  it("refuses text that is not the canonical form of its own content", async () => {
    // Same content, same digest, different bytes: keys reordered and reindented,
    // which is exactly what a jsonb round trip would have done.
    const reordered = JSON.stringify(JSON.parse(fixture.canonicalText))
    const db = fakeDb({
      assessment: fixture.row,
      report: {
        ...fixture.reportRow,
        canonical_report: reordered,
        canonical_report_sha256: reportDigest(reordered),
      },
    })
    const result = await ensureReportWithDependencies({ sessionId: "cs", client: db.client })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toBe("canonical-form-mismatch")
  })

  it("refuses a Report row that names another assessment", async () => {
    const db = fakeDb({
      assessment: fixture.row,
      report: { ...fixture.reportRow, assessment_id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb" },
    })
    const result = await ensureReportWithDependencies({ sessionId: "cs", client: db.client })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toBe("parent-mismatch")
  })

  it("refuses a Report row that names another handoff", async () => {
    const db = fakeDb({
      assessment: fixture.row,
      report: { ...fixture.reportRow, consultation_handoff_id: "22222222-2222-4222-8222-222222222222" },
    })
    const result = await ensureReportWithDependencies({ sessionId: "cs", client: db.client })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toBe("handoff-mismatch")
  })
})

describe("the Report must agree with the sealed Consultation", () => {
  const fixture = sealedFixture()

  const withProvenance = (patch: Record<string, unknown>) => {
    const doc = JSON.parse(fixture.canonicalText) as Record<string, unknown>
    doc.provenance = { ...(doc.provenance as Record<string, unknown>), ...patch }
    const text = JSON.stringify(doc, null, 2)
    return { canonical_report: text, canonical_report_sha256: reportDigest(text) }
  }

  const cases: [string, Record<string, unknown>][] = [
    ["bankVersion", { bankVersion: "consultation-v0" }],
    ["bankFingerprint", { bankFingerprint: "b".repeat(32) }],
    ["scienceContractVersion", { scienceContractVersion: "science-contract-v1.0-old" }],
    ["finalisationVersion", { finalisationVersion: "consultation-finalisation-v0" }],
    ["finalisedAt", { finalisedAt: "2020-01-01T00:00:00.000Z" }],
    ["handoffId", { handoffId: "33333333-3333-4333-8333-333333333333" }],
  ]

  for (const [field, patch] of cases) {
    it(`refuses a Report whose ${field} disagrees`, async () => {
      const db = fakeDb({
        assessment: fixture.row,
        report: { ...fixture.reportRow, ...withProvenance(patch) },
      })
      const result = await ensureReportWithDependencies({ sessionId: "cs", client: db.client })
      expect(result.ok).toBe(false)
      if (result.ok) return
      // A provenance edit may fail as an unknown producer or as a binding
      // mismatch; both refuse, and neither regenerates.
      expect(["report-finalisation-mismatch", "producer-identity-unknown"]).toContain(result.reason)
      expect(db.inserts).toBe(0)
    })
  }

  it("refuses a Report whose foundation disagrees", async () => {
    const doc = JSON.parse(fixture.canonicalText) as Record<string, unknown>
    doc.foundation = "family"
    const text = JSON.stringify(doc, null, 2)
    const db = fakeDb({
      assessment: fixture.row,
      report: { ...fixture.reportRow, canonical_report: text, canonical_report_sha256: reportDigest(text) },
    })
    const result = await ensureReportWithDependencies({ sessionId: "cs", client: db.client })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toBe("report-finalisation-mismatch")
  })
})

/* ══ The producer entitlement ══════════════════════════════════════════════ */

describe("a composer-v2 Report cannot belong to a lens Consultation", () => {
  it("refuses the pairing rather than serving it", async () => {
    const core = sealedFixture()
    const lensSeal = sealedFixture({ lens: "mind" })
    // A core Report stored against a lens-sealed Consultation. Every other
    // check passes; the producer simply never supported that entitlement.
    const db = fakeDb({
      assessment: lensSeal.row,
      report: {
        consultation_handoff_id: lensSeal.row.consultation_handoff_id,
        assessment_id: lensSeal.row.id,
        canonical_report: core.canonicalText,
        canonical_report_sha256: core.digest,
      },
    })
    const result = await ensureReportWithDependencies({ sessionId: "cs", client: db.client })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toBe("producer-lens-unsupported")
  })
})

/* ══ First generation may refuse what the historical path still reads ══════ */

describe("first generation is allowed to be pickier than a read", () => {
  it("refuses a seal whose contract this build does not implement", async () => {
    const fixture = sealedFixture()
    const stale = {
      ...(fixture.row.consultation_finalisation as Record<string, unknown>),
      finalisationVersion: "consultation-finalisation-v0",
    }
    const db = fakeDb({ assessment: { ...fixture.row, consultation_finalisation: stale } })

    const result = await ensureReportWithDependencies({ sessionId: "cs", client: db.client })

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.reason).toBe("generation-version-unsupported")
    expect(db.inserts).toBe(0)
  })

  it("never seals an unsealed Consultation", async () => {
    const db = fakeDb({ assessment: unsealedFixture() })
    const before = JSON.stringify(db.client)
    const result = await ensureReportWithDependencies({ sessionId: "cs", client: db.client })
    expect(result.ok).toBe(false)
    expect(JSON.stringify(db.client)).toBe(before)
    expect(db.store.report).toBeNull()
  })
})

/* ══ The decoder, directly ═════════════════════════════════════════════════ */

describe("the persisted decoder refuses what this producer never emitted", () => {
  const fixture = sealedFixture()
  const doc = () => JSON.parse(fixture.canonicalText) as Record<string, unknown>

  it("accepts the real thing", () => {
    expect(decodePersistedReportV1(doc()).ok).toBe(true)
  })

  it("refuses a second proposition in priorityLever", () => {
    const d = doc()
    const lever = d.priorityLever as { propositions: unknown[] }
    lever.propositions = [lever.propositions[0], lever.propositions[0]]
    const result = decodePersistedReportV1(d)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toBe("cardinality-invalid")
  })

  it("refuses a three-step loop", () => {
    const d = doc()
    d.thirtyDayLoop = (d.thirtyDayLoop as unknown[]).slice(0, 3)
    const result = decodePersistedReportV1(d)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toBe("cardinality-invalid")
  })

  it("accepts an absent loop", () => {
    const d = doc()
    d.thirtyDayLoop = []
    expect(decodePersistedReportV1(d).ok).toBe(true)
  })

  it("refuses loop weeks out of order", () => {
    const d = doc()
    const loop = d.thirtyDayLoop as { week: number }[]
    ;[loop[2].week, loop[3].week] = [loop[3].week, loop[2].week]
    const result = decodePersistedReportV1(d)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toBe("cardinality-invalid")
  })

  it("refuses a recap sitting where the lever goes", () => {
    const d = doc()
    const lever = d.priorityLever as { propositions: Record<string, unknown>[] }
    lever.propositions[0].kind = "recap"
    const result = decodePersistedReportV1(d)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toBe("role-invalid")
  })

  it("refuses a section proposition retargeted to another valid target", () => {
    const d = doc()
    const snapshot = d.systemSnapshot as { propositions: Record<string, unknown>[] }
    snapshot.propositions[0].target = "thirtyDayLoop"
    const result = decodePersistedReportV1(d)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toBe("role-invalid")
  })

  it("refuses familyContext on a personal Report", () => {
    const d = doc()
    d.familyContext = { title: "Household", propositions: [] }
    const result = decodePersistedReportV1(d)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toBe("role-invalid")
  })

  it("refuses more than one source", () => {
    const d = doc()
    const snapshot = d.systemSnapshot as { propositions: Record<string, unknown>[] }
    const p = snapshot.propositions[0]
    const sources = p.sources as unknown[]
    p.sources = [sources[0], sources[0]]
    p.sourceQuestionIds = [...(p.sourceQuestionIds as string[]), (p.sourceQuestionIds as string[])[0]]
    p.sourceFields = [...(p.sourceFields as string[]), (p.sourceFields as string[])[0]]
    const result = decodePersistedReportV1(d)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toBe("cardinality-invalid")
  })

  it("refuses sourceQuestionIds that disagree with sources", () => {
    const d = doc()
    const snapshot = d.systemSnapshot as { propositions: Record<string, unknown>[] }
    snapshot.propositions[0].sourceQuestionIds = ["core_intentions_barrier_v1"]
    const result = decodePersistedReportV1(d)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toBe("provenance-incoherent")
  })

  it("refuses a sourceField that is not the question's own", () => {
    const d = doc()
    const snapshot = d.systemSnapshot as { propositions: Record<string, unknown>[] }
    snapshot.propositions[0].sourceFields = ["intentions.primaryFocus"]
    const result = decodePersistedReportV1(d)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toBe("provenance-incoherent")
  })

  it("refuses an unknown source question", () => {
    const d = doc()
    const snapshot = d.systemSnapshot as { propositions: Record<string, unknown>[] }
    const p = snapshot.propositions[0]
    p.sources = [{ questionId: "core_invented_v1", value: "x" }]
    p.sourceQuestionIds = ["core_invented_v1"]
    const result = decodePersistedReportV1(d)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toBe("unknown-source-question")
  })

  it("refuses a product-operational question relabelled as adjudicated", () => {
    const d = doc()
    const snapshot = d.systemSnapshot as { propositions: Record<string, unknown>[] }
    const p = snapshot.propositions.find(
      (x) => (x.basis as { kind: string }).kind === "product-operational",
    )!
    p.basis = {
      kind: "science-adjudicated",
      contractVersion: "science-contract-v1.0",
      questionId: (p.sources as { questionId: string }[])[0].questionId,
    }
    const result = decodePersistedReportV1(d)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toBe("question-authority-mismatch")
  })

  it("refuses an adjudicated question relabelled as product-operational", () => {
    const d = doc()
    const snapshot = d.systemSnapshot as { propositions: Record<string, unknown>[] }
    const p = snapshot.propositions.find(
      (x) => (x.basis as { kind: string }).kind === "science-adjudicated",
    )
    if (!p) return
    p.basis = {
      kind: "product-operational",
      recordVersion: "report-use-v1",
      approvedBy: "product",
      rationale: "Reclassified as logistics.",
    }
    const result = decodePersistedReportV1(d)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toBe("question-authority-mismatch")
  })

  it("refuses an edited reviewed rationale", () => {
    const d = doc()
    const snapshot = d.systemSnapshot as { propositions: Record<string, unknown>[] }
    const p = snapshot.propositions.find(
      (x) => (x.basis as { kind: string }).kind === "product-operational",
    )!
    const basis = p.basis as { rationale: string }
    basis.rationale = `${basis.rationale} And a sentence nobody reviewed.`
    const result = decodePersistedReportV1(d)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toBe("question-authority-mismatch")
  })

  it("refuses an adjudication-only use under a product-operational basis", () => {
    const d = doc()
    const snapshot = d.systemSnapshot as { propositions: Record<string, unknown>[] }
    const p = snapshot.propositions.find(
      (x) => (x.basis as { kind: string }).kind === "product-operational",
    )!
    p.allowedUse = "low-risk-self-observation"
    const result = decodePersistedReportV1(d)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toBe("question-authority-mismatch")
  })

  it("refuses a document with nothing in either opening section", () => {
    const d = doc()
    ;(d.systemSnapshot as { propositions: unknown[] }).propositions = []
    ;(d.priorityLever as { propositions: unknown[] }).propositions = []
    const result = decodePersistedReportV1(d)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toBe("cardinality-invalid")
  })

  it("accepts an empty systemSnapshot when the lever carries the document", () => {
    const d = doc()
    ;(d.systemSnapshot as { propositions: unknown[] }).propositions = []
    expect(decodePersistedReportV1(d).ok).toBe(true)
  })

  it("refuses an unknown producer identity", () => {
    const d = doc()
    ;(d.provenance as Record<string, unknown>).contentPackVersion = "content-pack-v2"
    const result = decodePersistedReportV1(d)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toBe("producer-identity-unknown")
  })

  it("refuses a capability flag that disagrees with the producer", () => {
    const d = doc()
    const prov = d.provenance as { capabilitiesAtCompose: Record<string, boolean> }
    prov.capabilitiesAtCompose.specificFoods = true
    const result = decodePersistedReportV1(d)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toBe("producer-identity-unknown")
  })

  it("refuses a kind that disagrees with its own provenance", () => {
    const d = doc()
    d.kind = "personal-food-system-report-v2"
    const result = decodePersistedReportV1(d)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toBe("unsupported-schema")
  })
})
