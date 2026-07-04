"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { User, Users, ArrowRight, Loader2 } from "lucide-react"
import { ScrollReveal } from "@/components/scroll-reveal"
import { FoundationChooser } from "@/components/assessment/foundation-chooser"
import { getJourney, patchJourney, completedFoundations } from "@/lib/assessment/journey"
import { HEALTH_SYSTEMS, type AssessedSystemKey, type FoundationKey } from "@/lib/assessment/registry"

type Mode = "loading" | "foundation" | "which" | "redirecting"

export function AddonGate({ addon }: { addon: AssessedSystemKey }) {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>("loading")
  const ran = useRef(false)

  useEffect(() => {
    if (ran.current) return
    ran.current = true

    const done = completedFoundations()
    const j = getJourney()

    if (done.length === 0) {
      patchJourney({ pendingAddon: addon, selectedAddon: null })
      setMode("foundation")
      return
    }
    // Prefer an explicitly chosen foundation if it's complete.
    if (j.foundationType && done.includes(j.foundationType)) {
      patchJourney({ selectedAddon: addon, pendingAddon: null })
      setMode("redirecting")
      router.replace(HEALTH_SYSTEMS[addon].route)
      return
    }
    if (done.length === 1) {
      patchJourney({ foundationType: done[0], selectedAddon: addon, pendingAddon: null })
      setMode("redirecting")
      router.replace(HEALTH_SYSTEMS[addon].route)
      return
    }
    // Both foundations completed and none chosen — ask which to build on.
    setMode("which")
  }, [addon, router])

  const label = HEALTH_SYSTEMS[addon].label

  if (mode === "foundation") return <FoundationChooser />

  if (mode === "which") {
    const pick = (f: FoundationKey) => {
      patchJourney({ foundationType: f, selectedAddon: addon, pendingAddon: null })
      setMode("redirecting")
      router.replace(HEALTH_SYSTEMS[addon].route)
    }
    return (
      <section className="px-6 pt-28 pb-24 md:pt-32">
        <div className="mx-auto max-w-[760px] text-center">
          <ScrollReveal>
            <p className="text-xs font-bold uppercase tracking-widest text-icon-green">Add {label}</p>
            <h1 className="mt-4 font-serif text-3xl font-bold text-foreground sm:text-4xl text-balance">
              Which Food System foundation should{" "}
              <span className="brand-gradient-text">{label}</span> build on?
            </h1>
            <p className="mt-5 text-muted-foreground">
              You&apos;ve completed both foundations. Choose which one to layer your {label} assessment onto.
            </p>
          </ScrollReveal>
          <div className="mt-10 grid gap-5 sm:grid-cols-2">
            {(["you", "family"] as FoundationKey[]).map((f) => {
              const Icon = f === "you" ? User : Users
              return (
                <button
                  key={f}
                  onClick={() => pick(f)}
                  className="group flex flex-col items-center rounded-[1.5rem] border border-border bg-card p-8 shadow-lg transition-all hover:-translate-y-1 hover:shadow-2xl"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: "color-mix(in srgb, var(--icon-green) 14%, transparent)" }}>
                    <Icon size={24} className="text-icon-green" />
                  </div>
                  <span className="mt-4 font-serif text-lg font-semibold text-foreground">
                    {f === "you" ? "Your personal Food System" : "Your Family Food System"}
                  </span>
                  <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-icon-green">
                    Continue <ArrowRight size={15} />
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </section>
    )
  }

  // loading / redirecting
  return (
    <section className="flex min-h-[60vh] items-center justify-center px-6">
      <div className="flex items-center gap-3 text-muted-foreground">
        <Loader2 size={20} className="animate-spin text-icon-green" />
        <span>{mode === "redirecting" ? `Adding ${label} to your assessment…` : "Loading…"}</span>
      </div>
    </section>
  )
}
