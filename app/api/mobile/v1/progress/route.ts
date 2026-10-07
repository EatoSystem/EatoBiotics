/**
 * GET /api/mobile/v1/progress — composed this-week companion read (P4).
 *
 * Sibling of GET /api/mobile/v1/today. Auth accepts either surface
 * (getUserFromRequest): the web app's session cookie, or
 * `Authorization: Bearer <supabase access token>` from the mobile companion.
 * Native clients cannot hold the password-gate cookie, so this path is on
 * proxy.ts's gate allowlist. It still 401s without a valid session, so the
 * gate would only have added a redirect, not protection.
 *
 * The response is the already-composed, already claim-checked object in
 * `mobileProgressResponseSchema`. This route does not call `buildAccountTwin`,
 * the fail-closed FSS selector, or return personal per-Biotic numbers.
 */

import { NextRequest, NextResponse } from "next/server"
import { getUserFromRequest } from "@/lib/supabase-server"
import { composeMobileProgress } from "@/lib/mobile/compose-progress"

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req)
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 })

  try {
    const payload = await composeMobileProgress({
      id: user.id,
      email: user.email ?? null,
    })
    return NextResponse.json(payload)
  } catch (err) {
    console.error("[mobile/v1/progress]", err)
    return NextResponse.json({ error: "This week is unavailable" }, { status: 503 })
  }
}
