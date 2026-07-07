import { describe, it, expect } from "vitest"
import { countBy, pct, bucketDailyCounts, sumBy } from "@/lib/admin-stats"

describe("countBy", () => {
  it("tallies a key into a count map", () => {
    const rows = [{ t: "a" }, { t: "b" }, { t: "a" }, { t: "a" }]
    expect(countBy(rows, "t")).toEqual({ a: 3, b: 1 })
  })

  it("buckets null/undefined under 'unknown'", () => {
    const rows = [{ t: null }, { t: undefined }, { t: "x" }]
    expect(countBy(rows, "t")).toEqual({ unknown: 2, x: 1 })
  })

  it("returns an empty map for no rows", () => {
    expect(countBy([] as Array<{ t: string }>, "t")).toEqual({})
  })
})

describe("pct", () => {
  it("computes a whole-number percentage", () => {
    expect(pct(1, 4)).toBe(25)
    expect(pct(2, 3)).toBe(67) // rounds
  })

  it("guards divide-by-zero", () => {
    expect(pct(5, 0)).toBe(0)
  })
})

describe("sumBy", () => {
  it("sums a numeric column treating nulls as 0", () => {
    const rows = [{ n: 3 }, { n: null }, { n: 5 }] as Array<{ n: number | null }>
    expect(sumBy(rows, "n")).toBe(8)
  })
})

describe("bucketDailyCounts", () => {
  const now = new Date("2026-06-23T12:00:00.000Z")

  it("returns one zero-filled bucket per day, oldest → newest", () => {
    const out = bucketDailyCounts([], 3, now)
    expect(out.map((d) => d.date)).toEqual(["2026-06-21", "2026-06-22", "2026-06-23"])
    expect(out.every((d) => d.count === 0)).toBe(true)
  })

  it("counts timestamps into their UTC day", () => {
    const out = bucketDailyCounts(
      [
        "2026-06-23T01:00:00.000Z",
        "2026-06-23T23:00:00.000Z",
        "2026-06-22T10:00:00.000Z",
      ],
      3,
      now
    )
    expect(out).toEqual([
      { date: "2026-06-21", count: 0 },
      { date: "2026-06-22", count: 1 },
      { date: "2026-06-23", count: 2 },
    ])
  })

  it("ignores timestamps outside the window and invalid/empty values", () => {
    const out = bucketDailyCounts(
      ["2026-06-01T10:00:00.000Z", "not-a-date", null, undefined],
      3,
      now
    )
    expect(out.reduce((s, d) => s + d.count, 0)).toBe(0)
  })
})
