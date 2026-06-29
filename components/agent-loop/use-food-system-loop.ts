/**
 * useFoodSystemLoop — client hook that drives a deterministic loop session for a
 * given baseline. Runs an initial pass on mount (completing the assessment is the
 * first observation), exposes helpers to add observations/meals and to record the
 * Learn-stage outcome, and persists to localStorage. The AI provider is
 * injectable; it defaults to deterministic so this works with no backend.
 */

"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import {
  createAgentLoopSession,
  runLoop,
  recordOutcome,
  makeObservation,
  calculateLoopProgress,
  buildFoodSystemTwin,
  saveSession,
  type AgentLoopResult,
  type AgentLoopSession,
  type FoodSystemBaseline,
  type LoopSystemKey,
  type ObservationKind,
  type RecommendationOutcomeStatus,
  type LoopIntelligenceProvider,
} from "@/lib/agent-loop"

export function useFoodSystemLoop(
  baseline: FoodSystemBaseline | null,
  system: LoopSystemKey = "foundation",
  provider?: LoopIntelligenceProvider,
) {
  const [session, setSession] = useState<AgentLoopSession | null>(null)
  const [result, setResult] = useState<AgentLoopResult | null>(null)
  const [busy, setBusy] = useState(false)
  const started = useRef(false)

  // Initial loop pass: the completed assessment is the first observation.
  useEffect(() => {
    if (!baseline || started.current) return
    started.current = true
    const s = createAgentLoopSession(baseline, system)
    runLoop(
      s,
      makeObservation("assessment_update", "Completed foundation assessment", {
        score: baseline.foodSystemScore.value,
      }),
      provider,
    ).then(({ session: next, result: r }) => {
      setSession(next)
      setResult(r)
      saveSession(next)
    })
  }, [baseline, system, provider])

  const observe = useCallback(
    async (kind: ObservationKind, value: string | number, meta?: Record<string, unknown>) => {
      if (!session || busy) return
      setBusy(true)
      try {
        const { session: next, result: r } = await runLoop(
          session,
          makeObservation(kind, value, meta),
          provider,
        )
        setSession(next)
        setResult(r)
        saveSession(next)
      } finally {
        setBusy(false)
      }
    },
    [session, busy, provider],
  )

  const addMeal = useCallback((meal: string) => observe("meal_description", meal), [observe])

  // Record an outcome (Learn), then refresh the next action so there's always one.
  const recordAndRefresh = useCallback(
    async (recommendationId: string, status: RecommendationOutcomeStatus) => {
      if (!session || busy) return
      setBusy(true)
      try {
        const learned = recordOutcome(session, recommendationId, status)
        const { session: next, result: r } = await runLoop(
          learned,
          makeObservation("assessment_update", "Progress check"),
          provider,
        )
        setSession(next)
        setResult(r)
        saveSession(next)
      } finally {
        setBusy(false)
      }
    },
    [session, busy, provider],
  )

  const progress = session ? calculateLoopProgress(session) : null
  // The Digital Twin: the single living object the UI/reports consume.
  const twin = session ? buildFoodSystemTwin(session) : null

  return { session, twin, result, progress, busy, observe, addMeal, recordAndRefresh }
}
