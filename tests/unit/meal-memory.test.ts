import { describe, it, expect } from "vitest"
import { mealMemory, type MemoryMeal } from "@/lib/account/meal-memory"

const now = new Date("2026-07-15T12:00:00Z")
const daysAgo = (n: number) => new Date(now.getTime() - n * 86_400_000).toISOString()

const meal = (name: string, score: number, days: number): MemoryMeal => ({
  name,
  score,
  createdAt: daysAgo(days),
})

describe("mealMemory", () => {
  it("is silent with no history", () => {
    expect(mealMemory({ name: "Lentil soup", score: 70 }, [], now)).toBeNull()
  })

  it("remembers a repeat meal with its running average", () => {
    const history = [meal("Lentil Soup", 60, 10), meal("lentil soup!", 70, 5), meal("Toast", 30, 2)]
    const line = mealMemory({ name: "Lentil soup", score: 62 }, history, now)
    expect(line).toContain("third time")
    expect(line).toContain("65") // avg of 60 and 70
  })

  it("celebrates a repeat meal's best version", () => {
    const history = [meal("Kefir bowl", 61, 8)]
    const line = mealMemory({ name: "Kefir Bowl", score: 75 }, history, now)
    expect(line).toContain("second time")
    expect(line).toContain("best version")
    expect(line).toContain("61")
  })

  it("celebrates an all-time personal best (needs ≥3 prior meals)", () => {
    const history = [meal("A", 50, 9), meal("B", 66, 6), meal("C", 58, 3)]
    const line = mealMemory({ name: "New dish", score: 80 }, history, now)
    expect(line).toContain("highest-scoring")
    expect(line).toContain("66")
  })

  it("notes the weekly rhythm at 4+ meals in 7 days", () => {
    const history = [meal("A", 50, 1), meal("B", 55, 2), meal("C", 60, 3)]
    const line = mealMemory({ name: "D", score: 52 }, history, now)
    expect(line).toContain("meal 4 this week")
  })

  it("prefers the repeat-meal memory over the rhythm line", () => {
    const history = [meal("Porridge", 62, 1), meal("B", 55, 2), meal("C", 60, 3)]
    const line = mealMemory({ name: "Porridge", score: 58 }, history, now)
    expect(line).toContain("second time")
  })

  it("stays silent for a first-time meal with thin history", () => {
    const history = [meal("A", 50, 20)]
    expect(mealMemory({ name: "B", score: 55 }, history, now)).toBeNull()
  })
})
