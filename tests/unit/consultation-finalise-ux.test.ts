import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"

import {
  finaliseFrom,
  type NavigationDeps,
} from "@/components/assessment/consultation/consultation-navigation"
import {
  createHttpConsultationPersistence,
  type FinaliseOutcome,
} from "@/components/assessment/consultation/consultation-persistence"
import { hydratePersistedSession } from "@/components/assessment/consultation/persisted-consultation-client"
import { CURRENT_CONSULTATION_BANK } from "@/lib/consultation/bank-registry"

/**
 * Finishing a Consultation, from the customer's side — Phase 3C-C2B.
 *
 * ══ THE TWO THINGS THAT MUST NEVER HAPPEN ═══════════════════════════════════
 *
 *  1. A seal that freezes a record missing the customer's last answer. The seal
 *     is write-once, so this is unrecoverable, and the evidence would be an
 *     answer still visible on their own screen. Hence: flush, THEN finalise —
 *     and only if the flush is confirmed.
 *  2. A completion screen shown for a finalisation that did not happen. That is
 *     a lie told to someone who has paid €49, and it stops them retrying the one
 *     action that would have worked.
 *
 * Everything below is one of those two properties, or the honesty of what is
 * said while neither has succeeded yet.
 *
 * ══ WHY NO RENDER ══════════════════════════════════════════════════════════
 *
 * This repository's vitest runs in `node` with no jsdom and no React Testing
 * Library. The ordering and the outcome mapping are therefore proven in the
 * pure functions that own them — which is where they belong anyway — and the
 * component's use of them is proven structurally.
 */

/* ── A deps stub that records the ORDER of what it was asked to do ───────── */
function deps(over: Partial<NavigationDeps> & { calls?: string[] } = {}) {
  const calls: string[] = over.calls ?? []
  const base: NavigationDeps = {
    flush: async () => {
      calls.push("flush")
      return true
    },
    finalise: async () => {
      calls.push("finalise")
      return { ok: true, handoffId: "hnd_1", finalisedAt: "2026-09-08T10:00:00.000Z" }
    },
    persistCursor: async () => ({ ok: true }),
    queueSkip: () => {},
    requestReview: async () => ({ ok: true }),
    leaveReview: async () => ({ ok: true }),
    ...(over as Partial<NavigationDeps>),
  }
  return { deps: base, calls }
}

/* ══ Ordering ══════════════════════════════════════════════════════════════ */

describe("the queue is flushed before anything is sealed", () => {
  it("flush runs first, and finalise runs second", async () => {
    const { deps: d, calls } = deps()
    await expect(finaliseFrom(d)).resolves.toEqual({ status: "finalised" })
    expect(calls, "reversing this order seals a record missing an answer").toEqual([
      "flush",
      "finalise",
    ])
  })

  it("a failed flush means finalise is never called at all", async () => {
    // Not "called and ignored" — never sent. A request that reached the server
    // could seal, and then the refusal shown to the customer would be false.
    const calls: string[] = []
    const { deps: d } = deps({
      calls,
      flush: async () => {
        calls.push("flush")
        return false
      },
    })
    await expect(finaliseFrom(d)).resolves.toEqual({ status: "save-failed" })
    expect(calls).toEqual(["flush"])
  })
})

/* ══ Outcomes ══════════════════════════════════════════════════════════════ */

describe("each server outcome maps to a distinct, honest attempt", () => {
  const attemptFor = async (outcome: FinaliseOutcome) => {
    const { deps: d } = deps({ finalise: async () => outcome })
    return finaliseFrom(d)
  }

  it("success is the only result that reports finalised", async () => {
    expect(await attemptFor({ ok: true, handoffId: "h", finalisedAt: "t" })).toEqual({
      status: "finalised",
    })
  })

  it("incomplete is carried through as incomplete", async () => {
    // The server re-derived completeness immediately before the write and says
    // something is outstanding. That is actionable, and distinct from a failure.
    expect(await attemptFor({ ok: false, kind: "incomplete" })).toEqual({
      status: "refused",
      kind: "incomplete",
    })
  })

  it("retryable and refused stay distinguishable", async () => {
    // One means "try again", the other means trying again cannot help. Collapsed
    // into one message, a customer either retries forever or gives up too early.
    expect(await attemptFor({ ok: false, kind: "retryable" })).toEqual({
      status: "refused",
      kind: "retryable",
    })
    expect(await attemptFor({ ok: false, kind: "refused" })).toEqual({
      status: "refused",
      kind: "refused",
    })
  })
})

/* ══ The HTTP adapter ══════════════════════════════════════════════════════ */

describe("the finalise request sends the session id and nothing else", () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock)
    fetchMock.mockReset()
  })
  afterEach(() => vi.unstubAllGlobals())

  const persistence = () => createHttpConsultationPersistence("cs_test_finalise_ux")
  const respond = (status: number, body: unknown = {}) =>
    fetchMock.mockResolvedValue({
      ok: status >= 200 && status < 300,
      status,
      json: async () => body,
    })

  it("the body carries only sessionId — the client states no verdict", async () => {
    // Completeness, the trusted payload and the handoff identity are all the
    // server's. A body that carried any of them would be a browser asserting
    // what a paid record contains.
    respond(200, { handoffId: "hnd_1", finalisedAt: "2026-09-08T10:00:00.000Z" })
    await persistence().finalise()

    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe("/api/consultation/finalise")
    expect(JSON.parse(init.body as string)).toEqual({ sessionId: "cs_test_finalise_ux" })
  })

  it("409 is incomplete, 5xx and 429 are retryable, other 4xx is refused", async () => {
    respond(409)
    expect(await persistence().finalise()).toEqual({ ok: false, kind: "incomplete" })
    respond(503)
    expect(await persistence().finalise()).toEqual({ ok: false, kind: "retryable" })
    respond(429)
    expect(await persistence().finalise()).toEqual({ ok: false, kind: "retryable" })
    respond(403)
    expect(await persistence().finalise()).toEqual({ ok: false, kind: "refused" })
  })

  it("a 200 whose body cannot be read is NOT a completion", async () => {
    // Showing completion on an unreadable success is showing it on a guess.
    respond(200, { unexpected: true })
    expect(await persistence().finalise()).toEqual({ ok: false, kind: "retryable" })
  })

  it("a network failure is retryable, never a completion", async () => {
    fetchMock.mockRejectedValue(new Error("offline"))
    expect(await persistence().finalise()).toEqual({ ok: false, kind: "retryable" })
  })
})

/* ══ Structural: completion is only ever rendered on a server success ══════ */

describe("the component cannot show completion without the server", () => {
  const source = readFileSync(
    join(process.cwd(), "components/assessment/consultation/persisted-consultation-client.tsx"),
    "utf8",
  )

  it("setCompleted is called in exactly one place, on the finalised branch", () => {
    // An optimistic setCompleted anywhere else is the lie this whole file is
    // about. One call site keeps that reviewable in a diff.
    const calls = source.match(/setCompleted\(/g) ?? []
    expect(calls).toHaveLength(1)
    expect(source).toMatch(/attempt\.status === "finalised"\)\s*\{\s*setCompleted\(true\)/)
  })

  it("the finish handler goes through finaliseFrom, not straight to persistence", () => {
    // The ordering guarantee lives in `finaliseFrom`. A component that called
    // `finalise()` itself would be a second path with no flush in front of it.
    expect(source).toContain("await finaliseFrom(navigation)")
    expect(source).not.toMatch(/persistence\.finalise\(\)\s*$/m)
  })

  it("the completion early-return sits after every hook", () => {
    // React forbids a conditional hook. An early return above `useMemo` would
    // have changed the hook order the moment a customer finished — i.e. it
    // would have broken only in the success case, in production.
    const session = source.slice(source.indexOf("function PersistedConsultationSession"))
    const guard = session.indexOf("if (completed) return <ConsultationComplete />")
    const lastHook = session.lastIndexOf("useMemo(", guard === -1 ? undefined : session.length)
    expect(guard, "the completion guard must exist").toBeGreaterThan(-1)
    expect(guard, "the guard must come after the last hook").toBeGreaterThan(lastHook)
  })
})

/* ══ Ready-for-report is a load state, not a failure ═══════════════════════ */

describe("a refresh after finishing shows completion, not a restart", () => {
  const loaded = (over: Record<string, unknown> = {}) =>
    ({
      bankVersion: CURRENT_CONSULTATION_BANK,
      context: { foundation: "you" as const },
      candidateAnswers: {},
      touchedQuestionIds: [],
      skippedOptionalQuestionIds: [],
      currentQuestionId: null,
      phase: "review" as const,
      started: true,
      ...over,
    }) as Parameters<typeof hydratePersistedSession>[0]

  it("ready-for-report hydrates as completed", () => {
    // It used to throw, which was correct while nothing could produce the phase.
    // C2A can persist it, so the throw became "your Consultation worked, here is
    // an error screen".
    expect(hydratePersistedSession(loaded({ phase: "ready-for-report" }))).toEqual({
      kind: "completed",
    })
  })

  it("completion carries no session, so nothing sealed can be edited", () => {
    const hydrated = hydratePersistedSession(loaded({ phase: "ready-for-report" }))
    expect(hydrated.kind).toBe("completed")
    expect("session" in hydrated, "a sealed record must not rehydrate into questions").toBe(false)
  })

  it("a sealed Consultation resolves even when this build lost the bank", () => {
    // Deliberately checked before the bank resolves. There are no questions left
    // to render, so refusing a finished customer over a bank they will never be
    // asked from again would be a regression, not a safety property.
    expect(
      hydratePersistedSession(loaded({ phase: "ready-for-report", bankVersion: "consultation-v99" })),
    ).toEqual({ kind: "completed" })
  })

  it("every other phase still hydrates into a live session", () => {
    for (const phase of ["questions", "review"] as const) {
      const hydrated = hydratePersistedSession(loaded({ phase }))
      expect(hydrated.kind, `${phase} must still render`).toBe("session")
    }
  })

  it("an unknown bank on an UNSEALED session still throws", () => {
    // The completion branch is an exception for finished records only. A live
    // session resolved against the wrong bank is the failure the fingerprint
    // exists to prevent.
    expect(() => hydratePersistedSession(loaded({ bankVersion: "consultation-v99" }))).toThrow(
      "unknown-bank",
    )
  })
})
