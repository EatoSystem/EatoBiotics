"use client"

/**
 * FeedbackPrompt — a light "how's it going?" card shown once after a good
 * moment: a 1–5 rating and an optional comment, submitted to /api/reviews.
 * Dismissible and remembered in localStorage so it never nags.
 *
 * This is PRIVATE product feedback. It is not a testimonial capture, and the
 * copy now says so: an earlier version invited a quote while the backend was
 * built to publish approved quotes as social proof, which would have meant
 * publishing words nobody agreed to publish.
 *
 * It also used to thank the member on failure and mark itself "done" in
 * localStorage — so a failed submission was both lost AND unrepeatable, since
 * the card never appeared again. Thanks now requires a confirmed stored row,
 * and a failure leaves the card open with their text intact.
 */
import { useEffect, useState } from "react"

type Phase = "hidden" | "ask" | "sending" | "done"

const LS_KEY = "eb_feedback_v1" // value: "done" | "dismissed"

export function FeedbackPrompt({
  source = "account",
  className = "",
}: {
  source?: "account" | "meal" | "retest" | "milestone"
  className?: string
}) {
  const [phase, setPhase] = useState<Phase>("hidden")
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [comment, setComment] = useState("")
  const [failed, setFailed] = useState(false)

  // Only show if the member hasn't already responded or dismissed.
  useEffect(() => {
    try {
      if (!localStorage.getItem(LS_KEY)) setPhase("ask")
    } catch {
      setPhase("ask")
    }
  }, [])

  function remember(v: "done" | "dismissed") {
    try { localStorage.setItem(LS_KEY, v) } catch { /* ignore */ }
  }

  function dismiss() {
    remember("dismissed")
    setPhase("hidden")
  }

  async function submit() {
    // Guards a double-click while the first request is still open.
    if (rating < 1 || phase === "sending") return
    setPhase("sending")
    setFailed(false)
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comment: comment.trim() || undefined, source }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || data?.stored !== true) {
        // Not stored: stay open, keep their words, and do NOT remember this as
        // done — otherwise the card never returns and the feedback is lost.
        setFailed(true)
        setPhase("ask")
        return
      }
    } catch {
      setFailed(true)
      setPhase("ask")
      return
    }
    remember("done")
    setPhase("done")
  }

  if (phase === "hidden") return null

  const active = hover || rating

  return (
    <div
      className={`relative rounded-2xl border p-5 ${className}`}
      style={{ borderColor: "var(--border)", background: "color-mix(in srgb, var(--icon-green) 5%, var(--card))" }}
    >
      <button
        type="button"
        aria-label="Dismiss"
        onClick={dismiss}
        className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full text-sm transition-colors hover:bg-black/5"
        style={{ color: "var(--muted-foreground)" }}
      >
        ✕
      </button>

      {phase === "done" ? (
        <div className="py-2 text-center">
          <p className="text-2xl">🌿</p>
          <p className="mt-1 font-semibold" style={{ color: "var(--foreground)" }}>Thank you — that really helps.</p>
          <p className="mt-1 text-sm" style={{ color: "var(--muted-foreground)" }}>
            Your feedback shapes what we build next.
          </p>
        </div>
      ) : (
        <>
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--icon-green)" }}>
            One quick thing
          </p>
          <h3 className="mt-1 font-serif text-lg font-bold" style={{ color: "var(--foreground)" }}>
            How&apos;s EatoBiotics going for you?
          </h3>

          {failed && (
            <p
              role="status"
              className="mt-2 rounded-lg px-2.5 py-2 text-xs leading-5"
              style={{ background: "color-mix(in srgb, var(--icon-orange) 10%, transparent)", color: "var(--muted-foreground)" }}
            >
              We couldn&apos;t send that just now. Your words are still here — try again in a moment.
            </p>
          )}

          {/* Rating */}
          <div className="mt-3 flex gap-1.5" role="radiogroup" aria-label="Rating out of 5">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={rating === n}
                aria-label={`${n} star${n > 1 ? "s" : ""}`}
                onMouseEnter={() => setHover(n)}
                onMouseLeave={() => setHover(0)}
                onFocus={() => setHover(n)}
                onBlur={() => setHover(0)}
                onClick={() => setRating(n)}
                className="text-2xl leading-none transition-transform hover:scale-110"
                style={{ color: n <= active ? "var(--icon-yellow)" : "var(--border)" }}
              >
                ★
              </button>
            ))}
          </div>

          {/* Optional comment — appears once a rating is chosen */}
          {rating > 0 && (
            <div className="mt-3">
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value.slice(0, 500))}
                rows={2}
                placeholder={rating >= 4 ? "What's working well? (optional)" : "What would make it better? (optional)"}
                className="w-full resize-none rounded-xl border p-3 text-sm outline-none focus:ring-2"
                style={{ borderColor: "var(--border)", background: "var(--card)", color: "var(--foreground)" }}
              />
              <p className="mt-2 text-[11px] leading-4" style={{ color: "var(--muted-foreground)" }}>
                This is private product feedback — it is never shown publicly. Please don&apos;t
                include personal, medical or payment details.
              </p>
              <button
                type="button"
                onClick={submit}
                disabled={phase === "sending"}
                className="mt-2 w-full rounded-full py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))" }}
              >
                {phase === "sending" ? "Sending…" : failed ? "Try again" : "Send feedback"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
