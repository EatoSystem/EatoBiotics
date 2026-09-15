/**
 * Canonical JSON — Phase 4A-S4.
 *
 * ══ WHY THIS IS A LEAF WITH NO IMPORTS ══════════════════════════════════════
 *
 * Two callers need the SAME bytes for two types that are deliberately not
 * assignable to each other: the live `PersonalFoodSystemReportV1`, which the
 * composer builds, and `PersistedReportV1`, which the historical decoder
 * returns with its version fields widened. A digest taken over one must verify
 * against the other, so there can be exactly one algorithm.
 *
 * The obvious shortcuts are both wrong. Casting the persisted type back to the
 * live one to call `serialiseReport` would put a lie at the boundary whose
 * whole purpose is that the two are different. Copying the algorithm into the
 * persistence layer would give the Report two canonical forms, and the day they
 * disagreed every stored digest would become unverifiable at once.
 *
 * So the algorithm moved here, unchanged, and both sides call it. This module
 * imports nothing — not a type, not a constant — because anything it imported
 * would become a dependency of the deterministic Core.
 *
 * ══ WHAT THE RULES ARE, AND WHY ═════════════════════════════════════════════
 *
 * Keys are sorted at every level, because `JSON.stringify` preserves INSERTION
 * order and insertion order is an accident of how an object literal was typed.
 * Arrays keep their order, because array order in a Report is meaningful
 * everywhere: bank order for recaps, precedence for the lever, week order for
 * the loop. `undefined` is dropped rather than serialised, so an absent
 * optional field and an explicitly-undefined one cannot differ.
 *
 * Moved verbatim from `lib/report/deterministic/serialise.ts`, which now
 * delegates here. The two S2 golden digests are the proof that nothing changed.
 */

function canonicalise(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalise)
  if (value === null || typeof value !== "object") return value
  const source = value as Record<string, unknown>
  const out: Record<string, unknown> = {}
  for (const key of Object.keys(source).sort()) {
    if (source[key] === undefined) continue
    out[key] = canonicalise(source[key])
  }
  return out
}

/** Deterministic, key-sorted JSON. Stable across builds for equal input. */
export function canonicalSerialise(value: unknown): string {
  return JSON.stringify(canonicalise(value), null, 2)
}
