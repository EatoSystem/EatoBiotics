"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Gauge, UtensilsCrossed, Sprout } from "lucide-react"

/**
 * Public pre-launch waitlist landing page.
 *
 * This is the page every visitor lands on while the site password gate is on
 * (proxy.ts redirects all traffic here). It replaces the old "Site Preview"
 * password wall with a premium public advert + email capture. The founder /
 * admin password login now lives at /preview-access, reachable only via the
 * discreet "Founder Access" link in the footer below.
 */

const CARDS = [
  {
    icon: Gauge,
    title: "Understand Your Score",
    body: "See the health of your internal food system at a glance — a single, personal score built from how you really eat.",
  },
  {
    icon: UtensilsCrossed,
    title: "Improve Your Meals",
    body: "Describe any plate and learn how it feeds the system inside you, with simple, premium guidance you can use today.",
  },
  {
    icon: Sprout,
    title: "Build Better Habits",
    body: "Turn small daily choices into lasting change — reports, recipes, and rhythms that rebuild health from the inside out.",
  },
]

export default function WaitlistPage() {
  const [email, setEmail]     = useState("")
  const [status, setStatus]   = useState<"idle" | "loading" | "done" | "error">("idle")
  const [message, setMessage] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (status === "loading") return
    setStatus("loading")
    setMessage("")

    try {
      const res = await fetch("/api/waitlist", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email }),
      })
      const data = (await res.json()) as { ok?: boolean; error?: string }

      if (res.ok && data.ok) {
        setStatus("done")
      } else {
        setStatus("error")
        setMessage(data.error ?? "Something went wrong. Please try again.")
      }
    } catch {
      setStatus("error")
      setMessage("Something went wrong. Please try again.")
    }
  }

  return (
    <div className="relative overflow-hidden bg-background">
      {/* Soft brand glow behind the hero */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-0 h-[520px] opacity-[0.10] blur-3xl"
        style={{
          background:
            "radial-gradient(60% 60% at 50% 0%, var(--icon-lime) 0%, var(--icon-yellow) 45%, var(--icon-orange) 75%, transparent 100%)",
        }}
      />

      <main className="relative z-10 mx-auto flex max-w-5xl flex-col items-center px-6 pb-24 pt-16 sm:pt-24">
        {/* Brand mark */}
        <div className="mb-8 flex flex-col items-center gap-4">
          <Image
            src="/eatobiotics-icon.webp"
            alt="EatoBiotics"
            width={64}
            height={64}
            className="h-16 w-16"
            priority
          />
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: "linear-gradient(135deg, var(--icon-green), var(--icon-orange))" }}
            />
            Coming soon
          </span>
        </div>

        {/* Hero */}
        <h1 className="text-center font-serif text-5xl font-bold tracking-tight text-foreground sm:text-6xl">
          EatoBiotics
        </h1>

        <h2 className="brand-gradient-text mt-5 text-center font-serif text-3xl font-bold leading-tight sm:text-5xl">
          The Food System Inside You
        </h2>

        <p className="mt-6 max-w-2xl text-center text-lg leading-relaxed text-muted-foreground sm:text-xl">
          Understand your internal food system, improve your daily habits, and
          rebuild health from the inside out.
        </p>

        {/* Waitlist capture */}
        <div className="mt-10 w-full max-w-md">
          {status === "done" ? (
            <div
              className="rounded-3xl border border-border bg-card p-8 text-center shadow-sm"
              style={{ boxShadow: "0 12px 40px -24px rgba(76, 182, 72, 0.45)" }}
            >
              <div
                className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full text-white"
                style={{ background: "linear-gradient(135deg, var(--icon-lime), var(--icon-green), var(--icon-teal))" }}
              >
                ✓
              </div>
              <p className="font-serif text-xl font-bold text-foreground">You&rsquo;re on the list</p>
              <p className="mt-2 text-sm text-muted-foreground">
                We&rsquo;ll be in touch the moment EatoBiotics opens. Thank you for joining
                the movement.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
              <input
                type="email"
                inputMode="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => { setEmail(e.target.value); if (status === "error") setStatus("idle") }}
                placeholder="you@email.com"
                className="w-full flex-1 rounded-full border bg-card px-6 py-4 text-base text-foreground placeholder:text-muted-foreground/50 outline-none transition-all focus:ring-2"
                style={{
                  borderColor: "var(--border)",
                  // @ts-expect-error css variable
                  "--tw-ring-color": "var(--icon-green)",
                }}
              />
              <button
                type="submit"
                disabled={status === "loading" || !email}
                className="shrink-0 rounded-full px-7 py-4 text-base font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, var(--icon-lime), var(--icon-green), var(--icon-teal))" }}
              >
                {status === "loading" ? "Joining…" : "Join the Waitlist"}
              </button>
            </form>
          )}

          {status === "error" && (
            <p className="mt-3 text-center text-sm font-medium text-red-500">{message}</p>
          )}

          {status !== "done" && (
            <p className="mt-4 text-center text-sm text-muted-foreground">
              Be first to access the EatoBiotics assessment, report, meal scoring,
              recipes, and membership.
            </p>
          )}
        </div>

        {/* Premium feature cards */}
        <div className="mt-20 grid w-full gap-6 sm:grid-cols-3">
          {CARDS.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="group rounded-3xl border border-border bg-card p-7 text-left transition-all hover:-translate-y-1 hover:shadow-lg"
            >
              <div
                className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl text-white"
                style={{ background: "linear-gradient(135deg, var(--icon-lime), var(--icon-green), var(--icon-teal))" }}
              >
                <Icon size={22} />
              </div>
              <h3 className="font-serif text-xl font-bold text-foreground">{title}</h3>
              <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>

        {/* Founder note */}
        <div className="mt-20 w-full max-w-2xl text-center">
          <div
            className="mx-auto mb-6 h-px w-16 rounded-full"
            style={{ background: "linear-gradient(90deg, var(--icon-lime), var(--icon-yellow), var(--icon-orange))" }}
          />
          <p className="font-serif text-xl italic leading-relaxed text-foreground sm:text-2xl">
            &ldquo;EatoBiotics is built to help individuals and families eat optimal
            for health, community, and environment.&rdquo;
          </p>
          <p className="mt-4 text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            A note from the founder
          </p>
        </div>

        {/* Discreet founder / admin access */}
        <div className="mt-24 text-center">
          <Link
            href="/preview-access"
            className="text-xs text-muted-foreground/40 transition-colors hover:text-muted-foreground"
          >
            Founder Access
          </Link>
        </div>
      </main>
    </div>
  )
}
