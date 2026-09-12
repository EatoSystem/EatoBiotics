import { createHash } from "node:crypto"

/**
 * The one digest — Phase 4A-S3.
 *
 * The variant pack, the overlay builder and the trust check all bind content
 * by hash, and they must agree exactly or a binding that is correct in one
 * place reads as tampered in another. Three private copies of `createHash`
 * would be three chances to disagree about encoding, algorithm or trimming, so
 * there is one.
 *
 * Not in the deterministic Core, and not shared with it: the Core hashes
 * nothing. This is narrative binding metadata.
 */
export function narrativeDigest(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex")
}
