"use client"

/**
 * components/providers/statsig-provider.tsx
 *
 * Wraps the app with Statsig's React context so that:
 *   - useGate() works in any child component
 *   - The client SDK is initialised once with NEXT_PUBLIC_STATSIG_CLIENT_KEY
 *   - The server key (STATSIG_SERVER_KEY) is NEVER used or referenced here
 *
 * User identity
 * -------------
 * Currently initialised as an anonymous user.
 * TODO: Replace the anonymous identity with the real logged-in user once the
 * Supabase auth session is available on the client. Call `client.updateUser()`
 * after login, e.g.:
 *
 *   const supabase = getSupabaseBrowser()
 *   const { data: { session } } = await supabase.auth.getSession()
 *   if (session?.user) {
 *     await client.updateUser({
 *       userID: session.user.id,
 *       email:  session.user.email,
 *     })
 *   }
 *
 * A good place to do this is in a useEffect inside this provider, or in a
 * separate <StatsigUserSync /> component that reads auth state.
 */

import { useEffect } from "react"
import { useClientAsyncInit, StatsigProvider } from "@statsig/react-bindings"
import { _registerStatsigLogger } from "@/lib/statsig-client"
import { getSupabaseBrowser } from "@/lib/supabase-browser"
import { useAnalyticsConsent } from "./use-analytics-consent"

export function StatsigClientProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const sdkKey = process.env.NEXT_PUBLIC_STATSIG_CLIENT_KEY ?? ""
  // Consent gate. The SDK sets client storage and this provider syncs the real
  // Supabase user id and email into it, so initialising before the visitor has
  // accepted contradicted the cookie banner and the Privacy Policy alike. The
  // hook is called unconditionally — an early `if (!sdkKey) return` above it
  // would change hook order between renders.
  const consented = useAnalyticsConsent()

  if (!sdkKey || !consented) {
    // Gates read false while un-consented, which is their documented safe
    // default, so every child renders as it would with Statsig unconfigured.
    return <>{children}</>
  }

  return <StatsigEnabledProvider sdkKey={sdkKey}>{children}</StatsigEnabledProvider>
}

function StatsigEnabledProvider({
  children,
  sdkKey,
}: {
  children: React.ReactNode
  sdkKey: string
}) {
  const { client } = useClientAsyncInit(
    sdkKey,
    {
      // TODO: Replace with real user identity after login (see file header).
      // For logged-in users: { userID: user.id, email: user.email }
      userID: "anonymous",
    },
    {
      environment: {
        tier: process.env.NODE_ENV === "production" ? "production" : "staging",
      },
    }
  )

  // Register the imperative logger so logEvent() in lib/statsig-client.ts works
  // from any client-side event handler without needing React context.
  useEffect(() => {
    if (!client) return
    _registerStatsigLogger((name, value, metadata) => {
      // Use the string overload: logEvent(eventName, value?, metadata?)
      client.logEvent(name, value, metadata)
    })
  }, [client])

  // Sync the real Supabase user into Statsig once available (was "anonymous"),
  // so gates, experiments, and subscription analytics key to the logged-in user.
  useEffect(() => {
    if (!client) return
    // Without Supabase env there is no session to sync; Statsig keeps the
    // anonymous identity. This provider wraps the whole app, so throwing here
    // would take down every page wherever the Statsig key is set.
    const supabase = getSupabaseBrowser()
    if (!supabase) return
    const sync = (userId?: string, email?: string | null) => {
      if (userId) client.updateUserSync({ userID: userId, email: email ?? undefined })
    }
    supabase.auth.getSession().then(({ data }) => sync(data.session?.user.id, data.session?.user.email))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) =>
      sync(session?.user.id, session?.user.email),
    )
    return () => subscription.unsubscribe()
  }, [client])

  // normally — gates default to OFF / false, which is safe.
  return <StatsigProvider client={client}>{children}</StatsigProvider>
}
