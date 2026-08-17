/**
 * The `updated_at` compare-and-set token for `deep_assessments` (#227).
 *
 * `app/api/save-deep-progress` merges one answer into the stored map, which is
 * a read-modify-write, so the update is guarded on the `updated_at` the read
 * observed: `.eq("updated_at", token)` matches zero rows if anyone wrote in
 * between, and the loser re-reads and re-applies its delta.
 *
 * That guard is only sound if a successful write ALWAYS moves the token.
 * `new Date().toISOString()` does not guarantee that — it is millisecond
 * precision, so a write landing in the same millisecond as the value it read
 * would store an identical token, and a third writer still holding that token
 * would find its guard satisfied AFTER the merge landed and overwrite a map it
 * never read. Small window, not an empty one.
 *
 * So the value is forced strictly forward rather than assumed distinct.
 * Comparison happens on the parsed timestamp, not the text: PostgREST sends
 * `updated_at=eq.<value>` and Postgres coerces it to timestamptz. A stored
 * microsecond value loses sub-millisecond digits through `Date.parse`, and
 * truncation only ever makes `seen` smaller, so `seen + 1` remains strictly
 * greater than what is stored.
 *
 * This is monotonicity relative to the OBSERVED token, which is all the CAS
 * needs: any concurrent reader holds either the pre-write token (now stale, so
 * its guard correctly fails) or the post-write token (so it is not stale).
 */
export function nextUpdatedAt(observed: string | null | undefined, now: number = Date.now()): string {
  const seen = observed ? Date.parse(observed) : NaN
  return new Date(Number.isFinite(seen) && now <= seen ? seen + 1 : now).toISOString()
}
