import { describe, it, expect } from "vitest"
import { aggregateDaily, computeGutTrend, type ScorePoint } from "@/lib/account/gut-trend"

describe("aggregateDaily", () => {
  it("averages multiple meals on the same day into one point", () => {
    const h: ScorePoint[] = [
      { score: 60, date: "2026-07-20T08:00:00Z" },
      { score: 80, date: "2026-07-20T19:00:00Z" },
      { score: 50, date: "2026-07-21T12:00:00Z" },
    ]
    const days = aggregateDaily(h)
    expect(days).toEqual([
      { date: "2026-07-20", score: 70 },
      { date: "2026-07-21", score: 50 },
    ])
  })

  it("sorts ascending and ignores non-numeric scores", () => {
    const h = [
      { score: 40, date: "2026-07-22" },
      { score: NaN, date: "2026-07-21" },
      { score: 55, date: "2026-07-20" },
    ] as ScorePoint[]
    expect(aggregateDaily(h).map((p) => p.date)).toEqual(["2026-07-20", "2026-07-22"])
  })
})

describe("computeGutTrend", () => {
  it("returns null with fewer than 3 distinct days", () => {
    expect(computeGutTrend([])).toBeNull()
    expect(computeGutTrend([
      { score: 50, date: "2026-07-20" },
      { score: 60, date: "2026-07-20" }, // same day
      { score: 70, date: "2026-07-21" },
    ])).toBeNull()
  })

  it("reports an upward trend and the window delta", () => {
    const h: ScorePoint[] = [
      { score: 40, date: "2026-07-01" },
      { score: 55, date: "2026-07-05" },
      { score: 70, date: "2026-07-10" },
    ]
    const t = computeGutTrend(h)!
    expect(t.direction).toBe("up")
    expect(t.current).toBe(70)
    expect(t.delta).toBe(30) // 70 − 40
  })

  it("reports a downward trend", () => {
    const t = computeGutTrend([
      { score: 80, date: "2026-07-01" },
      { score: 65, date: "2026-07-04" },
      { score: 50, date: "2026-07-08" },
    ])!
    expect(t.direction).toBe("down")
    expect(t.delta).toBe(-30)
  })

  it("computes this-week vs last-week delta by calendar distance", () => {
    const t = computeGutTrend([
      { score: 50, date: "2026-07-01" }, // >7 days before latest → prev week bucket
      { score: 52, date: "2026-07-02" },
      { score: 70, date: "2026-07-10" }, // within 7 days of latest
      { score: 74, date: "2026-07-12" },
    ])!
    // thisWeek avg ≈ 72, prevWeek avg ≈ 51 → +21
    expect(t.weekDelta).toBe(21)
  })

  it("treats a nearly flat series as holding steady", () => {
    const t = computeGutTrend([
      { score: 60, date: "2026-07-01" },
      { score: 61, date: "2026-07-05" },
      { score: 60, date: "2026-07-10" },
    ])!
    expect(t.direction).toBe("flat")
  })
})
