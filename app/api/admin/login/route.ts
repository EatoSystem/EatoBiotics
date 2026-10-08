import { NextRequest, NextResponse } from "next/server"
import { ADMIN_COOKIE, adminCookieToken } from "@/lib/admin-auth"
import {
  getClientIp,
  isFailureCeilingReached,
  rateLimit,
  recordFailedAttempt,
} from "@/lib/rate-limit"
import { timingSafeEqualStrings } from "@/lib/secret-compare"

/**
 * Admin sign-in.
 *
 * ══ TWO COUNTERS, AND WHY BOTH ═════════════════════════════════════════════
 *
 * Per-IP catches the obvious loop. The endpoint-wide FAILURE ceiling catches
 * guessing spread across addresses on the same warm instance, which per-IP
 * cannot see. It counts failures only, so a correct password never moves a
 * legitimate operator towards a lockout, and its window is bounded so nobody
 * can hold the door shut forever.
 *
 * Neither is distributed brute-force protection — lib/rate-limit.ts is
 * in-memory and serverless-local, so N warm instances mean N× the ceiling.
 * This is defence in depth for no infrastructure, and it is written down
 * rather than implied.
 *
 * ══ ONE RESPONSE FOR THREE REASONS ═════════════════════════════════════════
 *
 * Wrong password, per-IP limit and endpoint ceiling all return the SAME
 * redirect. That costs a locked-out admin the 429 they would find useful, and
 * buys not telling an attacker which wall they just hit — in particular, not
 * confirming that a password was wrong rather than merely rate-limited.
 */

/** Attempts per IP, and the failure budget for the endpoint as a whole. */
const PER_IP_LIMIT = 10
const PER_IP_WINDOW_MS = 10 * 60_000
const FAILURE_CEILING = 20
const FAILURE_WINDOW_MS = 15 * 60_000

const FAILURE_KEY = "admin-login:failures"

/** The only rejection this route has. See the note above. */
function refuse(req: NextRequest): NextResponse {
  return NextResponse.redirect(new URL("/admin?error=1", req.url), { status: 303 })
}

export async function POST(req: NextRequest) {
  try {
    if (!rateLimit(`admin-login:${getClientIp(req)}`, PER_IP_LIMIT, PER_IP_WINDOW_MS).allowed) {
      return refuse(req)
    }
    if (isFailureCeilingReached(FAILURE_KEY, FAILURE_CEILING)) {
      return refuse(req)
    }

    const { password } = await req.json()
    const adminPassword = process.env.ADMIN_PASSWORD
    const token = adminCookieToken()

    // Fail closed if no admin secret/password is configured, or password wrong.
    if (!adminPassword || !token || typeof password !== "string" ||
        !timingSafeEqualStrings(password, adminPassword)) {
      recordFailedAttempt(FAILURE_KEY, FAILURE_WINDOW_MS)
      return refuse(req)
    }

    // Success spends no failure budget — deliberately, so an operator signing
    // in normally can never be the reason the endpoint closes.
    const res = NextResponse.redirect(new URL("/admin", req.url), { status: 303 })
    res.cookies.set(ADMIN_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/", // available to /admin pages AND admin-gated API routes
      // Session cookie — expires when the browser closes
    })
    return res
  } catch {
    return refuse(req)
  }
}
