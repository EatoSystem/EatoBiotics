"use client"

import { UNAVAILABLE_COPY, UNAVAILABLE_FRAME } from "@/lib/fss/presentation/system"
import type { SystemCheck } from "@/lib/fss/system/validate"

/**
 * The fail-closed state: a current Food System that did not validate.
 *
 * ══ WHY FAIL CLOSED RATHER THAN RENDER WHAT LOADED ══════════════════════════
 *
 * Because the gaps are the part that has to be right. A Food System with a
 * missing score could render every other section and look complete; a Food
 * System whose decision records disagree could show a priority that nothing
 * supports. Partial rendering means filling in — and filling in is how a
 * product tells somebody something it does not know.
 *
 * ══ NOTHING IS DELETED, AND THE SCREEN SAYS SO ══════════════════════════════
 *
 * This component acts on nothing. `loadCurrentFoodSystem` left every record
 * where it was and did not clear the pointer, because "fixing" a failed read by
 * discarding somebody's Food System is the most destructive thing this layer
 * could do, and it is never the right response to a record that would not load.
 *
 * `nothingDeleted` is on the screen for the person rather than the developer. A
 * reader seeing an error about their own data assumes the worst, and the
 * restart button beside it would otherwise look like the only way out.
 *
 * ══ THE FAILING CHECK IS NAMED IN PLAIN WORDS ═══════════════════════════════
 *
 * One reviewed sentence per check, from `UNAVAILABLE_COPY`, keyed by
 * `SystemCheck` — so the record is exhaustive by type and a new check cannot
 * ship without a sentence. The technical name is shown too, small: a reviewer
 * walking a preview environment is the person most likely to be reading this,
 * and "identities-disagree" is what they would need to search for.
 */
export function SystemUnavailable({
  failed,
  systemId,
  onRestart,
}: {
  failed: SystemCheck
  systemId: string
  onRestart: () => void
}) {
  return (
    <div className="mx-auto w-full max-w-[640px] px-6 py-16">
      <h1 className="font-serif text-3xl font-bold">{UNAVAILABLE_FRAME.title}</h1>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        {UNAVAILABLE_FRAME.intro}
      </p>

      <div
        className="mt-6 rounded-2xl border p-5"
        style={{ borderColor: "var(--border)", background: "var(--card)" }}
      >
        <p className="text-sm leading-relaxed">{UNAVAILABLE_COPY[failed]}</p>
        <p className="mt-3 font-mono text-xs text-muted-foreground">
          {failed} · {systemId}
        </p>
      </div>

      <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
        {UNAVAILABLE_FRAME.nothingDeleted}
      </p>

      <button
        type="button"
        onClick={onRestart}
        className="mt-8 inline-flex min-h-[48px] items-center rounded-full border px-6 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
        style={{ borderColor: "var(--border)" }}
      >
        {UNAVAILABLE_FRAME.restartLabel}
      </button>
    </div>
  )
}
