"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseBrowser } from "@/lib/supabase-browser"

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    const hash = window.location.hash.slice(1)
    const params = new URLSearchParams(hash)
    const access_token = params.get("access_token")
    const refresh_token = params.get("refresh_token")

    if (!access_token || !refresh_token) {
      router.replace("/account/signin")
      return
    }

    const supabase = getSupabaseBrowser()
    supabase.auth.setSession({ access_token, refresh_token }).then(({ error }) => {
      if (error) {
        router.replace("/account/signin")
        return
      }
      // Trigger profile setup (fire-and-forget — non-critical)
      fetch("/api/auth/setup-profile", { method: "POST" }).catch(() => {})
      router.replace("/account")
    })
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-sm text-muted-foreground">Signing you in…</p>
    </div>
  )
}
