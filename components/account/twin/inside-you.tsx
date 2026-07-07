"use client"

/**
 * InsideYouSection — "How the Food System inside you works", personalized.
 * Builds the four chapters from the member's twin and lazy-loads the interactive
 * Remotion player (ssr:false) so Remotion never weighs down other pages. Shows a
 * lightweight poster while loading. Non-medical framing + disclaimer.
 */

import { useMemo } from "react"
import Link from "next/link"
import { Play } from "lucide-react"
import { buildInsideYouChapters } from "@/lib/account/inside-you"
import { InsideYouJourney } from "./inside-you-journey"
import type { FoodSystemDigitalTwin } from "@/lib/agent-loop/twin/twin-types"

/**
 * Full-bleed dark cinema band: the page reads dark stage → light content →
 * dark cinema → light, which is what makes the experience feel premium. The
 * body is the stage — an interactive journey through it, not a passive film.
 */
export function InsideYouSection({
  twin,
  figureSrc = "/images/couple-hero.png",
  eyebrow = "Inside you",
  title = "Journey through the Food System inside you",
}: {
  twin: FoodSystemDigitalTwin
  figureSrc?: string
  eyebrow?: string
  title?: string
}) {
  const chapters = useMemo(() => buildInsideYouChapters(twin), [twin])

  return (
    <section className="relative overflow-hidden" style={{ background: "linear-gradient(175deg, #10200A 0%, #0B1607 60%, #122208 100%)" }}>
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 top-0 h-[380px] w-[380px] rounded-full" style={{ background: "radial-gradient(circle, rgba(168,224,99,0.10) 0%, transparent 65%)" }} />
        <div className="absolute -right-24 bottom-0 h-[420px] w-[420px] rounded-full" style={{ background: "radial-gradient(circle, rgba(245,166,35,0.08) 0%, transparent 65%)" }} />
      </div>
      <div className="relative mx-auto max-w-5xl px-4 py-12 md:px-8 md:py-16">
        <div className="mb-7">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em]" style={{ color: "#A8E063" }}>{eyebrow}</p>
          <h3 className="mt-2 font-serif text-2xl font-bold md:text-3xl" style={{ color: "#FDFBF7" }}>{title}</h3>
          <p className="mt-1.5 text-sm" style={{ color: "rgba(253,251,247,0.55)" }}>
            Move through your body at your own pace — tap a stop, or play the whole journey.
          </p>
        </div>
        <InsideYouJourney chapters={chapters} figureSrc={figureSrc} />
        <p className="mt-6 px-1 text-[11px] leading-relaxed" style={{ color: "rgba(253,251,247,0.4)" }}>
          EatoBiotics provides food-first guidance for general wellbeing and is not medical advice.{" "}
          <Link href="/method" className="font-semibold underline underline-offset-2 transition-colors hover:text-white" style={{ color: "rgba(253,251,247,0.55)" }}>
            Read our method →
          </Link>
        </p>
      </div>
    </section>
  )
}

/**
 * Compact Overview teaser — links to the full interactive story on the Twin
 * page without loading the Remotion player on the account Overview.
 */
export function InsideYouTeaser({ twin, href = "/account/twin", bare = false }: { twin: FoodSystemDigitalTwin; href?: string; bare?: boolean }) {
  const chapters = useMemo(() => buildInsideYouChapters(twin), [twin])
  const colors = ["#4CB648", "#A8E063", "#2DAA6E", "#F5A623"]
  return (
    <section className={bare ? "min-w-0" : "mx-auto max-w-5xl px-4 pt-8 md:px-8"}>
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
