import { describe, it, expect } from "vitest"
import { buildAccountTwin, type AccountTwinInput } from "@/lib/agent-loop/account-twin"
import {
  dayKey,
  lastSevenDayKeys,
  loadRitual,
  saveRitual,
  ritualComplete,
  ritualCount,
  EMPTY_RITUAL,
  type Store,
} from "@/lib/account/ritual"
import { detectMilestones, unseenMilestones, loadSeen, saveSeen } from "@/lib/account/milestones"
import { stageMood, stageMoodKey } from "@/lib/account/stage-mood"
import { twinEvolution, AFTER_MEAL_STEPS } from "@/lib/account/evolution"
import { mergeServerRituals, collectLocalRituals } from "@/lib/account/twin-state-sync"
import { buildWeekInsideEmail } from "@/lib/email/week-inside-email"
import { projectScore, FORECAST_HABITS } from "@/lib/account/forecast"
import { buildWeekStory } from "@/lib/account/week-story"

function memStore(): Store {
  const m = new Map<string, string>()
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => void m.set(k, v) }
}

function sampleInput(over: Partial<AccountTwinInput> = {}): AccountTwinInput {
  return {
    score: 74,
    previousScore: 62,
    profileType: "Emerging Balance",
    biotics: { prebiotic: 71, probiotic: 23, postbiotic: 48 },
    streak: 4,
    meals: [
      { name: "Kefir & berries", score: 78, prebiotic: 55, probiotic: 65, postbiotic: 44, createdAt: new Date(Date.now() - 2 * 3_600_000).toISOString() },
      { name: "Lentil salad", score: 71, prebiotic: 72, probiotic: 8, postbiotic: 42, createdAt: new Date(Date.now() - 26 * 3_600_000).toISOString() },
    ],
    ...over,
  }
}

describe("ritual", () => {
  it("round-trips a day through an injected store and derives completion", () => {
    const store = memStore()
    const key = dayKey(new Date(2026, 6, 2))
    expect(key).toBe("2026-07-02")
    expect(loadRitual(store, key)).toEqual(EMPTY_RITUAL)
    saveRitual(store, key, { fermented: true, plants: true, moved: false, slept: false, feeling: false })
    const r = loadRitual(store, key)
    expect(r.fermented).toBe(true)
    expect(ritualCount(r)).toBe(2)
    expect(ritualComplete(r)).toBe(false)
    saveRitual(store, key, { fermented: true, plants: true, moved: true, slept: true, feeling: true })
    expect(ritualComplete(loadRitual(store, key))).toBe(true)
    // Null store (SSR) is safe.
    expect(loadRitual(null, key)).toEqual(EMPTY_RITUAL)
  })

  it("lists the last seven local day keys oldest → today", () => {
    const keys = lastSevenDayKeys(new Date(2026, 6, 2))
    expect(keys.length).toBe(7)
    expect(keys[6]).toBe("2026-07-02")
    expect(keys[0]).toBe("2026-06-26")
  })
})

describe("milestones", () => {
  it("detects first meal, score gains, band crossings and streaks", async () => {
    const { twin } = await buildAccountTwin(sampleInput())
    const ms = detectMilestones(twin, 4)
    const ids = ms.map((m) => m.id)
    expect(ids).toContain("first-meal")
    expect(ids).toContain("delta-10") // 62 → 74
    expect(ids).toContain("streak-3")
    // First-person, celebratory, non-medical.
    for (const m of ms) {
      expect(`${m.title} ${m.detail}`).not.toMatch(/cure|treat|diagnos|garden/i)
    }
    // Seen-set filtering fires each milestone once.
    const store = memStore()
    saveSeen(store, ["first-meal"])
    const unseen = unseenMilestones(ms, loadSeen(store))
    expect(unseen.map((m) => m.id)).not.toContain("first-meal")
    expect(unseen.length).toBe(ms.length - 1)
  })
})

describe("projectScore (what-if forecast)", () => {
  it("is flat with no habits, monotonic with habits, and capped at 100", async () => {
    const { twin } = await buildAccountTwin(sampleInput())
    const none = projectScore(twin, {})
    expect(none.weeks.every((w) => w === none.weeks[0])).toBe(true)
    expect(none.gain).toBe(0)

    const all = projectScore(twin, { fermented: true, plants: true, logging: true })
    for (let i = 1; i < all.weeks.length; i++) expect(all.weeks[i]).toBeGreaterThanOrEqual(all.weeks[i - 1])
    expect(all.gain).toBeGreaterThan(0)
    expect(all.projected).toBeLessThanOrEqual(100)

    // Fermented alone helps (probiotics are the weak spot in the sample).
    const ferm = projectScore(twin, { fermented: true })
    expect(ferm.gain).toBeGreaterThan(0)
    expect(all.projected).toBeGreaterThanOrEqual(ferm.projected)

    // Logging alone earns a small honest gain.
    const log = projectScore(twin, { logging: true })
    expect(log.gain).toBeGreaterThan(0)
    expect(log.gain).toBeLessThanOrEqual(4)

    expect(FORECAST_HABITS.length).toBe(3)
  })
})

describe("twin-state sync merge", () => {
  it("server rituals fill empty local days, but local days win", () => {
    const store = memStore()
    const today = dayKey()
    // Local already has today (partially done).
    saveRitual(store, today, { fermented: true, plants: false, moved: false, slept: false, feeling: false })
    const changed = mergeServerRituals(store, {
      [today]: { fermented: false, plants: true, moved: false, slept: false, feeling: true }, // server disagrees → ignored
      "2026-06-20": { fermented: true, plants: true, moved: true, slept: true, feeling: true }, // local empty → filled
      "not-a-day": { fermented: true, plants: true, moved: true, slept: true, feeling: true }, // invalid key → ignored
    })
    expect(changed).toEqual(["2026-06-20"])
    expect(loadRitual(store, today).fermented).toBe(true) // local untouched
    expect(loadRitual(store, today).plants).toBe(false)
    expect(ritualComplete(loadRitual(store, "2026-06-20"))).toBe(true)
  })

  it("collects only non-empty local days from the last 7", () => {
    const store = memStore()
    const today = dayKey()
    saveRitual(store, today, { fermented: true, plants: false, moved: false, slept: false, feeling: false })
    const collected = collectLocalRituals(store)
    expect(Object.keys(collected)).toEqual([today])
  })
})

describe("buildWeekInsideEmail", () => {
  it("renders the week's slides into HTML + text with the twin CTA", async () => {
    const { twin } = await buildAccountTwin(sampleInput())
    const slides = buildWeekStory(twin)
    const { subject, html, text } = buildWeekInsideEmail("Sarah", slides)
    expect(subject).toContain("Your Food System This Week")
    expect(html).toContain("Sarah")
    expect(html).toContain("/account/twin")
    for (const s of slides) expect(html).toContain(s.title.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"))
    expect(text).toContain("Open your Food System")
    expect(`${html}`).not.toMatch(/garden/i)
  })
})

describe("twinEvolution", () => {
  it("maps meal counts to growth stages with correct boundaries", async () => {
    const mealFor = (n: number) =>
      Array.from({ length: n }, (_, i) => ({
        name: `Meal ${i}`,
        score: 70,
        prebiotic: 60,
        probiotic: 50,
        postbiotic: 40,
        createdAt: new Date(Date.now() - i * 3_600_000).toISOString(),
      }))
    const stageFor = async (n: number) => {
      const { twin } = await buildAccountTwin(sampleInput({ meals: mealFor(n) }))
      return twinEvolution(twin)
    }
    expect((await stageFor(0)).stage).toBe("meeting")
    expect((await stageFor(2)).stage).toBe("meeting")
    const learning = await stageFor(3)
    expect(learning.stage).toBe("learning")
    expect(learning.index).toBe(2)
    expect(learning.next).toEqual({ label: "Attuned", remaining: 7 })
    expect((await stageFor(10)).stage).toBe("attuned")
    // Replay caps at 20 meals, so Expert (25+) is reached over time via history
    // — the boundary itself is still exercised through the raw count logic.
    const attuned = await stageFor(20)
    expect(attuned.stage).toBe("attuned")
    expect(attuned.next!.label).toBe("Expert")
  })

  it("keeps the after-meal journey generic and non-medical", () => {
    expect(AFTER_MEAL_STEPS.length).toBe(4)
    for (const s of AFTER_MEAL_STEPS) {
      expect(`${s.title} ${s.detail}`).not.toMatch(/cure|treat|diagnos|garden|will\b/i)
      expect(s.at).toBeTruthy()
    }
  })
})

describe("stageMood", () => {
  it("maps hours to dawn/day/dusk/night with correct boundaries", () => {
    expect(stageMoodKey(5)).toBe("dawn")
    expect(stageMoodKey(10)).toBe("dawn")
    expect(stageMoodKey(11)).toBe("day")
    expect(stageMoodKey(16)).toBe("day")
    expect(stageMoodKey(17)).toBe("dusk")
    expect(stageMoodKey(21)).toBe("dusk")
    expect(stageMoodKey(22)).toBe("night")
    expect(stageMoodKey(2)).toBe("night")
    expect(stageMoodKey(4)).toBe("night")
  })

  it("brightens when fed, calms while waiting, and stays gentle at night", () => {
    const fedDay = stageMood(13, { fed: true })
    const waitingDay = stageMood(13, { fed: false })
    expect(fedDay.auraMult).toBeGreaterThan(waitingDay.auraMult)
    expect(fedDay.particles).toBe(true)
    expect(waitingDay.particles).toBe(false)
    // Night damps even a fed twin, and never shows particles.
    const fedNight = stageMood(23, { fed: true })
    expect(fedNight.auraMult).toBeLessThan(fedDay.auraMult)
    expect(fedNight.particles).toBe(false)
    // Every mood keeps a human-readable line + brand-safe glows.
    for (const h of [6, 12, 19, 23]) {
      const m = stageMood(h, { fed: true })
      expect(m.line.length).toBeGreaterThan(5)
      expect(m.glowA).toMatch(/^rgba\(/)
    }
  })
})

describe("buildWeekStory", () => {
  it("builds first-person slides from the week's signals", async () => {
    const { twin } = await buildAccountTwin(sampleInput())
    const slides = buildWeekStory(twin)
    const keys = slides.map((s) => s.key)
    expect(keys[0]).toBe("intro")
    expect(keys).toContain("meals")
    expect(keys).toContain("best-meal")
    expect(keys).toContain("biotics")
    expect(keys).toContain("score")
    expect(keys).toContain("focus")
    // Best meal is the highest-scoring one.
    const best = slides.find((s) => s.key === "best-meal")!
    expect(best.title).toBe("Kefir & berries")
    expect(best.stat).toBe("78")
    for (const s of slides) {
      expect(`${s.title} ${s.detail}`).not.toMatch(/cure|treat|diagnos|garden/i)
    }
  })

  it("handles a quiet week (no meals) gracefully", async () => {
    const { twin } = await buildAccountTwin(sampleInput({ meals: [], streak: 0 }))
    const slides = buildWeekStory(twin)
    expect(slides.find((s) => s.key === "meals")!.title).toContain("quiet week")
    expect(slides.some((s) => s.key === "best-meal")).toBe(false)
  })
})
