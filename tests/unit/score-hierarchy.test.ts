/**
 * Product → output → framework, and person → meal, on the surfaces that show
 * a score.
 *
 *     Food System Assessment  is the PRODUCT
 *       → Biotics Score™       is its OUTPUT
 *         → Prebiotics · Probiotics · Postbiotics  is how it is UNDERSTOOD
 *     Meal Biotics Score      is one MEAL
 *     Feed · Seed · Rejuvenate is what a person DOES
 *
 * Semantic, not exact-copy. Asserting a headline verbatim makes a guard that
 * fails on every rewording and catches no real collision — the retired-vocabulary
 * corpus already polices the exact retired strings. What this file checks is
 * the RELATIONSHIP: that a surface showing a person's score does not name it as
 * a meal's, that a meal surface does not claim the person's branded score, and
 * that the score cards break down by pathway rather than by action.
 */
import { describe, it, expect } from "vitest"
import { readFileSync, existsSync } from "node:fs"
import { execSync } from "node:child_process"
import { copyOf } from "./helpers/marketing-language"
import { BIOTICS, ACTIONS } from "@/lib/product-vocabulary"
import { MEAL_SURFACES } from "./customer-surfaces"

const read = (p: string) => copyOf(readFileSync(p, "utf8"))

describe("the person-level score", () => {
  const personSurfaces = [
    "components/start/score-mock.tsx",
    "components/start/start-value.tsx",
    "app/api/score-card/route.tsx",
    "app/api/og/score-card/route.tsx",
    "app/share/share-client.tsx",
  ].filter(existsSync)

  it("is named Biotics Score, never a competing brand", () => {
    expect(personSurfaces.length).toBeGreaterThanOrEqual(4)
    for (const f of personSurfaces) {
      const copy = read(f)
      expect(copy, `${f} must name the Biotics Score`).toMatch(/Biotics Score/)
      expect(copy, `${f} must not carry a competing branded score`).not.toMatch(
        /Food System Score|Gut Health Score/i,
      )
    }
  })

  it("is not described as the score of one meal", () => {
    for (const f of personSurfaces) {
      // The collision that matters: a person-level surface promising the
      // person's score while actually describing a plate.
      expect(read(f), `${f} must not call the person's score a meal score`).not.toMatch(
        /Meal Biotics Score/,
      )
    }
  })
})

describe("the meal-level score", () => {
  // From the shared manifest, plus lib/nav.ts — which is a marketing surface
  // but carries the one nav entry that names the meal score, and was the
  // original person/meal collision.
  const mealSurfaces = [...MEAL_SURFACES, "lib/nav.ts"].filter(existsSync)

  it("is named Meal Biotics Score wherever a meal score is labelled", () => {
    expect(mealSurfaces.length).toBeGreaterThanOrEqual(6)
    // Not every meal surface names the score — guest-scan-flow.tsx is a
    // container that renders ResultBuilder, and requiring the string there
    // would be asserting where a component lives rather than what it says.
    // What must hold is that the surfaces which DO label a score use the meal
    // name, and that the group as a whole establishes it.
    const labelling = mealSurfaces.filter((f) => /\bScore\b/.test(read(f)))
    expect(labelling.length, "some meal surface must label a score").toBeGreaterThan(0)
    const naming = labelling.filter((f) => /Meal Biotics Score/.test(read(f)))
    expect(
      naming.length,
      `meal surfaces labelling a score without naming it: ${labelling
        .filter((f) => !/Meal Biotics Score/.test(read(f)))
        .join(", ")}`,
    ).toBe(labelling.length)
  })

  it("never claims the person's branded score for a meal", () => {
    for (const f of mealSurfaces) {
      const copy = read(f)
      // "Biotics Score™" with the mark is the PERSON's score. A meal surface
      // may point AT the Assessment that produces it — that is the correct
      // progression — but must not present the meal's number as that score.
      const badges = copy.match(/\bBiotics Score™/g) ?? []
      for (const _ of badges) {
        expect(
          copy,
          `${f} may only use Biotics Score™ for the person's score reached via the Assessment`,
        ).toMatch(/Food System Assessment/)
      }
      expect(copy, `${f} must not sell a meal as the full person score`).not.toMatch(
        /full Biotics Score/i,
      )
    }
  })
})

describe("understand versus act", () => {
  it("breaks scores down by pathway, not by action", () => {
    // The score cards are the sharpest case: their bars ARE the breakdown.
    for (const f of ["app/api/score-card/route.tsx"]) {
      const copy = read(f)
      for (const b of BIOTICS) {
        expect(copy, `${f} must label its bars with ${b}`).toContain(b)
      }
      // An action name appearing as a bar label is the conflation. The query
      // keys (feed/seed/heal) are not copy and are invisible to copyOf.
      for (const a of ACTIONS) {
        expect(copy, `${f} must not label a score bar "${a}"`).not.toMatch(
          new RegExp(`label:\\s*"${a}"`),
        )
      }
    }
  })

  /**
   * The framework cards pair an action with a biotic — "Feed" over "PREBIOTICS".
   *
   * This check used to assert that feed-seed-heal.tsx matched /inspired by/i,
   * because each card hedged the pairing ("Inspired by Prebiotics"). The hedge
   * came off the cards; the relationship now lives once, in the section intro.
   *
   * The old assertion would have PASSED that change unchanged, which is why it
   * is gone rather than adjusted. copyOf() strips comments but keeps the intro
   * sentence, and that sentence contains the words "inspired by" — so the
   * per-card hedge could vanish from all three cards and the guard would stay
   * green. A guard that survives the disappearance of its own subject is the
   * thing it exists to prevent.
   *
   * What replaces it asserts the two things that are actually still true.
   */
  const ACTION_SECTIONS = [
    "components/home/feed-seed-heal.tsx", // homepage
    "components/home/the-framework.tsx", // /enter and /c/[country]
  ]

  /**
   * The FSS-v1 candidate, which is where the action framework is being REBUILT.
   *
   * ── Why this list is derived and the one above is not ────────────────────────
   *
   * The two files above are finished surfaces; naming them is honest. The
   * candidate is under construction and about to acquire a whole action layer —
   * categories, a recommendation catalogue, a plan — so a named list would be
   * guarded only as far as somebody remembered to extend it, and the first file
   * they forgot would be the one that reintroduced the conflation.
   *
   * ── Why it matters more here than anywhere else ──────────────────────────────
   *
   * Every other surface inherited Feed · Seed · Rejuvenate already attached to a
   * Biotic, and the work was prising them apart. The candidate starts clean: the
   * engine contains no Biotic at all, and the architecture's whole claim is that
   * the domains are the scored layer and the actions are not. The cheapest way
   * to lose that is to write `Record<FssDomain, ActionCategory>` or to print an
   * action beside a Biotic with an operator between them — and until now no rule
   * in this file could see either, because the candidate tree was in no corpus.
   */
  const CANDIDATE_ACTION_SURFACES = execSync("git ls-files lib/fss components/fss", {
    encoding: "utf-8",
  })
    .trim()
    .split("\n")
    .filter((f) => /\.(ts|tsx)$/.test(f))
    .sort()

  /**
   * The relationship, stated as a whole phrase rather than two words. Matching
   * the full sentence is the point: it can only pass while the sentence is
   * actually there, so deleting it turns this red.
   */
  const RELATIONSHIP = /actions inspired by the science of/i

  /**
   * An equation, for any action/biotic pair. Built from the vocabulary
   * constants rather than hardcoding Regenerate/Postbiotics, which is how the
   * previous version came to name a term the product had already retired — a
   * rename moved the word and left the guard behind.
   */
  const equations = () =>
    ACTIONS.flatMap((a) =>
      BIOTICS.map((b) => ({
        label: `${a} = ${b}`,
        pattern: new RegExp(`\\b${a}\\b\\s*(?:=|:|—|-|\\bis\\b)\\s*\\b${b}\\b`, "i"),
      })),
    )

  /**
   * The same equation, assembled from the card data rather than typed out.
   *
   * These components render their words from `{p.title}` / `{biotic.science}`,
   * so the literal sentence "Feed = Prebiotics" never appears in the file even
   * when the page says exactly that. The rule above reads source text and is
   * blind to it — proven, not assumed: sabotage cases 947 and 948 wrote
   * `{p.title} = {p.science}` into both components and walked straight through.
   *
   * Stated plainly, because it bounds what this file can promise: a source
   * guard cannot see rendered output. This pattern closes the composition that
   * actually exists in these two components; the rendered assertion lives in
   * tests/e2e/framework-cards.spec.ts, which reads the real page.
   */
  const OPERATOR = String.raw`\s*(?:=|:|—|-|\bis\b)\s*`
  const ACTION_EXPR = String.raw`\{[^}]*\b(?:title|action)\b[^}]*\}`
  const SCIENCE_EXPR = String.raw`\{[^}]*\bscience\b[^}]*\}`
  const COMPOSED = [
    new RegExp(ACTION_EXPR + OPERATOR + SCIENCE_EXPR),
    new RegExp(SCIENCE_EXPR + OPERATOR + ACTION_EXPR),
  ]

  it("states the action/science relationship once, in the section intro", () => {
    const copy = read("components/home/feed-seed-heal.tsx")
    expect(
      copy,
      "the homepage action section must keep the sentence relating the actions to the science",
    ).toMatch(RELATIONSHIP)
  })

  it("never equates an action with a biotic", () => {
    for (const f of [...ACTION_SECTIONS, ...CANDIDATE_ACTION_SURFACES]) {
      const copy = read(f)
      for (const { label, pattern } of equations()) {
        expect(copy, `${f} must not assert "${label}"`).not.toMatch(pattern)
      }
      for (const pattern of COMPOSED) {
        expect(
          copy,
          `${f} must not assemble that equation from the card data either`,
        ).not.toMatch(pattern)
      }
    }
  })

  /**
   * And the candidate must not label anything with an action name.
   *
   * `label:` is the shape the rule above the framework cards already refuses on
   * the score-card route, and it is the shape an action-category record would
   * naturally take — `{ label: "Feed", … }`. Permitted everywhere it is a key
   * (`feed:`), refused everywhere it is a rendered label, which is the same
   * case-sensitive distinction `retired-vocabulary.test.ts` draws and for the
   * same reason: a stored key is not copy.
   *
   * The counterfactual is below, so this is not another presence check.
   */
  const actionAsLabel = () => ACTIONS.map((a) => new RegExp(`label:\\s*"${a}"`))

  it("the candidate never uses an action name as a label", () => {
    expect(CANDIDATE_ACTION_SURFACES.length).toBeGreaterThanOrEqual(16)
    for (const f of CANDIDATE_ACTION_SURFACES) {
      const copy = read(f)
      for (const [i, pattern] of actionAsLabel().entries()) {
        expect(copy, `${f} must not label anything "${ACTIONS[i]}"`).not.toMatch(pattern)
      }
    }
  })

  it("NON-VACUITY: an action used as a label would be caught, a key would not", () => {
    const hits = (s: string) => actionAsLabel().some((p) => p.test(s))
    expect(hits('{ label: "Feed", color: "var(--icon-green)" }')).toBe(true)
    expect(hits('{ label: "Rejuvenate" }')).toBe(true)
    // A stored key is not copy, and the candidate is free to use one.
    expect(hits('{ feed: 0.2, seed: 0.2 }')).toBe(false)
    expect(hits('category: "feed"')).toBe(false)
  })

  /**
   * Both rules run against input that must fail them. Without this they are
   * two more "the symbol is present" checks, and this engagement has repeatedly
   * found those passing over behaviour that was already gone.
   */
  it("NON-VACUITY: both rules fail on input that violates them", () => {
    expect("Three simple actions. Feed. Seed. Rejuvenate.").not.toMatch(RELATIONSHIP)
    const offender = equations().find((e) => e.label === "Rejuvenate = Postbiotics")
    expect(offender, "the pair list must cover Rejuvenate/Postbiotics").toBeDefined()
    expect("Rejuvenate = Postbiotics").toMatch(offender!.pattern)
    expect("Rejuvenate: Postbiotics").toMatch(offender!.pattern)
    expect("Rejuvenate — Postbiotics").toMatch(offender!.pattern)
    // Adjacency without an operator is the shipped design, not a violation.
    expect("Rejuvenate Postbiotics").not.toMatch(offender!.pattern)

    // The composed form, in both the shapes the two components could take.
    const composed = (s: string) => COMPOSED.some((p) => p.test(s))
    expect(composed("{p.title} = {p.science}")).toBe(true)
    expect(composed("{biotic.action} = {biotic.science}")).toBe(true)
    expect(composed("{biotic.science} — {biotic.action}")).toBe(true)
    // The shipped cards print the two as separate elements, which is not this.
    expect(composed("<h3>{biotic.action}</h3> <p>{biotic.science}</p>")).toBe(false)
  })

  /**
   * The conflation has one more place to hide: alternative text.
   *
   * the-framework.tsx's cards used to be keyed `title` (the biotic) and
   * `subtitle` (the action), and the image read `alt={biotic.title}`. Flipping
   * the card to lead with the action could have been a one-line swap of those
   * two values — and it would have left a photograph of garlic, onions, oats
   * and bananas described to a screen reader as "Feed". A verb is not a
   * description of food, and nothing else in the gate would notice: axe checks
   * that alt text EXISTS, not that it is true.
   *
   * Parsed rather than grepped. The question is which expression that specific
   * attribute is bound to, and reading it off the syntax tree answers exactly
   * that — a substring search would be satisfied by the word appearing anywhere
   * in the file.
   */
  it("describes the framework images by the food, never by the verb", async () => {
    const ts = await import("typescript")
    const f = "components/home/the-framework.tsx"
    const src = ts.createSourceFile(f, readFileSync(f, "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)

    const alts: string[] = []
    const walk = (node: import("typescript").Node) => {
      const opening = ts.isJsxSelfClosingElement(node)
        ? node
        : ts.isJsxElement(node)
          ? node.openingElement
          : undefined
      if (opening && opening.tagName.getText() === "Image") {
        const alt = opening.attributes.properties.find(
          (a) => ts.isJsxAttribute(a) && a.name.getText() === "alt",
        )
        expect(alt, `every <Image> in ${f} must carry alt text`).toBeDefined()
        alts.push((alt as import("typescript").JsxAttribute).initializer!.getText())
      }
      node.forEachChild(walk)
    }
    walk(src)

    // Non-vacuity: an empty walk would pass every assertion below.
    expect(alts.length, `${f} must contain at least one <Image>`).toBeGreaterThan(0)

    // Only the card images are driven by the card data. The plate image below
    // them carries a written description, which is correct and not this rule's
    // business — scoping by `biotic.` rather than asserting over every <Image>
    // is what keeps this a rule about the conflation and not about alt text in
    // general.
    // One element, not three: the cards come from a .map(), so the three
    // rendered images share a single <Image> in the source.
    const cardAlts = alts.filter((a) => a.includes("biotic."))
    expect(cardAlts.length, `${f} must render a data-driven card image`).toBe(1)
    for (const alt of cardAlts) {
      expect(alt, `alt must name the biotic, not the action (got ${alt})`).toContain("science")
      expect(alt, `alt must not be bound to the action (got ${alt})`).not.toContain("action")
    }
  })
})
