import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

// Paths that start with /account but are public (no auth required)
const PUBLIC_ACCOUNT_PREFIXES = [
  "/account/signin",
  "/account-you",   // public demo dashboard
]

function isProtectedAccountRoute(pathname: string): boolean {
  // Must start with /account or /account/ — but NOT match public prefixes
  if (!pathname.startsWith("/account")) return false
  for (const prefix of PUBLIC_ACCOUNT_PREFIXES) {
    if (pathname === prefix || pathname.startsWith(prefix + "/")) return false
  }
  return true
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const supabaseUrl     = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? ""
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""

  // Guard: if env vars are missing, fail safe — only block protected routes
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

  // Refresh session — IMPORTANT: always call getUser(), never getSession()
  const { data: { user } } = await supabase.auth.getUser()

  // Protect /account routes — redirect to /assessment if not signed in
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
    // Run on all routes except static assets, _next internals, and favicon
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
