"use client"

import { useState } from "react"
import Image from "next/image"
import { ArrowRight } from "lucide-react"
import { ScrollReveal } from "@/components/scroll-reveal"

const GRADIENT_BAR =
  "linear-gradient(90deg, var(--icon-lime), var(--icon-green), var(--icon-teal), var(--icon-yellow), var(--icon-orange))"

/**
 * Waitlist hero with email capture — the only bespoke part of the gated
 * landing page. Everything below it on /enter reuses the real homepage
 * showcase sections. Posts to /api/waitlist (which sends the confirmation
 * email). Kept as a client component for the form state.
 */
export function WaitlistHero() {
  const [email, setEmail]   = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle")
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
    <section className="relative px-6 pt-24 pb-16 md:pb-20">
      <div className="relative z-10 mx-auto flex max-w-[1200px] flex-col items-center gap-12 md:flex-row md:gap-16 lg:gap-20">

        {/* Left: gut hero illustration with brand glow */}
        <ScrollReveal delay={60} className="flex-1 flex items-center justify-center w-full max-w-[520px]">
          <div className="relative w-full">
            <div
              aria-hidden
              className="absolute inset-0 -z-10 blur-3xl"
              style={{ background: "radial-gradient(60% 60% at 50% 48%, rgba(76,182,72,0.22), rgba(245,166,35,0.12) 55%, transparent 78%)" }}
            />
            <Image
              src="/images/hero-gut.png"
              alt="The food system inside you — gut microbiome illustration"
              width={900}
              height={900}
              priority
              className="w-full h-auto max-h-[70vw] object-contain md:max-h-none"
            />
          </div>
        </ScrollReveal>

        {/* Right: waitlist content */}
        <div className="flex-1 text-left max-w-[560px] w-full">
          <ScrollReveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: GRADIENT_BAR }} />
              Coming soon · Join the waitlist
            </span>
          </ScrollReveal>

          <ScrollReveal delay={80}>
            <h1 className="mt-5 font-serif text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl text-balance">
              <span style={{ color: "var(--icon-green)" }}>The Food System</span>{" "}
              <span
                style={{
                  background: GRADIENT_BAR,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Inside You
              </span>
            </h1>
          </ScrollReveal>

          <ScrollReveal delay={140}>
            <p className="mt-5 max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg">
              Understand your internal food system, improve your daily habits, and
              rebuild health from the inside out.
            </p>
          </ScrollReveal>

          {/* Email capture */}
          <ScrollReveal delay={200}>
            <div className="mt-8 w-full max-w-md">
              {status === "done" ? (
                <div
                  className="rounded-3xl border border-border bg-card p-7 text-center"
                  style={{ boxShadow: "0 16px 50px -28px rgba(76, 182, 72, 0.55)" }}
                >
                  <div
                    className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full text-white"
                    style={{ background: GRADIENT_BAR }}
                  >
                    ✓
                  </div>
                  <p className="font-serif text-xl font-bold text-foreground">You&rsquo;re on the list</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    We&rsquo;ll be in touch the moment EatoBiotics opens. Check your inbox for a
                    confirmation. Thank you for joining the movement.
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
                    className="brand-gradient inline-flex shrink-0 items-center justify-center gap-2 rounded-full px-7 py-4 text-base font-semibold text-white shadow-lg shadow-icon-green/20 transition-all hover:opacity-90 disabled:opacity-50"
                  >
                    {status === "loading" ? "Joining…" : <>Join the Waitlist <ArrowRight size={16} /></>}
                  </button>
                </form>
              )}

              {status === "error" && (
                <p className="mt-3 text-sm font-medium text-red-500">{message}</p>
              )}

              {status !== "done" && (
                <p className="mt-4 text-sm text-muted-foreground">
                  Be first to access the EatoBiotics assessment, report, meal scoring,
                  recipes, and membership.
                </p>
              )}
            </div>
          </ScrollReveal>

          {/* Stat row — matches homepage */}
          <ScrollReveal delay={300}>
            <div className="mt-8 flex items-center gap-6">
              {[
                { num: "Free", label: "To join" },
                { num: "Early", label: "Access" },
                { num: "2026", label: "Launching" },
              ].map((s, i) => (
                <div key={s.label} className="flex items-center gap-5">
                  {i > 0 && <div className="h-5 w-px bg-border" />}
                  <div>
                    <p className="font-serif text-lg font-bold text-foreground">{s.num}</p>
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{s.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  )
}
