import { legacyQuestion, pinOf } from "./legacy-pin"
import { ASSESSMENT_VERSION, QUESTION_SET_V1, QUESTION_SET_VERSION } from "./v1"
import type { ManifestEntry, ResolvedQuestion, ResolvedQuestionSet } from "./types"

/**
 * Thrown when the manifest cannot be resolved into the instrument it names.
 *
 * A distinct class rather than a bare Error because the ONE behaviour that
 * matters here is that this is never swallowed. A caller that catches it and
 * carries on with a partial set has reintroduced exactly the failure mode
 * questions-v1.0 exists to prevent: an instrument quietly becoming a
 * different instrument under the same version number.
 */
export class QuestionSetResolutionError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "QuestionSetResolutionError"
  }
}

function resolveEntry(entry: ManifestEntry, order: number): ResolvedQuestion {
  if (entry.kind === "owned") {
    return {
      id: entry.id,
      order,
      part: entry.part,
      sectionTitle: entry.sectionTitle,
      text: entry.text,
      options: entry.options,
      contributes: entry.contributes,
      domain: entry.domain,
      origin: "candidate-v1",
      status: entry.status,
    }
  }

  const legacy = legacyQuestion(entry.id)
  if (!legacy) {
    throw new QuestionSetResolutionError(
      `${QUESTION_SET_VERSION} references legacy question "${entry.id}", which no longer exists. ` +
        `Resolution fails rather than producing a shorter instrument under the same version.`,
    )
  }

  const actual = pinOf(legacy)
  if (actual !== entry.pin) {
    throw new QuestionSetResolutionError(
      `${QUESTION_SET_VERSION} pins legacy question "${entry.id}" at ${entry.pin.slice(0, 12)}…, ` +
        `but it now hashes to ${actual.slice(0, 12)}…. The question this version was defined against ` +
        `has changed. This is a methodology change: decide whether assessment-v1.0 should ask the new ` +
        `wording — and if so issue a new version — rather than repinning to make this pass.`,
    )
  }

  return {
    id: legacy.id,
    order,
    part: entry.part,
    sectionTitle: entry.sectionTitle,
    text: legacy.text,
    options: legacy.options.map((o) => ({
      // The legacy `value` is a plain `number` with the 0–3 constraint held by
      // the freeze test rather than by the type. The assertion is safe because
      // the pin above has already established these options byte for byte.
      value: o.value as 0 | 1 | 2 | 3,
      label: o.label,
      description: o.description,
    })),
    contributes: entry.contributes,
    domain: entry.domain,
    origin: "legacy-frozen",
  }
}

/**
 * The manifest, resolved into one complete immutable instrument.
 *
 * Throws on: a missing legacy id, a pin that no longer matches, a duplicate
 * id, a scored item with no domain, or an unscored item that claims one. All
 * five are the same kind of failure — the manifest describes an instrument
 * that is not the one that would be produced — and none of them is recoverable
 * by carrying on.
 */
export function resolveQuestionSetV1(
  /*
   * The manifest is a PARAMETER so the refusal paths are reachable from a
   * test. That is not a testing convenience bolted on — it is the difference
   * between a guard and a claim.
   *
   * Sabotage case 1020 disabled the pin comparison outright (`if (false)`) and
   * NOTHING failed, because every pin currently matches: a check that is only
   * exercised by data that satisfies it is not exercised at all. The suite
   * proved the pins were correct and proved nothing about the code that
   * enforces them.
   *
   * With the manifest injectable, a test can hand this a deliberately wrong
   * pin, a missing id, a duplicate and a mislabelled item, and assert that each
   * throws. Defaults to the real manifest, so every caller is unchanged.
   */
  manifest: readonly ManifestEntry[] = QUESTION_SET_V1,
): ResolvedQuestionSet {
  const questions = manifest.map((entry, i) => resolveEntry(entry, i + 1))

  const seen = new Set<string>()
  for (const q of questions) {
    if (seen.has(q.id)) {
      throw new QuestionSetResolutionError(
        `${QUESTION_SET_VERSION} lists "${q.id}" more than once. An item asked twice is scored twice.`,
      )
    }
    seen.add(q.id)

    if (q.contributes === "fss" && !q.domain) {
      throw new QuestionSetResolutionError(
        `"${q.id}" contributes to the Score but names no domain. A scored item with no domain cannot be weighted.`,
      )
    }
    if (q.contributes !== "fss" && q.domain) {
      throw new QuestionSetResolutionError(
        `"${q.id}" is ${q.contributes} but names domain "${q.domain}". ` +
          `What You Notice and Your Food Context reach the Score by no path, and a domain on an unscored ` +
          `item is how that stops being true.`,
      )
    }
  }

  return {
    questionSetVersion: QUESTION_SET_VERSION,
    assessmentVersion: ASSESSMENT_VERSION,
    questions,
  }
}

/** The scored items only — what the engine is allowed to see. */
export function scoredQuestions(set: ResolvedQuestionSet): readonly ResolvedQuestion[] {
  return set.questions.filter((q) => q.contributes === "fss")
}
