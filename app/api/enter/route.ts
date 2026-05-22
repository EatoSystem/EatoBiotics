import { NextRequest, NextResponse } from "next/server"
import { DEV_COOKIE, OLD_DEV_COOKIES, devPasswordToken, getDevPassword, isPasswordGateEnabled } from "@/lib/dev-password-gate"

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
