"use client"

import { useState } from "react"

type Errors = Partial<Record<"name" | "email" | "why" | "consent", string>>

export function ApplyForm() {
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [errors, setErrors] = useState<Errors>({})
  const [hp, setHp] = useState("") // honeypot

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (submitting) return
    setSubmitting(true)
    setErrors({})
    const fd = new FormData(e.currentTarget)
    const payload = {
      name: String(fd.get("name") || "").trim(),
      email: String(fd.get("email") || "").trim(),
      why: String(fd.get("why") || "").trim(),
      focus: String(fd.get("focus") || "").trim(),
      referral: String(fd.get("referral") || "").trim(),
      consent: fd.get("consent") === "on",
      website: hp,
    }
    const res = await fetch("/api/founding/apply", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    })
    if (res.ok) {
      setSubmitted(true)
    } else if (res.status === 400) {
      const data = await res.json()
      setErrors(data.errors || {})
    } else {
      alert("Something went wrong. Please try again.")
    }
    setSubmitting(false)
  }

  if (submitted) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="font-serif text-2xl font-semibold">Application received</h2>
        <p className="mt-2 text-muted-foreground">
          Thanks — you’re in the queue for the Founding 100. We’ll email you if you’re admitted (and if we’re full, you’ll stay lined up for the Next 1,000).
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="rounded-2xl border border-border bg-card p-6 space-y-4">
      <div>
        <label className="block text-sm font-medium">Name</label>
        <input name="name" required className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-[var(--icon-green)]" />
        {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium">Email</label>
        <input type="email" name="email" required className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-[var(--icon-green)]" />
        {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium">Why do you want to join?</label>
        <textarea name="why" required rows={4} className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-[var(--icon-green)]" />
        {errors.why && <p className="mt-1 text-sm text-red-600">{errors.why}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium">Optional focus (what you’d like help with)</label>
        <input name="focus" className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-[var(--icon-green)]" />
      </div>
      <div>
        <label className="block text-sm font-medium">Referral code (optional)</label>
        <input name="referral" className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-[var(--icon-green)]" />
      </div>
      {/* Honeypot (visually hidden) */}
      <div aria-hidden className="sr-only">
        <label>Website</label>
        <input value={hp} onChange={(e) => setHp(e.target.value)} tabIndex={-1} autoComplete="off" />
      </div>
      <div className="flex items-start gap-2">
        <input id="consent" name="consent" type="checkbox" className="mt-1" />
        <label htmlFor="consent" className="text-sm text-muted-foreground">
          I agree to the <a className="underline" href="/privacy" target="_blank" rel="noreferrer">Privacy Policy</a> and <a className="underline" href="/terms" target="_blank" rel="noreferrer">Terms</a>.
        </label>
      </div>
      {errors.consent && <p className="-mt-2 text-sm text-red-600">{errors.consent}</p>}
      <div className="pt-2">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center rounded-full bg-[var(--icon-green)] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
        >
          {submitting ? "Submitting…" : "Submit application"}
        </button>
      </div>
    </form>
  )
}

