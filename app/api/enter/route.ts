import { NextRequest, NextResponse } from "next/server"
import { DEV_COOKIE, OLD_DEV_COOKIES, devPasswordToken, getDevPassword, isPasswordGateEnabled } from "@/lib/dev-password-gate"
import {
  getClientIp,
  isFailureCeilingReached,
  rateLimit,
  recordFailedAttempt,
} from "@/lib/rate-limit"
import { timingSafeEqualStrings } from "@/lib/secret-compare"

/**
 * The private-beta gate.
 *
 * Same two counters and the same single rejection as app/api/admin/login —
 * see the note there for why failures are counted separately from attempts,
 * why the windows are bounded, and why all three refusals look identical.
 *
 * The one difference: a 503 when the gate is enabled with no DEV_PASSWORD
 * configured stays distinct. That is a deployment fault, not a failed guess,
 * and the operator who caused it needs to be able to see it.
 */

const PER_IP_LIMIT = 10
const PER_IP_WINDOW_MS = 10 * 60_000
const FAILURE_CEILING = 20
const FAILURE_WINDOW_MS = 15 * 60_000

const FAILURE_KEY = "enter:failures"

/** The only rejection for a wrong or rate-limited attempt. */
function refuse(): NextResponse {
  return NextResponse.json({ ok: false }, { status: 401 })
}

export async function POST(req: NextRequest) {
  if (!isPasswordGateEnabled()) {
    return NextResponse.json({ ok: true, disabled: true })
  }

  const devPassword = getDevPassword()
  if (!devPassword) {
    return NextResponse.json(
      { ok: false, error: "Password gate is enabled but DEV_PASSWORD is not set." },
      { status: 503 }
    )
  }

  if (!rateLimit(`enter:${getClientIp(req)}`, PER_IP_LIMIT, PER_IP_WINDOW_MS).allowed) {
    return refuse()
  }
  if (isFailureCeilingReached(FAILURE_KEY, FAILURE_CEILING)) {
    return refuse()
  }

  const body = await req.json() as { password?: string }
  const submitted = body.password ?? ""

  if (!timingSafeEqualStrings(submitted, devPassword)) {
    recordFailedAttempt(FAILURE_KEY, FAILURE_WINDOW_MS)
    return refuse()
  }

  // Success spends no failure budget.

  const res = NextResponse.json({ ok: true })

  // Short redevelopment preview cookie.
  OLD_DEV_COOKIES.forEach((cookie) => {
    res.cookies.set(cookie, "", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0,
    })
  })

  res.cookies.set(DEV_COOKIE, await devPasswordToken(devPassword), {
    httpOnly: true,
    sameSite: "lax",
    secure:   process.env.NODE_ENV === "production",
    path:     "/",
    maxAge:   60 * 60 * 12, // 12 hours
  })

  return res
}
