import { describe, it, expect } from "vitest"
import { existsSync, readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"
import {
  MEAL_SCAN_PERSIST_KEY,
  MOBILE_BEARER_ROUTES,
  analyseMealResponseSchema,
  createMealScanController,
  memoryKv,
  postAnalyseMeal,
  presentMealScanResult,
} from "@eatobiotics/contracts"
import { PERSONAL_BIOTIC_STATE, bioticFlowsIntoVisual } from "@eatobiotics/claims"
import { MEAL_BIOTICS_SCORE, BIOTICS_SCORE } from "@eatobiotics/vocabulary"
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

const PHASE_C_MEAL = {
  id: "row-1",
  created_at: "2026-10-07T12:00:00Z",
  meal_name: "Oats and kefir",
  meal_type: "Breakfast",
  biotics_score: 72,
  prebiotic_score: 80,
  probiotic_score: 65,
  postbiotic_score: 55,
  quality_diversity: 70,
  quality_anti_inflammatory: 60,
  nutrition: { calories: 420, protein: 18, carbs: 55, fat: 12, fibre: 8 },
  insight: "Plant fibre and a fermented food on the same plate.",
  tags: ["Prebiotics", "Fermented Foods", "High Fibre"],
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  })
}

describe("P3 mobile companion — meal scan via POST /api/analyse-meal", () => {
  it("reuses the Phase C JSON contract and keeps plate scores off the view", () => {
    expect(MOBILE_BEARER_ROUTES.analyseMeal).toBe("/api/analyse-meal")
    const parsed = analyseMealResponseSchema.parse(PHASE_C_MEAL)
    expect(parsed.prebiotic_score).toBe(80)
    expect(parsed.probiotic_score).toBe(65)
    expect(parsed.postbiotic_score).toBe(55)
    const view = presentMealScanResult(parsed)
    expect(view.mealBioticsScore).toBe(72)
    expect(view.mealName).toBe("Oats and kefir")
    expect(view.tags).toEqual(["Prebiotics", "Fermented Foods", "High Fibre"])
    expect("prebiotic_score" in view).toBe(false)
    expect("probiotic_score" in view).toBe(false)
    expect("postbiotic_score" in view).toBe(false)
    expect(MEAL_BIOTICS_SCORE).not.toBe(BIOTICS_SCORE)
  })

  it("POSTs bearer JSON and surfaces a cap error as the server wrote it", async () => {
    const cap = "Daily limit reached. Your plan allows 2 meal analyses per day."
    const logs: unknown[] = []
    let postedUrl = ""
    let postedBody: unknown
    const limited = await postAnalyseMeal(
      "https://example.test/api/analyse-meal",
      "token",
      { description: "oats" },
      {
        logError: (message, cause) => logs.push([message, cause]),
        fetchImpl: async (url, init) => {
          postedUrl = url
          postedBody = JSON.parse(String(init?.body))
          expect(init?.headers).toMatchObject({ Authorization: "Bearer token" })
          return jsonResponse({ error: cap, resetAt: "2026-10-08T00:00:00.000Z" }, 429)
        },
      },
    )
    expect(limited).toEqual({ ok: false, reason: "limited", message: cap })
    expect(postedUrl).toContain("/api/analyse-meal")
    expect(postedBody).toEqual({ description: "oats" })
    expect(logs[0]).toEqual(["[mobile-analyse-meal] POST limited", 429])

    const rate = await postAnalyseMeal(
      "https://example.test/api/analyse-meal",
      "token",
      { description: "oats" },
      {
        logError: () => {},
        fetchImpl: async () =>
          jsonResponse({ error: "Too many requests. Please slow down and try again shortly." }, 429),
      },
    )
    expect(rate).toEqual({
      ok: false,
      reason: "limited",
      message: "Too many requests. Please slow down and try again shortly.",
    })
  })

  it("does not invent unlimited Member analyses or a local cap table", () => {
    const files = [
      "packages/contracts/src/analyse-meal-client.ts",
      "apps/mobile/src/api/analyse-meal.ts",
      "apps/mobile/src/sync/meal-scan.ts",
      "apps/mobile/src/screens/MealScreen.tsx",
      "apps/mobile/App.tsx",
      "apps/mobile/src/screens/TodayScreen.tsx",
    ]
    const joined = files.map((f) => withoutComments(readFileSync(f, "utf8"))).join("\n")
    expect(joined).not.toMatch(/DAILY_LIMITS/)
    expect(joined).not.toMatch(/grow:\s*2/)
    expect(joined).not.toMatch(/restore:\s*5/)
    expect(joined).not.toMatch(/transform:\s*10/)
    expect(joined).not.toMatch(/unlimited/i)
    expect(joined).not.toMatch(/Members? get unlimited/)
  })

  it("POST failure is logged, never swallowed, and a queued capture retries", async () => {
    const logs: unknown[] = []
    const thrown = await postAnalyseMeal(
      "https://example.test/api/analyse-meal",
      "token",
      { description: "oats" },
      {
        fetchImpl: async () => {
          throw new Error("offline")
        },
        logError: (message, cause) => logs.push([message, cause]),
      },
    )
    expect(thrown).toEqual({
      ok: false,
      reason: "unavailable",
      message: "Could not reach the server. Try again.",
    })
    expect(logs[0]).toEqual(["[mobile-analyse-meal] POST failed", expect.any(Error)])

    const kv = memoryKv({
      [MEAL_SCAN_PERSIST_KEY]: JSON.stringify({
        status: "queued",
        description: "oats with berries",
        mealType: "Breakfast",
      }),
    })
    const posts: unknown[] = []
    const c = createMealScanController({
      accessToken: "token",
      analyseMealUrl: "https://example.test/api/analyse-meal",
      kv,
      fetchImpl: async (_url, init) => {
        posts.push(JSON.parse(String(init?.body)))
        return jsonResponse(PHASE_C_MEAL)
      },
    })
    await c.hydrate()
    expect(posts).toEqual([{ description: "oats with berries", meal_type: "Breakfast" }])
    expect(c.snapshot().status).toBe("sent")
    expect(c.snapshot().view?.mealBioticsScore).toBe(72)
    expect(c.snapshot().view?.tags).toContain("Prebiotics")
  })

  it("the member sees queued, then the Meal Biotics Score, and the server's cap wording", async () => {
    let postWait: ((res: Response) => void) | null = null
    const c = createMealScanController({
      accessToken: "token",
      analyseMealUrl: "https://example.test/api/analyse-meal",
      kv: memoryKv(),
      fetchImpl: async () =>
        new Promise<Response>((resolve) => {
          postWait = resolve
        }),
    })
    const submitting = c.submit({ description: "kimchi bowl" })
    expect(c.snapshot().status).toBe("queued")
    for (let i = 0; i < 20 && !postWait; i++) await Promise.resolve()
    expect(postWait).toBeTruthy()
    postWait!(jsonResponse(PHASE_C_MEAL))
    await submitting
    expect(c.snapshot().status).toBe("sent")
    expect(c.snapshot().view?.mealBioticsScore).toBe(72)
    expect(c.snapshot().view?.mealName).toBe("Oats and kefir")

    const cap = "Daily limit reached. Your plan allows 2 meal analyses per day."
    const capped = createMealScanController({
      accessToken: "token",
      analyseMealUrl: "https://example.test/api/analyse-meal",
      kv: memoryKv(),
      logError: () => {},
      fetchImpl: async () => jsonResponse({ error: cap, resetAt: "2026-10-08T00:00:00.000Z" }, 429),
    })
    await capped.submit({ description: "toast" })
    expect(capped.snapshot().status).toBe("failed")
    expect(capped.snapshot().reason).toBe("limited")
    expect(capped.snapshot().error).toBe(cap)
    expect(capped.snapshot().view).toBeNull()
  })

  it("Meal screen states a Meal Biotics Score and meal-fact tags, never a personal bar", () => {
    expect(MOBILE_SURFACES).toContain("apps/mobile/src/screens/MealScreen.tsx")
    const screen = withoutComments(readFileSync("apps/mobile/src/screens/MealScreen.tsx", "utf8"))
    expect(screen).toMatch(/\{MEAL_BIOTICS_SCORE\}/)
    expect(screen).not.toMatch(/\{BIOTICS_SCORE\}/)
    expect(screen).toMatch(/On this plate/)
    expect(screen).toMatch(/view\.tags/)
    expect(screen).toMatch(/Take photo/)
    expect(screen).toMatch(/Queued — waiting to send/)
    expect(screen).toMatch(/"Sent"/)
    expect(screen).toMatch(/Failed — tap to retry/)
    expect(screen).not.toMatch(/prebiotic_score|probiotic_score|postbiotic_score/)
    expect(screen).not.toMatch(/orderedByNeed|\bweakest\b|focus-today/)
    expect(screen).not.toMatch(/\/api\/analyse[^-]|app\/analyse/)
    expect(bioticFlowsIntoVisual(screen)).toBe(false)
    expect(PERSONAL_BIOTIC_STATE.some(([, r]) => r.test(screen))).toBe(false)
  })

  it("a per-Biotic bar in the Meal screen still fails the RN dialect", () => {
    const forbidden = [
      "const personal = twin.biotics.prebiotics.score",
      "<Text>Your Prebiotics {personal}/100</Text>",
      "<View style={{ width: `${personal}%`, backgroundColor: '#2DAA6E' }} />",
    ].join("\n")
    expect(bioticFlowsIntoVisual(forbidden)).toBe(true)
    const live = MOBILE_SURFACES.map((f) => withoutComments(readFileSync(f, "utf8"))).join("\n")
    expect(bioticFlowsIntoVisual(live)).toBe(false)
  })

  it("does not copy a silent catch, IAP, WebView, Assessment or extra routes", () => {
    const files = [
      "packages/contracts/src/analyse-meal-client.ts",
      "apps/mobile/src/api/analyse-meal.ts",
      "apps/mobile/src/sync/meal-scan.ts",
      "apps/mobile/src/screens/MealScreen.tsx",
    ]
    for (const file of files) {
      const src = withoutComments(readFileSync(file, "utf8"))
      expect(src, file).not.toMatch(/catch(?:\s*\([^)]*\))?\s*\{\s*\}/)
      expect(src, file).not.toMatch(/\.catch\(\s*\(\)\s*=>\s*\{\s*\}\s*\)/)
    }
    const api = readFileSync("packages/contracts/src/analyse-meal-client.ts", "utf8")
    expect(api).toContain('logError("[mobile-analyse-meal] POST failed", error)')
    const mobileApi = readFileSync("apps/mobile/src/api/analyse-meal.ts", "utf8")
    expect(mobileApi).toMatch(/MOBILE_BEARER_ROUTES\.analyseMeal/)
    expect(mobileApi).toMatch(/postAnalyseMeal/)
    const app = readFileSync("apps/mobile/App.tsx", "utf8")
    expect(app).toMatch(/MealScreen/)
    const today = readFileSync("apps/mobile/src/screens/TodayScreen.tsx", "utf8")
    expect(today).toMatch(/Log a meal/)
    expect(withoutComments(today)).not.toMatch(/\/api\/analyse-meal/)

    const mobile = walkTs("apps/mobile").map((f) => withoutComments(readFileSync(f, "utf8"))).join("\n")
    expect(mobile).not.toMatch(/SUPABASE_SERVICE_ROLE_KEY|STRIPE_SECRET_KEY|ANTHROPIC_API_KEY|CRON_SECRET/)
    expect(mobile).not.toMatch(/Food System Assessment/)
    expect(mobile).not.toMatch(/Personal Food System Report/)
    const pkg = readFileSync("apps/mobile/package.json", "utf8")
    expect(pkg).not.toMatch(/react-native-webview|expo-iap|react-native-iap/)
    expect(pkg).toMatch(/expo-image-picker/)
    const appJson = readFileSync("apps/mobile/app.json", "utf8")
    expect(appJson).toMatch(/Take a photo of your meal/)

    const proxy = readFileSync("proxy.ts", "utf8")
    const allowlist = proxy.slice(
      proxy.indexOf("function isEnterRoute"),
      proxy.indexOf("function isEnterRoute") + 2000,
    )
    const exactApiEquals = [...allowlist.matchAll(/pathname === "(\/api\/[^"]+)"/g)].map((m) => m[1])
    expect(exactApiEquals.sort()).toEqual([
      "/api/analyse-meal",
      "/api/feedback",
      "/api/mobile/v1/today",
      "/api/twin-state",
    ])
  })
})
