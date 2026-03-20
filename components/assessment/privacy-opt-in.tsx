"use client"

import { Leaf } from "lucide-react"
import { ScrollReveal } from "@/components/scroll-reveal"
import { savePrivacyChoice } from "@/lib/assessment-storage"
import type { AssessmentResult } from "@/lib/assessment-scoring"
import type { PrivacyChoice } from "@/lib/assessment-storage"

interface PrivacyOptInProps {
  result: AssessmentResult
  onChoice: (choice: PrivacyChoice) => void
}

export function PrivacyOptIn({ result, onChoice }: PrivacyOptInProps) {
  function handleChoice(choice: PrivacyChoice) {
    savePrivacyChoice(choice)

    if (choice === "opted-in") {
      // Fire-and-forget — don't block the user
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

    onChoice(choice)
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6 py-20">
      <div className="mx-auto max-w-xl w-full">
        <ScrollReveal>
          {/* Brand pills */}
          <div className="flex justify-center gap-1.5 mb-8">
            <span className="biotic-pill bg-icon-lime" />
            <span className="biotic-pill bg-icon-green" />
            <span className="biotic-pill bg-icon-teal" />
          </div>

          {/* Leaf icon */}
          <div className="flex justify-center mb-6">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl brand-gradient">
              <Leaf size={24} className="text-white" />
            </div>
          </div>

          {/* Headline */}
          <h1 className="font-serif text-2xl font-semibold text-foreground text-center leading-snug sm:text-3xl">
            One small thing before your results
          </h1>

          {/* Body */}
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground text-center sm:text-base">
            Would you like to contribute your anonymised results to help improve
            EatoBiotics and support the EatoSystem mission?
          </p>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground text-center">
            Only your scores are shared — no name, email, or any personal information.
            This is completely optional.
          </p>

          {/* Score preview */}
          <div className="mt-6 rounded-2xl border border-border bg-secondary/20 px-5 py-4 text-center">
            <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">
              What would be shared
            </p>
            <p className="mt-2 text-2xl font-bold text-foreground">
              {result.overall}
              <span className="text-sm font-normal text-muted-foreground">/100</span>
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {result.profile.type} · {Object.values(result.subScores).join(" · ")}
            </p>
          </div>

          {/* Buttons */}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              onClick={() => handleChoice("opted-in")}
              className="flex items-center justify-center gap-2 rounded-full brand-gradient px-8 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              <Leaf size={14} />
              Contribute anonymously
            </button>
            <button
              onClick={() => handleChoice("opted-out")}
              className="flex items-center justify-center rounded-full border border-border px-8 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground"
            >
              Keep private
            </button>
          </div>

          {/* Small print */}
          <p className="mt-5 text-center text-xs text-muted-foreground/50">
            Only scores are shared. No name, email, or identifier of any kind.
            Your data will never be sold or shared with third parties.
          </p>
        </ScrollReveal>
      </div>
    </div>
  )
}
