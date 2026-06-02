"use client"

import { useEffect } from "react"
import posthog from "posthog-js"

/**
 * Root error boundary — catches otherwise-unhandled render errors anywhere in
 * the app, reports them to PostHog as an exception event, and shows a minimal
 * recoverable fallback. (Replaces the root layout when it renders, so it ships
 * its own <html>/<body>.)
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    try {
      posthog.capture("$exception", {
        $exception_message: error.message,
        $exception_type: error.name,
        digest: error.digest,
      })
    } catch {
      /* never let reporting throw */
    }
  }, [error])

  return (
    <html lang="en">
      <body
        style={{
          display: "flex",
          minHeight: "100vh",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
          padding: 24,
          textAlign: "center",
        }}
      >
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Something went wrong</h1>
          <p style={{ color: "#5A6E50", marginBottom: 20 }}>
            An unexpected error occurred. Please try again.
          </p>
          <button
            onClick={() => reset()}
            style={{
              background: "#4CB648",
              color: "white",
              border: "none",
              borderRadius: 9999,
              padding: "10px 22px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
