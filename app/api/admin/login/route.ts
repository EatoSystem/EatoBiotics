import { NextRequest, NextResponse } from "next/server"
import { ADMIN_COOKIE, adminCookieToken } from "@/lib/admin-auth"

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json()
    const adminPassword = process.env.ADMIN_PASSWORD
    const token = adminCookieToken()

    // Fail closed if no admin secret/password is configured, or password wrong.
    if (!adminPassword || !token || password !== adminPassword) {
      return NextResponse.redirect(new URL("/admin?error=1", req.url), { status: 303 })
    }

    const res = NextResponse.redirect(new URL("/admin", req.url), { status: 303 })
    res.cookies.set(ADMIN_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/", // available to /admin pages AND admin-gated API routes
      // Session cookie — expires when the browser closes
    })
    return res
  } catch {
    return NextResponse.redirect(new URL("/admin?error=1", req.url), { status: 303 })
  }
}
