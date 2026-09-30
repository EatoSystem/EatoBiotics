import { createHash } from "node:crypto"
import { QUESTIONS, type AssessmentQuestion } from "@/lib/assessment-data"

/**
 * The pin: a content hash of ONE legacy question.
 *
 * ── Why this projection and not some other ────────────────────────────────
 *
 * It is deliberately the SAME seven fields
 * `tests/unit/assessment-methodology-freeze.test.ts` hashes across the whole
 * array — id, index, pillar, sectionTitle, type, text, and each option's
 * value and label. Those are the fields that change what a score MEANS.
 *
 * Two consequences worth stating, because both are choices:
 *
 *   `option.description` is NOT pinned, exactly as it is not frozen. An answer
 *   description is explanatory text beside an option, not the option itself,
 *   and pinning it would make a copy edit look like a methodology change.
 *
 *   `index` IS pinned. A legacy question's position in the legacy instrument
 *   is part of what it is, and questions-v1.0 carries its own explicit order
 *   separately — so a reordered legacy array correctly fails resolution rather
 *   than silently re-numbering what this version references.
 *
 * The freeze hashes the array; this hashes an item. The finer instrument is
 * the right one here: it names WHICH question moved, not merely that one did.
 */
export function pinOf(q: AssessmentQuestion): string {
  const projection = {
    id: q.id,
    index: q.index,
    pillar: q.pillar,
    sectionTitle: q.sectionTitle,
    type: q.type,
    text: q.text,
    options: q.options.map((o) => ({ value: o.value, label: o.label })),
  }
  return createHash("sha256").update(JSON.stringify(projection), "utf8").digest("hex")
}

/** The legacy question with this id, or null. Never throws — the caller decides. */
export function legacyQuestion(id: string): AssessmentQuestion | null {
  return QUESTIONS.find((q) => q.id === id) ?? null
}

/** Every legacy id and its current pin — used to regenerate the manifest deliberately. */
export function currentPins(): Record<string, string> {
  return Object.fromEntries(QUESTIONS.map((q) => [q.id, pinOf(q)]))
}
