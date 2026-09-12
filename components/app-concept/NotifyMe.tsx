"use client"

/**
 * Concept notify-me capture. VISUAL MOCK ONLY — it does not submit anywhere
 * (the concept-page convention forbids backend/conversion changes). If this
 * landing is ever promoted, wire onSubmit to POST /api/waitlist. Concept-only.
 */
import { useState } from "react"
import { APP } from "./theme"

export function NotifyMe() {
  const [email, setEmail] = useState("")
  const [done, setDone] = useState(false)

  if (done) {
    return (
      <div className="flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
        style={{ background: "rgba(46,91,63,0.1)", border: `1px solid ${APP.green}`, color: APP.green }}>
        ✓ You&apos;re on the list — we&apos;ll email you the moment it lands.
      </div>
    )
  }

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); if (email.includes("@")) setDone(true) }}
      className="flex w-full max-w-md flex-col gap-2 sm:flex-row"
    >
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        className="flex-1 rounded-full px-5 py-3 text-sm outline-none"
        style={{ background: APP.card, border: `1.5px solid ${APP.border}`, color: APP.ink }}
      />
      <button type="submit" className="rounded-full px-6 py-3 text-sm font-bold text-white" style={{ background: APP.green }}>
        Notify me
      </button>
    </form>
  )
}
