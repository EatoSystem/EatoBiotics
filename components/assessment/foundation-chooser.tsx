"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { User, Users, ArrowRight, Sparkles } from "lucide-react"
import { ScrollReveal } from "@/components/scroll-reveal"
import { patchJourney, getJourney, completedFoundations } from "@/lib/assessment/journey"
import { HEALTH_SYSTEMS, FOUNDATIONS, type FoundationKey } from "@/lib/assessment/registry"
import { ensureHydrated } from "@/lib/assessment/sync"

const FOUNDATION_CARDS: Array<{
  key: FoundationKey
  icon: typeof User
  title: string
  tagline: string
  blurb: string
  cta: string
  accent: string
}> = [
  {
    key: "you",
    icon: User,
    title: "You",
    tagline: "The Food System Inside You",
    blurb: "Your personal Food System foundation — habits, rhythm, diversity, digestion, and the priorities that matter most for you.",
    cta: "Start with You",
    accent: "var(--icon-green)",
  },
  {
    key: "family",
    icon: Users,
    title: "Family",
    tagline: "The Food System Inside Your Family",
    blurb: "Your household Food System foundation — shared meals, routines, shopping, and the priorities that support everyone at the table.",
    cta: "Start with Family",
    accent: "var(--icon-teal)",
  },
]

export function FoundationChooser() {
  const router = useRouter()
  const [pendingAddon, setPendingAddon] = useState<string | null>(null)
  const [doneFoundations, setDoneFoundations] = useState<FoundationKey[]>([])

  useEffect(() => {
    setPendingAddon(getJourney().pendingAddon)
    setDoneFoundations(completedFoundations())
    void (async () => {
      await ensureHydrated() // returning signed-in users: reflect synced foundation state
      setDoneFoundations(completedFoundations())
    })()
  }, [])

  const pendingLabel = pendingAddon && pendingAddon in HEALTH_SYSTEMS ? HEALTH_SYSTEMS[pendingAddon as keyof typeof HEALTH_SYSTEMS].label : null

  function choose(key: FoundationKey) {
    patchJourney({ foundationType: key })
    router.push(FOUNDATIONS[key].route)
  }

  return (
    <section className="px-6 pt-28 pb-24 md:pt-32">
      <div className="mx-auto max-w-[920px]">
        <ScrollReveal>
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-icon-green">The Assessment</p>
            <h1 className="mt-4 font-serif text-4xl font-bold leading-[1.1] text-foreground sm:text-5xl text-balance">
              Start with your{" "}
              <span className="brand-gradient-text">Food System foundation.</span>
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
              Every EatoBiotics journey begins with You or Family. Choose who this assessment is for —
              then add a focused assessment when you want deeper support.
            </p>
          </div>
        </ScrollReveal>

        {pendingLabel && (
          <ScrollReveal delay={80}>
            <div
              className="mx-auto mt-8 flex max-w-2xl items-start gap-3 rounded-2xl border p-5 text-left"
              style={{ borderColor: "color-mix(in srgb, var(--icon-green) 35%, transparent)", background: "color-mix(in srgb, var(--icon-green) 7%, transparent)" }}
            >
              <Sparkles size={18} className="mt-0.5 shrink-0 text-icon-green" />
              <p className="text-sm leading-relaxed text-foreground/80">
                Every EatoBiotics journey starts with your Food System foundation. First complete the You or
                Family assessment, then we&apos;ll add the selected <strong>{pendingLabel}</strong> assessment
                to create your deeper combined report.
              </p>
            </div>
          </ScrollReveal>
        )}

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {FOUNDATION_CARDS.map((c, i) => (
            <ScrollReveal key={c.key} delay={120 + i * 90}>
              <button
                onClick={() => choose(c.key)}
                className="group flex h-full w-full flex-col rounded-[1.75rem] border border-border bg-card p-8 text-left shadow-lg transition-all hover:-translate-y-1 hover:shadow-2xl"
              >
                <div
                  className="flex h-14 w-14 items-center justify-center rounded-2xl"
                  style={{ background: `color-mix(in srgb, ${c.accent} 14%, transparent)` }}
                >
                  <c.icon size={26} style={{ color: c.accent }} />
                </div>
                <h2 className="mt-6 font-serif text-2xl font-semibold text-foreground">{c.title}</h2>
                <p className="mt-1 text-sm font-semibold" style={{ color: c.accent }}>{c.tagline}</p>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">{c.blurb}</p>
                <span
                  className="mt-6 inline-flex items-center gap-2 self-start rounded-full px-6 py-3 text-sm font-semibold text-white transition-opacity group-hover:opacity-90"
                  style={{ background: `linear-gradient(135deg, ${c.accent}, color-mix(in srgb, ${c.accent} 60%, var(--icon-yellow)))` }}
                >
                  {c.cta} <ArrowRight size={16} />
                </span>
              </button>
            </ScrollReveal>
          ))}
        </div>

        {doneFoundations.length > 0 && (
          <ScrollReveal delay={320}>
            <div className="mt-10 text-center">
              <Link href="/assessment/results" className="text-sm font-semibold text-icon-green underline underline-offset-4 hover:text-icon-teal">
                You&apos;ve completed a foundation — view your report →
              </Link>
            </div>
          </ScrollReveal>
        )}
      </div>
    </section>
  )
}
