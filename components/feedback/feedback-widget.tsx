"use client"

import { useState, useCallback } from "react"
import { usePathname } from "next/navigation"

/* ── Feedback bot widget ──────────────────────────────────────────────────
   A small, dismissible floating launcher available site-wide. Opens a short
   conversational capture: an optional 1–5 rating + a free-text message. On
   submit it may return one adaptive follow-up question (generated server-side
   in the same call, no extra round-trip) which the user can optionally answer.
   Fails soft in every direction — a broken request still thanks the user.
──────────────────────────────────────────────────────────────────────── */

type Phase = "closed" | "open" | "follow" | "done"

export function FeedbackWidget() {
  const pathname = usePathname()
  const [phase, setPhase] = useState<Phase>("closed")
  const [rating, setRating] = useState<number | null>(null)
  const [message, setMessage] = useState("")
  const [followUp, setFollowUp] = useState<string | null>(null)
  const [followText, setFollowText] = useState("")
  const [sending, setSending] = useState(false)

  const reset = useCallback(() => {
    setRating(null); setMessage(""); setFollowUp(null); setFollowText(""); setSending(false)
  }, [])

  async function submit(text: string, isFollow: boolean) {
    if (!text.trim() || sending) return
    setSending(true)
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text.trim(),
          rating: rating ?? undefined,
          source_page: pathname,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!isFollow && data?.follow_up) {
        setFollowUp(data.follow_up as string)
        setPhase("follow")
        setSending(false)
        return
      }
      setPhase("done")
    } catch {
      // Even on failure, thank the user — never make feedback feel punished.
      setPhase("done")
    }
  }

  // Don't offer the widget inside the admin console — different audience.
  if (pathname?.startsWith("/admin") || pathname?.startsWith("/cms")) return null

  if (phase === "closed") {
    return (
      <button
        onClick={() => setPhase("open")}
        aria-label="Give feedback"
        className="fixed bottom-4 right-4 z-40 flex items-center gap-2 rounded-full bg-[#2E5B3F] px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:bg-[#25492f] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4CB648]"
      >
        <span aria-hidden>💬</span> Feedback
      </button>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 z-40 w-[min(360px,calc(100vw-2rem))] rounded-2xl border border-[#e3e9dd] bg-white shadow-2xl">
      <div className="h-1.5 rounded-t-2xl bg-gradient-to-r from-[#A8E063] via-[#2DAA6E] to-[#F5A623]" />
      <div className="p-4">
        <div className="mb-2 flex items-start justify-between">
          <h2 className="text-[15px] font-bold text-[#1B2A20]">
            {phase === "done" ? "Thank you 🌱" : phase === "follow" ? "One more thing…" : "How's it going?"}
          </h2>
          <button
            onClick={() => { setPhase("closed"); reset() }}
            aria-label="Close feedback"
            className="-mt-1 rounded p-1 text-lg leading-none text-[#8a978c] hover:text-[#1B2A20]"
          >
            ×
          </button>
        </div>

        {phase === "done" && (
          <p className="text-sm leading-relaxed text-[#4a574d]">
            Your feedback goes straight to the team and genuinely shapes what we build next. We appreciate it.
          </p>
        )}

        {phase === "open" && (
          <>
            <div className="mb-3 flex gap-1.5" role="group" aria-label="Rating">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setRating(n)}
                  aria-label={`${n} star${n > 1 ? "s" : ""}`}
                  className={`text-2xl leading-none transition ${rating && n <= rating ? "text-[#F5C518]" : "text-[#d8ded2] hover:text-[#F5C518]/60"}`}
                >
                  ★
                </button>
              ))}
            </div>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              maxLength={4000}
              autoFocus
              placeholder={rating && rating <= 3 ? "What would make this better?" : "What's working, or what's on your mind?"}
              className="w-full resize-none rounded-lg border border-[#dbe3d5] bg-[#fafcf8] p-2.5 text-sm text-[#1B2A20] outline-none placeholder:text-[#9aa89d] focus:border-[#4CB648]"
            />
            <button
              onClick={() => submit(message, false)}
              disabled={!message.trim() || sending}
              className="mt-2.5 w-full rounded-full bg-[#2E5B3F] py-2.5 text-sm font-semibold text-white transition hover:bg-[#25492f] disabled:opacity-40"
            >
              {sending ? "Sending…" : "Send feedback"}
            </button>
          </>
        )}

        {phase === "follow" && (
          <>
            <p className="mb-2 text-sm leading-relaxed text-[#4a574d]">{followUp}</p>
            <textarea
              value={followText}
              onChange={(e) => setFollowText(e.target.value)}
              rows={3}
              maxLength={4000}
              autoFocus
              placeholder="Optional — add a little more"
              className="w-full resize-none rounded-lg border border-[#dbe3d5] bg-[#fafcf8] p-2.5 text-sm text-[#1B2A20] outline-none placeholder:text-[#9aa89d] focus:border-[#4CB648]"
            />
            <div className="mt-2.5 flex gap-2">
              <button
                onClick={() => setPhase("done")}
                className="flex-1 rounded-full border border-[#dbe3d5] py-2.5 text-sm font-semibold text-[#4a574d] transition hover:bg-[#f4f7f1]"
              >
                Skip
              </button>
              <button
                onClick={() => submit(followText, true)}
                disabled={!followText.trim() || sending}
                className="flex-1 rounded-full bg-[#2E5B3F] py-2.5 text-sm font-semibold text-white transition hover:bg-[#25492f] disabled:opacity-40"
              >
                {sending ? "Sending…" : "Send"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
