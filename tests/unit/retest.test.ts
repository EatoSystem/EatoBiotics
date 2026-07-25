import { describe, it, expect } from "vitest"
import { appendScore, parseScoreHistory, retestState, RETEST_DAY, type ScorePoint } from "@/lib/account/retest"

const iso = (daysAgo: number) => new Date(Date.now() - daysAgo * 86_400_000).toISOString()

describe("parseScoreHistory", () => {
  it("returns [] for junk", () => {
    expect(parseScoreHistory(null)).toEqual([])
    expect(parseScoreHistory("x")).toEqual([])
    expect(parseScoreHistory([{ score: "high", at: iso(1) }, { score: 50 }])).toEqual([])
  })

  it("clamps, rounds, and sorts chronologically", () => {
    const parsed = parseScoreHistory([
      { score: 120.6, at: "2026-03-02T00:00:00.000Z" },
      { score: -4, at: "2026-01-01T00:00:00.000Z" },
    ])
    expect(parsed.map((p) => p.score)).toEqual([0, 100])
  })
})

describe("appendScore", () => {
  it("appends a new day and collapses same-day duplicates", () => {
    const day1 = new Date("2026-01-01T09:00:00Z")
    const day1b = new Date("2026-01-01T20:00:00Z")
    const day2 = new Date("2026-01-02T09:00:00Z")
    let h: ScorePoint[] = []
    h = appendScore(h, 40, day1)
    h = appendScore(h, 44, day1b) // same day → replaces
    expect(h).toHaveLength(1)
    expect(h[0].score).toBe(44)
    h = appendScore(h, 50, day2)
    expect(h).toHaveLength(2)
  })

  it("caps at 24 entries", () => {
    let h: ScorePoint[] = []
    for (let i = 0; i < 30; i++) h = appendScore(h, 50, new Date(Date.parse("2026-01-01") + i * 86_400_000))
    expect(h).toHaveLength(24)
  })
})

describe("retestState", () => {
  it("is null with no data at all", () => {
    expect(retestState([], { score: null, at: null })).toBeNull()
  })

  it("counts down before day 75", () => {
    const s = retestState([{ score: 60, at: iso(9) }], { score: null, at: null })
    expect(s?.kind).toBe("countdown")
    if (s?.kind === "countdown") expect(s.day).toBe(10)
  })

  it("falls back to legacy score + created_at when history is empty", () => {
    const s = retestState([], { score: 58, at: iso(3) })
    expect(s?.kind).toBe("countdown")
  })

  it("is due at day 75+", () => {
    const s = retestState([{ score: 60, at: iso(RETEST_DAY + 2) }], { score: null, at: null })
    expect(s?.kind).toBe("due")
  })

  it("compares once there are two scores", () => {
    const s = retestState(
      [
        { score: 58, at: iso(80) },
        { score: 71, at: iso(1) },
      ],
      { score: null, at: null }
    )
    expect(s?.kind).toBe("compare")
    if (s?.kind === "compare") {
      expect(s.delta).toBe(13)
      expect(s.days).toBe(79)
    }
  })
})
