import { describe, it, expect } from "vitest"
import { ritualDaySchema, twinStatePutSchema } from "@/lib/account/twin-state-schema"
import { RITUAL_CHECKS, type RitualDay } from "@/lib/account/ritual"

describe("twin-state PUT schema", () => {
  it("round-trips all five ritual checks (regression: moved/slept were silently stripped)", () => {
    const full: RitualDay = { fermented: true, plants: true, moved: true, slept: true, feeling: true }
    const parsed = ritualDaySchema.parse(full)
    for (const check of RITUAL_CHECKS) {
      expect(parsed[check.key], `key "${check.key}" must survive validation`).toBe(true)
    }
  })

  it("stays in lockstep with RitualDay — every check key is a schema key", () => {
    const schemaKeys = Object.keys(ritualDaySchema.shape).sort()
    const ritualKeys = RITUAL_CHECKS.map((c) => c.key).sort()
    expect(schemaKeys).toEqual(ritualKeys)
  })

  it("accepts the legacy 3-key shape, defaulting moved/slept to false", () => {
    const parsed = ritualDaySchema.parse({ fermented: true, plants: false, feeling: true })
    expect(parsed).toEqual({ fermented: true, plants: false, moved: false, slept: false, feeling: true })
  })

  it("validates a full PUT body and rejects malformed day keys", () => {
    const ok = twinStatePutSchema.parse({
      rituals: { "2026-07-16": { fermented: true, plants: true, moved: true, slept: false, feeling: true } },
      milestonesSeen: ["first_meal"],
    })
    expect(ok.rituals["2026-07-16"].slept).toBe(false)

    expect(() =>
      twinStatePutSchema.parse({
        rituals: { "not-a-day": { fermented: true, plants: true, moved: true, slept: true, feeling: true } },
      }),
    ).toThrow()
  })
})
