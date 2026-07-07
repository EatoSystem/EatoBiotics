"use client"

import { useState } from "react"
import { Check } from "lucide-react"

type State = "idle" | "loading" | "done" | "error"

export function UnsubscribeClient({
  email: initialEmail,
  token,
  done,
}: {
  email: string
  token: string
  done: boolean
}) {
  const [email, setEmail] = useState(initialEmail)
  const [state, setState] = useState<State>(done ? "done" : "idle")
  const [message, setMessage] = useState("")

  async function submit() {
    if (!email) {
      setState("error")
      setMessage("Please enter your email address.")
      return
    }
    setState("loading")
    setMessage("")
    try {
      const res = await fetch("/api/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token: token || undefined }),
      })
      const data = (await res.json()) as { ok?: boolean; error?: string }
      if (res.ok && data.ok) {
        setState("done")
      } else {
        setState("error")
        setMessage(data.error ?? "Something went wrong. Please try again.")
      }
    } catch {
      setState("error")
      setMessage("Something went wrong. Please try again.")
    }
  }

  if (state === "done") {
    return (
      <div className="flex flex-col items-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary">
          <Check size={26} className="text-icon-green" />
        </div>
        <h1 className="mt-5 font-serif text-2xl font-bold text-foreground">You&rsquo;re unsubscribed</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {email ? <><strong className="text-foreground">{email}</strong> has been removed.</> : "You&rsquo;ve been removed."}{" "}
          You won&rsquo;t receive further marketing emails from EatoBiotics. Account and
          transactional emails (like sign-in links) may still be sent.
        </p>
      </div>
    )
  }

  return (
    <div className="flex w-full flex-col items-center">
      <h1 className="font-serif text-2xl font-bold text-foreground">Unsubscribe</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        Confirm you&rsquo;d like to stop receiving EatoBiotics marketing emails.
      </p>

      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        className="mt-6 w-full rounded-full border border-border bg-card px-5 py-3 text-center text-sm text-foreground outline-none focus:border-icon-green"
      />

      {state === "error" && <p className="mt-3 text-sm text-red-500">{message}</p>}

      <button
        onClick={submit}
        disabled={state === "loading"}
        className="brand-gradient mt-5 w-full rounded-full px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {state === "loading" ? "Unsubscribing…" : "Unsubscribe"}
      </button>
    </div>
  )
}
