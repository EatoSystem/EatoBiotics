"use client"

import { useState, useEffect, useRef } from "react"
import { useSearchParams } from "next/navigation"

const RESEND_COOLDOWN_SECONDS = 30
const SUPPORT_EMAIL = "hello@eatobiotics.com"

export function SignInClient() {
  const searchParams = useSearchParams()
  const emailParam = searchParams.get("email") ?? ""

  const [email, setEmail]       = useState(emailParam)
  const [sent, setSent]         = useState(false)
  const [deliveryWarn, setWarn] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [cooldown, setCooldown] = useState(0)
  const cooldownTimer           = useRef<ReturnType<typeof setInterval> | null>(null)

  // Auto-send if an email param was provided.
  useEffect(() => {
    if (emailParam) sendMagicLink(emailParam)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [emailParam])

  // Clean up the cooldown interval on unmount.
  useEffect(() => {
    return () => { if (cooldownTimer.current) clearInterval(cooldownTimer.current) }
  }, [])

  function startCooldown() {
    setCooldown(RESEND_COOLDOWN_SECONDS)
    if (cooldownTimer.current) clearInterval(cooldownTimer.current)
    cooldownTimer.current = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) { if (cooldownTimer.current) clearInterval(cooldownTimer.current); return 0 }
        return c - 1
      })
    }, 1000)
  }

  async function sendMagicLink(target: string) {
    if (!target || loading) return
    setLoading(true)
    setError(null)
    setWarn(false)
    try {
      const res = await fetch("/api/auth/send-magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: target }),
      })
      const data: { ok?: boolean; error?: string; delivered?: boolean; skipped?: boolean } = await res.json()
      if (data.error) {
        setError("We couldn't send your sign-in link. Please try again.")
      } else {
        setSent(true)
        // delivered:false signals Resend rejected the send OR we're in dev with no key.
        // Either way the user shouldn't blindly wait for an email that's not coming.
        if (data.delivered === false && !data.skipped) {
          setWarn(true)
        }
        startCooldown()
      }
    } catch {
      setError("We couldn't send your sign-in link. Please try again.")
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
      <div className="w-12 h-12 rounded-full bg-[var(--icon-green)]/10 flex items-center justify-center mx-auto" aria-hidden="true">
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
        <div className="space-y-4">
          <div
            role="status"
            className={
              "rounded-xl border px-4 py-3 text-left " +
              (deliveryWarn
                ? "border-amber-300 bg-amber-50"
                : "border-[var(--icon-green)]/30 bg-[var(--icon-green)]/5")
            }
          >
            <p className={
              "text-sm font-medium " +
              (deliveryWarn ? "text-amber-700" : "text-[var(--icon-green)]")
            }>
              {deliveryWarn ? "We had trouble sending your link" : "✓ Check your email for a sign-in link"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {deliveryWarn ? "Try again, or contact us if it keeps failing." : `Sent to ${email || emailParam}`}
            </p>
            {!deliveryWarn && (
              <p className="mt-2 text-xs text-muted-foreground">
                Not in your inbox? Check your spam or promotions folder.
              </p>
            )}
          </div>

          <div className="flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={() => sendMagicLink(email || emailParam)}
              disabled={loading || cooldown > 0}
              className="text-sm font-medium text-foreground underline underline-offset-2 disabled:text-muted-foreground disabled:no-underline disabled:cursor-not-allowed"
            >
              {loading
                ? "Sending…"
                : cooldown > 0
                ? `Resend in ${cooldown}s`
                : "Resend the email"}
            </button>
            <button
              type="button"
              onClick={() => { setSent(false); setWarn(false); setError(null) }}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
            >
              Use a different email
            </button>
            <a
              href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("Trouble signing in")}`}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
            >
              Email support
            </a>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <label htmlFor="signin-email" className="sr-only">Email address</label>
          <input
            id="signin-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
            autoComplete="email"
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-[var(--icon-green)] focus:outline-none focus:ring-1 focus:ring-[var(--icon-green)]"
          />
          {error && (
            <p role="alert" className="text-xs text-red-500">{error}</p>
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
