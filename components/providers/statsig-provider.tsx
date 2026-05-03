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

export function StatsigClientProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const sdkKey = process.env.NEXT_PUBLIC_STATSIG_CLIENT_KEY ?? ""

  if (!sdkKey) {
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

  // normally — gates default to OFF / false, which is safe.
  return <StatsigProvider client={client}>{children}</StatsigProvider>
}
