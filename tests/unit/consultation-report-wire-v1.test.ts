import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"

import { COMPOSER_VERSION, REPORT_SCHEMA_VERSION } from "@/lib/report/deterministic/report-types"
import { CONTENT_PACK_VERSION } from "@/lib/report/deterministic/content-pack"
import { REPORT_USE_RECORD_VERSION } from "@/lib/report/deterministic/permissions"
import { REPORT_V1_SUPPORTED_BANKS } from "@/lib/report/deterministic/report-bank"
import { reportCapabilities } from "@/lib/report/deterministic/capabilities"
import { SCIENCE_CONTRACT_VERSION } from "@/lib/consultation/science-contract"
import { CONSULTATION_FINALISATION_VERSION } from "@/lib/consultation/finalisation"
import { ADDON_KEYS } from "@/lib/addon-types"
import type { PersonalFoodSystemReportV1 } from "@/lib/report/deterministic/report-types"
import type { ConsultationFinalisation } from "@/lib/consultation/finalisation"

import {
  V1_KNOWN_PRODUCER_IDENTITIES,
  V1_QUESTION_AUTHORITY_BY_REPORT_USE_VERSION,
  V1_REPORT_SCHEMA_VERSION,
  V1_SOURCES_PER_PROPOSITION,
  v1QuestionAuthorityFor,
} from "@/lib/report/persisted/v1-wire"
import {
  V1_KNOWN_SCIENCE_CONTRACT_VERSIONS,
  V1_KNOWN_FINALISATION_VERSIONS,
  V1_PURCHASED_LENSES,
} from "@/lib/report/persisted/v1-consultation-wire"
import type {
  HistoricalConsultationFinalisationV1,
  PersistedReportV1,
} from "@/lib/report/persisted/types"

/**
 * The frozen wire contract, and the tripwires that keep it honest.
 *
 * ══ WHAT THESE TESTS ARE FOR ════════════════════════════════════════════════
 *
 * The persisted decoder must NOT consult the live registries — that is the
 * whole historical-authority rule. But "independent of the live values" and
 * "unrelated to reality" are different things, and the second would let a
 * decoder drift into accepting provenance no build ever emitted.
 *
 * So the frozen sets are asserted to describe the CURRENT build exactly. The
 * day a version is bumped, these fail — and the failure is the point: appending
 * a producer identity is a reviewed decision, not something a version bump
 * makes on somebody's behalf.
 */

/* ══ The compile-time bridges ══════════════════════════════════════════════ */

/*
 * Live → persisted must hold, so two structural definitions of one document
 * cannot drift. Persisted → live must NOT: that is the widening this phase
 * exists for, and asserting it would defeat the purpose. `tsc` checks both
 * lines on every build, and the gate runs `tsc`.
 *
 * They live here rather than in `lib/report/persisted/types.ts` because the
 * assertion needs the live types, and importing those into the persisted layer
 * is exactly what the historical boundary forbids.
 */
type LiveReportIsPersistable = PersonalFoodSystemReportV1 extends PersistedReportV1 ? true : never
type LiveFinalisationIsHistorical =
  ConsultationFinalisation extends HistoricalConsultationFinalisationV1 ? true : never

const REPORT_BRIDGE: LiveReportIsPersistable = true
const FINALISATION_BRIDGE: LiveFinalisationIsHistorical = true

describe("the live types are valid historical artifacts", () => {
  it("compiles, which is the assertion", () => {
    expect(REPORT_BRIDGE).toBe(true)
    expect(FINALISATION_BRIDGE).toBe(true)
  })
})

/* ══ Producer identity ═════════════════════════════════════════════════════ */

describe("the frozen producer identity describes this build", () => {
  const current = V1_KNOWN_PRODUCER_IDENTITIES[0]

  it("holds exactly one identity today", () => {
    expect(V1_KNOWN_PRODUCER_IDENTITIES).toHaveLength(1)
  })

  it("matches every live version constant", () => {
    expect(current.composerVersion).toBe(COMPOSER_VERSION)
    expect(current.scienceContractVersion).toBe(SCIENCE_CONTRACT_VERSION)
    expect(current.finalisationVersion).toBe(CONSULTATION_FINALISATION_VERSION)
    expect(current.reportUseRecordVersion).toBe(REPORT_USE_RECORD_VERSION)
    expect(current.contentPackVersion).toBe(CONTENT_PACK_VERSION)
    expect(V1_REPORT_SCHEMA_VERSION).toBe(REPORT_SCHEMA_VERSION)
  })

  it("matches the live supported bank identity, version and fingerprint together", () => {
    expect(REPORT_V1_SUPPORTED_BANKS).toHaveLength(1)
    expect(current.bankVersion).toBe(REPORT_V1_SUPPORTED_BANKS[0].version)
    expect(current.bankFingerprint).toBe(REPORT_V1_SUPPORTED_BANKS[0].fingerprint)
    expect(current.bankFingerprint).toBe("591ceb245296dab2d70dfb0420e0163a")
  })

  it("matches the live capability state, which is all three gates OPEN", () => {
    expect(current.capabilitiesAtCompose).toEqual(reportCapabilities())
    expect(current.capabilitiesAtCompose).toEqual({
      specificFoods: false,
      bioticsLanguage: false,
      safetyNetting: false,
    })
  })

  it("renders no lens, because composer-v2 refuses every one", () => {
    expect(current.supportedEntitledLenses).toEqual([null])
    for (const lens of ADDON_KEYS) {
      expect(current.supportedEntitledLenses).not.toContain(lens)
    }
  })
})

/* ══ Consultation-v1 vocabularies ══════════════════════════════════════════ */

describe("the frozen Consultation vocabularies describe this build", () => {
  it("knows today's science-contract and finalisation versions", () => {
    expect(V1_KNOWN_SCIENCE_CONTRACT_VERSIONS).toContain(SCIENCE_CONTRACT_VERSION)
    expect(V1_KNOWN_FINALISATION_VERSIONS).toContain(CONSULTATION_FINALISATION_VERSION)
  })

  it("holds null plus every current add-on, and nothing else", () => {
    expect([...V1_PURCHASED_LENSES]).toEqual([null, ...ADDON_KEYS])
  })
})

/* ══ Question authority ════════════════════════════════════════════════════ */

describe("the versioned question authority", () => {
  const map = v1QuestionAuthorityFor("report-use-v1")!

  it("is keyed by report-use record version, not timeless", () => {
    expect(Object.keys(V1_QUESTION_AUTHORITY_BY_REPORT_USE_VERSION)).toEqual(["report-use-v1"])
    expect(v1QuestionAuthorityFor("report-use-v2")).toBeUndefined()
  })

  it("covers all 21 v1 questions", () => {
    expect(Object.keys(map)).toHaveLength(21)
  })

  it("agrees with the live permission registry, record for record", () => {
    /*
     * Read out of the live registry's SOURCE rather than imported, because
     * importing the records would make this test pass by construction — it
     * would be comparing the frozen map with itself through another name.
     */
    const source = readFileSync(join(process.cwd(), "lib/report/deterministic/permissions.ts"), "utf8")
    for (const [questionId, authority] of Object.entries(map)) {
      expect(source, `${questionId} answerField`).toContain(`"${authority.answerField}"`)
      if (authority.basisKind === "product-operational") {
        // The exact reviewed prose the Report carries. A live edit without a
        // report-use-v2 bump fails here, which is the intended behaviour.
        expect(source, `${questionId} rationale`).toContain(authority.rationale)
      }
    }
  })

  it("splits six adjudicated questions from fifteen product-operational ones", () => {
    const kinds = Object.values(map).map((a) => a.basisKind)
    expect(kinds.filter((k) => k === "science-adjudicated")).toHaveLength(6)
    expect(kinds.filter((k) => k === "product-operational")).toHaveLength(15)
  })

  it("gives every adjudicated record its own question id and contract version", () => {
    for (const [questionId, authority] of Object.entries(map)) {
      if (authority.basisKind !== "science-adjudicated") continue
      expect(authority.basisQuestionId).toBe(questionId)
      expect(authority.contractVersion).toBe(SCIENCE_CONTRACT_VERSION)
    }
  })

  it("gives every product-operational record the product approval and a rationale", () => {
    for (const authority of Object.values(map)) {
      if (authority.basisKind !== "product-operational") continue
      expect(authority.approvedBy).toBe("product")
      expect(authority.recordVersion).toBe(REPORT_USE_RECORD_VERSION)
      expect(authority.rationale.length).toBeGreaterThan(20)
    }
  })
})

describe("this producer is single-source", () => {
  it("expects exactly one source per proposition", () => {
    expect(V1_SOURCES_PER_PROPOSITION).toBe(1)
  })
})
