import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import { DEV_COOKIE, OLD_DEV_COOKIES, devPasswordToken, getDevPassword, isPasswordGateEnabled } from "@/lib/dev-password-gate"
import { LANDING_SLUGS, resolveMarket } from "@/lib/market"
import { isLocale, LOCALE_COOKIE } from "@/lib/i18n/config"

// ── Site-wide password gate ───────────────────────────────────────────────
async function hasSiteAccess(request: NextRequest, password: string): Promise<boolean> {
  return request.cookies.get(DEV_COOKIE)?.value === await devPasswordToken(password)
}

function withPreviewNoStore(response: NextResponse): NextResponse {
  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate")
  response.headers.set("Pragma", "no-cache")
  response.headers.set("Expires", "0")
  response.headers.set("Surrogate-Control", "no-store")
  response.headers.set("Clear-Site-Data", '"cache", "storage"')
  OLD_DEV_COOKIES.forEach((cookie) => {
    response.cookies.set(cookie, "", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0,
    })
  })
  return response
}

function isEnterRoute(pathname: string): boolean {
  // Routes reachable while the gate is on: the public waitlist landing page
  // (/enter), the waitlist capture API, and the hidden founder/admin login.
  // The auth mechanics are also always allowed so that a customer's magic-link
  // sign-in can complete even if the waitlist gate is deliberately enabled —
  // otherwise /auth/callback would bounce back to /enter and break sign-in.
  return (
    pathname === "/enter" ||
    pathname === "/preview-access" ||
    pathname.startsWith("/discover") ||  // public shareable mini-report pages + OG
    pathname.startsWith("/c/") ||        // public per-country landing pages
    pathname.startsWith("/api/enter") ||
    pathname.startsWith("/api/waitlist") ||
    pathname.startsWith("/auth/callback") ||
    pathname.startsWith("/api/auth/")
  )
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

  // Pretty per-country URLs: /ie, /uk, /us… → the canonical /c/<slug> landing page.
  // Public ad/SEO entry points; rewrite before the gate so they're reachable.
  const seg = pathname.slice(1).toLowerCase()
  if (LANDING_SLUGS.includes(seg)) {
    const url = request.nextUrl.clone()
    url.pathname = `/c/${seg}`
    return NextResponse.rewrite(url)
  }

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
      return withPreviewNoStore(NextResponse.redirect(url))
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

  // Geo: remember the visitor's country (best-effort, Vercel edge header) for
  // localisation. User selection always wins, so only set when not already present.
  const geoCountry = request.headers.get("x-vercel-ip-country")
  if (geoCountry && /^[A-Za-z]{2}$/.test(geoCountry) && !request.cookies.get("eb_country")) {
    supabaseResponse.cookies.set("eb_country", geoCountry.toUpperCase(), {
      path: "/", maxAge: 60 * 60 * 24 * 180, sameSite: "lax",
    })
    // Seed the UI language from the visitor's market (country → language) when no
    // explicit choice exists yet. A user's switcher selection always overrides
    // this, since the switcher sets eb_locale and we only seed when it's absent.
    if (!request.cookies.get(LOCALE_COOKIE)) {
      const marketLocale = resolveMarket(geoCountry).locale
      if (isLocale(marketLocale)) {
        supabaseResponse.cookies.set(LOCALE_COOKIE, marketLocale, {
          path: "/", maxAge: 60 * 60 * 24 * 180, sameSite: "lax",
        })
      }
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
