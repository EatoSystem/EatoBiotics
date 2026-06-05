"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { EB_CONSENT_KEY, EB_CONSENT_EVENT } from "@/lib/consent"

const STORAGE_KEY = EB_CONSENT_KEY

export function CookieConsent() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (!stored) setVisible(true)
    } catch {
      // localStorage unavailable (SSR guard)
    }
  }, [])

  function accept() {
    try {
      localStorage.setItem(STORAGE_KEY, "accepted")
      window.dispatchEvent(new Event(EB_CONSENT_EVENT))
    } catch { /* noop */ }
    setVisible(false)
  }

  function decline() {
    try { localStorage.setItem(STORAGE_KEY, "declined") } catch { /* noop */ }
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 md:bottom-4 md:left-auto md:right-4 md:max-w-sm"
      role="dialog"
      aria-label="Cookie consent"
    >
      <div
        className="overflow-hidden rounded-2xl shadow-2xl"
        style={{
          background: "var(--background)",
          border: "1px solid var(--border)",
          boxShadow: "0 8px 40px rgba(0,0,0,0.18)",
        }}
      >
        {/* Top accent */}
        <div className="h-[3px]" style={{ background: "linear-gradient(90deg, var(--icon-green), var(--icon-teal), var(--icon-yellow))" }} />

        <div className="px-5 py-4">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--icon-green)" }}>
            Cookies
          </p>
          <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
            We use cookies to improve your experience
          </p>
          <p className="mt-1.5 text-xs leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
            Essential cookies keep you signed in. Analytics cookies help us understand how the app is used.{" "}
            <Link href="/privacy" className="underline transition-opacity hover:opacity-70" style={{ color: "var(--icon-green)" }}>
              Privacy Policy
            </Link>
          </p>

          <div className="mt-4 flex gap-2">
            <button
              onClick={accept}
              className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))" }}
            >
              Accept all
            </button>
            <button
              onClick={decline}
              className="flex-1 rounded-xl py-2.5 text-sm font-semibold transition-colors"
              style={{
                background: "var(--background)",
                border: "1px solid var(--border)",
                color: "var(--muted-foreground)",
              }}
            >
              Essential only
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
