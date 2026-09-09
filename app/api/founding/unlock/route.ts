import { NextRequest, NextResponse } from "next/server"
import { getSupabase } from "@/lib/supabase"
import { DEV_COOKIE, devPasswordToken, getDevPassword, isPasswordGateEnabled } from "@/lib/dev-password-gate"
import { logServerEvent } from "@/lib/statsig-server"

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const token = url.searchParams.get("token")?.trim()
  if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 })

  const db = getSupabase()
  if (!db) return NextResponse.json({ error: "Not configured" }, { status: 503 })

  // Verify token and status
  const { data, error } = await db
    .from("founding_applications")
    .select("email, name, status")
    .eq("admit_token", token)
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error("[founding/unlock] Supabase error:", error.message)
    return NextResponse.json({ error: "Invalid token" }, { status: 400 })
  }
  if (!data || data.status !== "admitted") {
    return NextResponse.json({ error: "Invalid or inactive token" }, { status: 400 })
  }

  // Set the preview gate cookie using the configured DEV_PASSWORD
  if (!isPasswordGateEnabled()) {
    // In public mode, just redirect to account
    await logServerEvent("founding_activated", "anonymous", { email: data.email })
    const res = NextResponse.redirect(new URL("/assessment", req.url))
    return res
  }

  const password = getDevPassword()
  if (!password) {
    return NextResponse.json({ error: "Preview gate misconfigured" }, { status: 503 })
  }

  const res = NextResponse.redirect(new URL("/assessment", req.url))
  res.cookies.set(DEV_COOKIE, await devPasswordToken(password), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 14, // 14 days
  })
  await logServerEvent("founding_activated", "anonymous", { email: data.email })
  return res
}

