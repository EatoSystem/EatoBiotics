"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { getSupabaseBrowser } from "@/lib/supabase-browser"

export function AccountNavItem() {
  const [isSignedIn, setIsSignedIn] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const supabase = getSupabaseBrowser()
    // Check current session
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsSignedIn(!!user)
      setLoaded(true)
    })
    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsSignedIn(!!session?.user)
    })
    return () => subscription.unsubscribe()
  }, [])

  if (!loaded) return null

  if (!isSignedIn) return (
    <Link
      href="/assessment?signin=1"
      className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
    >
      Log in
    </Link>
  )

  return (
    <Link
      href="/account"
      className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
    >
      <span className="w-2 h-2 rounded-full bg-[var(--icon-green)]" />
      My Account
    </Link>
  )
}
