import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  const res = NextResponse.redirect(new URL("/admin", req.url), { status: 303 })
  res.cookies.set("admin_auth", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/admin",
    maxAge: 0,
  })
  return res
}
