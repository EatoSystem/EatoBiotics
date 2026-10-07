import { describe, it, expect } from "vitest"
import { composeMobileTodayFrom } from "@/lib/mobile/compose-today"
import {
  NEXT_STEP_ABSENCE,
  NEXT_STEP_BEGIN,
  NEXT_STEP_KEEP,
  NEXT_STEP_REVIEWED,
  composeNextStep,
} from "@/lib/mobile/next-step"
import { ACTIONS_LINE } from "@eatobiotics/vocabulary"

const noon = (day: string) => new Date(`${day}T12:00:00.000Z`)

describe("composeNextStep — no selector", () => {
  it("unlogged with no streak is a general next step", () => {
    expect(composeNextStep({ loggedToday: false, currentStreak: 0, hasBioticsScore: true })).toEqual({
      kind: "general-next-step",
      copy: NEXT_STEP_BEGIN,
    })
  })

  it("unlogged with a streak keeps the streak, still not a pathway pick", () => {
    expect(composeNextStep({ loggedToday: false, currentStreak: 4, hasBioticsScore: true })).toEqual({
      kind: "general-next-step",
      copy: NEXT_STEP_KEEP,
    })
  })

  it("logged without a person-level score is truthful absence", () => {
    expect(composeNextStep({ loggedToday: true, currentStreak: 2, hasBioticsScore: false })).toEqual({
      kind: "absence",
      copy: NEXT_STEP_ABSENCE,
    })
  })

  it("logged with a score returns unranked reviewed material", () => {
    const step = composeNextStep({ loggedToday: true, currentStreak: 2, hasBioticsScore: true })
    expect(step.kind).toBe("reviewed-material")
    expect(step.copy).toBe(NEXT_STEP_REVIEWED)
    expect(step.copy).toContain(ACTIONS_LINE)
    expect(step.copy).not.toMatch(/Prebiotics|Probiotics|Postbiotics/)
  })
})

describe("composeMobileTodayFrom", () => {
  it("assembles a schema-valid payload with a meal Biotics Score, not a personal Biotic", () => {
    const now = noon("2026-10-07")
    const payload = composeMobileTodayFrom({
      bioticsScore: 74,
      entitlementTier: "member",
      now,
      meals: [
        {
          created_at: "2026-10-07T08:00:00.000Z",
          meal_name: "Oat bowl",
          biotics_score: 62,
        },
      ],
      ritualsByDay: {
        "2026-10-07": { fermented: true, plants: false, feeling: true },
      },
    })
    expect(payload.bioticsScore).toBe(74)
    expect(payload.entitlementTier).toBe("member")
    expect(payload.streak.loggedToday).toBe(true)
    expect(payload.ritualToday).toEqual({
      fermented: true,
      plants: false,
      moved: false,
      slept: false,
      feeling: true,
    })
    expect(payload.recentActivity.some((e) => e.kind === "meal" && e.mealBioticsScore === 62)).toBe(true)
    expect(payload.nextStep.kind).toBe("reviewed-material")
    expect("prebiotic_score" in payload).toBe(false)
  })

  it("absence when there is no person-level score, even with meals", () => {
    const payload = composeMobileTodayFrom({
      bioticsScore: null,
      entitlementTier: "free",
      now: noon("2026-10-07"),
      meals: [
        {
          created_at: "2026-10-07T08:00:00.000Z",
          meal_name: "Soup",
          biotics_score: 40,
        },
      ],
      ritualsByDay: null,
    })
    expect(payload.nextStep).toEqual({ kind: "absence", copy: NEXT_STEP_ABSENCE })
    expect(payload.ritualToday).toBeNull()
  })

  it("does not invent a focus from an empty day", () => {
    const payload = composeMobileTodayFrom({
      bioticsScore: 50,
      entitlementTier: "trial",
      now: noon("2026-10-07"),
      meals: [],
      ritualsByDay: null,
    })
    expect(payload.nextStep.kind).toBe("general-next-step")
    expect(payload.recentActivity).toEqual([])
    expect(payload.streak.current).toBe(0)
  })
})
