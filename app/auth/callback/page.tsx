"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseBrowser } from "@/lib/supabase-browser"

const TIMEOUT_MS = 10_000

export default function AuthCallbackPage() {
  const router = useRouter()
  const [stuck, setStuck] = useState(false)

  useEffect(() => {
    const hash = window.location.hash.slice(1)
    const params = new URLSearchParams(hash)
    const access_token = params.get("access_token")
    const refresh_token = params.get("refresh_token")

    if (!access_token || !refresh_token) {
      router.replace("/account/signin")
      return
    }

    // If setSession or the network hangs, escape after TIMEOUT_MS so the user
    // doesn't sit on "Signing you in…" indefinitely.
    const stuckTimer = setTimeout(() => setStuck(true), TIMEOUT_MS)

    const supabase = getSupabaseBrowser()
    supabase.auth.setSession({ access_token, refresh_token }).then(({ error }) => {
      clearTimeout(stuckTimer)
      if (error) {
        router.replace("/account/signin?error=session")
        return
      }
      // Profile setup is intentionally fire-and-forget; the API is idempotent
      // and retries cleanly on the next visit if it fails.
      fetch("/api/auth/setup-profile", { method: "POST" }).catch(() => {})
      router.replace("/account")
    }).catch(() => {
      clearTimeout(stuckTimer)
      setStuck(true)
    })

    return () => clearTimeout(stuckTimer)
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      {stuck ? (
        <div className="max-w-sm text-center space-y-4">
          <p className="font-serif text-xl font-semibold text-foreground">
            That's taking longer than expected
          </p>
          <p className="text-sm text-muted-foreground">
            Your sign-in link may have expired, or the connection stalled. Try requesting a fresh link.
          </p>
          <button
            onClick={() => router.replace("/account/signin")}
            className="brand-gradient text-white text-sm font-semibold px-6 py-2.5 rounded-full"
          >
            Back to sign-in
          </button>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground" role="status">Signing you in…</p>
      )}
    </div>
  )
}
