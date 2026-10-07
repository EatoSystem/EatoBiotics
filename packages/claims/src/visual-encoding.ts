/**
 * Form-track rules: a prohibited personal Biotic state cannot FLOW into a
 * visual encoding — colour, position, scale, opacity, duration, anatomy.
 *
 * Web sinks live in tests/unit/biotic-visual-encoding.test.ts (pinned by
 * 0R sabotage). This module is the RN dialect plus the derived reads that
 * transfer unchanged, so a BioticBar in React Native fails the same
 * invariant before any Today screen ships.
 */

export const BIOTIC_DERIVED: readonly [string, RegExp][] = [
  ["the weakest Biotic", /\bbiotics\s*\.\s*weakest\b/],
  ["the strongest Biotic", /\bbiotics\s*\.\s*strongest\b/],
  [
    "a per-Biotic score",
    /\b(?:pre|pro|post)biotic_score\b|\bbiotics\s*\.\s*(?:pre|pro|post)biotics?\b/,
  ],
  [
    "a RECORD of per-Biotic values",
    /\b\w+\s*:\s*Record<\s*BioticScoreKey\s*,\s*number\s*>|\b\w+\s*:\s*Partial<\s*Record<\s*BioticScoreKey\b/,
  ],
]

/**
 * Visual sinks, including the React Native dialect from the mobile brief:
 *
 *   derived extent   width: `${…}%`          transfers (inline style objects)
 *   colour           backgroundColor, color  plus expo-linear-gradient `colors`
 *   strokeDasharray  react-native-svg        same prop
 *   scale            RN transform array      `transform: [{ scale: … }]`
 *   anatomy          node: { x, y }          unchanged
 */
export const VISUAL_SINKS: readonly [string, RegExp][] = [
  [
    "a colour or gradient",
    /\b(?:\w*[Gg]radient\w*|\w*[Cc]olou?r\w*|\w*[Tt]int\w*|\w*[Aa]ura\w*|colors\s*:)/,
  ],
  [
    "a DERIVED extent — a bar length, a ring arc or a scale computed from a value",
    /\bwidth\s*:\s*(?:`[^`]*\$\{|\$\{|\w+\s*[*+]|[`"']?\$)|\bstrokeDasharray\s*:\s*(?:`|\{|\w)|\bscale\s*\(\s*(?:\$\{|\w+\s*[*+]|[a-z])|\btransform\s*:\s*\[\s*\{\s*scale\s*:/,
  ],
]

export const ANATOMICAL_COORDINATE = /\bnode\s*:\s*\{\s*x\s*:/

export function bioticFlowsIntoVisual(source: string): boolean {
  const derived = BIOTIC_DERIVED.some(([, re]) => re.test(source))
  const sink = VISUAL_SINKS.some(([, re]) => re.test(source))
  return derived && sink
}
