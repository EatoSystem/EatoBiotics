import { describe, it, expect } from "vitest"

import { canonicalPropositionOrder } from "@/lib/report/narrative/order"
import { isEligibleKind } from "@/lib/report/narrative/contract"
import { generateNarrativeCandidates } from "@/lib/report/narrative/authoring/generate"

import {
  echoRewriter,
  hangingRewriter,
  mutatingRewriter,
  recordingRewriter,
  reportFor,
  throwingRewriter,
} from "./narrative-fixtures"

/**
 * Candidate generation — Phase 4A-S3, authoring.
 *
 * ══ WHAT THIS IS FOR ════════════════════════════════════════════════════════
 *
 * These are the failure modes that used to happen inside a customer's request
 * and now happen to a person running a batch. The consequence changed
 * completely: a timeout used to mean a customer got canonical wording, and now
 * means somebody re-runs the batch.
 *
 * Nothing here decides what a customer sees. Surviving the screen earns a
 * candidate a reader.
 */

const REPORT = reportFor("you")
const ELIGIBLE = canonicalPropositionOrder(REPORT).filter((p) => isEligibleKind(p.kind)).length

describe("the batch", () => {
  it("asks once per eligible proposition, and never for the rest", async () => {
    const rewriter = echoRewriter()
    const batch = await generateNarrativeCandidates({ report: REPORT, rewriter })

    expect(rewriter.calls.length).toBe(ELIGIBLE)
    expect(batch.candidates.length).toBe(ELIGIBLE)
    expect(batch.rejected).toEqual([])
  })

  it("never sends the quotation or a loop beat, even offline", async () => {
    const rewriter = echoRewriter()
    await generateNarrativeCandidates({ report: REPORT, rewriter })

    const propositions = canonicalPropositionOrder(REPORT)
    const quotation = propositions.find((p) => p.kind === "quotation")!
    const beats = propositions.filter((p) => p.kind === "loop-step")

    const sent = rewriter.calls.map((c) => c.text)
    expect(sent).not.toContain(quotation.text)
    // The beats share the lever's text, so the count is what proves it: five
    // eligible propositions, five calls, not nine.
    expect(beats.length).toBe(4)
    expect(rewriter.calls.length).toBe(ELIGIBLE)
  })

  it("sends one sentence per call, never two", async () => {
    const rewriter = echoRewriter()
    await generateNarrativeCandidates({ report: REPORT, rewriter })
    const canonical = new Set(canonicalPropositionOrder(REPORT).map((p) => p.text))
    for (const call of rewriter.calls) {
      expect(Object.keys(call)).toEqual(["text"])
      expect(canonical.has(call.text), call.text).toBe(true)
    }
  })

  it("records the prompt and screen versions it ran under", async () => {
    const batch = await generateNarrativeCandidates({ report: REPORT, rewriter: echoRewriter() })
    expect(batch.promptVersion).toBe("narrative-prompt-v1")
    expect(batch.validatorVersion).toBe("narrative-validator-v2")
  })

  it("gives a reviewer the canonical sentence beside the candidate", async () => {
    const batch = await generateNarrativeCandidates({
      report: REPORT,
      rewriter: mutatingRewriter((t) => t.replace("You told us", "You reported")),
    })
    for (const candidate of batch.candidates) {
      expect(candidate.canonicalText.startsWith("You told us")).toBe(true)
      expect(candidate.candidateText.startsWith("You reported")).toBe(true)
      expect(candidate.templateId.length).toBeGreaterThan(0)
    }
  })
})

describe("the rewriter fails", () => {
  it("throws: one reason, no candidates, nothing thrown onward", async () => {
    const batch = await generateNarrativeCandidates({
      report: REPORT,
      rewriter: throwingRewriter(),
    })
    expect(batch.candidates).toEqual([])
    expect(batch.rejected.length).toBe(ELIGIBLE)
    expect(batch.rejected.every((r) => r.reason === "rewriter-failed")).toBe(true)
  })

  it("never resolves: the deadline is the way out", async () => {
    const batch = await generateNarrativeCandidates({
      report: REPORT,
      rewriter: hangingRewriter(),
      timeoutMs: 20,
    })
    expect(batch.rejected.every((r) => r.reason === "rewriter-timeout")).toBe(true)
  })

  it("returns the wrong shape: malformed, not a crash", async () => {
    for (const reply of [
      () => null,
      () => undefined,
      () => ({}),
      () => ({ rewritten: 42 }),
      () => ({ rewritten: "  " }),
      () => "a bare string",
    ]) {
      const batch = await generateNarrativeCandidates({
        report: REPORT,
        rewriter: recordingRewriter(reply),
      })
      expect(batch.candidates).toEqual([])
      expect(batch.rejected.every((r) => r.reason === "malformed-response")).toBe(true)
    }
  })

  it("is not retried — one operation per proposition, rejection or not", async () => {
    const rewriter = mutatingRewriter((t) => t.replace("You told us ", "We can see "))
    await generateNarrativeCandidates({ report: REPORT, rewriter })
    expect(rewriter.calls.length).toBe(ELIGIBLE)
  })
})

describe("the screen rejects before a human is asked", () => {
  it("keeps what passes and reports what does not, in one batch", async () => {
    const propositions = canonicalPropositionOrder(REPORT)
    const lever = propositions.find((p) => p.kind === "lever")!
    const batch = await generateNarrativeCandidates({
      report: REPORT,
      rewriter: mutatingRewriter((text) =>
        text === lever.text
          ? "You told us energy is what you most want to focus on."
          : text.replace("You told us", "You reported"),
      ),
    })
    // The lever's sentence is also a recap's, so both are rejected — the fake
    // can only key on text, because the payload carries no identity.
    expect(batch.rejected.length).toBe(2)
    expect(batch.rejected.every((r) => r.reason === "drift-rejected")).toBe(true)
    expect(batch.candidates.length).toBe(ELIGIBLE - 2)
  })

  it("records the rejection class, so the screen is auditable", async () => {
    const batch = await generateNarrativeCandidates({
      report: REPORT,
      rewriter: mutatingRewriter((t) =>
        t.replace(/\.$/, " indeed indeed indeed indeed indeed."),
      ),
    })
    expect(batch.rejected.every((r) => r.rejectionClass === "expansion")).toBe(true)
  })
})

describe("bounded concurrency changes nothing but the timing", () => {
  it("produces the same batch at 1, 4 and 64 in flight", async () => {
    const restyle = (t: string) => t.replace("You told us", "You reported")
    const results = []
    for (const concurrency of [1, 4, 64]) {
      results.push(
        await generateNarrativeCandidates({
          report: REPORT,
          rewriter: mutatingRewriter(restyle),
          concurrency,
        }),
      )
    }
    expect(results[1]).toEqual(results[0])
    expect(results[2]).toEqual(results[0])
  })
})
