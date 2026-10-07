import { describe, it, expect } from "vitest"
import { existsSync, readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"
import { PERSONAL_BIOTIC_STATE } from "@eatobiotics/claims"
import { MOBILE_TODAY_PATH, mobileTodayResponseSchema } from "@eatobiotics/contracts"
import { FOOD_SYSTEM_ASSESSMENT, BIOTICS_SCORE, MEAL_BIOTICS_SCORE, MEMBER } from "@eatobiotics/vocabulary"
import { FOOD_SYSTEM_ASSESSMENT as WEB_ASSESSMENT, MEMBER as WEB_MEMBER } from "@/lib/product-vocabulary"
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

describe("P0 mobile companion — capability graph, not a second product", () => {
  it("runs the same nine PERSONAL_BIOTIC_STATE rules the web does", () => {
    expect(PERSONAL_BIOTIC_STATE).toHaveLength(9)
  })

  it("the Expo app is iOS and Android capable", () => {
    const app = JSON.parse(readFileSync("apps/mobile/app.json", "utf8")) as {
      expo: { ios?: { bundleIdentifier?: string }; android?: { package?: string } }
    }
    expect(app.expo.ios?.bundleIdentifier).toBe("com.eatobiotics.app")
    expect(app.expo.android?.package).toBe("com.eatobiotics.app")
    const pkg = JSON.parse(readFileSync("apps/mobile/package.json", "utf8")) as {
      dependencies: Record<string, string>
    }
    expect(pkg.dependencies.expo).toMatch(/^~57/)
    expect(pkg.dependencies["react-native"]).toBeTruthy()
  })

  it("lists every named mobile surface and each file exists", () => {
    expect(MOBILE_SURFACES).toContain("apps/mobile/App.tsx")
    expect(MOBILE_SURFACES).toContain("apps/mobile/src/config.ts")
    expect(MOBILE_SURFACES).toContain("apps/mobile/src/screens/MealScreen.tsx")
    for (const file of MOBILE_SURFACES) {
      expect(existsSync(file), `missing ${file}`).toBe(true)
    }
  })

  it("names GET /api/mobile/v1/today as the composed read", () => {
    expect(MOBILE_TODAY_PATH).toBe("/api/mobile/v1/today")
  })

  it("the today contract has no personal per-Biotic fields", () => {
    const src = withoutComments(readFileSync("packages/contracts/src/mobile-today.ts", "utf8"))
    expect(src).not.toMatch(/prebiotic_score|probiotic_score|postbiotic_score/)
    expect(src).not.toMatch(/\bweakest\b|\bstrongest\b|orderedByNeed|focus-today/)
    expect(src).toMatch(/reviewed-material/)
    expect(src).toMatch(/absence/)
    const parsed = mobileTodayResponseSchema.parse({
      bioticsScore: 74,
      streak: { current: 1, longest: 3, loggedToday: true, daysSinceLast: 0 },
      ritualToday: { fermented: true, plants: false, moved: false, slept: false, feeling: true },
      recentActivity: [{ kind: "meal", at: "2026-10-07T08:00:00Z", summary: "Logged a meal", mealBioticsScore: 62 }],
      nextStep: { kind: "absence", copy: "No personalised focus yet." },
      entitlementTier: "member",
    })
    expect(parsed.bioticsScore).toBe(74)
    expect("prebiotic_score" in parsed).toBe(false)
  })

  it("shares vocabulary with the web re-export — no second set of names", () => {
    expect(FOOD_SYSTEM_ASSESSMENT).toBe(WEB_ASSESSMENT)
    expect(MEMBER).toBe(WEB_MEMBER)
    expect(BIOTICS_SCORE).toBe("Biotics Score™")
    expect(MEAL_BIOTICS_SCORE).not.toBe(BIOTICS_SCORE)
    const app = readFileSync("apps/mobile/App.tsx", "utf8")
    expect(app).toMatch(/from ["']@eatobiotics\/vocabulary["']/)
    expect(app).not.toMatch(/from ["']@\/lib\/product-vocabulary["']/)
  })

  it("holds no service-role, Stripe, Anthropic or cron secrets", () => {
    const files = [
      ...walkTs("apps/mobile"),
      "packages/contracts/src/index.ts",
      "packages/vocabulary/src/index.ts",
    ]
    const forbidden = [
      /SUPABASE_SERVICE_ROLE_KEY/,
      /STRIPE_SECRET_KEY/,
      /STRIPE_WEBHOOK_SECRET/,
      /ANTHROPIC_API_KEY/,
      /CRON_SECRET/,
      /OPENAI_API_KEY/,
    ]
    for (const file of files) {
      const src = withoutComments(readFileSync(file, "utf8"))
      for (const pattern of forbidden) {
        expect(src, `${file} must not mention ${pattern}`).not.toMatch(pattern)
      }
    }
  })

  it("does not ship Assessment, Report, IAP or a WebView wrap", () => {
    const app = readFileSync("apps/mobile/App.tsx", "utf8")
    const cfg = readFileSync("apps/mobile/src/config.ts", "utf8")
    const pkg = readFileSync("apps/mobile/package.json", "utf8")
    const joined = `${app}\n${cfg}\n${pkg}`
    expect(joined).not.toMatch(/react-native-webview|WebView/)
    expect(joined).not.toMatch(/expo-in-app-purchases|react-native-iap|expo-iap/)
    expect(joined).not.toMatch(/Food System Assessment/)
    expect(joined).not.toMatch(/Personal Food System Report/)
    expect(app).not.toMatch(/from ["']react-native-webview["']/)
  })

  it("a new tsx under apps/mobile/src is a decision, not an accident", () => {
    const present = walkTs("apps/mobile").filter((f) => /\.(ts|tsx)$/.test(f) && !f.includes("node_modules"))
    const named = new Set([
      "apps/mobile/App.tsx",
      "apps/mobile/index.ts",
      "apps/mobile/src/config.ts",
      "apps/mobile/src/api/today.ts",
      "apps/mobile/src/api/twin-state.ts",
      "apps/mobile/src/auth/deep-link.ts",
      "apps/mobile/src/auth/magic-link.ts",
      "apps/mobile/src/auth/secure-storage.ts",
      "apps/mobile/src/auth/session.ts",
      "apps/mobile/src/api/analyse-meal.ts",
      "apps/mobile/src/screens/MealScreen.tsx",
      "apps/mobile/src/screens/SignInScreen.tsx",
      "apps/mobile/src/screens/TodayScreen.tsx",
      "apps/mobile/src/sync/check-in.ts",
      "apps/mobile/src/sync/meal-scan.ts",
      "apps/mobile/src/sync/persist.ts",
    ])
    for (const file of present) {
      expect(named, `${file} exists but is not a known companion file — add it to MOBILE_SURFACES if it can speak to a member`).toContain(file)
    }
  })
})
