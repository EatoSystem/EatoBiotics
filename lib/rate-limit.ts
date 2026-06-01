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
