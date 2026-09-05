"use client"

import { ArrowRight } from "lucide-react"
import type { ConsultationFoundation } from "@/lib/consultation/types"

/**
 * The state before the first question (§7).
 *
 * Orientation is not a Consultation section: it carries no question, appears in
 * no progress count, and has no section value. It exists so the customer knows
 * what they have entered before they are asked anything.
 *
 * ══ WHAT IT DELIBERATELY DOES NOT SAY ═══════════════════════════════════════
 *
 * No completion time — question burden is adaptive and lens-dependent, so any
 * figure would be invented (§42). No "we save every answer as you go" — the
 * deterministic preview persists nothing, and the paid path's autosave has a
 * debounce window, so the claim would be untrue in both (§25). No email-to-
 * continue (§41). No medical framing, no diagnosis, no urgency.
 */

interface Props {
  foundation: ConsultationFoundation
  onBegin: () => void
}

const COPY = {
  you: {
    title: "Your Personal Food System Consultation",
    lead: "This is the guided part of your Consultation. Your answers shape the Personal Food System Report you receive at the end.",
    cta: "Begin My Consultation",
  },
  family: {
    title: "Your Household Food System Consultation",
    lead: "This is the guided part of your Consultation. Your answers shape the Personal Food System Report your household receives at the end.",
    cta: "Begin Our Consultation",
  },
} as const satisfies Record<ConsultationFoundation, { title: string; lead: string; cta: string }>

const POINTS = [
  "It is a guided digital process — educational and non-diagnostic. It is not a medical consultation and it does not diagnose anything.",
  "You can move forward and back at any point, and change an answer you have already given.",
  "Some questions appear only if they are relevant to what you have already said, so the number of questions varies.",
  "Anything optional is clearly marked, and you can move past it without answering.",
] as const

export function ConsultationOrientation({ foundation, onBegin }: Props) {
  const copy = COPY[foundation]

  return (
    <div className="mx-auto max-w-2xl px-6 pb-28 pt-10">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        Before we start
      </p>
      <h1 className="mt-3 font-serif text-3xl font-semibold leading-tight text-foreground sm:text-4xl">
        {copy.title}
      </h1>
      <p className="mt-4 text-base leading-relaxed text-muted-foreground">{copy.lead}</p>

      <ul className="mt-8 space-y-4">
        {POINTS.map((point) => (
          <li key={point} className="flex gap-3">
            <span
              aria-hidden
              className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--icon-green)]"
            />
            <span className="text-sm leading-relaxed text-foreground">{point}</span>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={onBegin}
        className="brand-gradient mt-10 flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 sm:w-auto"
      >
        {copy.cta}
        <ArrowRight size={16} />
      </button>
    </div>
  )
}
