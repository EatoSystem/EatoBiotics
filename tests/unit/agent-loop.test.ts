import { describe, it, expect } from "vitest"
import {
  buildBaseline,
  toBioticsScore,
  bioticLabel,
  nextStage,
  isLoopActive,
  STAGE_ORDER,
  getSystem,
  liveSystemsMatchRegistry,
  liveSpecialisedSystems,
  plannedSpecialisedSystems,
  createAgentLoopSession,
  runLoop,
  runAddOnLoop,
  runMealLoop,
  recordOutcome,
  makeObservation,
  calculateLoopProgress,
  generateLoopSummary,
  LoopError,
  isNonDiagnostic,
  LOOP_DISCLAIMER,
  type FoodSystemBaseline,
} from "@/lib/agent-loop"

function sampleBaseline(over: Partial<Parameters<typeof buildBaseline>[0]> = {}): FoodSystemBaseline {
  return buildBaseline({
    foundationKey: "you",
    score: 62,
    scoreLabel: "Strong Foundation",
    biotics: { prebiotics: 40, probiotics: 75, postbiotics: 55 },
    strengths: ["Fermented foods"],
    priorities: ["Fibre diversity"],
    ...over,
  })
}

describe("biotics adapter", () => {
  it("derives strongest and weakest from sub-scores", () => {
    const b = toBioticsScore({ prebiotics: 40, probiotics: 75, postbiotics: 55 })
    expect(b.strongest).toBe("probiotics")
    expect(b.weakest).toBe("prebiotics")
  })

  it("labels score bands", () => {
    expect(bioticLabel(85)).toBe("Thriving")
    expect(bioticLabel(10)).toBe("Getting started")
  })

  it("resolves ties deterministically by canonical order", () => {
    const b = toBioticsScore({ prebiotics: 50, probiotics: 50, postbiotics: 50 })
    expect(b.strongest).toBe("prebiotics")
    expect(b.weakest).toBe("prebiotics")
  })
})

describe("baseline", () => {
  it("flags low biotics as gaps and keeps the band", () => {
    const base = sampleBaseline()
    expect(base.gaps.some((g) => g.includes("Prebiotics"))).toBe(true)
    expect(base.foodSystemScore.band.label).toBeTruthy()
    expect(base.foodSystemScore.value).toBe(62)
  })
})

describe("stages", () => {
  it("transitions through the loop and returns to observe", () => {
    expect(nextStage("assess")).toBe("understand")
    expect(nextStage("understand")).toBe("observe")
    expect(nextStage("learn")).toBe("observe")
    expect(STAGE_ORDER).toHaveLength(8)
  })

  it("knows when the loop is active", () => {
    expect(isLoopActive("assess")).toBe(false)
    expect(isLoopActive("observe")).toBe(true)
  })
})

describe("systems + inheritance", () => {
  it("keeps live systems in sync with the assessment registry", () => {
    expect(liveSystemsMatchRegistry()).toBe(true)
    expect(liveSpecialisedSystems().map((s) => s.key).sort()).toEqual([
      "glucose",
      "mind",
      "performance",
      "stability",
    ])
  })

  it("registers planned systems without scoring them", () => {
    const planned = plannedSpecialisedSystems().map((s) => s.key)
    expect(planned).toEqual(["recovery", "longevity", "sleep", "heart"])
    planned.forEach((k) => expect(getSystem(k).requiresFoundation).toBe(true))
  })

  it("refuses to start a planned (not-yet-built) system loop", () => {
    expect(() => createAgentLoopSession(sampleBaseline(), "recovery")).toThrow(LoopError)
  })

  it("starts a live foundation session at the observe stage", () => {
    const s = createAgentLoopSession(sampleBaseline(), "foundation")
    expect(s.currentStage).toBe("observe")
    expect(s.foundationKey).toBe("you")
  })
})

describe("loop engine", () => {
  it("produces exactly one food-first recommendation per pass", async () => {
    const session = createAgentLoopSession(sampleBaseline(), "foundation")
    const { session: next, result } = await runMealLoop(session, "Porridge with berries")
    expect(result.recommendation.category).toBe("food-first")
    expect(result.recommendation.action).toBeTruthy()
    expect(result.recommendation.disclaimer).toBe(LOOP_DISCLAIMER)
    expect(next.turns).toHaveLength(1)
    expect(next.currentStage).toBe("observe")
    expect(result.usage.engine).toBe("deterministic")
  })

  it("targets the weakest biotic and is non-diagnostic", async () => {
    const session = createAgentLoopSession(sampleBaseline(), "foundation")
    const { result } = await runLoop(session, makeObservation("energy", 2))
    expect(result.recommendation.targetBiotic).toBe("prebiotics")
    expect(isNonDiagnostic(result.recommendation.action)).toBe(true)
    expect(isNonDiagnostic(result.recommendation.why)).toBe(true)
    expect(isNonDiagnostic(result.summary)).toBe(true)
  })

  it("counts loops and starts with 'starting' momentum then 'steady'", async () => {
    let session = createAgentLoopSession(sampleBaseline(), "foundation")
    expect(calculateLoopProgress(session).momentum).toBe("starting")
    ;({ session } = await runMealLoop(session, "Salad"))
    const progress = calculateLoopProgress(session)
    expect(progress.loopsCompleted).toBe(1)
    expect(progress.momentum).toBe("steady")
  })

  it("reflects an assessment_update as positive score movement", async () => {
    const session = createAgentLoopSession(sampleBaseline({ score: 62 }), "foundation")
    const { result } = await runLoop(
      session,
      makeObservation("assessment_update", "re-scored", { score: 70 }),
    )
    expect(result.progress.scoreDelta).toBe(8)
    expect(result.progress.momentum).toBe("improving")
    expect(result.score.value).toBe(70)
  })

  it("learns from ignored actions and softens the next step", async () => {
    let session = createAgentLoopSession(sampleBaseline(), "foundation")
    let pass = await runMealLoop(session, "Toast")
    session = pass.session
    const firstRec = pass.result.recommendation
    expect(firstRec.effort).toBe("small")
    session = recordOutcome(session, firstRec.id, "ignored")
    pass = await runMealLoop(session, "Toast again")
    expect(pass.result.recommendation.effort).toBe("tiny")
    expect(calculateLoopProgress(session).ignoredActions).toBe(1)
  })

  it("enforces inheritance + controls", async () => {
    const foundation = createAgentLoopSession(sampleBaseline(), "foundation")
    await expect(runAddOnLoop(foundation, makeObservation("energy", 3))).rejects.toThrow(LoopError)

    const capped = createAgentLoopSession(sampleBaseline(), "foundation", { maxTurns: 1 })
    const { session: afterOne } = await runMealLoop(capped, "Eggs")
    await expect(runMealLoop(afterOne, "More eggs")).rejects.toThrow(LoopError)

    const restricted = createAgentLoopSession(sampleBaseline(), "foundation", {
      allowedObservations: ["meal_description"],
    })
    await expect(runLoop(restricted, makeObservation("sleep", 5))).rejects.toThrow(LoopError)
  })

  it("runs a live specialised (add-on) loop on the foundation baseline", async () => {
    const session = createAgentLoopSession(sampleBaseline(), "stability")
    const { result } = await runAddOnLoop(session, makeObservation("digestion", "comfortable"))
    expect(result.recommendation.category).toBe("food-first")
    expect(getSystem("stability").requiresFoundation).toBe(true)
  })

  it("summarises with a disclaimer", () => {
    const session = createAgentLoopSession(sampleBaseline(), "foundation")
    expect(generateLoopSummary(session)).toContain(LOOP_DISCLAIMER)
  })
})

describe("safety language", () => {
  it("rejects diagnostic/treatment claims", () => {
    expect(isNonDiagnostic("This cures IBS")).toBe(false)
    expect(isNonDiagnostic("This treats diabetes")).toBe(false)
    expect(isNonDiagnostic("Fibre-rich foods support general wellbeing")).toBe(true)
  })
})
