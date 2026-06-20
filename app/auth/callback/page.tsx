"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseBrowser } from "@/lib/supabase-browser"

/**
 * Magic-link landing page.
 *
 * Supabase can return the session in two different shapes depending on the
 * project's auth flow:
 *   1. Implicit flow  → tokens in the URL hash (#access_token=…&refresh_token=…)
 *   2. PKCE flow      → an authorization ?code=… in the query string
 * It can also send ?token_hash=…&type=… for email OTP links. We handle all of
 * them here so sign-in works regardless of how the Supabase project is set up.
 * On success we finish profile setup and land the user on /account; on failure
 * we send them to the sign-in screen instead of leaving them stuck.
 */
export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    const supabase = getSupabaseBrowser()

    async function completeSignIn() {
      const url = new URL(window.location.href)
      const hash = new URLSearchParams(window.location.hash.slice(1))

      const accessToken = hash.get("access_token")
      const refreshToken = hash.get("refresh_token")
      const code = url.searchParams.get("code")
      const tokenHash = url.searchParams.get("token_hash")
      const otpType = url.searchParams.get("type")
      const errorDescription =
        url.searchParams.get("error_description") ?? hash.get("error_description")

      if (errorDescription) {
        console.error("[auth/callback] Provider returned an error:", errorDescription)
        router.replace("/account/signin?error=link_invalid")
        return
      }

      try {
        if (accessToken && refreshToken) {
          // Implicit flow — tokens already present in the hash.
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })
          if (error) throw error
        } else if (code) {
          // PKCE flow — exchange the authorization code for a session.
          const { error } = await supabase.auth.exchangeCodeForSession(code)
          if (error) throw error
        } else if (tokenHash) {
          // Email OTP link.
          const { error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            type: (otpType as any) ?? "magiclink",
          })
          if (error) throw error
        } else {
          console.error("[auth/callback] No auth credentials found in callback URL")
          router.replace("/account/signin?error=link_invalid")
          return
        }
      } catch (err) {
        console.error("[auth/callback] Sign-in failed:", err)
        router.replace("/account/signin?error=link_expired")
        return
      }

      // Trigger profile setup + lead linking (non-critical, fire-and-forget).
      try {
        await fetch("/api/auth/setup-profile", { method: "POST" })
      } catch {
        /* non-fatal — profile is also created in the server callback route */
      }
      router.replace("/account")
    }

    void completeSignIn()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-sm text-muted-foreground">Signing you in…</p>
    </div>
  )
}
