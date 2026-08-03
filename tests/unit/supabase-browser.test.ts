import { describe, it, expect, beforeEach, afterEach } from "vitest"

import { getSupabaseBrowser } from "@/lib/supabase-browser"

/**
 * Regression guard for the hydration crash.
 *
 * `getSupabaseBrowser()` used to pass `process.env.NEXT_PUBLIC_SUPABASE_URL!`
 * straight into `createBrowserClient`, which throws "Your project's URL and API
 * key are required" on an empty value. `AccountNavItem` calls it from an effect
 * in the global site nav, so with no env **every page** rendered correctly on the
 * server and was then replaced by the error boundary during hydration.
 *
 * The damage was mostly to trust rather than to production: the vars are
 * required env and are always set in prod. But CI builds without them by design,
 * so local screenshots and manual QA silently captured Next's error shell while
 * the a11y suite stayed green — it scans at `domcontentloaded`, before hydration.
 *
 * The contract is the same one lib/supabase-server.ts:29 already holds: absent
 * env yields null, never a throw.
 */

const URL_VAR = "NEXT_PUBLIC_SUPABASE_URL"
const KEY_VAR = "NEXT_PUBLIC_SUPABASE_ANON_KEY"

let savedUrl: string | undefined
let savedKey: string | undefined

beforeEach(() => {
  savedUrl = process.env[URL_VAR]
  savedKey = process.env[KEY_VAR]
})

afterEach(() => {
  // Restore rather than delete: this suite must not leak config state into its
  // neighbours in either direction.
  if (savedUrl === undefined) delete process.env[URL_VAR]
  else process.env[URL_VAR] = savedUrl
  if (savedKey === undefined) delete process.env[KEY_VAR]
  else process.env[KEY_VAR] = savedKey
})

describe("getSupabaseBrowser env handling", () => {
  it("returns null instead of throwing when both vars are absent", () => {
    delete process.env[URL_VAR]
    delete process.env[KEY_VAR]
    // `not.toThrow` is the actual regression — a throw here is what took down
    // every page during hydration.
    expect(() => getSupabaseBrowser()).not.toThrow()
    expect(getSupabaseBrowser()).toBeNull()
  })

  it("treats half-configured as not configured", () => {
    // Either var alone still produces the throwing call, so both directions are
    // checked rather than just the both-absent case.
    delete process.env[URL_VAR]
    process.env[KEY_VAR] = "test-anon-key"
    expect(() => getSupabaseBrowser()).not.toThrow()
    expect(getSupabaseBrowser(), "key without url").toBeNull()

    process.env[URL_VAR] = "https://example.supabase.co"
    delete process.env[KEY_VAR]
    expect(() => getSupabaseBrowser()).not.toThrow()
    expect(getSupabaseBrowser(), "url without key").toBeNull()
  })

  it("treats an empty string as absent", () => {
    // The old code used `!`, which is satisfied by "" — and "" is exactly what
    // an unset var becomes once a build inlines it.
    process.env[URL_VAR] = ""
    process.env[KEY_VAR] = ""
    expect(getSupabaseBrowser()).toBeNull()
  })

  it("returns a real client when both vars are present", () => {
    // The other half of the contract: this must not become a function that
    // always returns null, which would pass every assertion above.
    process.env[URL_VAR] = "https://example.supabase.co"
    process.env[KEY_VAR] = "test-anon-key"
    const client = getSupabaseBrowser()
    expect(client).not.toBeNull()
    expect(client?.auth).toBeDefined()
  })
})
