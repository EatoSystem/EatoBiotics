import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import {
  ANATOMICAL_COORDINATE,
  BIOTIC_DERIVED,
  PERSONAL_BIOTIC_STATE,
  VISUAL_SINKS,
  bioticFlowsIntoVisual,
} from "@eatobiotics/claims"
import { MOBILE_SURFACES } from "./customer-surfaces"

function source(file: string): string {
  return readFileSync(file, "utf-8")
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/^\s*\/\/.*$/gm, " ")
}

/**
 * EXPERIENCE 0R mobile dialect — the §5.3 demonstration.
 *
 * Before the app ships a screen that mentions Prebiotics, Probiotics or
 * Postbiotics, a per-Biotic score with a bar in React Native must fail a
 * test. These subjects are the RN reconstructions of the web defects; they
 * exist nowhere in apps/mobile. The live files must stay clean.
 */
const RN_PRE_REPAIR: readonly [why: string, shape: string][] = [
  [
    "a per-Biotic score drives a React Native bar width",
    [
      "const score = twin.biotics.prebiotics.score",
      "return <View style={{ width: `${Math.max(4, Math.min(100, score))}%` }} />",
    ].join("\n"),
  ],
  [
    "personal Pre/Pro/Post stats as Text nodes plus a bar",
    [
      "<Text>Your Prebiotics</Text>",
      "<Text>{twin.biotics.prebiotics.score}/100</Text>",
      "<View style={{ width: `${score}%`, backgroundColor: c }} />",
    ].join("\n"),
  ],
  [
    "RN transform array scale from a Biotic score",
    [
      "const score = twin.biotics.probiotics.score",
      "style={{ transform: [{ scale: score / 100 }] }}",
    ].join("\n"),
  ],
  [
    "expo-linear-gradient colours from the weakest Biotic",
    [
      "const tint = auraFor(twin.biotics.weakest)",
      "<LinearGradient colors={[tint, '#000']} />",
    ].join("\n"),
  ],
]

describe("0R mobile · a Biotic may not flow into an RN visual encoding", () => {
  it.each(MOBILE_SURFACES)("%s maps no Biotic to a visual parameter", (file) => {
    const src = source(file)
    expect(
      bioticFlowsIntoVisual(src),
      `${file} maps a personal Biotic read onto a bar, colour or scale`,
    ).toBe(false)
    expect(ANATOMICAL_COORDINATE.test(src), `${file} attaches a body coordinate`).toBe(false)
  })

  it.each(MOBILE_SURFACES)("%s asserts no personal Biotic state in prose", (file) => {
    const src = source(file)
    for (const [why, pattern] of PERSONAL_BIOTIC_STATE) {
      const hit = src.match(pattern)
      expect(hit?.[0] ?? null, `${file} — ${why}: "${hit?.[0]}"`).toBeNull()
    }
  })

  it.each(RN_PRE_REPAIR)("§5.3 NON-VACUITY: the RN shape is refused — %s", (_why, shape) => {
    const derived = BIOTIC_DERIVED.some(([, r]) => r.test(shape))
    const sink = VISUAL_SINKS.some(([, r]) => r.test(shape))
    const prose = PERSONAL_BIOTIC_STATE.some(([, r]) => r.test(shape))
    expect(
      (derived && sink) || prose,
      `no personal Biotic bar/stat found in: ${shape}`,
    ).toBe(true)
  })

  it("§5.3: introducing a per-Biotic bar into RN source fails this suite", () => {
    const forbidden = [
      "function BioticBar({ score }: { score: number }) {",
      "  const personal = twin.biotics.prebiotics.score",
      "  return (",
      "    <View>",
      "      <Text>Your Prebiotics {personal}/100</Text>",
      "      <View style={{ width: `${personal}%`, backgroundColor: '#2DAA6E' }} />",
      "    </View>",
      "  )",
      "}",
    ].join("\n")

    expect(bioticFlowsIntoVisual(forbidden)).toBe(true)
    expect(PERSONAL_BIOTIC_STATE.some(([, r]) => r.test(forbidden))).toBe(true)

    const live = MOBILE_SURFACES.map(source).join("\n")
    expect(bioticFlowsIntoVisual(live)).toBe(false)
    expect(PERSONAL_BIOTIC_STATE.some(([, r]) => r.test(live))).toBe(false)
  })
})
