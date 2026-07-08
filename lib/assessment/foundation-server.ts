import type { SupabaseClient } from "@supabase/supabase-js"
import { z } from "zod"

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
 * A client-submitted journey payload (POST /api/assessment/journey) is a third,
 * weaker signal: it's caller-controlled, so a bare key like `{ you: {} }` must
 * never count as proof on its own — isValidFoundationSummary() below enforces
 * the real AssessmentSummary shape (lib/assessment/registry.ts) before a
 * payload-supplied foundation is trusted.
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

/**
 * The real shape of a foundation AssessmentSummary (lib/assessment/registry.ts),
 * strict enough that an empty or fabricated object (`{}`) can never pass.
 * `key`/`kind` are pinned per-foundation by the caller via .extend() below.
 */
const foundationSummaryShape = z.object({
  label: z.string().min(1),
  scoreLabel: z.string().min(1),
  score: z.number().min(0).max(100),
  bandLabel: z.string().min(1),
  bandDescription: z.string().optional(),
  strengths: z.array(z.string()),
  priorities: z.array(z.string()),
  details: z.array(z.object({ label: z.string(), text: z.string() })).optional(),
  sevenDay: z.array(z.string()),
  thirtyDay: z.array(z.string()).optional(),
})

const youSummarySchema = foundationSummaryShape.extend({ key: z.literal("you"), kind: z.literal("foundation") })
const familySummarySchema = foundationSummaryShape.extend({ key: z.literal("family"), kind: z.literal("foundation") })

/** True if `value` is a real, complete `you` or `family` AssessmentSummary. */
export function isValidFoundationSummary(value: unknown, expectedKey: "you" | "family"): boolean {
  const schema = expectedKey === "you" ? youSummarySchema : familySummarySchema
  return schema.safeParse(value).success
}

/**
 * True if a journey-sync `summaries` payload carries a *validated* foundation
 * summary — not just a `you`/`family` key. A caller-forged `{ you: {} }` (or
 * any object missing the real AssessmentSummary fields) returns false here,
 * so it can never substitute for hasServerFoundation() proof.
 */
export function payloadHasFoundation(summaries: Record<string, unknown> | null | undefined): boolean {
  if (!summaries) return false
  if ("you" in summaries && isValidFoundationSummary(summaries.you, "you")) return true
  if ("family" in summaries && isValidFoundationSummary(summaries.family, "family")) return true
  return false
}

const ADDON_SUMMARY_KEYS = ["mind", "glucose", "performance", "pregnancy", "stability"] as const

/** True if a journey-sync `summaries` payload carries any add-on key. */
export function payloadHasAddon(summaries: Record<string, unknown> | null | undefined): boolean {
  if (!summaries) return false
  return ADDON_SUMMARY_KEYS.some((k) => k in summaries)
}
