"use client"

/**
 * useTwinRealtime — keeps the Living Twin feeling live.
 *
 * 1) Subscribes (best-effort) to INSERTs on the member's `analyses` rows via
 *    Supabase Realtime; a new meal → router.refresh() re-derives the Twin. Wrapped
 *    so it silently no-ops if Realtime isn't enabled on the table (RLS already
 *    scopes rows to the user, so the subscription is per-user safe).
 * 2) Zero-infra fallback: refreshes when the tab becomes visible again, so the
 *    Twin re-derives on return even without Realtime.
 */

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseBrowser } from "@/lib/supabase-browser"

export function useTwinRealtime(userId: string | null, onNewMeal?: () => void) {
  const router = useRouter()
  const onNewMealRef = useRef(onNewMeal)
  onNewMealRef.current = onNewMeal

  useEffect(() => {
    if (!userId) return

    // (1) Realtime subscription — best-effort.
    let cleanup: (() => void) | undefined
    try {
      const supabase = getSupabaseBrowser()
      const channel = supabase
        .channel("twin-analyses")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "analyses", filter: `user_id=eq.${userId}` },
          () => {
            onNewMealRef.current?.()
            router.refresh()
          },
        )
        .subscribe()
      cleanup = () => {
        try { supabase.removeChannel(channel) } catch { /* ignore */ }
      }
    } catch {
      /* Realtime unavailable — the visibility fallback still applies. */
    }

    // (2) Refresh when returning to the tab.
    const onVisible = () => {
      if (document.visibilityState === "visible") router.refresh()
    }
    document.addEventListener("visibilitychange", onVisible)

    return () => {
      cleanup?.()
      document.removeEventListener("visibilitychange", onVisible)
    }
  }, [userId, router])
}
