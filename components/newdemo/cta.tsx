"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"

/**
 * The single call to action for /newdemo.
 *
 * Label and destination are defined here and nowhere else. The brief requires
 * one CTA label across the whole page with no variants ("Start", "Get started",
 * "Discover your score"); defining it once makes that structural rather than
 * something to remember. Production currently ships three different labels for
 * two destinations — "Analyse a Meal Free" (/analyse), "Get My Food System
 * Score" (/assessment) and the nav's "Understand My Food System" (/assessment).
 *
 * Destination is /assessment, confirmed with Jason: a Biotics Score comes from
 * the assessment, and section 3 shows an assessment result. Note this is
 * production's *secondary* hero button — its primary is /analyse, the meal
 * scanner, which does not produce a Biotics Score.
 */
export const CTA_LABEL = "Get My Free Biotics Score"
export const CTA_HREF = "/assessment"

export function PrimaryCta({
  size = "lg",
  className = "",
}: {
  size?: "lg" | "md"
  className?: string
}) {
  const pad = size === "lg" ? "px-9 py-4 text-lg" : "px-7 py-3.5 text-base"
  return (
    <Link
      href={CTA_HREF}
      className={`brand-gradient inline-flex min-h-[48px] items-center gap-2.5 rounded-full font-semibold text-white shadow-xl shadow-icon-green/25 transition-all hover:opacity-90 hover:shadow-2xl hover:shadow-icon-green/35 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-icon-green ${pad} ${className}`}
    >
      {CTA_LABEL} <ArrowRight size={18} aria-hidden />
    </Link>
  )
}

/** Dark-band variant — the gradient pill has poor contrast against forest green. */
export function PrimaryCtaOnDark({ className = "" }: { className?: string }) {
  return (
    <Link
      href={CTA_HREF}
      className={`brand-gradient inline-flex min-h-[48px] items-center gap-2.5 rounded-full px-9 py-4 text-lg font-semibold text-white shadow-xl shadow-black/30 transition-all hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${className}`}
    >
      {CTA_LABEL} <ArrowRight size={18} aria-hidden />
    </Link>
  )
}
