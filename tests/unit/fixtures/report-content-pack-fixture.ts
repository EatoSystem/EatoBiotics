import {
  registerTestContentPack,
  type ContentDisposition,
  type ContentPack,
} from "@/lib/report/deterministic/content-pack"

/**
 * A synthetic reviewed pack, for the two gates production has no words for.
 *
 * ══ WHY THIS EXISTS ═════════════════════════════════════════════════════════
 *
 * Three capabilities are gated; only `specificFoods` has templates in the
 * production pack, because the pack deliberately contains no Biotics-language
 * and no safety-netting wording — those gates are exactly what has not been
 * approved, and authoring the copy early to make a test convenient would be
 * writing the sentence the gate exists to hold back.
 *
 * So the capability metadata is proven on synthetic templates instead, and
 * proven through the REAL path: this pack implements the same `ContentPack`
 * contract the production pack does, and `buildProposition` resolves it with
 * the same code. What the tests demonstrate is not that these words are safe —
 * they are nonsense — but that selecting an authoritative reviewed template
 * carries its capability requirements automatically, and that no caller can
 * omit, replace or weaken them.
 *
 * ══ WHY IT CANNOT LEAK ══════════════════════════════════════════════════════
 *
 * Its id is `test:`-prefixed, which `registerTestContentPack` enforces and a
 * guard in report-content-pack.test.ts asserts no shipped module calls. It is
 * never the default pack — a caller must name it. And its question ids carry
 * no permission record, so `buildProposition` refuses them with
 * `no-permission-record` before it ever reaches content resolution, in any
 * path that has not also been given a real question id.
 */

export const FIXTURE_PACK_ID = "test:report-capability-fixture-v1"

/** Real permission records, so construction gets as far as the content. */
export const FIXTURE_UNGATED_TARGET = "thirtyDayLoop" as const
export const FIXTURE_QUESTION = "core_rhythm_longest_gap_v1"

/** Values keyed to the capability each one exercises. */
export const FIXTURE_VALUES = {
  biotics: "fixture-biotics",
  safety: "fixture-safety",
  ungated: "fixture-ungated",
  silent: "fixture-silent",
} as const

const ENTRIES: Readonly<Record<string, ContentDisposition>> = {
  [FIXTURE_VALUES.biotics]: {
    templateId: "fixture.biotics",
    text: "You told us about the shape of your day.",
    requiresCapabilities: ["bioticsLanguage"],
  },
  [FIXTURE_VALUES.safety]: {
    templateId: "fixture.safety",
    text: "You told us about the gaps between your meals.",
    requiresCapabilities: ["safetyNetting"],
  },
  [FIXTURE_VALUES.ungated]: {
    templateId: "fixture.ungated",
    text: "You told us when you usually eat.",
  },
  [FIXTURE_VALUES.silent]: null,
}

export const FIXTURE_PACK: ContentPack = {
  id: FIXTURE_PACK_ID,
  version: FIXTURE_PACK_ID,
  resolve(questionId, value) {
    if (questionId !== FIXTURE_QUESTION) return undefined
    return value in ENTRIES ? ENTRIES[value] : undefined
  },
}

let registered = false

/** Idempotent: several test files may import this fixture in one process. */
export function useFixtureContentPack(): string {
  if (!registered) {
    registerTestContentPack(FIXTURE_PACK)
    registered = true
  }
  return FIXTURE_PACK_ID
}
