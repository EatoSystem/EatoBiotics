import { createHash } from "node:crypto"

/**
 * The content digest of a canonical Report — Phase 4A-S4.
 *
 * Lowercase hex, because the database CHECK is `^[0-9a-f]{64}$` and a digest
 * that only sometimes matches its own column constraint is a defect waiting for
 * a platform that spells hex differently.
 *
 * This is content identity, not a signature: it proves the bytes read back are
 * the bytes written, and nothing about who wrote them. The authority checks are
 * the seal, the producer identity and the finalisation binding.
 */
export function reportDigest(canonicalText: string): string {
  return createHash("sha256").update(canonicalText, "utf8").digest("hex")
}
