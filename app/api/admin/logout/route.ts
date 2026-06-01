import { NextRequest, NextResponse } from "next/server"
import { ADMIN_COOKIE } from "@/lib/admin-auth"

export async function POST(req: NextRequest) {
  const res = NextResponse.redirect(new URL("/admin", req.url), { status: 303 })
  res.cookies.set(ADMIN_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  })
  return res
}
