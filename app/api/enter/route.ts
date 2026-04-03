import { NextRequest, NextResponse } from "next/server"

const DEV_PASSWORD = process.env.DEV_PASSWORD ?? ""
const DEV_COOKIE   = "eb_dev_auth"

export async function POST(req: NextRequest) {
  const body = await req.json() as { password?: string }
  const submitted = body.password ?? ""

  if (!DEV_PASSWORD || submitted !== DEV_PASSWORD) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }

  const res = NextResponse.json({ ok: true })

  // Set a session cookie — expires when browser closes, or set maxAge for longer
  res.cookies.set(DEV_COOKIE, DEV_PASSWORD, {
    httpOnly: true,
    sameSite: "lax",
    secure:   process.env.NODE_ENV === "production",
    path:     "/",
    maxAge:   60 * 60 * 24 * 7, // 7 days
  })

  return res
}
