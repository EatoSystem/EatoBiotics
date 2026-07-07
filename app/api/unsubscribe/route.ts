import { NextRequest, NextResponse } from "next/server"
import { rateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit"
import { recordOptOut, verifyUnsubscribeToken } from "@/lib/email/unsubscribe"

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://eatobiotics.com"
const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)

/**
 * Email opt-out endpoint. Reachable while the site password gate is on
 * (see proxy.ts isEnterRoute).
 *
 *  - POST: one-click (RFC 8058) — mail clients POST the List-Unsubscribe URL
 *    with `email` + `token` in the query string (and a `List-Unsubscribe=One-Click`
 *    form body). Also accepts a JSON body { email, token? } from the /unsubscribe
 *    page's confirm button. A valid token unsubscribes silently; without one it's
 *    still honored (it only ever ADDS an opt-out and requires the address).
 *  - GET: a human clicked the header link → record opt-out if the token is valid,
 *    then redirect to the friendly /unsubscribe page.
 */

async function extract(req: NextRequest): Promise<{ email: string; token: string | null }> {
  const qp = req.nextUrl.searchParams
  let email = (qp.get("email") ?? "").toLowerCase().trim()
  let token = qp.get("token")
  if (!email) {
    try {
      const body = (await req.json()) as { email?: string; token?: string }
      email = (body.email ?? "").toLowerCase().trim()
      token = token ?? body.token ?? null
    } catch { /* no/!json body (e.g. form-encoded one-click) — query params only */ }
  }
  return { email, token }
}

export async function POST(req: NextRequest) {
  const limit = rateLimit(`unsubscribe:${getClientIp(req)}`, 20, 10 * 60_000)
  if (!limit.allowed) {
    const { body, init } = rateLimitResponse(limit)
    return NextResponse.json(body, init)
  }

  const { email, token } = await extract(req)
  if (!email || !isValidEmail(email)) {
    return NextResponse.json({ error: "A valid email is required." }, { status: 400 })
  }

  const oneClick = verifyUnsubscribeToken(email, token)
  const ok = await recordOptOut(email, oneClick ? "one_click" : "manual")
  if (!ok) return NextResponse.json({ error: "Could not process unsubscribe." }, { status: 500 })

  return NextResponse.json({ ok: true })
}

export async function GET(req: NextRequest) {
  const { email, token } = await extract(req)
  const url = new URL("/unsubscribe", SITE_URL)
  if (email && isValidEmail(email) && verifyUnsubscribeToken(email, token)) {
    await recordOptOut(email, "link")
    url.searchParams.set("done", "1")
  } else if (email) {
    url.searchParams.set("email", email) // let the page show a manual confirm button
  }
  return NextResponse.redirect(url)
}
