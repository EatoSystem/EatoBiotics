/**
 * GET /api/mobile/v1/today — composed daily companion read (P1).
 *
 * Auth accepts either surface (getUserFromRequest): the web app's session
 * cookie, or `Authorization: Bearer <supabase access token>` from the mobile
 * companion. Native clients cannot hold the password-gate cookie, so this
 * path is on proxy.ts's gate allowlist. It still 401s without a valid
 * session, so the gate would only have added a redirect, not protection.
 *
 * The response is the already-composed, already claim-checked object in
 * `mobileTodayResponseSchema`. This route does not call the fail-closed
 * FSS selector, does not rank pathways, and does not return personal
 * per-Biotic numbers. Cookie-only account delete/export stay cookie-gated.
 */

import { NextRequest, NextResponse } from "next/server"
import { getUserFromRequest } from "@/lib/supabase-server"
import { composeMobileToday } from "@/lib/mobile/compose-today"

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req)
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 })

  try {
    const payload = await composeMobileToday({
      id: user.id,
      email: user.email ?? null,
    })
    return NextResponse.json(payload)
  } catch (err) {
    console.error("[mobile/v1/today]", err)
    return NextResponse.json({ error: "Today is unavailable" }, { status: 503 })
  }
}
