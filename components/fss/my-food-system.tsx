"use client"

import { useCallback, useState } from "react"
import { DEFAULT_SECTION, type SectionId } from "@/lib/fss/presentation/system"
import { foodSystemRepository } from "@/lib/fss/persistence/local"
import { moveAction } from "@/lib/fss/system/actions"
import {
  BIOTICS,
  LEARN,
  MY_FOOD,
  MY_PLAN,
  PROGRESS,
  SCORE,
  SECTION_LIST,
  TODAY,
} from "@/lib/fss/system/sections"
import type { ActionState } from "@/lib/fss/persistence/repository"
import type { MyFoodSystem } from "@/lib/fss/system/types"
import { TodaySection } from "@/components/fss/system/today"
import { ScoreSection } from "@/components/fss/system/score"
import { MyFoodSection } from "@/components/fss/system/my-food"
import { BioticsSection } from "@/components/fss/system/biotics"
import { MyPlanSection } from "@/components/fss/system/my-plan"
import { ProgressSection } from "@/components/fss/system/progress"
import { LearnSection } from "@/components/fss/system/learn"

/**
 * MY FOOD SYSTEM — the shell.
 *
 * ══ IT COMPOSES. IT OWNS NOTHING. ═══════════════════════════════════════════
 *
 * Seven areas, one of them showing at a time, each handed the result of its own
 * `select` and never the aggregate. The shell holds three pieces of state and
 * they are all about the screen rather than about the person: which section is
 * open, which action is mid-write, and what time it is.
 *
 * ══ `now` IS CAPTURED ONCE, HERE, AT THE EDGE ═══════════════════════════════
 *
 * Everything below this component is pure. `composeMyFoodSystem` has no clock,
 * `resolveReviewPoint` returns an absolute date, and "in 24 days" is made from
 * this `now`. Captured in `useState`'s initialiser rather than read per render,
 * so the phrase cannot change under somebody mid-session, and after hydration
 * rather than during it, so there is no server/client mismatch to reconcile.
 *
 * ══ THE SEVEN ARE THE WHOLE NAVIGATION ══════════════════════════════════════
 *
 * `SECTION_LIST` is the tab bar, in one order, from one list. Feed · Seed ·
 * Rejuvenate is inside My Plan; What You Notice and My Context are inside My
 * Food. None of those three is a tab, because turning every concept into a
 * destination is how this stops being a daily product.
 *
 * ══ A WRITE IS AWAITED BEFORE ANYTHING RE-RENDERS ═══════════════════════════
 *
 * `onMove` disables the row, calls `moveAction`, and only then asks the parent
 * to re-read. No optimistic update: on a surface whose entire purpose is to
 * remember, showing a state that did not persist is the worst failure
 * available, and `localStorage` fails for real in private mode and at quota.
 */
export function MyFoodSystemView({
  system,
  onReload,
  now: injectedNow,
}: {
  system: MyFoodSystem
  /** Re-read from storage after a write. The shell never patches its own copy. */
  onReload: () => void
  /** Only a test passes this. The component is the clock's home otherwise. */
  now?: Date
}) {
  const [section, setSection] = useState<SectionId>(DEFAULT_SECTION)
  const [pending, setPending] = useState<string | null>(null)
  const [now] = useState(() => injectedNow ?? new Date())

  const onMove = useCallback(
    (actionId: string, state: ActionState) => {
      setPending(actionId)
      void (async () => {
        await moveAction({
          repo: foodSystemRepository(),
          scoreId: system.scoreId,
          actionId,
          state,
          now: new Date().toISOString(),
        })
        setPending(null)
        onReload()
      })()
    },
    [system.scoreId, onReload],
  )

  return (
    <div className="mx-auto w-full max-w-[760px] px-6 py-10">
      <nav aria-label="My Food System" className="mb-10">
        <ul className="flex flex-wrap gap-2">
          {SECTION_LIST.map((descriptor) => {
            const isCurrent = descriptor.id === section
            return (
              <li key={descriptor.id}>
                <button
                  type="button"
                  onClick={() => setSection(descriptor.id)}
                  aria-current={isCurrent ? "page" : undefined}
                  className="min-h-[44px] rounded-full border px-4 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                  style={{
                    borderColor: isCurrent ? "var(--icon-green)" : "var(--border)",
                    background: isCurrent
                      ? "color-mix(in srgb, var(--icon-green) 10%, var(--card))"
                      : "transparent",
                  }}
                >
                  {descriptor.label}
                </button>
              </li>
            )
          })}
        </ul>
      </nav>

      {/*
       * Each section receives `descriptor.select(system)` and nothing more.
       * Biotics receives the result of `BIOTICS.select`, which is `null` — so
       * the call is made and discarded rather than skipped, which is what keeps
       * the pattern uniform and the omission deliberate rather than accidental.
       */}
      {section === "today" && <TodaySection slice={TODAY.select(system)} now={now} />}
      {section === "score" && <ScoreSection slice={SCORE.select(system)} />}
      {section === "my-food" && <MyFoodSection slice={MY_FOOD.select(system)} />}
      {section === "biotics" && BIOTICS.select(system) === null && <BioticsSection />}
      {section === "my-plan" && (
        <MyPlanSection slice={MY_PLAN.select(system)} onMove={onMove} pending={pending} />
      )}
      {section === "progress" && <ProgressSection slice={PROGRESS.select(system)} now={now} />}
      {section === "learn" && <LearnSection slice={LEARN.select(system)} />}
    </div>
  )
}
