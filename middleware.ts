import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? ""
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""

  // Guard: if env vars are missing, never crash the middleware — fail safe
  if (!supabaseUrl || !supabaseAnonKey) {
    if (
      request.nextUrl.pathname.startsWith("/account") &&
      !request.nextUrl.pathname.startsWith("/account/signin")
    ) {
      const url = request.nextUrl.clone()
      url.pathname = "/assessment"
      url.searchParams.set("signin", "1")
      return NextResponse.redirect(url)
    }
    return NextResponse.next()
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
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
    }
  )

  // Refresh session — IMPORTANT: always call getUser(), never getSession()
  const { data: { user } } = await supabase.auth.getUser()

  // Protect /account routes — redirect to /assessment if not signed in
  if (
    request.nextUrl.pathname.startsWith("/account") &&
    !request.nextUrl.pathname.startsWith("/account/signin") &&
    !user
  ) {
    const url = request.nextUrl.clone()
    url.pathname = "/assessment"
    url.searchParams.set("signin", "1")  // so the page can show a "sign in" message
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
