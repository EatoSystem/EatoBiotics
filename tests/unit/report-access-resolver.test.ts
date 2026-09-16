import { describe, it, expect } from "vitest"

import {
  encodeReportCookie,
  hashSecret,
  mintSecret,
} from "@/lib/report/access/capability"
import {
  resolveReportAccess,
  type AssessmentAccessRow,
  type CapabilityRow,
  type ReportAccessClient,
} from "@/lib/report/access/resolver"
import type { ReportAccessProof } from "@/lib/report/access/types"

/**
 * The authorisation boundary — Phase 4B-S1.
 *
 * Phase 4A-S4 answers "what is the canonical Report for this sealed
 * Consultation" and says in its own contract that it is NOT the customer
 * authentication boundary. This is that boundary. These tests are mostly about
 * what it REFUSES to distinguish.
 */

const HANDOFF = "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d"
const OTHER_HANDOFF = "99999999-8888-4777-8666-555555555555"
const ASSESSMENT = "f0e1d2c3-b4a5-4968-8778-695a4b3c2d1e"

const SEALED_GUEST: AssessmentAccessRow = {
  id: ASSESSMENT,
  stripe_session_id: "cs_test_123",
  user_id: null,
  email: "guest@x.com",
  consultation_handoff_id: HANDOFF,
}

function client(overrides: Partial<ReportAccessClient> = {}): ReportAccessClient {
  return {
    async readAssessmentByHandoff() {
      return { ok: true, row: SEALED_GUEST }
    },
    async readCapability() {
      return { ok: true, row: null }
    },
    ...overrides,
  }
}

function capabilityRow(secret: string, overrides: Partial<CapabilityRow> = {}): CapabilityRow {
  return {
    assessment_id: ASSESSMENT,
    consultation_handoff_id: HANDOFF,
    token_hash: hashSecret(secret),
    revoked_at: null,
    ...overrides,
  }
}

const accountProof = (userId: string, verifiedEmail: string | null = null): ReportAccessProof => ({
  kind: "account",
  userId,
  verifiedEmail,
})

const cookieProof = (...cookies: string[]): ReportAccessProof => ({
  kind: "capability",
  presented: cookies,
})

describe("account ownership", () => {
  it("authorises the exact owner", async () => {
    const result = await resolveReportAccess({
      handoffId: HANDOFF,
      proof: accountProof("user-1"),
      client: client({
        async readAssessmentByHandoff() {
          return { ok: true, row: { ...SEALED_GUEST, user_id: "user-1" } }
        },
      }),
    })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.access).toEqual({
        assessmentId: ASSESSMENT,
        handoffId: HANDOFF,
        sessionId: "cs_test_123",
      })
    }
  })

  it("refuses a different account", async () => {
    const result = await resolveReportAccess({
      handoffId: HANDOFF,
      proof: accountProof("user-2"),
      client: client({
        async readAssessmentByHandoff() {
          return { ok: true, row: { ...SEALED_GUEST, user_id: "user-1" } }
        },
      }),
    })
    expect(result.ok).toBe(false)
  })

  it("ignores email entirely once an owner exists", async () => {
    // The asymmetry that `ownerOrFilter` does not give us. An address must not
    // outrank the account a row was deliberately linked to — otherwise anyone
    // who can receive mail at the original purchase address reaches it.
    const result = await resolveReportAccess({
      handoffId: HANDOFF,
      proof: accountProof("user-2", "guest@x.com"),
      client: client({
        async readAssessmentByHandoff() {
          return { ok: true, row: { ...SEALED_GUEST, user_id: "user-1" } }
        },
      }),
    })
    expect(result.ok).toBe(false)
  })

  it("accepts a verified recovery email while no owner is set", async () => {
    const result = await resolveReportAccess({
      handoffId: HANDOFF,
      proof: accountProof("user-9", " GUEST@x.com "),
      client: client(),
    })
    expect(result.ok).toBe(true)
  })

  it("refuses a different verified email", async () => {
    const result = await resolveReportAccess({
      handoffId: HANDOFF,
      proof: accountProof("user-9", "someone@else.com"),
      client: client(),
    })
    expect(result.ok).toBe(false)
  })

  it("refuses when there is no owner and no recovery email to match", async () => {
    const result = await resolveReportAccess({
      handoffId: HANDOFF,
      proof: accountProof("user-9", "someone@else.com"),
      client: client({
        async readAssessmentByHandoff() {
          return { ok: true, row: { ...SEALED_GUEST, email: null } }
        },
      }),
    })
    expect(result.ok).toBe(false)
  })
})

describe("capability", () => {
  it("authorises a cookie whose secret hashes to the committed value", async () => {
    const secret = mintSecret()
    const result = await resolveReportAccess({
      handoffId: HANDOFF,
      proof: cookieProof(encodeReportCookie(HANDOFF, secret)),
      client: client({
        async readCapability() {
          return { ok: true, row: capabilityRow(secret) }
        },
      }),
    })
    expect(result.ok).toBe(true)
  })

  it("refuses a rotated-away secret", async () => {
    const old = mintSecret()
    const current = mintSecret()
    const result = await resolveReportAccess({
      handoffId: HANDOFF,
      proof: cookieProof(encodeReportCookie(HANDOFF, old)),
      client: client({
        async readCapability() {
          return { ok: true, row: capabilityRow(current) }
        },
      }),
    })
    expect(result.ok).toBe(false)
  })

  it("refuses a revoked capability even with the right secret", async () => {
    const secret = mintSecret()
    const result = await resolveReportAccess({
      handoffId: HANDOFF,
      proof: cookieProof(encodeReportCookie(HANDOFF, secret)),
      client: client({
        async readCapability() {
          return { ok: true, row: capabilityRow(secret, { revoked_at: "2026-09-16T00:00:00Z" }) }
        },
      }),
    })
    expect(result.ok).toBe(false)
  })

  it("picks this Report's cookie out of several, and ignores the others", async () => {
    // Reports coexist. A customer holding two purchased Reports presents both
    // cookies at whichever path matches, and only the right one may authorise.
    const mine = mintSecret()
    const theirs = mintSecret()
    const result = await resolveReportAccess({
      handoffId: HANDOFF,
      proof: cookieProof(
        encodeReportCookie(OTHER_HANDOFF, theirs),
        encodeReportCookie(HANDOFF, mine),
      ),
      client: client({
        async readCapability() {
          return { ok: true, row: capabilityRow(mine) }
        },
      }),
    })
    expect(result.ok).toBe(true)
  })

  it("refuses a valid secret presented under another Report's handoff", async () => {
    const secret = mintSecret()
    const result = await resolveReportAccess({
      handoffId: HANDOFF,
      proof: cookieProof(encodeReportCookie(OTHER_HANDOFF, secret)),
      client: client({
        async readCapability() {
          return { ok: true, row: capabilityRow(secret) }
        },
      }),
    })
    expect(result.ok).toBe(false)
  })

  it("refuses when no capability has been issued", async () => {
    const result = await resolveReportAccess({
      handoffId: HANDOFF,
      proof: cookieProof(encodeReportCookie(HANDOFF, mintSecret())),
      client: client(),
    })
    expect(result.ok).toBe(false)
  })

  it("refuses a capability belonging to ANOTHER assessment", async () => {
    // The repair. Checking only the handoff half of a composite identity is
    // making, one layer up, exactly the mistake the composite foreign key
    // exists to prevent — and the assessment half is the one a caller could
    // influence, because the read is issued for this row's id.
    const secret = mintSecret()
    const result = await resolveReportAccess({
      handoffId: HANDOFF,
      proof: cookieProof(encodeReportCookie(HANDOFF, secret)),
      client: client({
        async readCapability() {
          return {
            ok: true,
            row: capabilityRow(secret, { assessment_id: "00000000-0000-4000-8000-000000000000" }),
          }
        },
      }),
    })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.external).toBe("report_not_found")
      expect(result.severity).toBe("integrity")
    }
  })

  it("accepts only when BOTH halves of the identity pair match", async () => {
    // Non-vacuity for the two refusals around it: the pair check must not be
    // refusing everything.
    const secret = mintSecret()
    const result = await resolveReportAccess({
      handoffId: HANDOFF,
      proof: cookieProof(encodeReportCookie(HANDOFF, secret)),
      client: client({
        async readCapability() {
          return {
            ok: true,
            row: capabilityRow(secret, {
              assessment_id: ASSESSMENT,
              consultation_handoff_id: HANDOFF,
            }),
          }
        },
      }),
    })
    expect(result.ok).toBe(true)
  })

  it("refuses a capability bound to a different handoff than the row's seal", async () => {
    // Unstorable under the composite foreign key. Seeing it means the
    // constraint is missing.
    const secret = mintSecret()
    const result = await resolveReportAccess({
      handoffId: HANDOFF,
      proof: cookieProof(encodeReportCookie(HANDOFF, secret)),
      client: client({
        async readCapability() {
          return { ok: true, row: capabilityRow(secret, { consultation_handoff_id: OTHER_HANDOFF }) }
        },
      }),
    })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.severity).toBe("integrity")
  })

  it("refuses duplicates rather than accepting on a coin flip", async () => {
    // Two matching cookies is the shape a parent-path cookie shadowing a scoped
    // one would take, and a parent-path copy would destroy per-Report scoping.
    const secret = mintSecret()
    const cookie = encodeReportCookie(HANDOFF, secret)
    const result = await resolveReportAccess({
      handoffId: HANDOFF,
      proof: cookieProof(cookie, cookie),
      client: client({
        async readCapability() {
          return { ok: true, row: capabilityRow(secret) }
        },
      }),
    })
    expect(result.ok).toBe(false)
  })

  it("does not read the capability table when no cookie names this handoff", async () => {
    let reads = 0
    await resolveReportAccess({
      handoffId: HANDOFF,
      proof: cookieProof("garbage", encodeReportCookie(OTHER_HANDOFF, mintSecret())),
      client: client({
        async readCapability() {
          reads += 1
          return { ok: true, row: null }
        },
      }),
    })
    expect(reads).toBe(0)
  })
})

describe("unauthorised and nonexistent are indistinguishable", () => {
  const cases: Array<[string, () => Promise<unknown>]> = [
    [
      "locator is not a handoff",
      () => resolveReportAccess({ handoffId: "nope", proof: accountProof("u"), client: client() }),
    ],
    [
      "no row for this handoff",
      () =>
        resolveReportAccess({
          handoffId: HANDOFF,
          proof: accountProof("u"),
          client: client({
            async readAssessmentByHandoff() {
              return { ok: true, row: null }
            },
          }),
        }),
    ],
    [
      "wrong account",
      () =>
        resolveReportAccess({
          handoffId: HANDOFF,
          proof: accountProof("wrong"),
          client: client({
            async readAssessmentByHandoff() {
              return { ok: true, row: { ...SEALED_GUEST, user_id: "right" } }
            },
          }),
        }),
    ],
    [
      "wrong secret",
      () =>
        resolveReportAccess({
          handoffId: HANDOFF,
          proof: cookieProof(encodeReportCookie(HANDOFF, mintSecret())),
          client: client({
            async readCapability() {
              return { ok: true, row: capabilityRow(mintSecret()) }
            },
          }),
        }),
    ],
    [
      "no cookie at all",
      () => resolveReportAccess({ handoffId: HANDOFF, proof: cookieProof(), client: client() }),
    ],
  ]

  it.each(cases)("%s produces the same external answer", async (_name, run) => {
    const result = (await run()) as { ok: false; external: string }
    expect(result.ok).toBe(false)
    expect(result.external).toBe("report_not_found")
  })

  it("every refusal above is byte-identical once the server-only fields are dropped", async () => {
    const externals = new Set<string>()
    for (const [, run] of cases) {
      const result = (await run()) as { ok: false; external: string }
      externals.add(JSON.stringify({ ok: result.ok, external: result.external }))
    }
    expect(externals.size).toBe(1)
  })
})

describe("a read failure is not an absence", () => {
  it("an assessment read error is retryable, not not-found", async () => {
    // Collapsing these is the failure S4 was built around. Here it would turn a
    // database blip into "you are not authorised" — wrong, and unfixable by the
    // customer.
    const result = await resolveReportAccess({
      handoffId: HANDOFF,
      proof: accountProof("u"),
      client: client({
        async readAssessmentByHandoff() {
          return { ok: false, detail: "connection reset" }
        },
      }),
    })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.external).toBe("report_temporarily_unavailable")
      expect(result.severity).toBe("infrastructure")
    }
  })

  it("a capability read error is retryable too", async () => {
    const result = await resolveReportAccess({
      handoffId: HANDOFF,
      proof: cookieProof(encodeReportCookie(HANDOFF, mintSecret())),
      client: client({
        async readCapability() {
          return { ok: false, detail: "timeout" }
        },
      }),
    })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.external).toBe("report_temporarily_unavailable")
  })
})

describe("integrity defences", () => {
  it("refuses a row whose handoff disagrees with the query it answered", async () => {
    const result = await resolveReportAccess({
      handoffId: HANDOFF,
      proof: accountProof("user-1"),
      client: client({
        async readAssessmentByHandoff() {
          return {
            ok: true,
            row: { ...SEALED_GUEST, user_id: "user-1", consultation_handoff_id: OTHER_HANDOFF },
          }
        },
      }),
    })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.external).toBe("report_not_found")
      expect(result.severity).toBe("integrity")
    }
  })

  it("refuses to hand on a blank session locator", async () => {
    const result = await resolveReportAccess({
      handoffId: HANDOFF,
      proof: accountProof("user-1"),
      client: client({
        async readAssessmentByHandoff() {
          return { ok: true, row: { ...SEALED_GUEST, user_id: "user-1", stripe_session_id: "" } }
        },
      }),
    })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.severity).toBe("integrity")
  })

  it("never reads anything when the locator is malformed", async () => {
    let reads = 0
    await resolveReportAccess({
      handoffId: "'; DROP TABLE deep_assessments; --",
      proof: accountProof("u"),
      client: client({
        async readAssessmentByHandoff() {
          reads += 1
          return { ok: true, row: null }
        },
      }),
    })
    expect(reads).toBe(0)
  })
})

describe("what the boundary refuses to accept", () => {
  it("takes a locator, a proof and a client, and nothing else", () => {
    // Mirrors the signature guard S4 applies to its own entry point. A caller
    // cannot assert authority because there is no parameter for an assertion.
    const source = resolveReportAccess.toString()
    for (const forbidden of ["report", "digest", "finalisation", "foundation", "lens"]) {
      expect(source.includes(`input.${forbidden}`), forbidden).toBe(false)
    }
  })

  it("never returns the session locator on a refusal", async () => {
    const result = await resolveReportAccess({
      handoffId: HANDOFF,
      proof: accountProof("nobody"),
      client: client({
        async readAssessmentByHandoff() {
          return { ok: true, row: { ...SEALED_GUEST, user_id: "somebody" } }
        },
      }),
    })
    expect(JSON.stringify(result)).not.toContain("cs_test_123")
  })

  it("never puts a secret in a refusal", async () => {
    const secret = mintSecret()
    const result = await resolveReportAccess({
      handoffId: HANDOFF,
      proof: cookieProof(encodeReportCookie(HANDOFF, secret)),
      client: client({
        async readCapability() {
          return { ok: true, row: capabilityRow(mintSecret()) }
        },
      }),
    })
    const serialised = JSON.stringify(result)
    expect(serialised).not.toContain(secret)
    expect(serialised).not.toContain(hashSecret(secret))
  })
})
