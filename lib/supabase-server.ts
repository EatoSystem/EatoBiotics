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

/** Returns the authenticated user, or null if not signed in. */
export async function getUser() {
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
