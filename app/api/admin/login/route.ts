import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json()
    const adminPassword = process.env.ADMIN_PASSWORD

    if (!adminPassword || password !== adminPassword) {
      return NextResponse.redirect(new URL("/admin?error=1", req.url), { status: 303 })
    }

    const res = NextResponse.redirect(new URL("/admin", req.url), { status: 303 })
    res.cookies.set("admin_auth", "eatobiotics-admin-ok", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/admin",
      // Session cookie — no maxAge means it expires when browser closes
    })
    return res
  } catch {
    return NextResponse.redirect(new URL("/admin?error=1", req.url), { status: 303 })
  }
}
