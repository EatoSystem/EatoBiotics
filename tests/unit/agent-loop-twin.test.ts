import { describe, it, expect } from "vitest"
import {
  buildBaseline,
  buildFoodSystemTwin,
  createAgentLoopSession,
  runLoop,
  runMealLoop,
  recordOutcome,
  makeObservation,
  type FoodSystemBaseline,
} from "@/lib/agent-loop"

function sampleBaseline(over: Partial<Parameters<typeof buildBaseline>[0]> = {}): FoodSystemBaseline {
  return buildBaseline({
    foundationKey: "you",
    score: 60,
    scoreLabel: "Strong Foundation",
    biotics: { prebiotics: 42, probiotics: 72, postbiotics: 55 },
    strengths: ["Fermented foods"],
    priorities: ["Fibre diversity"],
    ...over,
  })
}

describe("Food System Digital Twin", () => {
  it("derives from the baseline before any loop runs", () => {
    const session = createAgentLoopSession(sampleBaseline(), "foundation")
    const twin = buildFoodSystemTwin(session)
    expect(twin.baseline.foundationKey).toBe("you")
    expect(twin.currentScore.value).toBe(60)
    expect(twin.biotics.weakest).toBe("prebiotics")
    expect(twin.observations).toHaveLength(0)
    expect(twin.recommendations).toHaveLength(0)
    expect(twin.nextBestAction).toBeNull()
    expect(twin.activeSystem).toBe("foundation")
    expect(twin.currentStage).toBe("observe")
  })

  it("collects observations + recommendation history and surfaces the latest action", async () => {
    let session = createAgentLoopSession(sampleBaseline(), "foundation")
    ;({ session } = await runMealLoop(session, "Porridge with berries"))
    ;({ session } = await runMealLoop(session, "Lentil soup"))
    const twin = buildFoodSystemTwin(session)
    expect(twin.observations.map((o) => o.kind)).toEqual(["meal_description", "meal_description"])
    expect(twin.recommendations).toHaveLength(2)
    expect(twin.nextBestAction).not.toBeNull()
    expect(twin.nextBestAction).toBe(twin.recommendations[twin.recommendations.length - 1])
    expect(twin.progress.loopsCompleted).toBe(2)
  })

  it("reflects an assessment_update in current score and trends", async () => {
    const session = createAgentLoopSession(sampleBaseline({ score: 60 }), "foundation")
    const { session: next } = await runLoop(
      session,
      makeObservation("assessment_update", "re-scored", { score: 71 }),
    )
    const twin = buildFoodSystemTwin(next)
    expect(twin.currentScore.value).toBe(71)
    const scoreTrend = twin.trends.find((t) => t.label === "Food System Score")
    expect(scoreTrend?.direction).toBe("up")
    expect(scoreTrend?.detail).toContain("+11")
  })

  it("carries memory + progress from the Learn layer", async () => {
    const pass = await runMealLoop(createAgentLoopSession(sampleBaseline(), "foundation"), "Toast")
    const session = recordOutcome(pass.session, pass.result.recommendation.id, "completed")
    const twin = buildFoodSystemTwin(session)
    expect(twin.memory.completed).toHaveLength(1)
    expect(twin.progress.completedActions).toBe(1)
  })

  it("is deterministic — same session yields an equal twin", async () => {
    let session = createAgentLoopSession(sampleBaseline(), "foundation")
    ;({ session } = await runMealLoop(session, "Kefir and oats"))
    expect(buildFoodSystemTwin(session)).toEqual(buildFoodSystemTwin(session))
  })

  it("tracks the active specialised system on the twin", async () => {
    const session = createAgentLoopSession(sampleBaseline(), "stability")
    const twin = buildFoodSystemTwin(session)
    expect(twin.activeSystem).toBe("stability")
    expect(twin.baseline.foundationKey).toBe("you") // still inherits the foundation
  })
})
