import type { ConsultationQuestion } from "./types"
import { CONSULTATION_QUESTION_BANK } from "./question-bank"

/**
 * Which bank a stored Consultation was answered against — Phase 3C-A.
 *
 * ══ WHY A VERSION AND A FINGERPRINT ═════════════════════════════════════════
 *
 * A stored deterministic session records answers by question id. Those ids are
 * stable and semantic, which is most of the problem solved — but not all of it.
 * Two failures remain, and they are the ones that corrupt a Report quietly
 * rather than loudly:
 *
 *   1. the bank gains a v2 and a stored v1 session is resolved against it, so
 *      a question the customer never saw appears "unanswered";
 *   2. the bank stays v1 but a question's WORDING or its option set changes, so
 *      an answer the customer gave to one question is read as an answer to a
 *      differently-worded one.
 *
 * The version catches the first. Only a content fingerprint catches the second,
 * because nothing about (2) changes an id.
 *
 * The legacy path has exactly this hole and documents it:
 * `lib/assessment/question-snapshot.ts` explains that regenerated core ids
 * reuse "dq1", "dq2", … with DIFFERENT text, so an answer saved against the old
 * "dq4" binds silently to the new one. It concluded no version handle was
 * needed because nothing re-derives that snapshot. The deterministic path is
 * the opposite: the bank IS re-derived on every read, so it needs both.
 *
 * ══ WHAT THE FINGERPRINT COVERS, AND WHAT IT DELIBERATELY DOES NOT ══════════
 *
 * Covered: everything that changes what the customer was asked, what they could
 * answer, or what an answer means downstream — id, answer field, section, type,
 * which foundations ask it, the customer-facing wording in both voices, the
 * option values and their labels and exclusivity, the required flag, selection
 * and length bounds, slider bounds, and the applicability rule.
 *
 * NOT covered: `intent`, `whyNeeded`, `deeperBecause`, `sensitivity`,
 * `scienceReview`, `reportTargets`, `freeAssessmentOverlap`. These govern how a
 * question was built and reviewed. Editing one does not change the question the
 * customer read or the meaning of their answer, and folding them in would
 * invalidate every in-flight session for a governance note — a cost with no
 * safety return. The Phase 3A guards already own those fields.
 *
 * Order-independent by construction: questions are sorted by id and every
 * object is emitted through an explicit field list, so a reordered bank or a
 * differently-shaped object literal produces the identical digest. Only a
 * genuine semantic change moves it.
 */

/** Registry key for the frozen v1 bank. */
export const CONSULTATION_BANK_V1 = "consultation-v1"

/** The bank a NEW session is opened against. */
export const CURRENT_CONSULTATION_BANK = CONSULTATION_BANK_V1

/**
 * The v1 bank, under its registry name.
 *
 * The same array as `CONSULTATION_QUESTION_BANK` — deliberately not a copy. Two
 * arrays would be two banks, and the one that got reviewed would not reliably
 * be the one a customer answered.
 */
export const CONSULTATION_QUESTION_BANK_V1: readonly ConsultationQuestion[] =
  CONSULTATION_QUESTION_BANK

export const CONSULTATION_BANKS: Readonly<Record<string, readonly ConsultationQuestion[]>> = {
  [CONSULTATION_BANK_V1]: CONSULTATION_QUESTION_BANK_V1,
}

export type ConsultationBankVersion = keyof typeof CONSULTATION_BANKS & string

/** Every registered version, for tests and review tooling. */
export const CONSULTATION_BANK_VERSIONS: readonly string[] = Object.keys(CONSULTATION_BANKS)

/**
 * The bank for a stored version, or `null`.
 *
 * `null` for an unknown version rather than a fallback to the current bank:
 * resolving a session against a bank it was not answered against is the exact
 * failure this module exists to prevent, and a silent fallback would make it
 * unobservable.
 */
export function resolveConsultationBank(
  version: unknown,
): readonly ConsultationQuestion[] | null {
  if (typeof version !== "string") return null
  return CONSULTATION_BANKS[version] ?? null
}

export function isKnownBankVersion(version: unknown): version is ConsultationBankVersion {
  return resolveConsultationBank(version) !== null
}

/* ══ Fingerprint ═══════════════════════════════════════════════════════════ */

/** The semantic projection of one question — the input to the digest. */
function semanticShape(q: ConsultationQuestion): unknown[] {
  return [
    q.id,
    q.answerField,
    q.section,
    q.type,
    [...q.foundations].sort(),
    q.text,
    q.familyText ?? null,
    q.supportText ?? null,
    q.familySupportText ?? null,
    // Option ORDER is meaningful — it is the order the customer read them in —
    // so options are NOT sorted.
    (q.options ?? []).map((o) => [o.value, o.label, o.familyLabel ?? null, o.exclusive === true]),
    q.required,
    q.minSelections ?? null,
    q.maxLength ?? null,
    q.min ?? null,
    q.max ?? null,
    q.minLabel ?? null,
    q.maxLabel ?? null,
    q.applicableWhen
      ? [q.applicableWhen.questionId, q.applicableWhen.operator, [...q.applicableWhen.values]]
      : null,
  ]
}

/**
 * One FNV-1a-style 32-bit lane.
 *
 * `Math.imul` because plain `*` on a 32-bit-scale product silently loses
 * precision above 2^53 and the hash would stop being reproducible. `>>> 0`
 * keeps every lane unsigned.
 *
 * BigInt would be the obvious alternative and is deliberately not used: this
 * repository targets ES6, where BigInt literals are not available, and raising
 * the target for a fingerprint would be a build-wide change in service of one
 * function.
 */
function fnv1aLane(input: string, offsetBasis: number, prime: number): number {
  let hash = offsetBasis >>> 0
  for (let i = 0; i < input.length; i += 1) {
    // Code UNITS, not code points: the pairing is arbitrary but fixed, which is
    // all a fingerprint needs, and it avoids a surrogate-handling branch.
    hash = (hash ^ input.charCodeAt(i)) >>> 0
    hash = Math.imul(hash, prime) >>> 0
  }
  return hash >>> 0
}

/** Four independent bases and primes — 128 bits of digest in total. */
const FINGERPRINT_LANES: readonly (readonly [number, number])[] = [
  [0x811c9dc5, 0x01000193],
  [0x0f4b6a17, 0x01000199],
  [0x7a3f91c5, 0x010001a7],
  [0x51ed270b, 0x010001b3],
]

/**
 * A stable digest of a bank's customer-facing and answer-bearing content.
 *
 * ══ WHY NOT `node:crypto` ═══════════════════════════════════════════════════
 *
 * `lib/consultation/` is a pure, inert leaf: `consultation-question-bank.test.ts`
 * fails the build if anything in it imports outside itself and
 * `@/lib/addon-types`. That rule is what lets the same modules run on the
 * server, in a browser bundle and in a Node test with no environment behind
 * them — `session.ts` is already imported by client components. A `node:crypto`
 * import would break that portability, and widening the allowlist to keep one
 * hash would trade the property away for the convenience.
 *
 * So the digest is computed here, dependency-free: four independent 32-bit
 * FNV-1a lanes over the canonical JSON, concatenated to 128 bits.
 *
 * ══ WHAT THIS IS AND IS NOT ═════════════════════════════════════════════════
 *
 * An INTEGRITY fingerprint for drift, not a signature. It answers "is the bank
 * behind this stored session still the bank we hold?", where the realistic
 * failure is a question being edited while sessions are live — not an adversary
 * forging a digest. It never needs to resist that: the value is written
 * server-side at initialisation, compared server-side on read, and the progress
 * route refuses a request body that so much as mentions it. If a customer could
 * supply one, a cryptographic hash would not rescue the design — the authority
 * boundary would already be gone.
 *
 * Sorted by id so bank ORDER cannot move the digest: order is presentation, and
 * what the fingerprint protects is the binding between a stored answer and the
 * question it was given to.
 */
export function fingerprintBank(bank: readonly ConsultationQuestion[]): string {
  const canonical = [...bank]
    .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
    .map(semanticShape)
  const serialised = JSON.stringify(canonical)
  return FINGERPRINT_LANES.map(([basis, prime]) =>
    fnv1aLane(serialised, basis, prime).toString(16).padStart(8, "0"),
  ).join("")
}

/** The digest of a registered version, or `null` if that version is unknown. */
export function fingerprintFor(version: unknown): string | null {
  const bank = resolveConsultationBank(version)
  return bank ? fingerprintBank(bank) : null
}

/**
 * Does a stored (version, fingerprint) pair still describe a bank we hold?
 *
 * Both must match. A known version with a stale fingerprint means the wording
 * or the options moved under a live session, and that session must not be
 * resolved against today's bank.
 */
export function bankMatches(version: unknown, fingerprint: unknown): boolean {
  if (typeof fingerprint !== "string" || fingerprint.length === 0) return false
  const expected = fingerprintFor(version)
  return expected !== null && expected === fingerprint
}
