"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Gauge, UtensilsCrossed, Sprout } from "lucide-react"
import { ScrollReveal } from "@/components/scroll-reveal"

/**
 * Public pre-launch waitlist landing page.
 *
 * This is the page every visitor lands on while the site password gate is on
 * (proxy.ts redirects all traffic here). It mirrors the homepage's premium
 * look — gut hero illustration, brand-gradient headline, food imagery — while
 * capturing waitlist emails. The founder / admin password login lives at
 * /preview-access, reachable only via the discreet footer link below.
 */

const CARDS = [
  {
    icon: Gauge,
    image: "/prebiotics-1.png",
    title: "Understand Your Score",
    body: "See the health of your internal food system at a glance — a single, personal score built from how you really eat.",
  },
  {
    icon: UtensilsCrossed,
    image: "/probiotics-1.png",
    title: "Improve Your Meals",
    body: "Describe any plate and learn how it feeds the system inside you, with simple, premium guidance you can use today.",
  },
  {
    icon: Sprout,
    image: "/postbiotics-1.png",
    title: "Build Better Habits",
    body: "Turn small daily choices into lasting change — reports, recipes, and rhythms that rebuild health from the inside out.",
  },
]

const FOOD_STRIP = ["/food-1.webp", "/food-5.webp", "/food-8.webp", "/food-11.webp", "/food-14.webp", "/food-18.webp"]

const GRADIENT_BAR =
  "linear-gradient(90deg, var(--icon-lime), var(--icon-green), var(--icon-teal), var(--icon-yellow), var(--icon-orange))"

export default function WaitlistPage() {
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
    <div className="relative overflow-hidden bg-background">
      {/* ── Hero — mirrors the homepage layout ─────────────────────────── */}
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
                    background: "linear-gradient(90deg, var(--icon-lime), var(--icon-green), var(--icon-teal), var(--icon-yellow), var(--icon-orange))",
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
                      We&rsquo;ll be in touch the moment EatoBiotics opens. Thank you for
                      joining the movement.
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

      {/* Gradient divider */}
      <div style={{ height: "2px", background: GRADIENT_BAR }} />

      {/* ── Premium feature cards ──────────────────────────────────────── */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-[1100px]">
          <ScrollReveal>
            <p className="text-center text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
              What you&rsquo;ll unlock
            </p>
            <h2 className="mt-3 text-center font-serif text-3xl font-bold text-foreground sm:text-4xl">
              Your inner food system, made simple
            </h2>
          </ScrollReveal>

          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {CARDS.map(({ icon: Icon, image, title, body }, i) => (
              <ScrollReveal key={title} delay={i * 90}>
                <div className="group h-full overflow-hidden rounded-3xl border border-border bg-card transition-all hover:-translate-y-1 hover:shadow-xl">
                  <div className="relative flex h-36 items-center justify-center overflow-hidden">
                    <div
                      aria-hidden
                      className="absolute inset-0 opacity-[0.10]"
                      style={{ background: GRADIENT_BAR }}
                    />
                    <Image
                      src={image}
                      alt=""
                      width={160}
                      height={160}
                      className="relative h-24 w-24 object-contain transition-transform duration-300 group-hover:scale-110"
                    />
                  </div>
                  <div className="p-7">
                    <div
                      className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl text-white"
                      style={{ background: GRADIENT_BAR }}
                    >
                      <Icon size={20} />
                    </div>
                    <h3 className="font-serif text-xl font-bold text-foreground">{title}</h3>
                    <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">{body}</p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Food imagery strip ─────────────────────────────────────────── */}
      <section className="px-6 pb-4">
        <div className="mx-auto max-w-[1100px]">
          <ScrollReveal>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
              {FOOD_STRIP.map((src, i) => (
                <div
                  key={src}
                  className="relative aspect-square overflow-hidden rounded-2xl border border-border"
                  style={{ borderTopColor: i % 2 === 0 ? "var(--icon-green)" : "var(--icon-orange)", borderTopWidth: "3px" }}
                >
                  <Image src={src} alt="" fill sizes="(max-width: 640px) 33vw, 16vw" className="object-cover" />
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ── Founder note ───────────────────────────────────────────────── */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <ScrollReveal>
            <div className="mx-auto mb-6 h-px w-16 rounded-full" style={{ background: GRADIENT_BAR }} />
            <p className="font-serif text-xl italic leading-relaxed text-foreground sm:text-2xl">
              &ldquo;EatoBiotics is built to help individuals and families eat optimal
              for health, community, and environment.&rdquo;
            </p>
            <p className="mt-4 text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              A note from the founder
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* Discreet founder / admin access */}
      <div className="pb-16 text-center">
        <Link
          href="/preview-access"
          className="text-xs text-muted-foreground/40 transition-colors hover:text-muted-foreground"
        >
          Founder Access
        </Link>
      </div>
    </div>
  )
}
