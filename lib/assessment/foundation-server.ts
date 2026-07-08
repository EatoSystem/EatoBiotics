import type { SupabaseClient } from "@supabase/supabase-js"

/**
 * Server-side proof that a You or Family foundation assessment is complete —
 * the backend counterpart to the client-only check in
 * components/assessment/foundation-guard.tsx (which only ever reads
 * localStorage, so it can't be trusted to gate a write). Checked against two
 * independent sources so both legacy free-quiz users and newer journey-synced
 * users are covered:
 *
 *   1. `leads` — the free You/Family quiz. `assessment_type` is filtered
 *      explicitly to ["gut", "family"] so a Mind lead (which also writes
 *      `leads.overall_score`, via /api/send-results-email) can never count as
 *      foundation proof.
 *   2. `assessment_journeys.summaries` — the newer per-user sync record,
 *      checked for a `you` or `family` key. Only queryable for signed-in users
 *      (the table has no email column).
 *
 * Server-only: never import this from a client component.
 */

export interface FoundationProofArgs {
  userId?: string | null
  email?: string | null
}

/** "gut" is the legacy leads.assessment_type value for the You foundation. */
const FOUNDATION_ASSESSMENT_TYPES = ["gut", "family"] as const

function normalizeEmail(email?: string | null): string | null {
  const trimmed = email?.toLowerCase().trim()
  return trimmed ? trimmed : null
}

async function leadsHasFoundation(
  sb: SupabaseClient,
  userId: string | null,
  email: string | null,
): Promise<boolean> {
  if (userId) {
    const { data } = await sb
      .from("leads")
      .select("id")
      .eq("user_id", userId)
      .in("assessment_type", FOUNDATION_ASSESSMENT_TYPES)
      .not("overall_score", "is", null)
      .limit(1)
    if (data && data.length > 0) return true
  }
  if (email) {
    const { data } = await sb
      .from("leads")
      .select("id")
      .eq("email", email)
      .in("assessment_type", FOUNDATION_ASSESSMENT_TYPES)
      .not("overall_score", "is", null)
      .limit(1)
    if (data && data.length > 0) return true
  }
  return false
}

async function journeyHasFoundation(sb: SupabaseClient, userId: string | null): Promise<boolean> {
  if (!userId) return false
  const { data } = await sb.from("assessment_journeys").select("summaries").eq("user_id", userId).maybeSingle()
  const summaries = data?.summaries as Record<string, unknown> | null | undefined
  return !!summaries && ("you" in summaries || "family" in summaries)
}

/**
 * True if this user (by id and/or email — at least one must be provided) has
 * a completed You or Family foundation on file, per either source above.
 */
export async function hasServerFoundation(
  sb: SupabaseClient,
  { userId, email }: FoundationProofArgs,
): Promise<boolean> {
  const normalizedEmail = normalizeEmail(email)
  const id = userId ?? null
  if (!id && !normalizedEmail) return false

  if (await leadsHasFoundation(sb, id, normalizedEmail)) return true
  return journeyHasFoundation(sb, id)
}

/** True if a journey-sync `summaries` payload already carries a foundation key. */
export function payloadHasFoundation(summaries: Record<string, unknown> | null | undefined): boolean {
  return !!summaries && ("you" in summaries || "family" in summaries)
}

const ADDON_SUMMARY_KEYS = ["mind", "glucose", "performance", "pregnancy", "stability"] as const

/** True if a journey-sync `summaries` payload carries any add-on key. */
export function payloadHasAddon(summaries: Record<string, unknown> | null | undefined): boolean {
  if (!summaries) return false
  return ADDON_SUMMARY_KEYS.some((k) => k in summaries)
}
