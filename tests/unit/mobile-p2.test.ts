import { describe, it, expect } from "vitest"
import { existsSync, readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"
import {
  CHECK_IN_PERSIST_KEY,
  EMPTY_RITUAL,
  MOBILE_BEARER_ROUTES,
  RITUAL_DAY_KEYS,
  buildTwinStatePut,
  createCheckInController,
  getTwinState,
  incomingDayWins,
  localDayKey,
  memoryKv,
  normaliseRitualDay,
  pickTodayRitual,
  putTwinState,
  ritualDaySchema,
  toggleRitualKey,
  twinStateGetSchema,
  twinStatePutSchema,
} from "@eatobiotics/contracts"
import { PERSONAL_BIOTIC_STATE, bioticFlowsIntoVisual } from "@eatobiotics/claims"
import { RITUAL_CHECKS } from "@/lib/account/ritual"
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

const FIVE = ["feeling", "fermented", "moved", "plants", "slept"] as const
const FULL_TRUE = {
  fermented: true,
  plants: true,
  moved: true,
  slept: true,
  feeling: true,
}
const FULL_FALSE = {
  fermented: false,
  plants: false,
  moved: false,
  slept: false,
  feeling: false,
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  })
}

describe("P2 mobile companion — check-in writes, visible sync", () => {
  it("lists every RitualDay key and does not invent extras", () => {
    expect([...RITUAL_DAY_KEYS].sort()).toEqual([...FIVE])
    expect(Object.keys(ritualDaySchema.shape).sort()).toEqual(
      RITUAL_CHECKS.map((c) => c.key).sort(),
    )
    const extra = ritualDaySchema.parse({
      fermented: true,
      plants: false,
      moved: true,
      slept: false,
      feeling: true,
      leftover: true,
      colour: "green",
    })
    expect("leftover" in extra).toBe(false)
    expect("colour" in extra).toBe(false)
    expect(Object.keys(extra).sort()).toEqual([...FIVE])
  })

  it("GET and PUT share the five-key contract", () => {
    expect(twinStateGetSchema).toBe(twinStatePutSchema)
    const parsed = twinStatePutSchema.parse({
      rituals: {
        "2026-10-07": {
          fermented: true,
          plants: true,
          feeling: false,
          leftover: "drop",
        },
      },
      milestonesSeen: ["keep-me"],
    })
    expect(parsed.rituals["2026-10-07"]).toEqual({
      fermented: true,
      plants: true,
      moved: false,
      slept: false,
      feeling: false,
    })
    expect(parsed.milestonesSeen).toEqual(["keep-me"])
  })

  it("incoming day wins whole; other days survive; extra keys never appear", () => {
    const today = "2026-10-07"
    const lastWeek = "2026-09-30"
    const merged = incomingDayWins(
      {
        [today]: FULL_FALSE,
        [lastWeek]: FULL_TRUE,
        leftoverDay: FULL_TRUE,
      },
      {
        [today]: { fermented: true, plants: true, feeling: true, leftover: true },
      },
    )
    expect(merged[today]).toEqual({
      fermented: true,
      plants: true,
      moved: false,
      slept: false,
      feeling: true,
    })
    expect(merged[lastWeek]).toEqual(FULL_TRUE)
    expect(merged.leftoverDay).toBeUndefined()
    expect(Object.keys(merged[today]).sort()).toEqual([...FIVE])
  })

  it("normalise and toggle never invent keys beyond the schema", () => {
    expect(normaliseRitualDay({ fermented: true, leftover: 1 })).toEqual(EMPTY_RITUAL)
    const toggled = toggleRitualKey(EMPTY_RITUAL, "moved")
    expect(toggled.moved).toBe(true)
    expect(Object.keys(toggled).sort()).toEqual([...FIVE])
    const body = buildTwinStatePut("2026-10-07", {
      ...FULL_TRUE,
      leftover: true,
    } as typeof FULL_TRUE)
    expect(Object.keys(body.rituals["2026-10-07"]!).sort()).toEqual([...FIVE])
    expect("leftover" in body.rituals["2026-10-07"]!).toBe(false)
    expect(Object.keys(body)).toEqual(["rituals", "milestonesSeen"])
  })

  it("dirty local today beats the server; a clean local does not", () => {
    const local = { ...FULL_TRUE, slept: false }
    expect(
      pickTodayRitual({
        local,
        localDirty: true,
        server: FULL_FALSE,
        seed: FULL_FALSE,
      }),
    ).toEqual(local)
    expect(
      pickTodayRitual({
        local,
        localDirty: false,
        server: FULL_FALSE,
        seed: FULL_TRUE,
      }),
    ).toEqual(FULL_FALSE)
  })

  it("PUT /api/twin-state uses the bearer route and surfaces failure", async () => {
    expect(MOBILE_BEARER_ROUTES.twinState).toBe("/api/twin-state")
    const logs: unknown[] = []
    const thrown = await putTwinState(
      "https://example.test/api/twin-state",
      "token",
      buildTwinStatePut("2026-10-07", FULL_TRUE),
      {
        fetchImpl: async () => {
          throw new Error("offline")
        },
        logError: (message, cause) => logs.push([message, cause]),
      },
    )
    expect(thrown).toEqual({ ok: false, reason: "unavailable" })
    expect(logs[0]).toEqual(["[mobile-twin-state] PUT failed", expect.any(Error)])

    let putUrl = ""
    let putBody: unknown
    const ok = await putTwinState(
      "https://example.test/api/twin-state",
      "token",
      buildTwinStatePut("2026-10-07", FULL_TRUE),
      {
        fetchImpl: async (url, init) => {
          putUrl = url
          putBody = JSON.parse(String(init?.body))
          return jsonResponse({
            rituals: { "2026-10-07": FULL_TRUE },
            milestonesSeen: [],
          })
        },
      },
    )
    expect(ok.ok).toBe(true)
    expect(putUrl).toContain("/api/twin-state")
    expect(putBody).toEqual({
      rituals: { "2026-10-07": FULL_TRUE },
      milestonesSeen: [],
    })
  })

  it("GET parse failure is invalid, not a silent empty object", async () => {
    const logs: unknown[] = []
    const result = await getTwinState("https://example.test/api/twin-state", "token", {
      fetchImpl: async () => jsonResponse({ rituals: { "not-a-day": FULL_TRUE } }),
      logError: (message, cause) => logs.push([message, cause]),
    })
    expect(result).toEqual({ ok: false, reason: "invalid" })
    expect(logs.length).toBeGreaterThan(0)
  })

  it("the member sees queued, then sent, and failed when PUT throws", async () => {
    const today = localDayKey(new Date("2026-10-07T12:00:00"))
    const statuses: string[] = []
    let putWait: ((res: Response) => void) | null = null
    const fetchImpl = async (_url: string, init?: RequestInit) => {
      if ((init?.method ?? "GET") === "GET") {
        return jsonResponse({ rituals: { [today]: FULL_FALSE }, milestonesSeen: [] })
      }
      return new Promise<Response>((resolve) => {
        putWait = resolve
      })
    }
    const c = createCheckInController({
      accessToken: "token",
      twinStateUrl: "https://example.test/api/twin-state",
      kv: memoryKv(),
      fetchImpl,
      now: () => new Date("2026-10-07T12:00:00"),
    })
    c.subscribe((snap) => statuses.push(snap.status))
    await c.hydrate()
    expect(c.snapshot().status).toBe("sent")
    expect(c.snapshot().ritual).toEqual(FULL_FALSE)

    const toggling = c.toggle("fermented")
    expect(c.snapshot().status).toBe("queued")
    expect(c.snapshot().ritual.fermented).toBe(true)
    for (let i = 0; i < 20 && !putWait; i++) await Promise.resolve()
    expect(putWait).toBeTruthy()
    putWait!(
      jsonResponse({
        rituals: { [today]: { ...FULL_FALSE, fermented: true } },
        milestonesSeen: [],
      }),
    )
    await toggling
    expect(c.snapshot().status).toBe("sent")

    const failing = createCheckInController({
      accessToken: "token",
      twinStateUrl: "https://example.test/api/twin-state",
      kv: memoryKv(),
      now: () => new Date("2026-10-07T12:00:00"),
      fetchImpl: async (_url, init) => {
        if ((init?.method ?? "GET") === "GET") {
          return jsonResponse({ rituals: {}, milestonesSeen: [] })
        }
        throw new Error("offline")
      },
      logError: () => {},
    })
    await failing.hydrate()
    await failing.toggle("plants")
    expect(failing.snapshot().status).toBe("failed")
    expect(failing.snapshot().error).toBe("unavailable")
    expect(statuses).toContain("queued")
    expect(statuses).toContain("sent")
  })

  it("a queued local day survives hydrate and is the incoming PUT body", async () => {
    const today = localDayKey(new Date("2026-10-07T12:00:00"))
    const kv = memoryKv({
      [CHECK_IN_PERSIST_KEY]: JSON.stringify({
        day: today,
        ritual: { ...FULL_FALSE, plants: true },
        dirty: true,
        status: "queued",
      }),
    })
    const puts: unknown[] = []
    const c = createCheckInController({
      accessToken: "token",
      twinStateUrl: "https://example.test/api/twin-state",
      kv,
      now: () => new Date("2026-10-07T12:00:00"),
      seedRitual: FULL_FALSE,
      fetchImpl: async (_url, init) => {
        if ((init?.method ?? "GET") === "GET") {
          return jsonResponse({ rituals: { [today]: FULL_TRUE }, milestonesSeen: [] })
        }
        puts.push(JSON.parse(String(init?.body)))
        return jsonResponse({ rituals: { [today]: { ...FULL_FALSE, plants: true } }, milestonesSeen: [] })
      },
    })
    await c.hydrate()
    expect(c.snapshot().ritual.plants).toBe(true)
    expect(c.snapshot().ritual.fermented).toBe(false)
    expect(puts).toEqual([
      {
        rituals: { [today]: { ...FULL_FALSE, plants: true } },
        milestonesSeen: [],
      },
    ])
    expect(c.snapshot().status).toBe("sent")
  })

  it("does not copy the web silent-fail client", () => {
    const files = [
      "packages/contracts/src/twin-state-client.ts",
      "apps/mobile/src/api/twin-state.ts",
      "apps/mobile/src/sync/check-in.ts",
      "apps/mobile/src/sync/persist.ts",
      "apps/mobile/src/screens/TodayScreen.tsx",
    ]
    for (const file of files) {
      const src = withoutComments(readFileSync(file, "utf8"))
      expect(src, file).not.toMatch(/account\/twin-state-sync/)
      expect(src, file).not.toMatch(/catch(?:\s*\([^)]*\))?\s*\{\s*\}/)
      expect(src, file).not.toMatch(/\.catch\(\s*\(\)\s*=>\s*\{\s*\}\s*\)/)
    }
    const api = readFileSync("packages/contracts/src/twin-state-client.ts", "utf8")
    expect(api).toContain('logError("[mobile-twin-state] PUT failed", error)')
    expect(api).toContain('logError("[mobile-twin-state] GET failed", error)')
    const mobileApi = readFileSync("apps/mobile/src/api/twin-state.ts", "utf8")
    expect(mobileApi).toMatch(/MOBILE_BEARER_ROUTES\.twinState/)
    expect(mobileApi).toMatch(/putTwinState/)
    const screen = readFileSync("apps/mobile/src/screens/TodayScreen.tsx", "utf8")
    expect(screen).toMatch(/Queued — waiting to send/)
    expect(screen).toMatch(/"Sent"/)
    expect(screen).toMatch(/Failed — tap to retry/)
    expect(withoutComments(screen)).toMatch(/putTwinState|toggle\(/)
    expect(withoutComments(screen)).not.toMatch(/focus-today/)
    expect(withoutComments(screen)).not.toMatch(/\/api\/analyse-meal/)
  })

  it("Today can toggle today's ritual without a selector or per-Biotic bar", () => {
    const screen = withoutComments(readFileSync("apps/mobile/src/screens/TodayScreen.tsx", "utf8"))
    expect(screen).toMatch(/fermented/)
    expect(screen).toMatch(/plants/)
    expect(screen).toMatch(/moved/)
    expect(screen).toMatch(/slept/)
    expect(screen).toMatch(/feeling/)
    expect(screen).toMatch(/onToggle/)
    expect(screen).not.toMatch(/prebiotic_score|probiotic_score|postbiotic_score/)
    expect(screen).not.toMatch(/orderedByNeed|\bweakest\b|focus-today/)
    expect(bioticFlowsIntoVisual(screen)).toBe(false)
    expect(PERSONAL_BIOTIC_STATE.some(([, r]) => r.test(screen))).toBe(false)
  })

  it("a per-Biotic bar in the Today screen still fails the RN dialect", () => {
    const forbidden = [
      "const personal = twin.biotics.prebiotics.score",
      "<Text>Your Prebiotics {personal}/100</Text>",
      "<View style={{ width: `${personal}%`, backgroundColor: '#2DAA6E' }} />",
    ].join("\n")
    expect(bioticFlowsIntoVisual(forbidden)).toBe(true)
    const live = MOBILE_SURFACES.map((f) => withoutComments(readFileSync(f, "utf8"))).join("\n")
    expect(bioticFlowsIntoVisual(live)).toBe(false)
  })

  it("does not put secrets, IAP, WebView, Assessment or extra routes in the bundle", () => {
    const files = walkTs("apps/mobile")
    const joined = files.map((f) => withoutComments(readFileSync(f, "utf8"))).join("\n")
    expect(joined).not.toMatch(/SUPABASE_SERVICE_ROLE_KEY|STRIPE_SECRET_KEY|ANTHROPIC_API_KEY|CRON_SECRET/)
    const pkg = readFileSync("apps/mobile/package.json", "utf8")
    expect(pkg).not.toMatch(/react-native-webview|expo-iap|react-native-iap/)
    expect(joined).not.toMatch(/Food System Assessment/)
    expect(joined).not.toMatch(/Personal Food System Report/)
    const proxy = readFileSync("proxy.ts", "utf8")
    const allowlist = proxy.slice(proxy.indexOf("function isEnterRoute"), proxy.indexOf("function isEnterRoute") + 2000)
    const exactApiEquals = [...allowlist.matchAll(/pathname === "(\/api\/[^"]+)"/g)].map((m) => m[1])
    expect(exactApiEquals.sort()).toEqual([
      "/api/analyse-meal",
      "/api/feedback",
      "/api/mobile/v1/today",
      "/api/twin-state",
    ])
  })
})
