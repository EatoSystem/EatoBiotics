import { createServerClient } from "@supabase/ssr"
import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"

export async function getSupabaseServer() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // setAll called from Server Component — cookies can only be set in middleware or Route Handlers
          }
        },
      },
    }
  )
}

/**
 * Returns the authenticated user, or null if not signed in.
 *
 * Also returns null when Supabase env is absent, rather than throwing.
 * `createServerClient` throws "Your project's URL and Key are required" on an
 * empty URL/key, which turned every page that calls this into a 500 — including
 * `/pricing`, a public marketing page whose only use of `user` is to pick a CTA.
 * CI builds with no env by design, so `/pricing` had been returning 500 there
 * and the accessibility suite was silently auditing Next's error shell.
 *
 * `getUserFromRequest` below already guarded its bearer-token path this way;
 * this makes the cookie path behave the same. No env means no session, which is
 * indistinguishable from a signed-out visitor — the correct answer is null.
 */
export async function getUser() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? ""
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""
  if (!url || !anonKey) return null

  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

/**
 * Returns the authenticated user from either auth surface:
 * - `Authorization: Bearer <supabase access token>` — native clients (the
 *   mobile companion app) that hold a Supabase Auth session but no cookies.
 *   The token is verified against Supabase Auth (a network call), not just
 *   decoded locally.
 * - Otherwise falls back to the session cookie, same as getUser().
 *
 * Use this instead of getUser() in API routes the mobile app calls.
 */
export async function getUserFromRequest(req: Request) {
  const token = req.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1]
  if (token) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? ""
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""
    if (!url || !anonKey) return null
    const supabase = createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
    const { data: { user } } = await supabase.auth.getUser(token)
    return user
  }
  return getUser()
}
