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
  /** The parts a score is composed of moved. See `canCompareDomains` below. */
  | "different-domain-schema"

/**
 * How a comparison was permitted.
 *
 * `same-domain-schema` is NOT a synonym for `same-method`, and the distinction
 * is load-bearing rather than tidy: a domain verdict that reported
 * `via: "same-method"` would be stating that the method was what got checked,
 * when the method is a different question with a different answer. One of the
 * two can pass while the other refuses, so a caller holding a verdict must be
 * able to see which question it answers.
 */
export type ComparisonVerdict =
  | { readonly comparable: true; readonly via: "same-method" | "same-domain-schema" | "allowlisted" }
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

/* ════════════════════════════════════════════════════════════════════════
   THE NESTED QUESTION — may the DOMAINS be compared?

   ── Why this is a second entry point and not a branch inside the first ────

   Two reasons, and the first is forced by the data. The domain schema version
   is not in `ScoreProvenance` and cannot be (see
   `lib/fss/questions/domain-schema.ts`), so `canCompare`'s two-provenance
   signature has nothing to read.

   The second is the one that matters to the product. The two verdicts can
   DISAGREE, and the disagreement is a real case that has to be representable:

     the method stayed still, the domain set moved
       → the overall score comparison is sound, the per-domain one is not

   A single function returning a single verdict would have to collapse that into
   "comparable" or "not", and either collapse is a lie. So there are two
   questions, asked separately, in ONE authority module — which is the whole
   point: there is no second place that decides whether a comparison may be
   presented.

   ── What a caller must do with it ────────────────────────────────────────

   A per-domain change requires BOTH verdicts. The overall score verdict does
   not license a domain delta, and this function refusing does not invalidate
   the overall score — it removes the domains from what may be said.
   ════════════════════════════════════════════════════════════════════════ */

/**
 * Pairs of domain schema versions a reviewer has established are comparable.
 *
 * Empty, and for the same reason `COMPARABLE_METHODS` is empty: no such change
 * has happened, and an entry added without a reviewer having established that
 * the domains still mean the same thing would silently reintroduce exactly the
 * defect this refuses. A rename with identical composition is the one case that
 * could ever honestly live here, and it is not this product's job to guess that
 * a rename was only a rename.
 */
export const COMPARABLE_DOMAIN_SCHEMAS: readonly (readonly [string, string])[] = []

function domainsAllowlisted(a: string, b: string): boolean {
  return COMPARABLE_DOMAIN_SCHEMAS.some(([x, y]) => (x === a && y === b) || (x === b && y === a))
}

/**
 * May the per-domain parts of these two scores be compared?
 *
 * ── An ABSENT version refuses, and is not assumed to be the current one ───
 *
 * `StoredScore.domainSchemaVersion` is required by the type, but a record
 * written before this anchor existed is sitting in `localStorage` right now
 * with no such key, and `JSON.parse` does not care what a TypeScript interface
 * says. Treating a missing version as "current" would be the one assumption
 * that defeats the whole mechanism: the records that most need refusing are
 * exactly the ones that predate the field.
 *
 * So anything that is not a recognised version refuses — missing, empty,
 * undefined-coerced, or a version from a schema that has since moved.
 */
export function canCompareDomains(a: string, b: string): ComparisonVerdict {
  /*
   * An absent version refuses FIRST, before equality is even considered.
   *
   * Two records that both lack the field are equal, and equality is the rule
   * below — so checking equality first would make the pre-anchor records the
   * one pair that sails through. They are the pair that most needs refusing.
   */
  if (!a || !b) {
    return {
      comparable: false,
      because: "different-domain-schema",
      explain:
        "One of these scores does not record which domain schema composed it. Which parts its " +
        "per-domain numbers describe cannot be established, so the domains are comparable with " +
        "nothing — including another score that also does not record one. The overall score may " +
        "still be comparable.",
    }
  }

  /*
   * Exact match, and deliberately NOT "is it the current schema".
   *
   * Two scores both written under a schema this code has never heard of share
   * a composition, and comparing them is sound. Whether today's reviewed copy
   * can NAME their domains is a different question with a different answer,
   * and it belongs to whatever renders the result, not to whether a comparison
   * is permitted. Collapsing the two here would refuse a sound comparison for
   * a presentation reason.
   */
  if (a === b) return { comparable: true, via: "same-domain-schema" }

  if (domainsAllowlisted(a, b)) return { comparable: true, via: "allowlisted" }

  return {
    comparable: false,
    because: "different-domain-schema",
    explain:
      `These scores were composed of different domains (${a} and ${b}). A domain can be renamed, ` +
      "split or recomposed without the method version moving, so a per-domain change across the " +
      "two would describe different things under one name. The overall score may still be comparable.",
  }
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
