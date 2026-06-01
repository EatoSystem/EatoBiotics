import { NextResponse, type NextRequest } from "next/server"

/* ── Cron authorisation ───────────────────────────────────────────────────
   Shared guard for cron-triggered routes (weekly check-in, nudges, email
   sequences, etc).

   Fails CLOSED: if CRON_SECRET is not configured the route is rejected with
   503 rather than running unauthenticated. This prevents anyone on the
   internet from triggering expensive operations (mass emails, AI generation)
   simply because the secret was never set.

   Vercel Cron automatically sends `Authorization: Bearer <CRON_SECRET>` with
   each invocation when the CRON_SECRET env var is present, so requiring it is
   compatible with scheduled runs.
──────────────────────────────────────────────────────────────────────── */

/**
 * Verifies a cron request's bearer token against CRON_SECRET.
 *
 * @returns `null` if the request is authorised, otherwise a NextResponse to
 *          return immediately (503 if unconfigured, 401 if the token is wrong).
 */
export function verifyCronRequest(req: NextRequest): NextResponse | null {
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret) {
    console.error("[cron-auth] CRON_SECRET is not configured — rejecting request")
    return NextResponse.json(
      { error: "CRON_SECRET not configured" },
      { status: 503 }
    )
  }

  const authHeader = req.headers.get("authorization")
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 })
  }

  return null
}
