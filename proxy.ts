import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import { DEV_COOKIE, devPasswordToken, getDevPassword, isPasswordGateEnabled } from "@/lib/dev-password-gate"

// ── Site-wide password gate ───────────────────────────────────────────────
async function hasSiteAccess(request: NextRequest, password: string): Promise<boolean> {
  return request.cookies.get(DEV_COOKIE)?.value === await devPasswordToken(password)
}

function isEnterRoute(pathname: string): boolean {
  return pathname === "/enter" || pathname.startsWith("/api/enter")
}
// ─────────────────────────────────────────────────────────────────────────

// Paths that start with /account but are public (no auth required)
const PUBLIC_ACCOUNT_PREFIXES = [
  "/account/signin",
  "/account-you",      // public demo dashboard
  "/account-you-live", // live dev/testing sandbox
]

function isProtectedAccountRoute(pathname: string): boolean {
  if (!pathname.startsWith("/account")) return false
  for (const prefix of PUBLIC_ACCOUNT_PREFIXES) {
    if (pathname === prefix || pathname.startsWith(prefix + "/")) return false
  }
  return true
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Site password check. During redevelopment, DEV_PASSWORD enables the gate.
  if (isPasswordGateEnabled()) {
    const password = getDevPassword()
    if (!password) {
      return new NextResponse("Password gate is enabled but DEV_PASSWORD is not set.", { status: 503 })
    }

    if (!isEnterRoute(pathname) && !(await hasSiteAccess(request, password))) {
      const url = request.nextUrl.clone()
      url.pathname = "/enter"
      url.searchParams.set("from", pathname)
      return NextResponse.redirect(url)
    }
  }
  // ────────────────────────────────────────────────────────────────────────

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? ""
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""

  if (!supabaseUrl || !supabaseAnonKey) {
    if (isProtectedAccountRoute(pathname)) {
      const url = request.nextUrl.clone()
      url.pathname = "/assessment"
      url.searchParams.set("signin", "1")
      return NextResponse.redirect(url)
    }
    return NextResponse.next()
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        supabaseResponse = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        )
      },
    },
  })

  const { data: { user } } = await supabase.auth.getUser()

  if (isProtectedAccountRoute(pathname) && !user) {
    const url = request.nextUrl.clone()
    url.pathname = "/assessment"
    url.searchParams.set("signin", "1")
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
