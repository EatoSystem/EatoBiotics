/**
 * Product → output → framework, and person → meal, on the surfaces that show
 * a score.
 *
 *     Food System Assessment  is the PRODUCT
 *       → Biotics Score™       is its OUTPUT
 *         → Prebiotics · Probiotics · Postbiotics  is how it is UNDERSTOOD
 *     Meal Biotics Score      is one MEAL
 *     Feed · Seed · Regenerate is what a person DOES
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

  it("keeps the action section from equating Regenerate with Postbiotics", () => {
    const f = "components/home/feed-seed-heal.tsx"
    const copy = read(f)
    // It may say the actions are inspired by / founded on the science — the
    // relationship is real. What it must not do is print the science word alone
    // under the action title, which reads as a rename.
    expect(copy, "the actions must be related to the science, not equated with it").toMatch(
      /inspired by/i,
    )
    expect(copy).not.toMatch(/\bRegenerate\s*(=|:)\s*Postbiotics\b/i)
  })
})
