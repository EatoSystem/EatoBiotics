"use client"

import { useState } from "react"
import { Leaf } from "lucide-react"
import { ScrollReveal } from "@/components/scroll-reveal"
import { savePrivacyChoice, loadPrivacyChoice } from "@/lib/assessment-storage"
import type { AssessmentResult } from "@/lib/assessment-scoring"

/**
 * The optional contribution ask, moved out of the way of the result.
 *
 * It used to be a full-screen gate between q15 and the score — headline "One
 * small thing before your results" — so the customer had to answer a question
 * about research donation before seeing their own number.
 *
 * Inspection established it can move: it saves a choice to localStorage and,
 * only when someone opts in, fire-and-forgets scores to /api/contribute. It is
 * not a lawful basis for anything. The health-data consent that IS required was
 * taken before the Assessment began and is untouched — different statement,
 * different record, different moment, and they must not be conflated.
 *
 * The shared `PrivacyOptIn` component is deliberately NOT modified: Mind and
 * Family render it too, and changing their flow is out of scope. This is the
 * You journey's own inline card, using the same storage and the same endpoint.
 *
 * Nothing is preselected and neither answer is styled as the expected one —
 * "Not now" has to be as easy as yes for the ask to be honest.
 */
export function ContributeOptIn({ result }: { result: AssessmentResult }) {
  const [choice, setChoice] = useState<"opted-in" | "opted-out" | null>(() =>
    typeof window === "undefined" ? null : loadPrivacyChoice(),
  )

  function handle(next: "opted-in" | "opted-out") {
    savePrivacyChoice(next)
    setChoice(next)

    if (next === "opted-in") {
      // Fire-and-forget — the answer is recorded locally either way, and a
      // failed request must not turn an optional favour into an error state.
      fetch("/api/contribute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          overall: result.overall,
          subScores: result.subScores,
          profile: { type: result.profile.type },
          completedAt: result.completedAt,
        }),
      }).catch(() => {})
    }
  }

  if (choice) {
    return (
      <section className="px-6 pb-10">
        <div className="mx-auto max-w-2xl rounded-2xl border border-border bg-secondary/20 px-5 py-4">
          <p className="text-sm text-muted-foreground">
            {choice === "opted-in"
              ? "Thank you — your anonymised scores were contributed."
              : "Your results stay private. Nothing was shared."}
          </p>
        </div>
      </section>
    )
  }

  return (
    <section className="px-6 pb-10">
      <ScrollReveal>
        <div className="mx-auto max-w-2xl rounded-2xl border border-border bg-secondary/20 p-6">
          <div className="flex items-start gap-3">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl brand-gradient"
              aria-hidden
            >
              <Leaf size={16} className="text-white" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-foreground">
                Optional: contribute your scores
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                Only your scores — no name, email or identifier of any kind. Completely
                optional, and it changes nothing about your results.
              </p>

              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={() => handle("opted-in")}
                  className="rounded-full border border-[var(--icon-green)]/40 px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-secondary/60"
                >
                  Contribute anonymously
                </button>
                <button
                  type="button"
                  onClick={() => handle("opted-out")}
                  className="rounded-full border border-border px-5 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground"
                >
                  Not now
                </button>
              </div>
            </div>
          </div>
        </div>
      </ScrollReveal>
    </section>
  )
}
