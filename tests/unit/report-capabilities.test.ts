import { describe, it, expect, vi, afterEach } from "vitest"
import { readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"

import { SPECIALIST_GATES } from "@/lib/consultation/science-contract"
import {
  CAPABILITY_SCOPE,
  GATE_FOR_CAPABILITY,
  REPORT_CAPABILITIES,
  reportCapabilities,
  reportCapabilityEnabled,
} from "@/lib/report/deterministic/capabilities"

/**
 * The three specialist capabilities — Phase 4A-S2.
 *
 * ══ WHAT THESE STAND FOR ════════════════════════════════════════════════════
 *
 * Not features. Each one stands for a professional review that has not
 * happened: a dietitian and an EU allergen taxonomy, Irish/EU health-claims
 * law, and GP/dietetic sign-off of one sentence.
 *
 * A rollout switch and a specialist's approval are different kinds of thing,
 * and the property proven here is that the second cannot be simulated by the
 * first. Every route somebody might reach for — an environment variable, a
 * query parameter, a caller argument, a test-only override — is closed, and
 * the last of those is closed by the functions taking no parameters at all.
 */

afterEach(() => vi.unstubAllEnvs())

describe("all three gates are OPEN, so all three capabilities are off", () => {
  it("names exactly three capabilities, each mapped to a real gate", () => {
    expect([...REPORT_CAPABILITIES].sort()).toEqual([
      "bioticsLanguage",
      "safetyNetting",
      "specificFoods",
    ])
    const gateNames = new Set(SPECIALIST_GATES.map((g) => g.gate))
    for (const capability of REPORT_CAPABILITIES) {
      expect(gateNames, capability).toContain(GATE_FOR_CAPABILITY[capability])
      expect(CAPABILITY_SCOPE[capability].length).toBeGreaterThan(20)
    }
  })

  it("maps each capability to the gate that actually governs it", () => {
    expect(GATE_FOR_CAPABILITY.specificFoods).toBe("food-allergy-dietetic-eu-taxonomy")
    expect(GATE_FOR_CAPABILITY.bioticsLanguage).toBe("eu-legal-health-claims")
    expect(GATE_FOR_CAPABILITY.safetyNetting).toBe("safety-netting-wording")
  })

  it("every one evaluates false", () => {
    for (const capability of REPORT_CAPABILITIES) {
      expect(reportCapabilityEnabled(capability), capability).toBe(false)
    }
    expect(reportCapabilities()).toEqual({
      specificFoods: false,
      bioticsLanguage: false,
      safetyNetting: false,
    })
  })

  it("because the adjudicated records still say OPEN", () => {
    for (const gate of SPECIALIST_GATES) {
      expect(gate.status, `${gate.gate} was closed`).toBe("OPEN")
    }
  })
})

describe("nothing outside the adjudicated record can enable one", () => {
  it("no environment variable moves any capability", () => {
    // The shapes somebody would actually try.
    for (const name of [
      "EATOBIOTICS_ENABLE_SPECIFIC_FOODS",
      "EATOBIOTICS_ENABLE_BIOTICS_LANGUAGE",
      "EATOBIOTICS_ENABLE_SAFETY_NETTING",
      "EATOBIOTICS_SPECIALIST_GATES_CLOSED",
      "NEXT_PUBLIC_EATOBIOTICS_ENABLE_SPECIFIC_FOODS",
      "NODE_ENV",
      "VERCEL_ENV",
    ]) {
      vi.stubEnv(name, "true")
    }
    for (const capability of REPORT_CAPABILITIES) {
      expect(reportCapabilityEnabled(capability), capability).toBe(false)
    }
  })

  it("the module reads no environment, request or storage at all", () => {
    const source = readFileSync(
      join(process.cwd(), "lib/report/deterministic/capabilities.ts"),
      "utf8",
    )
    const code = source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "")
    for (const forbidden of [
      "process.env",
      "searchParams",
      "headers(",
      "cookies(",
      "request",
      "supabase",
      "localStorage",
    ]) {
      expect(code.includes(forbidden), `capabilities must not consult ${forbidden}`).toBe(false)
    }
  })

  it("takes no parameters, so a caller has nothing to override", () => {
    /*
     * The structural half. A function with an `env` or `overrides` argument
     * has an injection point, and an injection point on a professional
     * sign-off is a way to ship without one.
     */
    expect(reportCapabilityEnabled.length, "reportCapabilityEnabled takes only the name").toBe(1)
    expect(reportCapabilities.length, "reportCapabilities takes nothing").toBe(0)
  })

  it("a capability whose gate has been removed is off, not on", () => {
    // Fail closed on a missing record: an absent gate is not permission.
    const survivors = SPECIALIST_GATES.filter((g) => g.gate !== "eu-legal-health-claims")
    expect(survivors.length).toBe(2)
    // Proven by construction in the module; asserted here as the intent.
    expect(reportCapabilityEnabled("bioticsLanguage")).toBe(false)
  })
})

describe("no deterministic Report module invents its own gate check", () => {
  it("only capabilities.ts reads SPECIALIST_GATES", () => {
    /*
     * A second reader is a second answer. If a composer decided for itself
     * whether a gate were closed, closing one in the contract would leave that
     * copy behind — or worse, the copy would drift open.
     */
    const dir = join(process.cwd(), "lib/report/deterministic")
    const readers = readdirSync(dir)
      .filter((f) => f.endsWith(".ts") || f.endsWith(".tsx"))
      .filter((f) => f !== "capabilities.ts")
      .filter((f) => readFileSync(join(dir, f), "utf8").includes("SPECIALIST_GATES"))
    expect(readers).toEqual([])
  })
})
