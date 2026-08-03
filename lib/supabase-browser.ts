import { createBrowserClient } from "@supabase/ssr"

/**
 * The browser Supabase client, or **null when Supabase env is absent** rather
 * than throwing.
 *
 * This mirrors `getUser()` in lib/supabase-server.ts:29 — same bug class, same
 * fix, and worth keeping recognisable as one pattern rather than two accidents.
 * That comment describes the server half: an empty URL/key made
 * `createServerClient` throw, which turned public pages into 500s in CI.
 *
 * The client half was worse, because it fails *after* a successful render.
 * `createBrowserClient` throws "Your project's URL and API key are required" on
 * an empty URL/key, and `AccountNavItem` calls this from an effect in the global
 * site nav (components/nav.tsx) — so with no env, **every page** server-rendered
 * correctly and was then replaced by the error boundary during hydration.
 *
 * That made local visual checks actively misleading: screenshots and manual QA
 * captured Next's error shell while the a11y suite stayed green, because it
 * scans at `domcontentloaded`, before hydration runs.
 *
 * Callers must handle null. That is deliberate and is the guarantee here — there
 * is no second "safe" accessor to reach for by mistake, so a future
 * globally-mounted component cannot reintroduce the crash. For anything
 * auth-shaped the right reading is the server one: no env means no session,
 * which is indistinguishable from a signed-out visitor.
 *
 * Production is unaffected. NEXT_PUBLIC_SUPABASE_URL and
 * NEXT_PUBLIC_SUPABASE_ANON_KEY are required env (see CLAUDE.md); this only
 * changes what happens where they are absent by design, such as CI.
 */
export function getSupabaseBrowser() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""
  if (!url || !anonKey) return null

  return createBrowserClient(url, anonKey)
}
