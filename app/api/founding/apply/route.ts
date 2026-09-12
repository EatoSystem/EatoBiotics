import { NextRequest, NextResponse } from "next/server"
import { getSupabase } from "@/lib/supabase"
import { getClientIp, rateLimit, rateLimitResponse } from "@/lib/rate-limit"
import { logServerEvent } from "@/lib/statsig-server"

type Body = {
  name?: string
  email?: string
  why?: string
  focus?: string
  referral?: string
  consent?: boolean
  website?: string // honeypot (must be empty)
}

export async function POST(req: NextRequest) {
  // Basic abuse control: fixed-window IP rate limit
  const limit = rateLimit(`founding-apply:${getClientIp(req)}`, 5, 10 * 60_000)
  if (!limit.allowed) {
    const { body, init } = rateLimitResponse(limit)
    return NextResponse.json(body, init)
  }

  let body: Body
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  // Honeypot: quietly succeed without writing
  if ((body.website ?? "").trim().length > 0) {
    return NextResponse.json({ ok: true })
  }

  const name = (body.name ?? "").trim()
  const email = (body.email ?? "").trim().toLowerCase()
  const why = (body.why ?? "").trim()
  const focus = (body.focus ?? "").trim() || null
  const referral = (body.referral ?? "").trim() || null
  const consent = !!body.consent

  // Validate input
  const errors: Record<string, string> = {}
  if (!name) errors.name = "Name is required"
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) errors.email = "Valid email is required"
  if (!why) errors.why = "Please tell us why you'd like to join"
  if (!consent) errors.consent = "You must agree to the Privacy Policy and Terms"
  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ ok: false, errors }, { status: 400 })
  }

  const db = getSupabase()
  if (!db) {
    // Degrade gracefully in environments without Supabase — still return success
    await logServerEvent("founding_apply_submitted", "anonymous", { email })
    return NextResponse.json({ ok: true, degraded: true })
  }

  try {
    // Idempotent on email: update the latest details, preserve status if already set
    const { error } = await db
      .from("founding_applications")
      .upsert(
        { email, name, why, focus, referral, consented: true },
        { onConflict: "email", ignoreDuplicates: false }
      )

    if (error) {
      console.error("[founding/apply] Supabase error:", error.message)
      return NextResponse.json({ error: "Could not save application" }, { status: 500 })
    }

    await logServerEvent("founding_apply_submitted", "anonymous", { email })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[founding/apply] Error:", err)
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 })
  }
}

