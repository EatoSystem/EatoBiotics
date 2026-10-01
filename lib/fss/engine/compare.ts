import { isLegacyUnversioned, type ScoreProvenance } from "./provenance"

/* ════════════════════════════════════════════════════════════════════════
   Comparing two scores — and refusing to, which is the normal case.

   The product will want to say "your plant diversity increased". That sentence
   is only true if both numbers came from the same instrument, and today two
   instruments write the same columns with no record of which. So comparison
   REFUSES BY DEFAULT and permits only what is explicitly allowed.

   The inversion matters. A comparison function that returns a delta and
   documents its caveats will be called without them; one that returns a
   refusal cannot be.
   ════════════════════════════════════════════════════════════════════════ */

export type ComparisonRefusal =
  | "legacy-unversioned"
  | "different-method"
  | "different-question-set"
  | "different-calculation"

export type ComparisonVerdict =
  | { readonly comparable: true; readonly via: "same-method" | "allowlisted" }
  | { readonly comparable: false; readonly because: ComparisonRefusal; readonly explain: string }

/**
 * Pairs of method versions a reviewer has established are comparable.
 *
 * An ALLOWLIST, never a default. It exists for the one honest case: a change
 * that moved only `interpretationVersion` — band labels, copy — leaves the
 * numbers identical and comparing them is sound.
 *
 * Empty, and correctly so: no such change has happened, and a pair added here
 * without a reviewer having said so would silently reintroduce exactly the
 * defect this module exists to prevent.
 */
export const COMPARABLE_METHODS: readonly (readonly [string, string])[] = []

function allowlisted(a: string, b: string): boolean {
  return COMPARABLE_METHODS.some(([x, y]) => (x === a && y === b) || (x === b && y === a))
}

/**
 * May these two scores be compared?
 *
 * Note what is NOT here: a tolerance, a "close enough" rule, or a way to
 * compare a legacy score with anything. A `legacy-unversioned` score was
 * produced by an instrument that cannot now be identified, and no amount of
 * care at the call site recovers that.
 */
export function canCompare(a: ScoreProvenance, b: ScoreProvenance): ComparisonVerdict {
  if (isLegacyUnversioned(a) || isLegacyUnversioned(b)) {
    return {
      comparable: false,
      because: "legacy-unversioned",
      explain:
        "One of these scores predates score provenance. Which instrument produced it cannot be " +
        "established — two different question sets wrote the same columns — so it is comparable " +
        "with nothing, including another legacy score.",
    }
  }

  if (a.fssMethodVersion !== b.fssMethodVersion) {
    if (allowlisted(a.fssMethodVersion, b.fssMethodVersion)) {
      return { comparable: true, via: "allowlisted" }
    }
    return {
      comparable: false,
      because: "different-method",
      explain:
        `These scores came from different methods (${a.fssMethodVersion} and ${b.fssMethodVersion}). ` +
        "Show both, labelled, and say the method changed. Do not draw a line through the two.",
    }
  }

  // Same method version, so the rest should agree. If they do not, the method
  // version is lying about what it covers — which is worth failing on rather
  // than tolerating, because it means provenance has stopped being reliable.
  if (a.questionSetVersion !== b.questionSetVersion) {
    return {
      comparable: false,
      because: "different-question-set",
      explain:
        `Same method version but different question sets (${a.questionSetVersion} and ` +
        `${b.questionSetVersion}). The instrument changed without the method version changing.`,
    }
  }
  if (a.calculationVersion !== b.calculationVersion) {
    return {
      comparable: false,
      because: "different-calculation",
      explain:
        `Same method version but different calculations (${a.calculationVersion} and ` +
        `${b.calculationVersion}). The arithmetic changed without the method version changing.`,
    }
  }

  return { comparable: true, via: "same-method" }
}

/**
 * The language a comparison may use, when one is permitted at all.
 *
 * Behaviour reported by a person is not biology observed about them. A changed
 * answer is a changed answer — so the vocabulary here is "you reported", never
 * "improved", and there is no function that returns the other kind of
 * sentence.
 */
export const COMPARISON_LANGUAGE = {
  increased: (what: string) => `Your reported ${what} increased.`,
  decreased: (what: string) => `Your reported ${what} decreased.`,
  unchanged: (what: string) => `Your reported ${what} is about the same.`,
  /**
   * Shown when a method change has ALREADY happened between two results.
   *
   * Past tense, and that matters: it asserts that something changed. Gate 3
   * first wired this into the thirty-day reassessment note, where it was read
   * by somebody who had taken the assessment once — telling them the
   * calculation had changed between two results they did not have. Use `rule`
   * for the forward-looking statement.
   */
  methodChanged:
    "The way we calculate this changed between these two results, so they are shown separately rather than compared.",
  /**
   * The rule itself, stated before anything has happened.
   *
   * Prospective, so a surface can explain what a future comparison would be
   * allowed to do without claiming a change has occurred.
   */
  rule:
    "Two results can only be compared when they came from the same version of the method. If it changes in between, we show them separately rather than drawing a line between them.",
} as const
