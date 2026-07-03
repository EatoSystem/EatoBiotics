"use client"

/**
 * AskTwin — "Ask your Food System" entry into the AI consult.
 *
 * Three deterministic prompt chips built from the member's twin state (their
 * weakest biotic, the current next action, their latest meal) that deep-link
 * into the existing consult with the question prefilled (?q=…). No AI calls
 * here — this is the bridge, the consult route keeps its own caps.
 */

import Link from "next/link"
import { MessageCircle, ArrowRight } from "lucide-react"
import type { FoodSystemDigitalTwin } from "@/lib/agent-loop/twin/twin-types"

const BIOTIC_NAME = { prebiotics: "prebiotic", probiotics: "probiotic", postbiotics: "postbiotic" } as const

function buildPrompts(twin: FoodSystemDigitalTwin): string[] {
  const prompts: string[] = []
  prompts.push(`Why is my ${BIOTIC_NAME[twin.biotics.weakest]} level my weakest, and what foods would help this week?`)
  if (twin.nextBestAction) {
    prompts.push(`What's the easiest way to fit this in: "${twin.nextBestAction.action}"?`)
  }
  const lastMeal = [...twin.observations].reverse().find((o) => o.kind === "meal_description" || o.kind === "meal_photo")
  if (lastMeal) {
    prompts.push(`How could I make "${String(lastMeal.value)}" even better for my Food System?`)
  } else {
    prompts.push("What would a great first day of eating look like for my Food System?")
  }
  return prompts.slice(0, 3)
}

export function AskTwin({ twin, consultHref = "/account/consult" }: { twin: FoodSystemDigitalTwin; consultHref?: string }) {
  const prompts = buildPrompts(twin)

  return (
    <section className="mx-auto max-w-5xl px-4 pt-8 md:px-8">
      <div className="mb-4">
        <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--icon-green)" }}>Ask your Food System</p>
        <h3 className="mt-1 font-serif text-xl font-bold" style={{ color: "var(--foreground)" }}>It knows your Food System. Ask it anything.</h3>
      </div>
      <div className="rounded-2xl border border-border bg-card p-5" style={{ boxShadow: "0 2px 12px rgba(26,46,18,0.05)" }}>
        <div className="flex flex-col gap-2">
          {prompts.map((p) => (
            <Link
              key={p}
              href={`${consultHref}?q=${encodeURIComponent(p)}`}
              className="group flex items-center gap-3 rounded-xl px-4 py-3 transition-colors hover:bg-black/[0.03]"
              style={{ border: "1px solid var(--border)", background: "color-mix(in srgb, var(--icon-teal) 4%, white)" }}
            >
              <MessageCircle size={14} className="shrink-0" style={{ color: "var(--icon-teal)" }} />
              <span className="min-w-0 flex-1 text-sm leading-snug" style={{ color: "var(--foreground)" }}>{p}</span>
              <ArrowRight size={14} className="shrink-0 transition-transform group-hover:translate-x-0.5" style={{ color: "var(--icon-teal)" }} />
            </Link>
          ))}
        </div>
        <p className="mt-3 text-[11px] leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
          Answers come from your AI consultant with your Food System&apos;s context. EatoBiotics provides food-first guidance for general wellbeing and is not medical advice.
        </p>
      </div>
    </section>
  )
}
