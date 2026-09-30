import { describe, it, expect } from "vitest"
import { existsSync, readFileSync } from "node:fs"

/**
 * ══ THE DOCUMENTS CANNOT QUIETLY CLAIM MORE THAN THEY HAVE ═══════════════════
 *
 * Work Package B produced a constitution and four FSS-v1 documents. A document
 * is the easiest thing in a repository to let drift: nothing imports it,
 * nothing renders it, and a sentence added to it in six months' time is
 * reviewed by whoever happens to be reading.
 *
 * The specific failure this guards is the one the founder named: describing a
 * candidate model as validated because the code for it exists. The domains are
 * FROZEN FOR REVIEW, which means no further architectural iteration — it does
 * NOT mean approved, and the distinction is the whole reason the label was
 * written.
 *
 * These are cheap assertions. They exist because the expensive version of
 * finding this out is a customer-facing claim nobody can support.
 */

const CONSTITUTION = "docs/EATOBIOTICS_PRODUCT_CONSTITUTION_v1.md"
const FSS_DOCS = [
  "docs/fss/FSS_V1_SPEC.md",
  "docs/fss/FSS_V1_EVIDENCE_MATRIX.md",
  "docs/fss/FSS_V1_CLAIMS_BOUNDARY.md",
  "docs/fss/FSS_V1_VERSIONING.md",
]
const ALL = [CONSTITUTION, ...FSS_DOCS]

const read = (f: string) => readFileSync(f, "utf-8")

const DOMAINS = ["Diversity", "Plants & Fibre", "Fermented Foods", "Food Quality", "Meal Rhythm"]

describe("the Work Package B documents exist and are substantial", () => {
  it.each(ALL)("%s exists", (f) => {
    expect(existsSync(f), `${f} is missing — a rename must not empty the set`).toBe(true)
  })

  it.each(ALL)("%s is not a stub", (f) => {
    expect(read(f).length, `${f} is too short to be the document it claims to be`).toBeGreaterThan(1500)
  })
})

describe("the candidate domains are never described as approved", () => {
  /*
   * The label, verbatim. Asserted as a whole phrase rather than by keyword:
   * "candidate" alone would pass over "candidate domains, now validated".
   */
  const LABEL = /Frozen for Scientific Review, Not Yet Scientifically Approved/

  it("the constitution carries the label in full", () => {
    expect(read(CONSTITUTION)).toMatch(LABEL)
  })

  it("the spec carries the label in full", () => {
    expect(read("docs/fss/FSS_V1_SPEC.md")).toMatch(LABEL)
  })

  it("every document naming all five domains also carries the label", () => {
    for (const f of ALL) {
      const src = read(f)
      const namesAll = DOMAINS.every((d) => src.includes(d))
      if (namesAll) {
        expect(src, `${f} lists all five domains without the candidate label`).toMatch(LABEL)
      }
    }
  })

  const VALIDATION_CLAIM = [
    ["domains called validated", /\b(?:domains?|model|methodology|score)\b[^.!?\n]{0,40}\b(?:is|are|has been|have been)\s+(?:scientifically\s+)?validated\b/i],
    ["domains called evidence-based", /\b(?:domains?|model|methodology)\b[^.!?\n]{0,30}\bevidence-based\b/i],
    ["a clinical claim", /\bclinically\s+(?:validated|proven|approved)\b/i],
  ] as const

  /*
   * A document that FORBIDS a claim contains the words of that claim. The
   * constitution says "no surface may describe these domains as validated,
   * evidence-based or clinically supported" — and the rule above fired on it,
   * which would have forced the prohibition to be deleted to go green.
   *
   * Exactly the shape of lib/consultation/science-contract.ts matching the
   * colonisation rule because it is the module prohibiting colonisation. A
   * rule that punishes a file for defending itself is the wrong rule, so
   * prohibition sentences are excluded before matching — and non-vacuity is
   * asserted in both directions so this cannot become a blanket escape.
   */
  const PROHIBITION = /\b(?:never|not|must not|may not|may never|no surface|nothing|cannot|refus\w+|prohibit\w+|forbid\w+)\b/i
  const assertions = (src: string) =>
    src
      /*
       * UNWRAP FIRST. Markdown here is hard-wrapped at ~80 columns, so a
       * prohibition routinely spans two lines — and splitting on "\n" put
       * "does not validate it" in one chunk and "as validated, evidence-based"
       * in the next, which then read as a bare assertion. The guard failed on
       * the document's own prohibition for a reason that was purely about line
       * length. Paragraphs are rejoined before sentences are split.
       */
      .split(/\n\s*\n/)
      .map((paragraph) => paragraph.replace(/\s*\n\s*/g, " "))
      .flatMap((paragraph) => paragraph.split(/(?<=[.!?])\s+/))
      .filter((sentence) => !PROHIBITION.test(sentence))
      .join("\n")

  it.each(ALL)("%s makes no validation claim", (f) => {
    const src = assertions(read(f))
    for (const [why, pattern] of VALIDATION_CLAIM) {
      const hit = src.match(pattern)
      expect(hit?.[0] ?? null, `${f} — ${why}: "${hit?.[0]}"`).toBeNull()
    }
  })

  it("NON-VACUITY: a validation claim would be caught", () => {
    for (const line of [
      "The five domains are scientifically validated.",
      "This model has been validated against a cohort.",
      "The methodology is evidence-based.",
      "A clinically proven measure.",
    ]) {
      expect(VALIDATION_CLAIM.some(([, r]) => r.test(line)), `not caught: ${line}`).toBe(true)
    }
  })

  it("NON-VACUITY: a prohibition is excluded, an assertion is not", () => {
    const forbids = "No surface may describe these domains as validated, evidence-based or clinically supported."
    const asserts = "These domains are scientifically validated."
    expect(PROHIBITION.test(forbids), "the prohibition must be excluded").toBe(true)
    expect(PROHIBITION.test(asserts), "a bare assertion must NOT be excluded").toBe(false)
    expect(VALIDATION_CLAIM.some(([, r]) => r.test(asserts))).toBe(true)
  })

  it("NON-VACUITY: a hard-wrapped prohibition survives unwrapping", () => {
    /*
     * The case that actually failed. Wrapped across two lines, the second half
     * reads as an assertion; unwrapped, it is plainly a prohibition.
     */
    const wrapped =
      "No surface, document, commit message or prompt may describe these\n" +
      "domains as validated, evidence-based or clinically supported."
    expect(assertions(wrapped).trim(), "an unwrapped prohibition must be excluded").toBe("")
    expect(
      VALIDATION_CLAIM.some(([, r]) => r.test(assertions(wrapped))),
      "and must therefore not register as a claim",
    ).toBe(false)
  })

  it("NON-VACUITY: the honest statements are NOT caught", () => {
    for (const line of [
      "Requires reviewer sign-off.",
      "Not Yet Scientifically Approved",
      "no evidence base ranks these five against each other",
      "Evidence class of the proposed use, never of the topic.",
    ]) {
      expect(VALIDATION_CLAIM.some(([, r]) => r.test(line)), `false positive: ${line}`).toBe(false)
    }
  })
})

describe("the claims boundary refuses to weaken the contract", () => {
  /*
   * The load-bearing sentence of the whole phase. `cannotProduceValidatedSystemModel`
   * is the clause most directly in tension with a branded composite score, and
   * the ONLY acceptable answer is to scope the claim — never to relax the rule
   * so a name fits. If that sentence ever disappears, the document has stopped
   * saying the thing it was written to say.
   */
  const boundary = read("docs/fss/FSS_V1_CLAIMS_BOUNDARY.md")

  it("names the clause it has to answer", () => {
    expect(boundary).toContain("cannotProduceValidatedSystemModel")
  })

  it("records that the name yields to the rule, not the other way round", () => {
    expect(
      boundary,
      "the refusal to relax the rule for a name must survive verbatim",
    ).toMatch(/If review concludes the rule must be relaxed to permit the name, that is\s*\n?>?\s*the signal the name is wrong/)
  })

  it("states the three prohibited equivalences", () => {
    const matrix = read("docs/fss/FSS_V1_EVIDENCE_MATRIX.md")
    expect(matrix).toMatch(/fibre ≠ prebiotic/i)
    expect(matrix).toMatch(/fermented food ≠ probiotic/i)
    expect(matrix).toMatch(/metabolite ≠ a postbiotic/i)
  })
})

describe("the constitution agrees with the code it governs", () => {
  const src = read(CONSTITUTION)

  /*
   * The SECOND time hard-wrapping has broken a rule in this file, so it is
   * fixed once here rather than per-assertion. Markdown wraps at ~80 columns,
   * so any sentence long enough to be worth asserting is likely to span two
   * lines — and a regex written as a sentence then fails on a newline that has
   * nothing to do with meaning. `flat` joins paragraph lines back together;
   * `src` stays available for assertions that genuinely care about layout.
   */
  const flat = src
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s*\n\s*/g, " "))
    .join("\n")

  it("keeps the retired programme vocabulary as prohibitions only", () => {
    /*
     * The constitution must NAME the retired terms — a vocabulary authority
     * that cannot say which words are retired is useless. What it must not do
     * is use them. Both appear only inside the "Not" column of its table.
     */
    for (const retired of ["First Course", "First 100", "founding member"]) {
      expect(src, `${retired} must be named`).toContain(retired)
    }
    const misuse = /\bjoin (?:the )?(?:First Course|First 100)\b|\bour founding members\b/i
    expect(src.match(misuse)?.[0] ?? null).toBeNull()
  })

  it("records the Systems ladder in order", () => {
    expect(src).toMatch(/100\s*→\s*1,000\s*→\s*10,000\s*→\s*100,000\s*→\s*\n?\s*1M\s*→\s*10M\s*→\s*100M Systems/)
  })

  it("carries the vision, in both halves", () => {
    expect(flat).toMatch(/Build the food system inside you/)
    expect(flat).toMatch(/help build the food system around you/)
  })

  it("SCALE IS NOT A SCORING INPUT, and the constitution says so", () => {
    /*
     * The load-bearing separation. The ladder is a growth and learning
     * structure; a cohort is not a covariate. If which rung somebody joined at
     * ever reached the Score, its domains, weights or bands, the Score would
     * stop describing the food patterns a person reported and start describing
     * when they arrived.
     */
    expect(flat).toMatch(/referenced by no scoring document/i)
    expect(flat).toMatch(/A cohort is not a covariate/)
  })

  it("no FSS document references the Systems ladder", () => {
    /*
     * The other direction, and the one that would fail silently. The
     * constitution can promise separation all it likes; this is what checks it.
     */
    for (const doc of FSS_DOCS) {
      const text = read(doc)
      for (const rung of ["100 Systems", "1,000 Systems", "10,000 Systems", "100M Systems"]) {
        expect(text.includes(rung), `${doc} references the Scale ladder ("${rung}")`).toBe(false)
      }
    }
  })

  it("the Scale ladder keeps the counted-or-absent rule", () => {
    expect(flat).toMatch(/counted, or absent/i)
  })

  it("states that stored keys never move", () => {
    expect(src).toMatch(/Stored keys never move/i)
    for (const key of ["heal", "adding"]) expect(src).toContain(`\`${key}\``)
  })

  it("forbids a personal number on any Biotic", () => {
    expect(src).toMatch(/NO personal number, ever/)
  })
})
