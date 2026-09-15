import { describe, it, expect, vi, beforeEach, afterAll } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"

import type { PersonalFoodSystemReportV1 } from "@/lib/report/deterministic/report-types"
import { ensureReportWithDependencies } from "@/lib/report/persisted/testing/report-seam"

import { fakeDb, sealedFixture } from "./consultation-report-fixtures"

/**
 * Nothing unreadable reaches the immutable table — Phase 4A-S4, repair 1.
 *
 * ══ THE DEFECT THIS FILE EXISTS FOR ═════════════════════════════════════════
 *
 * The first-generation path used to decode its composed Report and compare the
 * handoff — most of the check, and therefore the dangerous amount. A future
 * producer regression could satisfy that and still emit a document the
 * historical reader refuses: a bankVersion disagreeing with the seal, a
 * capability flag no producer identity claims, a lens this producer cannot
 * render. The row would be INSERTed into a table with no UPDATE and no DELETE,
 * and the post-insert re-read would then report a customer's immutable Report
 * as unreadable. There is no recovery from that; there is only not doing it.
 *
 * ══ WHY THE COMPOSER IS MOCKED, AND WHY THAT IS NOT CHEATING ════════════════
 *
 * Every mismatch below is, by construction, unreachable today: one seal feeds
 * both the composer and the frozen decoder, so they cannot disagree about a
 * bank version unless the producer itself regresses. That regression is exactly
 * the hazard, so it is what the test simulates. The mock delegates to the REAL
 * composer and then perturbs one field of its output — the rest of the path,
 * including the function under test, is the production one.
 *
 * Each case asserts two things: the refusal, and `inserts === 0`. The second is
 * the one that matters.
 */

const holder = vi.hoisted(() => ({
  tamper: null as null | ((report: PersonalFoodSystemReportV1) => PersonalFoodSystemReportV1),
  forceOk: false,
}))

vi.mock("@/lib/report/deterministic/compose", async (importActual) => {
  const actual = await importActual<typeof import("@/lib/report/deterministic/compose")>()
  return {
    ...actual,
    composePersonalFoodSystemReport: (input: Parameters<typeof actual.composePersonalFoodSystemReport>[0]) => {
      const real = actual.composePersonalFoodSystemReport(input)
      if (real.ok) {
        return holder.tamper ? { ok: true as const, report: holder.tamper(real.report) } : real
      }
      // `forceOk` stands in for a producer that stopped refusing something it
      // refuses today — the lens case below is the only user of it.
      if (holder.forceOk && holder.tamper) {
        return { ok: true as const, report: holder.tamper({} as PersonalFoodSystemReportV1) }
      }
      return real
    },
  }
})

/*
 * The imports above sit at the top of the file and still see the mocked
 * composer: `vi.mock` is hoisted above every import by the transform. A
 * top-level `await import` would read more explicitly and does not compile
 * under this repository's module target.
 */

beforeEach(() => {
  holder.tamper = null
  holder.forceOk = false
})

afterAll(() => {
  vi.restoreAllMocks()
})

/** Perturb one provenance field of an otherwise real composed Report. */
const patchProvenance = (patch: Record<string, unknown>) => (report: PersonalFoodSystemReportV1) =>
  ({ ...report, provenance: { ...report.provenance, ...patch } }) as PersonalFoodSystemReportV1

async function attempt(tamper: (r: PersonalFoodSystemReportV1) => PersonalFoodSystemReportV1) {
  const fixture = sealedFixture()
  holder.tamper = tamper
  const db = fakeDb({ assessment: fixture.row })
  const result = await ensureReportWithDependencies({ sessionId: "cs_test", client: db.client })
  return { result, db }
}

describe("a Report that could not be read back is never written", () => {
  it("is not vacuous: the untampered Report is written", async () => {
    const fixture = sealedFixture()
    const db = fakeDb({ assessment: fixture.row })
    const result = await ensureReportWithDependencies({ sessionId: "cs_test", client: db.client })
    expect(result.ok, result.ok ? "" : `${result.reason}: ${result.detail}`).toBe(true)
    expect(db.inserts).toBe(1)
  })

  const provenanceCases: [string, Record<string, unknown>][] = [
    ["handoffId", { handoffId: "99999999-9999-4999-8999-999999999999" }],
    ["bankVersion", { bankVersion: "consultation-v0" }],
    ["bankFingerprint", { bankFingerprint: "f".repeat(32) }],
    ["scienceContractVersion", { scienceContractVersion: "science-contract-v0.9" }],
    ["finalisationVersion", { finalisationVersion: "consultation-finalisation-v0" }],
    ["finalisedAt", { finalisedAt: "2019-01-01T00:00:00.000Z" }],
  ]

  for (const [field, patch] of provenanceCases) {
    it(`refuses before the INSERT when ${field} disagrees with the seal`, async () => {
      const { result, db } = await attempt(patchProvenance(patch))

      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.reason).toBe("self-check-failed")
      // The assertion this file exists for.
      expect(db.inserts, "a Report that cannot be read back was written").toBe(0)
      expect(db.store.report).toBeNull()
    })
  }

  it("refuses before the INSERT when the foundation disagrees with the seal", async () => {
    const { result, db } = await attempt((report) => ({
      ...report,
      foundation: report.foundation === "you" ? "family" : "you",
    }))

    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toBe("self-check-failed")
    expect(db.inserts).toBe(0)
  })

  it("refuses before the INSERT when the producer identity is unknown", async () => {
    const { result, db } = await attempt(patchProvenance({ composerVersion: "composer-v3" }))

    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.detail).toContain("producer-identity-unknown")
    expect(db.inserts).toBe(0)
  })

  it("refuses before the INSERT when a capability flag no producer claims is set", async () => {
    const { result, db } = await attempt((report) => ({
      ...report,
      provenance: {
        ...report.provenance,
        capabilitiesAtCompose: { ...report.provenance.capabilitiesAtCompose, specificFoods: true },
      },
    }))

    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toBe("self-check-failed")
    expect(db.inserts).toBe(0)
  })

  it("refuses before the INSERT when a producer emits a Report for a lens seal", async () => {
    /*
     * `composer-v2` refuses every lens outright, so this is a producer that has
     * stopped refusing — the regression the producer tuple's
     * `supportedEntitledLenses` exists to catch. The composed bytes are a valid
     * core Report; what is wrong is the Consultation it claims to describe.
     */
    const core = sealedFixture()
    const lensSeal = sealedFixture({ lens: "mind" })
    holder.forceOk = true
    holder.tamper = () => JSON.parse(core.canonicalText) as PersonalFoodSystemReportV1

    const db = fakeDb({ assessment: lensSeal.row })
    const result = await ensureReportWithDependencies({ sessionId: "cs_test", client: db.client })

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.reason).toBe("self-check-failed")
      expect(result.detail).toContain("producer-lens-unsupported")
    }
    expect(db.inserts).toBe(0)
  })

  it("refuses before the INSERT when the document itself is malformed", async () => {
    const { result, db } = await attempt((report) => {
      const broken = { ...report } as Record<string, unknown>
      delete broken.safety
      return broken as unknown as PersonalFoodSystemReportV1
    })

    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toBe("self-check-failed")
    expect(db.inserts).toBe(0)
  })

  it("refuses before the INSERT when a section role is wrong", async () => {
    const { result, db } = await attempt((report) => ({
      ...report,
      systemSnapshot: {
        ...report.systemSnapshot,
        propositions: report.systemSnapshot.propositions.map((p, i) =>
          i === 0 ? { ...p, target: "thirtyDayLoop" as const } : p,
        ),
      },
    }))

    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.detail).toContain("role-invalid")
    expect(db.inserts).toBe(0)
  })
})

describe("the rehearsal is the same function every later read uses", () => {
  it("first generation calls readPersistedReport on a candidate row", () => {
    const source = readFileSync(
      join(process.cwd(), "lib/report/persisted/internal/first-generation.ts"),
      "utf8",
    )
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/^\s*\/\/.*$/gm, "")

    // Reused, not reimplemented: a copy of these checks would drift, and the
    // drift would be invisible until an immutable row had already been written.
    expect(source).toContain("readPersistedReport({ row, reportRow: candidate, seal: frozenSeal.context })")
    expect(source).toContain("const candidate: PersistedReportRow = {")
    for (const copied of ["bankFingerprint", "finalisedAt", "supportedEntitledLenses"]) {
      expect(source, `first-generation reimplements ${copied}`).not.toContain(copied)
    }
  })
})
