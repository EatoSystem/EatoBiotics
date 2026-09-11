import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"

import {
  CONSULTATION_BANK_V1,
  CONSULTATION_BANK_VERSIONS,
  fingerprintFor,
} from "@/lib/consultation/bank-registry"
import {
  REPORT_V1_SUPPORTED_BANKS,
  reportBankSupport,
} from "@/lib/report/deterministic/report-bank"

/**
 * Which bank identity Report v1 claims to understand — Phase 4A-S2 review fix.
 *
 * ══ WHAT THIS FILE IS FOR ═══════════════════════════════════════════════════
 *
 * The composer used to interpret any sealed finalisation against today's
 * registered bank. A seal is immutable and may name a bank that has since
 * moved; the permission registry, the content pack and the precedence list
 * were authored and exhaustively tested against exactly one. Run against a
 * different bank they do not fail — they quietly mean something else.
 *
 * The pinned digest below is the whole mechanism. If it is ever computed
 * rather than typed out, this file stops proving anything at all.
 */

describe("the supported bank identity is pinned, not derived", () => {
  it("the pinned fingerprint still matches the bank it was pinned against", () => {
    /*
     * THE TEST THAT MATTERS. An independent recomputation.
     *
     * When this fails the bank has changed, and the failure is the product,
     * not an obstacle. The options are to revert the bank, to version the
     * bank/Report contract, or to add historical support in a reviewed
     * change. Pasting today's digest into report-bank.ts is none of those:
     * the permission and content coverage were proven against the old bank,
     * and re-pinning without re-proving them is the drift this guards.
     */
    expect(REPORT_V1_SUPPORTED_BANKS).toHaveLength(1)
    expect(REPORT_V1_SUPPORTED_BANKS[0].version).toBe(CONSULTATION_BANK_V1)
    expect(REPORT_V1_SUPPORTED_BANKS[0].fingerprint).toBe(fingerprintFor(CONSULTATION_BANK_V1))
  })

  it("the fingerprint is a literal in the source, never a runtime derivation", () => {
    const source = readFileSync(join(process.cwd(), "lib/report/deterministic/report-bank.ts"), "utf8")
    // A computed value would track the bank instead of pinning it, so the
    // check would pass against any bank — the same bug in a new costume.
    expect(source).not.toMatch(/fingerprintFor|fingerprintBank|bankMatches/)
    expect(source).toMatch(/fingerprint: "[0-9a-f]{32}"/)
  })

  it("supports exactly one identity — no drift allow-list", () => {
    expect(REPORT_V1_SUPPORTED_BANKS.map((b) => b.version)).toEqual([CONSULTATION_BANK_V1])
    // And the registry itself still holds only the one bank, so "one
    // supported" is not silently narrower than what exists.
    expect(CONSULTATION_BANK_VERSIONS).toEqual([CONSULTATION_BANK_V1])
  })
})

describe("the support check separates an unknown bank from a drifted one", () => {
  const PINNED = REPORT_V1_SUPPORTED_BANKS[0]

  it("accepts the exact supported pair", () => {
    expect(reportBankSupport(PINNED.version, PINNED.fingerprint)).toEqual({ ok: true })
  })

  it("refuses an unknown version as bank-unsupported", () => {
    const result = reportBankSupport("consultation-v2", PINNED.fingerprint)
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.reason).toBe("bank-unsupported")
    expect(result.detail).toContain("consultation-v2")
  })

  it("refuses a drifted fingerprint on a known version, distinctly", () => {
    /*
     * A different reason, deliberately. An unknown version is a seal from a
     * generation this Report was never written for; a known version with an
     * unrecognised digest is the wording or the options having moved under a
     * seal that still calls itself v1 — the exact failure the fingerprint was
     * introduced to catch, and worth naming separately in a log.
     */
    const result = reportBankSupport(PINNED.version, "00000000000000000000000000000000")
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.reason).toBe("bank-fingerprint-unsupported")
  })

  it("refuses an empty fingerprint rather than treating absence as a match", () => {
    const result = reportBankSupport(PINNED.version, "")
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.reason).toBe("bank-fingerprint-unsupported")
  })
})
