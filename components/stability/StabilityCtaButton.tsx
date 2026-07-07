"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"
import posthog from "posthog-js"

/* Primary "Start Stability Assessment" CTA with conversion tracking.
   A client island so the surrounding pages stay server-rendered. */
export function StabilityCtaButton({
  source,
  label = "Start Stability Assessment",
  className = "brand-gradient inline-flex items-center gap-2 rounded-full px-8 py-4 text-base font-semibold text-white shadow-lg shadow-icon-green/20 transition-all hover:opacity-90 hover:shadow-xl",
}: {
  source: string
  label?: string
  className?: string
}) {
  return (
    <Link
      href="/assessment/add/stability"
      onClick={() => posthog.capture("cta_clicked", { page: "stability", cta: "start_assessment", source })}
      className={className}
    >
      {label} <ArrowRight size={16} />
    </Link>
  )
}
