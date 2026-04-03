"use client"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import { useSearchParams } from "next/navigation"
import { Suspense } from "react"

function EnterForm() {
  const searchParams = useSearchParams()
  const from = searchParams.get("from") ?? "/"

  const [password, setPassword] = useState("")
  const [error, setError]       = useState(false)
  const [loading, setLoading]   = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(false)
    setLoading(true)

    try {
      const res  = await fetch("/api/enter", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ password }),
      })
      const data = await res.json() as { ok: boolean }

      if (data.ok) {
        window.location.href = from
      } else {
        setError(true)
        setPassword("")
        inputRef.current?.focus()
      }
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6"
      style={{ background: "var(--background)" }}>

      {/* Card */}
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="mb-10 flex flex-col items-center gap-3">
          <Image
            src="/eatobiotics-icon.webp"
            alt="EatoBiotics"
            width={56}
            height={56}
            className="h-14 w-14"
          />
          <p className="font-serif text-xl font-semibold text-foreground">EatoBiotics</p>
          <div
            className="h-px w-12 rounded-full"
            style={{ background: "linear-gradient(90deg, var(--icon-lime), var(--icon-orange))" }}
          />
        </div>

        {/* Heading */}
        <h1 className="mb-2 text-center font-serif text-2xl font-bold text-foreground">
          Site Preview
        </h1>
        <p className="mb-8 text-center text-sm text-muted-foreground">
          Enter the access password to continue.
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              ref={inputRef}
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(false) }}
              placeholder="Password"
              autoComplete="current-password"
              required
              className="w-full rounded-2xl border bg-card px-5 py-3.5 text-base text-foreground placeholder:text-muted-foreground/50 outline-none transition-all focus:ring-2"
              style={{
                borderColor: error
                  ? "color-mix(in srgb, #ef4444 50%, var(--border))"
                  : "var(--border)",
                // @ts-expect-error css variable
                "--tw-ring-color": "var(--icon-green)",
              }}
            />
            {error && (
              <p className="mt-2 text-center text-sm font-medium text-red-400">
                Incorrect password. Try again.
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !password}
            className="w-full rounded-full py-3.5 text-base font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, var(--icon-lime), var(--icon-green), var(--icon-teal))" }}
          >
            {loading ? "Checking…" : "Enter"}
          </button>
        </form>

        {/* Footer */}
        <p className="mt-8 text-center text-xs text-muted-foreground/50">
          EatoBiotics — Development Preview
        </p>
      </div>
    </div>
  )
}

export default function EnterPage() {
  return (
    <Suspense>
      <EnterForm />
    </Suspense>
  )
}
