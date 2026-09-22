/* ── In-memory rate limiter ───────────────────────────────────────────────
   Best-effort abuse protection for public, unauthenticated endpoints (guest
   meal scans, lead capture). State lives in the module scope of a single
   serverless instance, so limits are enforced PER-INSTANCE, not globally —
   under heavy fan-out a determined attacker could get up to N× the limit
   across N warm instances.

   For strict global limits, back this with a shared store (Vercel KV /
   Upstash Redis). As-is it adds zero infra and meaningfully raises the bar
   against trivial single-source abuse (e.g. someone looping the vision
   endpoint to burn Anthropic credits).
──────────────────────────────────────────────────────────────────────── */

type Bucket = { count: number; resetAt: number }

const buckets = new Map<string, Bucket>()
const MAX_BUCKETS = 10_000

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  retryAfterSeconds: number
}

/**
 * Fixed-window rate limit. Returns whether the request is allowed and, if not,
 * how many seconds until the window resets.
 */
export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now()
  const existing = buckets.get(key)

  if (!existing || existing.resetAt <= now) {
    // Opportunistically prune expired entries so the map can't grow unbounded.
    if (buckets.size > MAX_BUCKETS) {
      for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k)
    }
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: limit - 1, retryAfterSeconds: 0 }
  }

  if (existing.count >= limit) {
    return { allowed: false, remaining: 0, retryAfterSeconds: Math.ceil((existing.resetAt - now) / 1000) }
  }

  existing.count++
  return { allowed: true, remaining: limit - existing.count, retryAfterSeconds: 0 }
}

/* ── Credential endpoints: a second, failures-only counter ────────────────
   `rateLimit` above checks and increments in one call, which is right for a
   request you judge before you know its outcome. A login is the other shape:
   you only want to spend budget on attempts that FAILED, so a correct password
   never moves a legitimate operator towards a lockout. That needs two halves.

   ══ WHAT THIS IS, AND WHAT IT IS NOT ═══════════════════════════════════════

   The key is the ENDPOINT, not the caller — so guessing spread across many IPs
   on one warm instance still hits a wall that a per-IP limit alone would miss.
   Both are used together: per-IP first, then this.

   It is NOT distributed brute-force protection, and nothing here should be
   read as claiming otherwise. State lives in the module scope of ONE
   serverless instance, so an attacker fanned out across N warm instances gets
   N× the ceiling. That is defence in depth against the cheap attack, bought
   for no infrastructure; a real cross-instance ledger is a post-V1 decision if
   production traffic ever justifies the write on the login path.

   The window is bounded, deliberately. An attacker who can trip the ceiling
   must not be able to keep a legitimate admin locked out indefinitely — the
   budget expires and the endpoint reopens.
──────────────────────────────────────────────────────────────────────── */

/**
 * Has this endpoint's failure budget been spent? Read-only: it never
 * increments, so asking the question costs nothing.
 */
export function isFailureCeilingReached(key: string, limit: number): boolean {
  const bucket = buckets.get(key)
  if (!bucket || bucket.resetAt <= Date.now()) return false
  return bucket.count >= limit
}

/** Spend one unit of the failure budget. Call this ONLY on a failed attempt. */
export function recordFailedAttempt(key: string, windowMs: number): void {
  const now = Date.now()
  const existing = buckets.get(key)

  if (!existing || existing.resetAt <= now) {
    if (buckets.size > MAX_BUCKETS) {
      for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k)
    }
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return
  }
  existing.count++
}

/** Test-only: drop all counters so cases cannot leak state into each other. */
export function __resetRateLimitState(): void {
  buckets.clear()
}

/** Best-effort client IP from proxy headers (Vercel sets x-forwarded-for). */
export function getClientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for")
  if (xff) return xff.split(",")[0]!.trim()
  return req.headers.get("x-real-ip")?.trim() || "unknown"
}

/** Builds a 429 JSON response body + headers for a blocked request. */
export function rateLimitResponse(result: RateLimitResult) {
  return {
    body: { error: "Too many requests. Please slow down and try again shortly." },
    init: {
      status: 429,
      headers: { "Retry-After": String(result.retryAfterSeconds) },
    },
  }
}
