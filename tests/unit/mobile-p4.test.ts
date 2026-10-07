import { describe, it, expect } from "vitest"
import { existsSync, readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"
import {
  MOBILE_BEARER_ROUTES,
  MOBILE_GATE_ALLOWLIST,
  MOBILE_PROGRESS_PATH,
  mobileProgressResponseSchema,
} from "@eatobiotics/contracts"
import { PERSONAL_BIOTIC_STATE, bioticFlowsIntoVisual } from "@eatobiotics/claims"
import { BIOTICS_SCORE, MEAL_BIOTICS_SCORE } from "@eatobiotics/vocabulary"
import { composeMobileProgressFrom } from "@/lib/mobile/compose-progress"
import { WEEK_ABSENCE, composeWeekSummary } from "@/lib/mobile/week-copy"
import { MOBILE_SURFACES } from "./customer-surfaces"

function withoutComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/^\s*\/\/.*$/gm, " ")
}

function walkTs(dir: string): string[] {
  if (!existsSync(dir)) return []
  const out: string[] = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".expo") continue
      out.push(...walkTs(full))
    } else if (/\.(ts|tsx|js|json)$/.test(entry.name)) {
      out.push(full)
    }
  }
  return out
}

const noon = (day: string) => new Date(`${day}T12:00:00.000Z`)
const COMPOSE = "lib/mobile/compose-progress.ts"
const WEEK_COPY = "lib/mobile/week-copy.ts"
const ROUTE = "app/api/mobile/v1/progress/route.ts"
const SCREEN = "apps/mobile/src/screens/ProgressScreen.tsx"
const FETCH = "apps/mobile/src/api/progress.ts"

describe("P4 mobile companion — progress / this-week", () => {
  it("names GET /api/mobile/v1/progress as the composed week read", () => {
    expect(MOBILE_PROGRESS_PATH).toBe("/api/mobile/v1/progress")
    expect(MOBILE_BEARER_ROUTES.progress).toBe(MOBILE_PROGRESS_PATH)
    expect(MOBILE_GATE_ALLOWLIST).toContain(MOBILE_PROGRESS_PATH)
    expect(existsSync(ROUTE)).toBe(true)
    const src = withoutComments(readFileSync(ROUTE, "utf8"))
    expect(src).toMatch(/getUserFromRequest/)
    expect(src).not.toMatch(/getUser\(\)/)
    expect(src).not.toMatch(/focus-today/)
    expect(src).not.toMatch(/buildAccountTwin/)
    expect(readFileSync(ROUTE, "utf8")).toMatch(/Authorization: Bearer/)
  })

  it("week copy is counts only — no selector, no momentum, no Biotic ranking", () => {
    expect(composeWeekSummary({ mealCount: 0, checkInDays: 0 })).toEqual({
      kind: "absence",
      copy: WEEK_ABSENCE,
    })
    expect(composeWeekSummary({ mealCount: 1, checkInDays: 0 })).toEqual({
      kind: "logged",
      copy: "1 meal this week.",
    })
    expect(composeWeekSummary({ mealCount: 3, checkInDays: 2 })).toEqual({
      kind: "logged",
      copy: "3 meals and 2 check-ins this week.",
    })
    expect(composeWeekSummary({ mealCount: 0, checkInDays: 1 })).toEqual({
      kind: "logged",
      copy: "1 check-in this week.",
    })
    const src = withoutComments(readFileSync(WEEK_COPY, "utf8"))
    expect(src).not.toMatch(/prebiotic|probiotic|postbiotic/)
    expect(src).not.toMatch(/momentum|scoreDelta|weakest|strongest|orderedByNeed|focus-today/)
    expect(src).not.toMatch(/buildAccountTwin/)
  })

  it("assembles a schema-valid week with meal facts, not a personal Biotic", () => {
    const payload = composeMobileProgressFrom({
      bioticsScore: 74,
      entitlementTier: "member",
      now: noon("2026-10-07"),
      meals: [
        { created_at: "2026-10-07T08:00:00.000Z", meal_name: "Oat bowl", biotics_score: 62 },
        { created_at: "2026-10-05T18:00:00.000Z", meal_name: "Soup", biotics_score: 40 },
        { created_at: "2026-09-20T12:00:00.000Z", meal_name: "Too old", biotics_score: 90 },
      ],
      ritualsByDay: {
        "2026-10-07": { fermented: true, plants: false, feeling: true },
        "2026-10-06": { fermented: false, plants: false, moved: false, slept: false, feeling: false },
      },
    })
    expect(payload.weekStart).toBe("2026-10-01")
    expect(payload.weekEnd).toBe("2026-10-07")
    expect(payload.days).toHaveLength(7)
    expect(payload.mealCount).toBe(2)
    expect(payload.checkInDays).toBe(1)
    expect(payload.summary.copy).toBe("2 meals and 1 check-in this week.")
    expect(payload.bioticsScore).toBe(74)
    const today = payload.days.find((d) => d.date === "2026-10-07")
    expect(today?.meals[0]?.mealBioticsScore).toBe(62)
    expect(today?.ritualLine).toMatch(/Fermented food/)
    expect(payload.days.some((d) => d.meals.some((m) => m.summary === "Too old"))).toBe(false)
    expect("prebiotic_score" in payload).toBe(false)
    expect("scoreDelta" in payload).toBe(false)
    expect("momentum" in payload).toBe(false)
  })

  it("absence when the week is empty — no invented focus or delta", () => {
    const payload = composeMobileProgressFrom({
      bioticsScore: null,
      entitlementTier: "free",
      now: noon("2026-10-07"),
      meals: [],
      ritualsByDay: null,
    })
    expect(payload.summary).toEqual({ kind: "absence", copy: WEEK_ABSENCE })
    expect(payload.mealCount).toBe(0)
    expect(payload.checkInDays).toBe(0)
    expect(payload.days).toHaveLength(7)
    expect(payload.days.every((d) => d.meals.length === 0 && d.ritualLine == null)).toBe(true)
  })

  it("the composer never reads per-Biotic columns, focus-today, or buildAccountTwin", () => {
    const src = withoutComments(
      `${readFileSync(COMPOSE, "utf8")}\n${readFileSync(WEEK_COPY, "utf8")}\n${readFileSync(ROUTE, "utf8")}`,
    )
    expect(src).not.toMatch(/prebiotic_score|probiotic_score|postbiotic_score/)
    expect(src).not.toMatch(/\bweakest\b|\bstrongest\b|orderedByNeed/)
    expect(src).not.toMatch(/focus-today/)
    expect(src).not.toMatch(/buildAccountTwin/)
    expect(src).not.toMatch(/scoreDelta|momentum/)
  })

  it("the progress contract has no personal per-Biotic fields and strips extras", () => {
    const src = withoutComments(readFileSync("packages/contracts/src/mobile-progress.ts", "utf8"))
    expect(src).not.toMatch(/prebiotic_score|probiotic_score|postbiotic_score/)
    expect(src).not.toMatch(/\bweakest\b|\bstrongest\b|orderedByNeed|focus-today/)
    expect(src).not.toMatch(/scoreDelta|momentum|buildAccountTwin/)
    const parsed = mobileProgressResponseSchema.parse({
      bioticsScore: 74,
      weekStart: "2026-10-01",
      weekEnd: "2026-10-07",
      days: [],
      mealCount: 0,
      checkInDays: 0,
      summary: { kind: "absence", copy: WEEK_ABSENCE },
      entitlementTier: "member",
      prebiotic_score: 10,
      scoreDelta: 4,
    })
    expect("prebiotic_score" in parsed).toBe(false)
    expect("scoreDelta" in parsed).toBe(false)
  })

  it("Progress screen renders the payload and does not aggregate a claim", () => {
    expect(MOBILE_SURFACES).toContain(SCREEN)
    const screen = withoutComments(readFileSync(SCREEN, "utf8"))
    expect(screen).toMatch(/fetchProgress/)
    expect(screen).toMatch(/data\.summary\.copy/)
    expect(screen).toMatch(/data\.days\.map/)
    expect(screen).not.toMatch(/data\.days\.filter/)
    expect(screen).toMatch(/\{BIOTICS_SCORE\}/)
    expect(screen).toMatch(/\{MEAL_BIOTICS_SCORE\}/)
    expect(MEAL_BIOTICS_SCORE).not.toBe(BIOTICS_SCORE)
    expect(screen).not.toMatch(/\.reduce\(/)
    expect(screen).not.toMatch(/Math\.max|Math\.min/)
    expect(screen).not.toMatch(/average|momentum|scoreDelta/)
    expect(screen).not.toMatch(/buildAccountTwin/)
    expect(screen).not.toMatch(/focus-today/)
    expect(screen).not.toMatch(/prebiotic_score|probiotic_score|postbiotic_score/)
    expect(screen).not.toMatch(/orderedByNeed|\bweakest\b|\bstrongest\b/)
    expect(screen).not.toMatch(/recentActivity/)
    expect(bioticFlowsIntoVisual(screen)).toBe(false)
    expect(PERSONAL_BIOTIC_STATE.some(([, r]) => r.test(screen))).toBe(false)
  })

  it("a per-Biotic bar in the Progress screen still fails the RN dialect", () => {
    const forbidden = [
      "const personal = twin.biotics.prebiotics.score",
      "<Text>Your Prebiotics {personal}/100</Text>",
      "<View style={{ width: `${personal}%`, backgroundColor: '#2DAA6E' }} />",
    ].join("\n")
    expect(bioticFlowsIntoVisual(forbidden)).toBe(true)
    expect(PERSONAL_BIOTIC_STATE.some(([, r]) => r.test(forbidden))).toBe(true)
    const live = MOBILE_SURFACES.map((f) => withoutComments(readFileSync(f, "utf8"))).join("\n")
    expect(bioticFlowsIntoVisual(live)).toBe(false)
  })

  it("GET failure is logged, never swallowed, and Today links through", () => {
    const fetchSrc = readFileSync(FETCH, "utf8")
    expect(fetchSrc).toContain('console.error("[mobile-progress] GET failed"')
    expect(withoutComments(fetchSrc)).not.toMatch(/catch(?:\s*\([^)]*\))?\s*\{\s*\}/)
    expect(fetchSrc).toMatch(/MOBILE_PROGRESS_PATH/)
    const app = readFileSync("apps/mobile/App.tsx", "utf8")
    expect(app).toMatch(/ProgressScreen/)
    const today = readFileSync("apps/mobile/src/screens/TodayScreen.tsx", "utf8")
    expect(today).toMatch(/This week/)
    expect(today).toMatch(/onThisWeek/)
    expect(withoutComments(today)).not.toMatch(/\/api\/mobile\/v1\/progress/)
  })

  it("does not copy IAP, WebView, Assessment, extra routes, or production writes", () => {
    const files = [FETCH, SCREEN, COMPOSE, WEEK_COPY, ROUTE]
    for (const file of files) {
      const src = withoutComments(readFileSync(file, "utf8"))
      expect(src, file).not.toMatch(/catch(?:\s*\([^)]*\))?\s*\{\s*\}/)
      expect(src, file).not.toMatch(/Food System Assessment/)
      expect(src, file).not.toMatch(/Personal Food System Report/)
    }
    const mobile = walkTs("apps/mobile").map((f) => withoutComments(readFileSync(f, "utf8"))).join("\n")
    expect(mobile).not.toMatch(/SUPABASE_SERVICE_ROLE_KEY|STRIPE_SECRET_KEY|ANTHROPIC_API_KEY|CRON_SECRET/)
    const pkg = readFileSync("apps/mobile/package.json", "utf8")
    expect(pkg).not.toMatch(/react-native-webview|expo-iap|react-native-iap/)

    const proxy = readFileSync("proxy.ts", "utf8")
    const allowlist = proxy.slice(
      proxy.indexOf("function isEnterRoute"),
      proxy.indexOf("function isEnterRoute") + 2500,
    )
    const exactApiEquals = [...allowlist.matchAll(/pathname === "(\/api\/[^"]+)"/g)].map((m) => m[1])
    expect(exactApiEquals.sort()).toEqual([...MOBILE_GATE_ALLOWLIST].sort())
    expect(allowlist).not.toContain("/api/checkout")
    expect(allowlist).not.toContain("/api/consult")
    expect(allowlist).not.toContain("/api/account/delete")
    expect(withoutComments(allowlist)).not.toContain("focus-today")
  })
})
