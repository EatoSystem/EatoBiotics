import { describe, it, expect } from "vitest"

import { canonicalPropositionOrder } from "@/lib/report/narrative/order"
import { buildNarrativeOverlay } from "@/lib/report/narrative/overlay"
import { isEligibleKind, type NarrativeFallbackReason } from "@/lib/report/narrative/contract"
import { customerFacingText, serialiseReport } from "@/lib/report/deterministic/serialise"

import {
  echoRewriter,
  hangingRewriter,
  mutatingRewriter,
  recordingRewriter,
  reportFor,
  throwingRewriter,
} from "./narrative-fixtures"

/**
 * Every way this can go wrong — Phase 4A-S3.
 *
 * ══ THE ONE PROPERTY BEING PROVEN ═══════════════════════════════════════════
 *
 * There is no failure of the narrative layer that damages the Report. Every
 * path below ends in the same place: a complete overlay, a typed reason, and
 * the canonical document untouched. Nothing throws, nothing retries, nothing
 * invents substitute content, and no path fails Report generation.
 */

const REPORT = reportFor("you")
const ELIGIBLE = canonicalPropositionOrder(REPORT).filter((p) => isEligibleKind(p.kind)).length

async function overlayWith(rewriter: Parameters<typeof buildNarrativeOverlay>[0]["rewriter"], extra = {}) {
  return buildNarrativeOverlay({ report: REPORT, rewriter, enabled: true, ...extra })
}

/** Every item is canonical-only, and each carries the expected reason. */
function expectAllCanonicalOnly(
  items: readonly { status: string; fallbackReason?: NarrativeFallbackReason; narrativeText?: string }[],
  eligibleReason: NarrativeFallbackReason,
) {
  const propositions = canonicalPropositionOrder(REPORT)
  expect(items.length).toBe(propositions.length)
  items.forEach((item, index) => {
    expect(item.status).toBe("canonical-only")
    expect(item.narrativeText).toBeUndefined()
    if (isEligibleKind(propositions[index].kind)) {
      expect(item.fallbackReason).toBe(eligibleReason)
    } else {
      expect(item.fallbackReason).toMatch(/^ineligible-/)
    }
  })
}

describe("the rewriter fails", () => {
  it("disabled: nothing is called, and every item says so", async () => {
    const rewriter = echoRewriter()
    const overlay = await buildNarrativeOverlay({ report: REPORT, rewriter, enabled: false })
    expect(rewriter.calls.length).toBe(0)
    for (const item of overlay.items) {
      expect(item.status).toBe("canonical-only")
      expect(item.fallbackReason).toBe("narrative-disabled")
    }
  })

  it("disabled by omission: the layer does not switch itself on", async () => {
    const rewriter = echoRewriter()
    const overlay = await buildNarrativeOverlay({ report: REPORT, rewriter })
    expect(rewriter.calls.length).toBe(0)
    expect(overlay.items.every((i) => i.fallbackReason === "narrative-disabled")).toBe(true)
  })

  it("throws: one reason, and the overlay is still complete", async () => {
    const overlay = await overlayWith(throwingRewriter())
    expectAllCanonicalOnly(overlay.items, "rewriter-failed")
  })

  it("never resolves: the deadline is the way out, not a hang", async () => {
    const overlay = await overlayWith(hangingRewriter(), { timeoutMs: 20 })
    expectAllCanonicalOnly(overlay.items, "rewriter-timeout")
  })

  it("returns the wrong shape: malformed, not a crash", async () => {
    for (const reply of [
      () => null,
      () => undefined,
      () => ({}),
      () => ({ rewritten: 42 }),
      () => ({ rewritten: null }),
      () => ({ text: "You told us energy is what you most want to work on." }),
      () => "a bare string",
    ]) {
      const overlay = await overlayWith(recordingRewriter(reply))
      expectAllCanonicalOnly(overlay.items, "malformed-response")
    }
  })

  it("returns an empty string: malformed, and the canonical sentence stands", async () => {
    const overlay = await overlayWith(recordingRewriter(() => ({ rewritten: "  " })))
    expectAllCanonicalOnly(overlay.items, "malformed-response")
  })
})

describe("the rewrite is rejected", () => {
  /*
   * These cases mutate ONE sentence — the priority lever — and echo the rest.
   *
   * A rewriter that mangled every sentence the same way would work too, but it
   * would prove less: the expansion window is a function of each sentence's own
   * length, so a single mutation applied to five sentences of different lengths
   * can trip a different rule on each, and the test would be asserting the
   * shortest sentence's behaviour while appearing to assert all of them.
   */
  const LEVER = canonicalPropositionOrder(REPORT).find((p) => p.kind === "lever")!
  const LEVER_INDEX = canonicalPropositionOrder(REPORT).findIndex((p) => p.kind === "lever")

  const REJECTIONS: readonly {
    readonly name: string
    readonly rewritten: string
    readonly reason: NarrativeFallbackReason
  }[] = [
    {
      name: "a negation is added",
      rewritten: "You told us energy is not what you most want to work on.",
      reason: "preservation-failed",
    },
    {
      name: "the attribution is dropped",
      rewritten: "We can see energy is what you most want to work on.",
      reason: "preservation-failed",
    },
    {
      name: "causal language appears",
      rewritten: "You told us energy is what you most want to work on, because.",
      reason: "drift-rejected",
    },
    {
      name: "it collapses below the window",
      rewritten: "You told us energy.",
      reason: "expansion-rejected",
    },
  ]

  for (const { name, rewritten, reason } of REJECTIONS) {
    it(`${name}: that one item is canonical-only with "${reason}"`, async () => {
      const overlay = await overlayWith(
        mutatingRewriter((text) => (text === LEVER.text ? rewritten : text)),
      )
      const item = overlay.items[LEVER_INDEX]
      expect(item.status).toBe("canonical-only")
      expect(item.fallbackReason).toBe(reason)
      expect(item.narrativeText).toBeUndefined()
    })
  }

  it("a rejection everywhere still yields a complete overlay", async () => {
    const overlay = await overlayWith(
      mutatingRewriter((text) => text.replace("You told us ", "We can see ")),
    )
    expectAllCanonicalOnly(overlay.items, "preservation-failed")
  })

  it("is not retried — one operation per proposition, rejection or not", async () => {
    const rewriter = mutatingRewriter((t) => t.replace("You told us ", "We can see "))
    await buildNarrativeOverlay({ report: REPORT, rewriter, enabled: true })
    expect(rewriter.calls.length).toBe(ELIGIBLE)
  })
})

describe("partial acceptance is the contract", () => {
  it("accepts what passes and falls back on the rest, in the same overlay", async () => {
    const propositions = canonicalPropositionOrder(REPORT)
    // Restyle everything except the priority lever, which gets a rewrite that
    // adds a recommendation and must therefore be refused on its own.
    const rewriter = mutatingRewriter((text) =>
      text === propositions.find((p) => p.kind === "lever")!.text
        ? "You told us energy is what you should work on."
        : text.replace("You told us", "You reported"),
    )
    const overlay = await buildNarrativeOverlay({ report: REPORT, rewriter, enabled: true })

    const statuses = overlay.items.map((item, index) => [propositions[index].kind, item.status])
    expect(statuses).toContainEqual(["recap", "accepted"])
    expect(statuses).toContainEqual(["lever", "canonical-only"])

    const lever = overlay.items[propositions.findIndex((p) => p.kind === "lever")]
    expect(lever.fallbackReason).toBe("drift-rejected")

    /*
     * Two refusals, not one — and the reason is worth recording.
     *
     * The lever and one recap are the SAME sentence, because both are resolved
     * from the same answer (`intentions.primaryFocus`). The fake can only key
     * on the text, since the payload deliberately carries no identity, so a
     * rewrite aimed at the lever necessarily lands on its twin as well.
     *
     * That is not a defect in the fake. It is the privacy boundary showing
     * through: nothing on the wire distinguishes two identical sentences, and
     * a fake that could tell them apart would be evidence something else was
     * being sent.
     */
    const leverText = propositions.find((p) => p.kind === "lever")!.text
    const eligibleTwins = propositions.filter((p) => isEligibleKind(p.kind) && p.text === leverText)
    expect(eligibleTwins.length).toBe(2)
    expect(overlay.items.filter((i) => i.status === "accepted").length).toBe(ELIGIBLE - 2)
  })
})

describe("no failure reaches the Report", () => {
  it("leaves the canonical document identical under every failure mode", async () => {
    const before = serialiseReport(REPORT)
    const beforeText = customerFacingText(REPORT).join("\n")

    for (const rewriter of [
      throwingRewriter(),
      recordingRewriter(() => ({ rewritten: 42 })),
      mutatingRewriter((t) => `${t} We found this matters.`),
    ]) {
      await buildNarrativeOverlay({ report: REPORT, rewriter, enabled: true })
    }
    await buildNarrativeOverlay({
      report: REPORT,
      rewriter: hangingRewriter(),
      enabled: true,
      timeoutMs: 20,
    })

    expect(serialiseReport(REPORT)).toBe(before)
    expect(customerFacingText(REPORT).join("\n")).toBe(beforeText)
  })

  it("resolves rather than rejecting, whatever the rewriter does", async () => {
    await expect(overlayWith(throwingRewriter())).resolves.toBeDefined()
    await expect(
      buildNarrativeOverlay({
        report: REPORT,
        rewriter: hangingRewriter(),
        enabled: true,
        timeoutMs: 20,
      }),
    ).resolves.toBeDefined()
  })
})
