"use client"

import { Suspense, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { getSupabaseBrowser } from "@/lib/supabase-browser"

function safeNextPath(next: string | null): string {
  if (!next) return "/account"
  if (!next.startsWith("/") || next.startsWith("//")) return "/account"
  if (next.startsWith("/auth/") || next.startsWith("/api/")) return "/account"
  return next
}

function AuthCallbackClient() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    let cancelled = false

    async function finishSignIn() {
      const nextPath = safeNextPath(searchParams.get("next"))
      const supabase = getSupabaseBrowser()
      const code = searchParams.get("code")
      const hashParams = new URLSearchParams(window.location.hash.slice(1))
      const access_token = hashParams.get("access_token")
      const refresh_token = hashParams.get("refresh_token")

      const { error } = code
        ? await supabase.auth.exchangeCodeForSession(code)
        : access_token && refresh_token
          ? await supabase.auth.setSession({ access_token, refresh_token })
          : { error: new Error("Missing callback credentials") }

      if (cancelled) return

      if (error) {
        router.replace("/account/signin")
        return
      }

      const setup = await fetch("/api/auth/setup-profile", { method: "POST" }).catch(() => null)
      if (cancelled) return

      if (!setup?.ok) {
        console.error("[auth-callback] setup-profile failed", setup?.status)
      }

      router.replace(nextPath)
    }

    finishSignIn().catch((err) => {
      console.error("[auth-callback] sign-in failed", err)
      if (!cancelled) router.replace("/account/signin")
    })

    return () => { cancelled = true }
  }, [router, searchParams])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-sm text-muted-foreground">Signing you in…</p>
    </div>
  )
}


export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><p className="text-sm text-muted-foreground">Signing you in…</p></div>}>
      <AuthCallbackClient />
    </Suspense>
  )
}
