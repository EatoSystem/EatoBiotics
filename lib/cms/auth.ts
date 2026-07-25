import { NextResponse, type NextRequest } from "next/server"
import { ADMIN_COOKIE, verifyAdminCookie } from "@/lib/admin-auth"

/* ── Content Studio route guard ───────────────────────────────────────────
   Every /api/cms handler calls this first, before touching any data. Returns
   a uniform 404 (not 401/403) for unauthorised callers so the CMS's existence
   isn't advertised — matching the middleware default-deny in proxy.ts.
   Fails closed via verifyAdminCookie (no admin secret configured → false). */
export function requireCmsAdmin(req: NextRequest): NextResponse | null {
  const authed = verifyAdminCookie(req.cookies.get(ADMIN_COOKIE)?.value)
  if (!authed) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return null
}
