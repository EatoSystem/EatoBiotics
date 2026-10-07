import { describe, it, expect } from "vitest"
import { existsSync, readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"
import {
  MOBILE_BEARER_ROUTES,
  MOBILE_GATE_ALLOWLIST,
  MOBILE_TODAY_PATH,
  mobileTodayResponseSchema,
  ritualDaySchema,
} from "@eatobiotics/contracts"
import { PERSONAL_BIOTIC_STATE, bioticFlowsIntoVisual } from "@eatobiotics/claims"
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

const TODAY_ROUTE = "app/api/mobile/v1/today/route.ts"
const COMPOSE = "lib/mobile/compose-today.ts"
const NEXT_STEP = "lib/mobile/next-step.ts"
const PROXY = "proxy.ts"

describe("P1 mobile companion — auth, composed today, gate allowlist", () => {
  it("implements GET /api/mobile/v1/today with dual-surface auth", () => {
    expect(existsSync(TODAY_ROUTE)).toBe(true)
    expect(MOBILE_TODAY_PATH).toBe("/api/mobile/v1/today")
    expect(MOBILE_BEARER_ROUTES.today).toBe(MOBILE_TODAY_PATH)
    const src = withoutComments(readFileSync(TODAY_ROUTE, "utf8"))
    expect(src).toMatch(/getUserFromRequest/)
    expect(src).not.toMatch(/focus-today/)
    expect(src).not.toMatch(/getUser\(\)/)
    expect(readFileSync(TODAY_ROUTE, "utf8")).toMatch(/Authorization: Bearer/)
  })

  it("the composer never reads per-Biotic columns or focus-today", () => {
    const src = withoutComments(
      `${readFileSync(COMPOSE, "utf8")}\n${readFileSync(NEXT_STEP, "utf8")}\n${readFileSync(TODAY_ROUTE, "utf8")}`,
    )
    expect(src).not.toMatch(/prebiotic_score|probiotic_score|postbiotic_score/)
    expect(src).not.toMatch(/\bweakest\b|\bstrongest\b|orderedByNeed/)
    expect(src).not.toMatch(/focus-today/)
    expect(src).not.toMatch(/buildAccountTwin/)
  })

  it("next-step input cannot smuggle a selector — no Biotic fields", () => {
    const src = withoutComments(readFileSync(NEXT_STEP, "utf8"))
    expect(src).toMatch(/loggedToday/)
    expect(src).toMatch(/hasBioticsScore/)
    expect(src).not.toMatch(/prebiotic|probiotic|postbiotic/)
    expect(src).toMatch(/reviewed-material/)
    expect(src).toMatch(/general-next-step/)
    expect(src).toMatch(/absence/)
  })

  it("ritual today round-trips all five keys (zod strip scar)", () => {
    const threeKey = ritualDaySchema.parse({ fermented: true, plants: false, feeling: true })
    expect(threeKey).toEqual({
      fermented: true,
      plants: false,
      moved: false,
      slept: false,
      feeling: true,
    })
    const extra = ritualDaySchema.parse({
      fermented: true,
      plants: true,
      moved: true,
      slept: true,
      feeling: false,
      leftover: "drop me",
    })
    expect("leftover" in extra).toBe(false)
    expect(Object.keys(extra).sort()).toEqual(["feeling", "fermented", "moved", "plants", "slept"])
  })

  it("password-gate allowlist is the four companion routes, not ~101 others", () => {
    const proxy = readFileSync(PROXY, "utf8")
    const allowlist = proxy.slice(
      proxy.indexOf("function isEnterRoute"),
      proxy.indexOf("function isEnterRoute") + 2500,
    )
    for (const path of MOBILE_GATE_ALLOWLIST) {
      expect(allowlist, path).toContain(`pathname === "${path}"`)
    }
    expect(allowlist).not.toContain('pathname === "/api/account/delete"')
    expect(allowlist).not.toContain('pathname === "/api/account/export"')
    expect(withoutComments(allowlist)).not.toContain("focus-today")
    expect(allowlist).not.toContain("/api/checkout")
    expect(allowlist).not.toContain("/api/consult")
    expect(allowlist).not.toContain("/api/stripe")
    const exactApiEquals = [...allowlist.matchAll(/pathname === "(\/api\/[^"]+)"/g)].map((m) => m[1])
    expect(exactApiEquals.sort()).toEqual([...MOBILE_GATE_ALLOWLIST].sort())
  })

  it("cookie-only delete/export stay on getUser, not bearer", () => {
    const del = readFileSync("app/api/account/delete/route.ts", "utf8")
    const exp = readFileSync("app/api/account/export/route.ts", "utf8")
    expect(del).toMatch(/getUser\(\)/)
    expect(exp).toMatch(/getUser\(\)/)
    expect(del).not.toMatch(/getUserFromRequest/)
    expect(exp).not.toMatch(/getUserFromRequest/)
    const mobile = walkTs("apps/mobile").map((f) => readFileSync(f, "utf8")).join("\n")
    expect(mobile).not.toMatch(/\/api\/account\/delete/)
    expect(mobile).not.toMatch(/\/api\/account\/export/)
  })

  it("magic-link send does not take an arbitrary redirectTo", () => {
    const src = readFileSync("app/api/auth/send-magic-link/route.ts", "utf8")
    expect(src).toMatch(/client === "mobile"/)
    expect(src).toMatch(/\/auth\/callback\?client=mobile/)
    expect(src).not.toMatch(/redirectTo:\s*[^\n]*body/)
    const bounce = readFileSync("app/auth/callback/page.tsx", "utf8")
    expect(bounce).toMatch(/eatobiotics:\/\/auth\/callback/)
    expect(bounce).toMatch(/client"\) === "mobile"/)
    expect(bounce.indexOf("eatobiotics://auth/callback")).toBeLessThan(
      bounce.indexOf("const supabase = getSupabaseBrowser"),
    )
  })

  it("session persistence uses expo-secure-store, not AsyncStorage", () => {
    const storage = readFileSync("apps/mobile/src/auth/secure-storage.ts", "utf8")
    const session = readFileSync("apps/mobile/src/auth/session.ts", "utf8")
    const pkg = readFileSync("apps/mobile/package.json", "utf8")
    expect(pkg).toMatch(/expo-secure-store/)
    expect(session).toMatch(/secureAuthStorage/)
    expect(storage).toMatch(/expo-secure-store/)
    expect(withoutComments(storage)).not.toMatch(/AsyncStorage/)
    expect(withoutComments(session)).not.toMatch(/AsyncStorage/)
  })

  it("Today screen is served from the parsed payload, not a client selector", () => {
    const screen = readFileSync("apps/mobile/src/screens/TodayScreen.tsx", "utf8")
    const app = readFileSync("apps/mobile/App.tsx", "utf8")
    expect(app).toMatch(/TodayScreen/)
    expect(app).toMatch(/accessToken/)
    expect(screen).toMatch(/fetchToday/)
    expect(screen).toMatch(/mobileTodayResponseSchema|MobileTodayResponse/)
    expect(withoutComments(screen)).not.toMatch(/focus-today/)
    expect(withoutComments(screen)).not.toMatch(/prebiotic_score|probiotic_score|postbiotic_score/)
    expect(withoutComments(screen)).not.toMatch(/orderedByNeed|\bweakest\b/)
  })

  it("signed-in shell drops the holding screen; signed-out copy stays for sabotage", () => {
    const app = readFileSync("apps/mobile/App.tsx", "utf8")
    expect(app).toMatch(/<TodayScreen/)
    expect(app).toMatch(/<Text style=\{styles\.hold\}>Today, meals and check-in land in later phases\.<\/Text>/)
    expect(app).toMatch(/Daily companion for iOS and Android/)
  })

  it("does not put secrets or commerce in the bundle", () => {
    const files = walkTs("apps/mobile")
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
    const pkg = readFileSync("apps/mobile/package.json", "utf8")
    expect(pkg).not.toMatch(/react-native-webview|expo-iap|react-native-iap/)
  })

  it("a per-Biotic bar in the Today screen still fails the RN dialect", () => {
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

  it("the today schema still refuses personal per-Biotic fields", () => {
    expect(() =>
      mobileTodayResponseSchema.parse({
        bioticsScore: 74,
        streak: { current: 1, longest: 3, loggedToday: true, daysSinceLast: 0 },
        ritualToday: null,
        recentActivity: [],
        nextStep: { kind: "absence", copy: "No personalised focus yet." },
        entitlementTier: "member",
        prebiotic_score: 10,
      }),
    ).not.toThrow()
    const parsed = mobileTodayResponseSchema.parse({
      bioticsScore: 74,
      streak: { current: 1, longest: 3, loggedToday: true, daysSinceLast: 0 },
      ritualToday: null,
      recentActivity: [],
      nextStep: { kind: "absence", copy: "No personalised focus yet." },
      entitlementTier: "member",
      prebiotic_score: 10,
    })
    expect("prebiotic_score" in parsed).toBe(false)
  })
})
