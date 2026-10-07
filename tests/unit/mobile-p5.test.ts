import { describe, it, expect } from "vitest"
import { existsSync, readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"
import {
  MOBILE_BEARER_ROUTES,
  MOBILE_GATE_ALLOWLIST,
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

const DELETE_ROUTE = "app/api/account/delete/route.ts"
const EXPORT_ROUTE = "app/api/account/export/route.ts"
const SCREEN = "apps/mobile/src/screens/AccountScreen.tsx"
const FETCH = "apps/mobile/src/api/account-delete.ts"
const LOCAL = "apps/mobile/src/notifications/local.ts"
const APP_JSON = "apps/mobile/app.json"
const PLAY = "apps/mobile/privacy/play-data-safety.json"

describe("P5 mobile companion — privacy, deletion, local reminders", () => {
  it("names DELETE /api/account/delete as dual-surface and gate-allowlisted", () => {
    expect(MOBILE_BEARER_ROUTES.accountDelete).toBe("/api/account/delete")
    expect(MOBILE_GATE_ALLOWLIST).toContain("/api/account/delete")
    expect(MOBILE_GATE_ALLOWLIST).not.toContain("/api/account/export")
    const src = withoutComments(readFileSync(DELETE_ROUTE, "utf8"))
    expect(src).toMatch(/getUserFromRequest/)
    expect(src).not.toMatch(/getUser\(\)/)
    expect(readFileSync(DELETE_ROUTE, "utf8")).toMatch(/Authorization: Bearer/)
    const exp = readFileSync(EXPORT_ROUTE, "utf8")
    expect(exp).toMatch(/getUser\(\)/)
    expect(exp).not.toMatch(/getUserFromRequest/)
  })

  it("permission copy is meal photos — nothing else invented", () => {
    const app = JSON.parse(readFileSync(APP_JSON, "utf8")) as {
      expo: {
        ios: {
          infoPlist: Record<string, string>
          privacyManifests: {
            NSPrivacyTracking: boolean
            NSPrivacyCollectedDataTypes: { NSPrivacyCollectedDataType: string }[]
          }
        }
        android: { permissions: string[]; blockedPermissions: string[] }
        plugins: unknown[]
      }
    }
    expect(app.expo.ios.infoPlist.NSCameraUsageDescription).toMatch(/meal/)
    expect(app.expo.ios.infoPlist.NSPhotoLibraryUsageDescription).toMatch(/meal/)
    const plist = JSON.stringify(app.expo.ios.infoPlist)
    expect(plist).not.toMatch(/NSLocationWhenInUseUsageDescription|NSLocationAlways/)
    expect(plist).not.toMatch(/NSMicrophoneUsageDescription/)
    expect(plist).not.toMatch(/NSContactsUsageDescription|NSHealthShareUsageDescription/)
    expect(plist).not.toMatch(/NSUserTrackingUsageDescription/)
    expect(app.expo.ios.privacyManifests.NSPrivacyTracking).toBe(false)
    const types = app.expo.ios.privacyManifests.NSPrivacyCollectedDataTypes.map(
      (row) => row.NSPrivacyCollectedDataType,
    )
    expect(types).toContain("NSPrivacyCollectedDataTypePhotosorVideos")
    expect(types).not.toContain("NSPrivacyCollectedDataTypePreciseLocation")
    expect(types).not.toContain("NSPrivacyCollectedDataTypeHealth")
    expect(types).not.toContain("NSPrivacyCollectedDataTypePurchaseHistory")
    expect(app.expo.android.permissions).toContain("android.permission.CAMERA")
    expect(app.expo.android.blockedPermissions).toEqual(
      expect.arrayContaining([
        "android.permission.RECORD_AUDIO",
        "android.permission.ACCESS_FINE_LOCATION",
        "android.permission.READ_CONTACTS",
      ]),
    )
    expect(JSON.stringify(app.expo.plugins)).toMatch(/microphonePermission/)
  })

  it("Play Data Safety matches meal photos and account data, not invented sensors", () => {
    expect(existsSync(PLAY)).toBe(true)
    const play = JSON.parse(readFileSync(PLAY, "utf8")) as {
      dataCollected: { type: string }[]
      dataNotCollected: string[]
      securityPractices: { usersCanRequestDeletion: boolean }
    }
    expect(play.dataCollected.map((row) => row.type)).toEqual([
      "Photos and videos",
      "Email address",
      "User IDs",
      "Other user-generated content",
    ])
    expect(play.dataNotCollected.join(" ")).toMatch(/location/i)
    expect(play.dataNotCollected.join(" ")).toMatch(/Microphone/)
    expect(play.dataNotCollected.join(" ")).toMatch(/Health/)
    expect(play.dataNotCollected.join(" ")).toMatch(/Purchase/)
    expect(play.securityPractices.usersCanRequestDeletion).toBe(true)
  })

  it("in-app deletion confirms, then DELETEs with bearer; export is not called", () => {
    expect(existsSync(SCREEN)).toBe(true)
    expect(MOBILE_SURFACES).toContain(SCREEN)
    const screen = withoutComments(readFileSync(SCREEN, "utf8"))
    expect(screen).toMatch(/Type DELETE to confirm/)
    expect(screen).toMatch(/deleteAccount/)
    expect(screen).not.toMatch(/\/api\/account\/export/)
    expect(screen).not.toMatch(/focus-today|prebiotic_score|orderedByNeed/)
    const fetchSrc = readFileSync(FETCH, "utf8")
    expect(fetchSrc).toMatch(/MOBILE_BEARER_ROUTES\.accountDelete/)
    expect(fetchSrc).toContain('console.error("[mobile-account-delete] DELETE failed"')
    expect(withoutComments(fetchSrc)).not.toMatch(/catch(?:\s*\([^)]*\))?\s*\{\s*\}/)
    const today = readFileSync("apps/mobile/src/screens/TodayScreen.tsx", "utf8")
    expect(today).toMatch(/onAccount/)
    expect(today).toMatch(/Account/)
    const app = readFileSync("apps/mobile/App.tsx", "utf8")
    expect(app).toMatch(/AccountScreen/)
  })

  it("notification scaffolding is local-only — no push tokens, no secrets in the repo", () => {
    const src = withoutComments(readFileSync(LOCAL, "utf8"))
    expect(src).not.toMatch(/getExpoPushTokenAsync|getDevicePushTokenAsync/)
    expect(src).not.toMatch(/sendPushNotificationsAsync|ExpoPushToken/)
    expect(src).not.toMatch(/APNs|FCM_SERVER|firebase-admin/)
    expect(src).toMatch(/scheduleNotificationAsync/)
    expect(src).toMatch(/requestPermissionsAsync/)
    expect(src).toMatch(/NOTIFICATION_CONSENT_KEY/)

    const files = walkTs("apps/mobile")
    const joined = files.map((f) => withoutComments(readFileSync(f, "utf8"))).join("\n")
    expect(joined).not.toMatch(/SUPABASE_SERVICE_ROLE_KEY|STRIPE_SECRET_KEY|ANTHROPIC_API_KEY|CRON_SECRET/)
    expect(joined).not.toMatch(/getExpoPushTokenAsync|getDevicePushTokenAsync/)
    expect(existsSync("apps/mobile/google-services.json")).toBe(false)
    expect(existsSync("apps/mobile/GoogleService-Info.plist")).toBe(false)
    const appJson = readFileSync(APP_JSON, "utf8")
    expect(appJson).not.toMatch(/googleServicesFile|aps-environment/)
    const pkg = readFileSync("apps/mobile/package.json", "utf8")
    expect(pkg).toMatch(/expo-notifications/)
    expect(pkg).not.toMatch(/react-native-webview|expo-iap|react-native-iap/)
  })

  it("a per-Biotic bar in the Account screen still fails the RN dialect", () => {
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

  it("does not copy IAP, Assessment, extra routes, or production writes", () => {
    const files = [FETCH, SCREEN, LOCAL, DELETE_ROUTE]
    for (const file of files) {
      const src = withoutComments(readFileSync(file, "utf8"))
      expect(src, file).not.toMatch(/catch(?:\s*\([^)]*\))?\s*\{\s*\}/)
      expect(src, file).not.toMatch(/Food System Assessment/)
      expect(src, file).not.toMatch(/Personal Food System Report/)
    }
    const proxy = readFileSync("proxy.ts", "utf8")
    const allowlist = proxy.slice(
      proxy.indexOf("function isEnterRoute"),
      proxy.indexOf("function isEnterRoute") + 2500,
    )
    const exactApiEquals = [...allowlist.matchAll(/pathname === "(\/api\/[^"]+)"/g)].map((m) => m[1])
    expect(exactApiEquals.sort()).toEqual([...MOBILE_GATE_ALLOWLIST].sort())
    expect(allowlist).not.toContain("/api/checkout")
    expect(allowlist).not.toContain("/api/consult")
    expect(allowlist).not.toContain("/api/account/export")
    expect(withoutComments(allowlist)).not.toContain("focus-today")
  })
})
