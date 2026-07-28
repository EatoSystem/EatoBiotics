"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { logEvent } from "@/lib/statsig-client"

/**
 * The single primary call to action for /newhome.
 *
 * The label lives here and nowhere else. The brief requires one dominant CTA
 * label across the whole page — defining it once makes that structural rather
 * than a thing to remember, so a future edit cannot reintroduce variants like
 * "Get My Food System Score" (which the previous concept used in three places
 * with two different wordings).
 *
 * Analytics reuses the established convention: logEvent from lib/statsig-client
 * (same as components/assessment/assessment-client.tsx and analyse-gate.tsx).
 * No new provider. Events are namespaced `newhome_` so this page can be
 * compared against `/` without the two funnels merging.
 */
export const PRIMARY_CTA_LABEL = "Get My Free Biotics Score"

/** Where the free assessment starts. */
const ASSESSMENT_HREF = "/assessment"

type Placement = "hero" | "sample_score" | "start" | "closing"

export function PrimaryCta({
  placement,
  size = "lg",
  className = "",
}: {
  placement: Placement
  size?: "lg" | "md"
  className?: string
}) {
  const pad = size === "lg" ? "px-9 py-4.5 text-lg" : "px-7 py-3.5 text-base"
  return (
    <Link
      href={ASSESSMENT_HREF}
      onClick={() => logEvent("newhome_cta_click", undefined, { placement })}
      className={`brand-gradient inline-flex min-h-[48px] items-center gap-2.5 rounded-full font-semibold text-white shadow-xl shadow-icon-green/25 transition-all hover:opacity-90 hover:shadow-2xl hover:shadow-icon-green/35 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-icon-green ${pad} ${className}`}
    >
      {PRIMARY_CTA_LABEL} <ArrowRight size={18} aria-hidden />
    </Link>
  )
}

/** The one secondary action — an in-page jump to the sample result. */
export function SampleResultLink({ className = "" }: { className?: string }) {
  return (
    <a
      href="#sample-score"
      onClick={() => logEvent("newhome_sample_result_click")}
      className={`inline-flex min-h-[48px] w-fit items-center gap-1.5 rounded-full border border-icon-green/30 bg-icon-green/5 px-5 py-2.5 text-sm font-semibold text-icon-green transition-all hover:border-icon-green/50 hover:bg-icon-green/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-icon-green ${className}`}
    >
      See a Sample Result
    </a>
  )
}

/** Outbound link that reports which destination was taken (report, twin, family…). */
export function TrackedLink({
  href,
  event,
  metadata,
  className = "",
  children,
}: {
  href: string
  event: string
  metadata?: Record<string, string>
  className?: string
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      onClick={() => logEvent(event, undefined, metadata)}
      className={className}
    >
      {children}
    </Link>
  )
}
