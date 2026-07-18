"use client"

/**
 * Concept notify-me capture. VISUAL MOCK ONLY — it does not submit anywhere
 * (the concept-page convention forbids backend/conversion changes). If this
 * landing is ever promoted, wire onSubmit to POST /api/waitlist. Concept-only.
 */
import { useState } from "react"

export function NotifyMe() {
  const [email, setEmail] = useState("")
  const [done, setDone] = useState(false)

  if (done) {
    return (
      <div className="flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
        style={{ background: "rgba(168,224,99,0.14)", border: "1px solid rgba(168,224,99,0.4)", color: "#A8E063" }}>
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
        style={{ background: "rgba(253,251,247,0.08)", border: "1px solid rgba(253,251,247,0.2)", color: "#FDFBF7" }}
      />
      <button
        type="submit"
        className="rounded-full px-6 py-3 text-sm font-bold text-white"
        style={{ background: "linear-gradient(135deg, #4CB648, #2DAA6E)" }}
      >
        Notify me
      </button>
    </form>
  )
}
