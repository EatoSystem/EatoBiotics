"use client"

/**
 * InsideYouSection — "How the Food System inside you works", personalized.
 * Builds the four chapters from the member's twin and lazy-loads the interactive
 * Remotion player (ssr:false) so Remotion never weighs down other pages. Shows a
 * lightweight poster while loading. Non-medical framing + disclaimer.
 */

import { useMemo } from "react"
import dynamic from "next/dynamic"
import Link from "next/link"
import { Play } from "lucide-react"
import { buildInsideYouChapters } from "@/lib/account/inside-you"
import type { FoodSystemDigitalTwin } from "@/lib/agent-loop/twin/twin-types"

const InsideYouPlayer = dynamic(() => import("@/components/twin-motion/inside-you-player"), {
  ssr: false,
  loading: () => (
    <div
      className="flex aspect-video w-full items-center justify-center rounded-2xl border border-border"
      style={{ background: "linear-gradient(180deg, #FDFBF7 0%, #F4F8EC 100%)" }}
    >
      <div className="text-center">
        <div
          className="eb-aura mx-auto h-16 w-16 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(168,224,99,0.7) 0%, rgba(245,197,24,0.4) 55%, rgba(255,255,255,0) 75%)" }}
        />
        <p className="mt-3 text-xs font-semibold" style={{ color: "var(--muted-foreground)" }}>
          Waking your Food System story…
        </p>
      </div>
    </div>
  ),
})

export function InsideYouSection({
  twin,
  eyebrow = "Inside you",
  title = "How the Food System inside you works",
  className = "mx-auto max-w-5xl px-4 pt-8 md:px-8",
}: {
  twin: FoodSystemDigitalTwin
  eyebrow?: string
  title?: string
  /** Section wrapper classes — override when already inside a constrained container. */
  className?: string
}) {
  const chapters = useMemo(() => buildInsideYouChapters(twin), [twin])

  return (
    <section className={className}>
      <div className="mb-4">
        <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--icon-green)" }}>{eyebrow}</p>
        <h3 className="mt-1 font-serif text-xl font-bold" style={{ color: "var(--foreground)" }}>{title}</h3>
        <p className="mt-1 text-sm" style={{ color: "var(--muted-foreground)" }}>
          A living story with your real levels — tap a chapter to jump in.
        </p>
      </div>
      <InsideYouPlayer chapters={chapters} />
      <p className="mt-2 px-1 text-[11px] leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
        EatoBiotics provides food-first guidance for general wellbeing and is not medical advice.
      </p>
    </section>
  )
}

/**
 * Compact Overview teaser — links to the full interactive story on the Twin
 * page without loading the Remotion player on the account Overview.
 */
export function InsideYouTeaser({ twin, href = "/account/twin" }: { twin: FoodSystemDigitalTwin; href?: string }) {
  const chapters = useMemo(() => buildInsideYouChapters(twin), [twin])
  const colors = ["#4CB648", "#A8E063", "#2DAA6E", "#F5A623"]
  return (
    <section className="mx-auto max-w-5xl px-4 pt-8 md:px-8">
      <Link
        href={href}
        className="group flex items-center gap-4 rounded-2xl border border-border p-5 transition-shadow hover:shadow-lg"
        style={{ background: "linear-gradient(135deg, #FDFBF7 0%, #F4F8EC 100%)", boxShadow: "0 2px 12px rgba(26,46,18,0.05)" }}
      >
        <span
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-white transition-transform group-hover:scale-105"
          style={{ background: "linear-gradient(135deg, #4CB648, #2DAA6E)", boxShadow: "0 6px 20px rgba(76,182,72,0.3)" }}
        >
          <Play size={18} className="ml-0.5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--icon-green)" }}>Inside you</p>
          <p className="mt-0.5 font-serif text-base font-bold leading-snug" style={{ color: "var(--foreground)" }}>
            Watch how the Food System inside you works
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {chapters.map((ch, i) => (
              <span key={ch.key} className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ background: "white", border: "1px solid var(--border)", color: colors[i] }}>
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: colors[i] }} />
                {ch.label}
              </span>
            ))}
          </div>
        </div>
        <span className="shrink-0 text-xs font-bold" style={{ color: "var(--icon-green)" }}>Play →</span>
      </Link>
    </section>
  )
}
