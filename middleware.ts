import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

/* ── Dev password gate ──────────────────────────────────────────────────
   Protects the entire site with a simple password while in development.
   Set DEV_PASSWORD in .env.local (or env vars) to enable.
   Leave it unset to disable the gate in production.
──────────────────────────────────────────────────────────────────────── */
const DEV_PASSWORD = process.env.DEV_PASSWORD ?? ""
const DEV_COOKIE   = "eb_dev_auth"
const ENTER_PATH   = "/enter"

function isDevGateExempt(pathname: string): boolean {
  return (
    pathname === ENTER_PATH ||
    pathname.startsWith("/api/enter") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    // static assets already excluded by matcher, but belt-and-braces:
    /\.(png|jpg|jpeg|webp|svg|gif|ico|css|js|woff2?)$/.test(pathname)
  )
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ── Dev gate (only active when DEV_PASSWORD is set) ──────────────────
  if (DEV_PASSWORD) {
    if (!isDevGateExempt(pathname)) {
      const cookie = request.cookies.get(DEV_COOKIE)?.value
      if (cookie !== DEV_PASSWORD) {
        const url = request.nextUrl.clone()
        url.pathname = ENTER_PATH
        url.searchParams.set("from", pathname)
        return NextResponse.redirect(url)
      }
    }
  }

  // ── Supabase auth middleware ──────────────────────────────────────────
  const supabaseUrl    = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? ""
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""

  if (!supabaseUrl || !supabaseAnonKey) {
    if (
      pathname.startsWith("/account") &&
      !pathname.startsWith("/account/signin")
    ) {
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

  if (
    pathname.startsWith("/account") &&
    !pathname.startsWith("/account/signin") &&
    !user
  ) {
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
