"use client"

import { useState } from "react"
import Image from "next/image"

export function AdminLogin({ error }: { error?: boolean }) {
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    })
    // If redirect happened (303), follow it
    if (res.redirected) {
      window.location.href = res.url
    } else {
      window.location.reload()
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <Image src="/eatobiotics-icon.webp" alt="EatoBiotics" width={36} height={36} className="h-9 w-9" />
          <span className="font-serif text-xl font-semibold tracking-tight text-foreground">EatoBiotics</span>
        </div>

        <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
          <div className="mb-6">
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Admin</span>
            <h1 className="mt-1 text-2xl font-bold font-serif">Dashboard</h1>
            <p className="mt-1 text-sm text-muted-foreground">Enter your password to continue</p>
          </div>

          {error && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              Incorrect password. Please try again.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground mb-1.5">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                required
                autoFocus
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[var(--icon-green)]/40 focus:border-[var(--icon-green)]"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !password}
              className="w-full brand-gradient rounded-xl py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
