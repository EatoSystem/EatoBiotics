import { canonicalSerialise } from "@/lib/report/canonical-json"

import type { PersistedReportV1 } from "./types"

/**
 * The canonical bytes of a decoded historical Report — Phase 4A-S4.
 *
 * The same algorithm `serialiseReport` uses, reached through the same leaf. Not
 * a second implementation, and deliberately not a cast back to
 * `PersonalFoodSystemReportV1`: the persisted type widens exactly the fields
 * that are allowed to differ between builds, so casting would be a claim about
 * this document that the document does not make.
 *
 * What it is FOR: re-serialising what was decoded and comparing the result to
 * the stored text. That equality is what makes "the bytes are intact" and "the
 * object is the canonical form of those bytes" the same fact — and it is the
 * check that catches a storage layer that normalised the text, or a hand edit
 * that kept the digest consistent with itself.
 */
export function serialisePersistedReport(report: PersistedReportV1): string {
  return canonicalSerialise(report)
}
