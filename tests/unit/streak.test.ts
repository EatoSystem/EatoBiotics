import { describe, it, expect } from "vitest"
import { computeStreak, distinctDaysDesc } from "@/lib/streak"

// Fixed reference "now" (UTC) for deterministic tests.
const NOW = new Date("2026-06-01T12:00:00Z")
const iso = (day: string, time = "08:00:00") => `${day}T${time}Z`

describe("distinctDaysDesc", () => {
  it("dedupes multiple logs on the same day and sorts newest-first", () => {
    expect(
      distinctDaysDesc([iso("2026-05-30"), iso("2026-05-30", "20:00:00"), iso("2026-06-01")]),
    ).toEqual(["2026-06-01", "2026-05-30"])
  })
})

describe("computeStreak", () => {
  it("returns an empty streak when nothing is logged", () => {
    expect(computeStreak([], NOW)).toEqual({
      current: 0,
      longest: 0,
      loggedToday: false,
      daysSinceLast: null,
    })
  })

  it("counts consecutive days ending today", () => {
    const s = computeStreak([iso("2026-06-01"), iso("2026-05-31"), iso("2026-05-30")], NOW)
    expect(s.current).toBe(3)
    expect(s.loggedToday).toBe(true)
    expect(s.daysSinceLast).toBe(0)
  })

  it("keeps the streak alive if the last log was yesterday", () => {
    const s = computeStreak([iso("2026-05-31"), iso("2026-05-30")], NOW)
    expect(s.current).toBe(2)
    expect(s.loggedToday).toBe(false)
    expect(s.daysSinceLast).toBe(1)
  })

  it("resets the current streak once the chain lapses (gap of 2+ days)", () => {
    const s = computeStreak([iso("2026-05-29"), iso("2026-05-28")], NOW)
    expect(s.current).toBe(0) // most recent log is 3 days ago
    expect(s.daysSinceLast).toBe(3)
  })

  it("ignores same-day duplicates when counting", () => {
    const s = computeStreak(
      [iso("2026-06-01", "07:00:00"), iso("2026-06-01", "19:00:00"), iso("2026-05-31")],
      NOW,
    )
    expect(s.current).toBe(2)
  })

  it("tracks the longest historical run independently of the current streak", () => {
    // A 4-day run in the past, then a gap, then a 1-day log today.
    const s = computeStreak(
      [
        iso("2026-06-01"),
        iso("2026-05-20"),
        iso("2026-05-19"),
        iso("2026-05-18"),
        iso("2026-05-17"),
      ],
      NOW,
    )
    expect(s.current).toBe(1)
    expect(s.longest).toBe(4)
  })
})
