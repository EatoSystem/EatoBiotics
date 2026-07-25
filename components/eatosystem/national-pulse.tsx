"use client"

import { useEffect, useState } from "react"
import { Activity } from "lucide-react"

const GRADIENT = "linear-gradient(90deg, var(--icon-lime), var(--icon-green), var(--icon-teal), var(--icon-yellow), var(--icon-orange))"

interface Pulse {
  total: number
  average: number | null
  countries: Array<{ code: string; count: number; average: number }>
}

/** ISO code → display name, with a safe fallback to the raw code. */
function countryName(code: string): string {
  try {
    return new Intl.DisplayNames(["en"], { type: "region" }).of(code) ?? code
  } catch {
    return code
  }
}

/**
 * The national Food System Pulse — "participate outward" made visible.
 * Renders nothing until enough anonymised contributions exist (the API
 * enforces the thresholds), so an early aggregate never looks fake.
 */
export function NationalPulse() {
  const [pulse, setPulse] = useState<Pulse | null>(null)

  useEffect(() => {
    let active = true
    fetch("/api/national-pulse")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (active && data?.ok && data.average != null) setPulse(data)
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [])

  if (!pulse || pulse.average == null) return null

  const nf = new Intl.NumberFormat("en")

  return (
    <section className="px-6 py-16">
      <div className="mx-auto max-w-[900px]">
        <div className="overflow-hidden rounded-3xl border border-border bg-card">
          <div className="h-1 w-full" style={{ background: GRADIENT }} />
          <div className="p-7 md:p-8">
            <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              <Activity size={13} /> The Food System Pulse
            </p>
            <div className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <p className="font-serif text-4xl font-bold text-foreground">{pulse.average}</p>
              <p className="text-sm text-muted-foreground">
                average Food System Score across{" "}
                <strong className="text-foreground">{nf.format(pulse.total)}</strong> anonymised
                contributions
              </p>
            </div>
            {pulse.countries.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-2">
                {pulse.countries.map((c) => (
                  <span
                    key={c.code}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-foreground"
                  >
                    {countryName(c.code)}
                    <span className="font-bold" style={{ color: "var(--icon-green)" }}>{c.average}</span>
                    <span className="text-muted-foreground">({nf.format(c.count)})</span>
                  </span>
                ))}
              </div>
            )}
            <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
              Built from scores members chose to contribute anonymously after their assessment —
              no personal data, just the aggregate picture of how we&apos;re all eating.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
