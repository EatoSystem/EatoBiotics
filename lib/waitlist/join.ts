/**
 * The one description of what joining the waitlist sends.
 *
 * Two surfaces post to `/api/waitlist`: the /enter experience and the
 * per-country DiscoverFlow. They were about to have two hand-written copies of
 * the same request body, which is how a field quietly stops being sent on one
 * of them — `diet` and the UTM keys are only ever read on the server, so a
 * missing one produces no error anywhere, just worse data.
 *
 * So the payload is built in one place and the fetch happens in one place. The
 * builder is pure, which is what makes the contract testable without a network.
 */

import type { AssessmentResult } from "@/lib/assessment-scoring"

export type WaitlistUtm = Partial<
  Record<"utm_source" | "utm_medium" | "utm_campaign" | "utm_content" | "utm_term", string>
>

export interface WaitlistJoinInput {
  email: string
  name?: string
  ageBracket?: string
  country?: string
  diet?: string
  mainGoal?: string
  foodChallenge?: string
  referredBy?: string | null
  utm?: WaitlistUtm
  result: AssessmentResult
  /** Unticked by default at every call site — a pre-ticked box is not consent. */
  healthDataConsent: boolean
}

export interface WaitlistJoinResponse {
  ok?: boolean
  error?: string
  shareCode?: string
}

/** The exact body `/api/waitlist` reads. Pure — no fetch, no globals. */
export function buildWaitlistJoinBody(input: WaitlistJoinInput): Record<string, unknown> {
  const { utm, ...rest } = input
  return { ...rest, ...(utm ?? {}) }
}

export async function submitWaitlistJoin(
  input: WaitlistJoinInput,
): Promise<{ ok: boolean; shareCode: string | null; error: string | null }> {
  const res = await fetch("/api/waitlist", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(buildWaitlistJoinBody(input)),
  })

  let data: WaitlistJoinResponse = {}
  try {
    data = (await res.json()) as WaitlistJoinResponse
  } catch {
    // A body that is not JSON is a failure, not an empty success.
    return { ok: false, shareCode: null, error: null }
  }

  if (res.ok && data.ok) {
    return { ok: true, shareCode: data.shareCode ?? null, error: null }
  }
  return { ok: false, shareCode: null, error: data.error ?? null }
}
