/**
 * "Analytics cookies … only placed with your consent" (app/privacy/page.tsx §8)
 * was true of PostHog and of neither of the other two.
 *
 * `StatsigClientProvider` called `useClientAsyncInit` whenever
 * NEXT_PUBLIC_STATSIG_CLIENT_KEY was set — and then synced the signed-in user's
 * Supabase id and email into it — while `app/layout.tsx` mounted Vercel's
 * `<Analytics />` unconditionally. Both ran for visitors who had chosen
 * "Essential only", and for visitors who had chosen nothing at all.
 *
 * These tests assert the *initialiser* is never reached, rather than that some
 * component renders null: the harm is the SDK starting, so that is what has to
 * be observed. Both SDKs are mocked at the module boundary and record every call.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { createElement, type ReactNode } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { readFileSync } from "node:fs"
import { EB_CONSENT_KEY } from "@/lib/consent"

const initCalls: unknown[][] = []
const analyticsMounts: number[] = []

vi.mock("@statsig/react-bindings", () => ({
  useClientAsyncInit: (...args: unknown[]) => {
    initCalls.push(args)
    return { client: null }
  },
  StatsigProvider: ({ children }: { children: ReactNode }) => children,
}))

vi.mock("@vercel/analytics/next", () => ({
  Analytics: () => {
    analyticsMounts.push(1)
    return null
  },
}))

vi.mock("@/lib/supabase-browser", () => ({ getSupabaseBrowser: () => null }))
vi.mock("@/lib/statsig-client", () => ({ _registerStatsigLogger: vi.fn() }))

/* ── A localStorage that behaves like the real one, since the whole mechanism
      reads through it. ─────────────────────────────────────────────────── */
function installStorage(initial?: string) {
  const store = new Map<string, string>()
  if (initial !== undefined) store.set(EB_CONSENT_KEY, initial)
  vi.stubGlobal("localStorage", {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
    clear: () => store.clear(),
  })
}

beforeEach(() => {
  initCalls.length = 0
  analyticsMounts.length = 0
  vi.stubEnv("NEXT_PUBLIC_STATSIG_CLIENT_KEY", "client-test-key")
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

/**
 * Renders to static markup, which runs the component body and any hook that
 * returns synchronously but never commits an effect — exactly the state a first
 * paint is in. `useAnalyticsConsent` starts `false` for that reason, so this
 * models "before consent is known", which is when the old code had already
 * started both SDKs.
 */
async function renderStatsig(child: ReactNode = createElement("span")) {
  const { StatsigClientProvider } = await import("@/components/providers/statsig-provider")
  return renderToStaticMarkup(createElement(StatsigClientProvider, null, child))
}

async function renderAnalytics() {
  const { ConsentedAnalytics } = await import("@/components/providers/consented-analytics")
  return renderToStaticMarkup(createElement(ConsentedAnalytics))
}

describe("Statsig does not initialise without consent", () => {
  it("stays inert when no choice has been stored", async () => {
    installStorage(undefined)
    await renderStatsig()
    expect(initCalls, "Statsig must not start before the visitor has accepted").toHaveLength(0)
  })

  it("stays inert when the visitor chose essential-only", async () => {
    installStorage("declined")
    await renderStatsig()
    expect(initCalls, "Statsig must not start after an explicit decline").toHaveLength(0)
  })

  it("still renders its children so the app is unaffected", async () => {
    installStorage("declined")
    const html = await renderStatsig(createElement("span", null, "child"))
    // Gating analytics must not gate the product. Without this, a provider that
    // returned null on decline would pass every assertion above.
    expect(html).toContain("child")
  })

  it("would start if the gate were removed", async () => {
    // Proves the mock can observe an init at all — otherwise every assertion
    // above is vacuously true and would survive deleting the gate.
    const { useClientAsyncInit } = await import("@statsig/react-bindings")
    ;(useClientAsyncInit as (...a: unknown[]) => unknown)("key", {})
    expect(initCalls).toHaveLength(1)
  })
})

describe("Vercel Analytics does not mount without consent", () => {
  it("stays inert when no choice has been stored", async () => {
    installStorage(undefined)
    await renderAnalytics()
    expect(analyticsMounts, "Vercel Analytics must not load before consent").toHaveLength(0)
  })

  it("stays inert when the visitor chose essential-only", async () => {
    installStorage("declined")
    await renderAnalytics()
    expect(analyticsMounts).toHaveLength(0)
  })
})

describe("the root layout routes Vercel Analytics through the gate", () => {
  it("does not import the SDK directly", () => {
    const layout = readFileSync("app/layout.tsx", "utf8")
    // The gate is only worth anything if the layout stops mounting the raw
    // component. A direct import here is the regression that reopens it.
    expect(layout, "app/layout.tsx must mount ConsentedAnalytics, not <Analytics />")
      .not.toMatch(/@vercel\/analytics/)
    expect(layout).toContain("ConsentedAnalytics")
  })
})

describe("consent can be withdrawn", () => {
  it("records the withdrawal and reloads so running SDKs stop", async () => {
    installStorage("accepted")
    const reload = vi.fn()
    vi.stubGlobal("window", {
      location: { reload },
      dispatchEvent: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })

    const { withdrawConsent, getConsent } = await import("@/lib/consent")
    withdrawConsent()

    expect(getConsent()).toBe("declined")
    // Without the reload the page would say "essential only" while PostHog,
    // Statsig and Vercel Analytics carried on for the rest of the session.
    expect(reload, "withdrawal must stop SDKs already running").toHaveBeenCalledTimes(1)
  })

  it("is reachable from the footer on every page", () => {
    const footer = readFileSync("components/footer.tsx", "utf8")
    expect(footer, "withdrawing must be as easy as accepting").toContain("openConsentPreferences")
    expect(footer).toContain("Cookie preferences")
  })

  it("lets the banner be reopened after a choice is stored", () => {
    const banner = readFileSync("components/cookie-consent.tsx", "utf8")
    // The banner renders only while nothing is stored, so without this listener
    // the footer control would dispatch into nothing.
    expect(banner).toContain("EB_CONSENT_REOPEN_EVENT")
  })
})
