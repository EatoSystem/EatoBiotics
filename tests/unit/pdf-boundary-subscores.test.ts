import { describe, it, expect, vi, beforeEach } from "vitest"

/* ════════════════════════════════════════════════════════════════════════════
   0R-6R · THE PDF BOUNDARY DROPS THE THREE PER-BIOTIC SCORES.

   ══ WHY THIS BOUNDARY EXISTS AND WHY IT NEEDS ITS OWN GUARD ═════════════════

   `lib/pdf/report-pdf.tsx` lost `freeScores.subScores` when its "Your 3
   Biotics" panel was deleted — name, number, per-Biotic colour, and a bar whose
   width was the score.

   Its one caller is `app/api/submit-deep-assessment/route.ts`, which is in
   CLAUDE.md's "What NOT to Modify" list and passes an OBJECT LITERAL, so
   TypeScript's excess-property check would have forced an edit to a protected
   route. `lib/pdf/generate-pdf.ts` sits between the two and is not protected,
   so it accepts the legacy shape and forwards only `{ overall, profile }`.

   That makes the discard a RUNTIME behaviour of one function, and runtime
   behaviour needs a runtime guard:

       export async function generatePDF({ freeScores, ...rest }) {
         const props = { ...rest, freeScores: { overall, profile } }   // drops
         const props = { ...rest, freeScores }                         // forwards

   Both typecheck. The second is one keystroke, and it silently hands the three
   per-Biotic scores back to the component that is no longer allowed to see
   them — which is precisely the ruling's own field test: WOULD THIS ALLOW A
   DOWNSTREAM CONSUMER TO RECONSTRUCT A PERSONAL BIOTIC STATE?

   ══ WHY THE PROPS AND NOT THE PDF BYTES ════════════════════════════════════

   MEASURED, not assumed. The obvious proof — generate two PDFs with permuted
   sub-scores and compare the bytes — does not work: `renderToBuffer` is not
   byte-deterministic even for IDENTICAL input (two renders of the same props
   produced two different sha256s). A test built on that comparison would fail
   for a reason that has nothing to do with Biotics.

   So `renderToBuffer` is mocked to capture the element it is handed, and the
   assertion is on the props that element carries. That is the boundary itself,
   with no rendering in between.
   ════════════════════════════════════════════════════════════════════════════ */

const captured: { props?: Record<string, unknown> }[] = []

vi.mock("@react-pdf/renderer", () => ({
  renderToBuffer: async (element: { props?: Record<string, unknown> }) => {
    captured.push(element)
    return Buffer.from("%PDF-1.7 mocked")
  },
  // `report-pdf.tsx` imports these at module load, so they have to exist.
  Document: "Document",
  Page: "Page",
  View: "View",
  Text: "Text",
  Image: "Image",
  Svg: "Svg",
  Path: "Path",
  Circle: "Circle",
  Rect: "Rect",
  G: "G",
  Defs: "Defs",
  LinearGradient: "LinearGradient",
  Stop: "Stop",
  Font: { register: () => undefined, registerHyphenationCallback: () => undefined },
  StyleSheet: { create: <T,>(s: T) => s },
}))

/** Three numbers no other field in this fixture can produce. */
const SUB = { prebiotics: 91, probiotics: 13, postbiotics: 57 }
const OVERALL = 62

async function generateWithLegacyShape() {
  const { generatePDF } = await import("@/lib/pdf/generate-pdf")
  const { buildFallbackPaidReport } = await import("@/lib/fallback-paid-report")

  const profile = { type: "Emerging Balance", tagline: "A steady pattern.", description: "d" }
  const report = buildFallbackPaidReport({
    tier: "premium",
    overall: OVERALL,
    subScores: SUB,
    profile,
    questions: [],
    answers: {},
  })

  const buffer = await generatePDF({
    tier: "premium",
    leadName: "Fixture",
    generatedAt: "1 Aug 2026",
    // The legacy caller's shape, sub-scores and all.
    freeScores: { overall: OVERALL, profile, subScores: SUB },
    report,
  } as never)

  return { buffer, element: captured.at(-1)! }
}

beforeEach(() => {
  captured.length = 0
})

describe("0R-6R · generatePDF forwards no per-Biotic scores to the renderer", () => {
  it("hands the component exactly { overall, profile }", async () => {
    const { element } = await generateWithLegacyShape()

    // NON-VACUITY: the capture is real and the boundary ran.
    expect(element, "renderToBuffer was never called").toBeTruthy()
    const props = element.props as Record<string, unknown>
    expect(props.tier).toBe("premium")
    expect(props.report, "the report never reached the component").toBeTruthy()

    const freeScores = props.freeScores as Record<string, unknown>
    expect(freeScores.overall, "the Biotics Score™ must still reach the PDF").toBe(OVERALL)
    expect(freeScores.profile).toBeTruthy()

    expect(
      Object.keys(freeScores).sort(),
      "generatePDF forwarded a field the PDF component is no longer allowed to " +
        "see. The whole point of this module is that the three per-Biotic " +
        "scores stop here.",
    ).toEqual(["overall", "profile"])
  })

  it("the three sub-scores appear nowhere in the element it builds", async () => {
    const { element } = await generateWithLegacyShape()

    /*
     * Serialised rather than key-walked, because the question is whether the
     * numbers are REACHABLE at all — through `freeScores`, through a nested
     * object, or through some future field nobody thought to check.
     */
    const seen = new Set<unknown>()
    const flat: string[] = []
    const walk = (node: unknown): void => {
      if (node == null || typeof node === "function") return
      if (typeof node !== "object") {
        flat.push(String(node))
        return
      }
      if (seen.has(node)) return
      seen.add(node)
      for (const value of Object.values(node as Record<string, unknown>)) walk(value)
    }
    walk(element.props)

    // NON-VACUITY: the walk found the values that ARE allowed through.
    expect(flat, "the walk saw nothing").toContain(String(OVERALL))

    for (const [key, value] of Object.entries(SUB)) {
      expect(
        flat.includes(String(value)),
        `the ${key} score ${value} is reachable from the PDF's props`,
      ).toBe(false)
    }
  })

  it("still produces a buffer — the boundary forwards, it does not swallow", async () => {
    const { buffer } = await generateWithLegacyShape()
    expect(buffer.subarray(0, 5).toString("latin1")).toBe("%PDF-")
  })
})
