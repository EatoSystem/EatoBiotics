/* ── Family Mode scoring ───────────────────────────────────────────────────
   A household is one account holder plus lightweight member sub-profiles. The
   family food-system score is the average of every member's latest score
   (including the account holder). Pure and deterministic.
──────────────────────────────────────────────────────────────────────────── */

export interface FamilyMember {
  id: string
  name: string
  ageBand?: string | null
  relationship?: string | null
  /** Most recent food-system score (0–100), or null if not yet scored. */
  score: number | null
}

export interface FamilyScore {
  /** Rounded average across members who have a score; null if nobody does. */
  average: number | null
  /** How many members contributed a score to the average. */
  contributors: number
  /** Total members counted (including those without a score yet). */
  memberCount: number
}

/**
 * Computes the household food-system score from a list of member scores
 * (pass the account holder's own score in alongside the members'). Members
 * without a score are ignored in the average but still counted in `memberCount`.
 */
export function familyScore(scores: ReadonlyArray<number | null | undefined>): FamilyScore {
  const valid = scores.filter(
    (s): s is number => typeof s === "number" && Number.isFinite(s),
  )
  return {
    average: valid.length
      ? Math.round(valid.reduce((sum, s) => sum + s, 0) / valid.length)
      : null,
    contributors: valid.length,
    memberCount: scores.length,
  }
}

/** Convenience: family score from member records plus the optional owner score. */
export function familyScoreFromMembers(
  members: ReadonlyArray<Pick<FamilyMember, "score">>,
  ownerScore: number | null = null,
): FamilyScore {
  return familyScore([ownerScore, ...members.map((m) => m.score)])
}
