import { NextRequest, NextResponse } from "next/server"
import { DEV_COOKIE, devPasswordToken, getDevPassword, isPasswordGateEnabled } from "@/lib/dev-password-gate"

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

  const body = await req.json() as { password?: string }
  const submitted = body.password ?? ""

  if (submitted !== devPassword) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }

  const res = NextResponse.json({ ok: true })

  // Set a session cookie — expires when browser closes, or set maxAge for longer
  res.cookies.set(DEV_COOKIE, await devPasswordToken(devPassword), {
    httpOnly: true,
    sameSite: "lax",
    secure:   process.env.NODE_ENV === "production",
    path:     "/",
    maxAge:   60 * 60 * 24 * 7, // 7 days
  })

  return res
}
