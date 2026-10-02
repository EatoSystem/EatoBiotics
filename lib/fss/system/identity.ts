/* ════════════════════════════════════════════════════════════════════════
   Identity for a Food System, a score and an action.

   ── The defect this replaces ──────────────────────────────────────────────

   Before this module, the candidate runtime had ONE id: the literal
   `"candidate"`, passed to `loadAssessment("candidate")`, and a score stored at
   the single unkeyed slot `score.latest`. That is enough for a walk that ends
   at a result page and not enough for a home a person returns to:

     · a second assessment overwrites the first with no record that it did;
     · `StoredAction.scoreId` has nothing to point at;
     · Gate 5's reassessment would need a schema change to represent two
       scores, which is the kind of change that quietly rewrites history.

   So ids are minted here, and every record is keyed by one.

   ── Why ids are NOT derived from their content ────────────────────────────

   A content hash would make two identical walks produce the same id, which
   sounds like a virtue — it is diffability, and this layer values it everywhere
   else. It is wrong here. Two people who answer identically have two Food
   Systems, and two attempts by the same person a month apart are two
   assessments, not one. An id that collided would silently merge them, and
   merging two people's records is the worst failure available to a persistence
   layer.

   Determinism lives where it belongs: `composeMyFoodSystem` is pure over
   whatever records it is given, and a test supplies its own ids rather than
   asking this module to be predictable.
   ════════════════════════════════════════════════════════════════════════ */

/** The record kinds that carry a minted id. */
export type IdPrefix = "system" | "assessment" | "score" | "action"

/**
 * A new id for one record.
 *
 * `crypto.randomUUID` where it exists — every browser this product supports,
 * and Node 24 — with a time-plus-random fallback so a non-secure context or an
 * embedded webview degrades rather than throws. The fallback is NOT presented
 * as equivalent: it is still unique enough for a `localStorage` keyspace with a
 * handful of records in it, which is the only place these ids live today.
 */
export function newId(prefix: IdPrefix): string {
  const c: Crypto | undefined = globalThis.crypto
  const unique =
    typeof c?.randomUUID === "function"
      ? c.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`
  return `${prefix}_${unique}`
}

/**
 * Does this look like an id this module minted?
 *
 * Used by validation, which must be able to say "that is not an id" about a
 * tampered pointer. It checks the SHAPE and makes no claim that the record
 * exists — existence is a separate check, and conflating the two is how a
 * validator ends up reporting the wrong failure.
 */
export function isMintedId(value: unknown, prefix?: IdPrefix): boolean {
  if (typeof value !== "string" || value.length < 3) return false
  const [head, ...rest] = value.split("_")
  if (rest.length === 0 || rest.join("_").length === 0) return false
  if (prefix) return head === prefix
  return (["system", "assessment", "score", "action"] as const).includes(head as IdPrefix)
}
