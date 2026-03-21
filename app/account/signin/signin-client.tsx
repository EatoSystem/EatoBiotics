"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { getSupabaseBrowser } from "@/lib/supabase-browser"

export function SignInClient() {
  const searchParams = useSearchParams()
  const emailParam = searchParams.get("email") ?? ""

  const [email, setEmail] = useState(emailParam)
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Auto-send the magic link if an email param was provided
  useEffect(() => {
    if (emailParam) {
      sendMagicLink(emailParam)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [emailParam])

  async function sendMagicLink(target: string) {
    if (!target || loading) return
    setLoading(true)
    setError(null)
    try {
      const supabase = getSupabaseBrowser()
      const { error: authError } = await supabase.auth.signInWithOtp({
        email: target,
        options: {
          emailRedirectTo: `${window.location.origin}/api/auth/callback?next=/account`,
        },
      })
      if (authError) {
        setError("Something went wrong. Please try again.")
      } else {
        setSent(true)
      }
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (email) sendMagicLink(email)
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-8 text-center space-y-5">
      {/* Icon */}
      <div className="w-12 h-12 rounded-full bg-[var(--icon-green)]/10 flex items-center justify-center mx-auto">
        <span className="text-2xl">🌿</span>
      </div>

      <div className="space-y-1">
        <h1 className="font-serif text-2xl font-semibold text-foreground">
          Access your account
        </h1>
        <p className="text-sm text-muted-foreground">
          We&rsquo;ll send a magic link to your email — no password needed.
        </p>
      </div>

      {sent ? (
        <div className="space-y-3">
          <div className="rounded-xl border border-[var(--icon-green)]/30 bg-[var(--icon-green)]/5 px-4 py-3">
            <p className="text-sm font-medium text-[var(--icon-green)]">
              ✓ Check your email for a sign-in link
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Sent to {email || emailParam}
            </p>
          </div>
          <button
            onClick={() => { setSent(false) }}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
          >
            Use a different email
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-[var(--icon-green)] focus:outline-none focus:ring-1 focus:ring-[var(--icon-green)]"
          />
          {error && (
            <p className="text-xs text-red-500">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading || !email}
            className="w-full brand-gradient text-white text-sm font-semibold px-6 py-3 rounded-full disabled:opacity-60 transition-opacity"
          >
            {loading ? "Sending link…" : "Send sign-in link →"}
          </button>
        </form>
      )}
    </div>
  )
}
