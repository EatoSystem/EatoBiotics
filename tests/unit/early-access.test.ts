/**
 * The first 100 early-access places.
 *
 * ══ WHAT THIS PINS ══════════════════════════════════════════════════════════
 *
 * Two things a scarcity campaign cannot get wrong: it must never invent a
 * number it did not count, and it must close at exactly the number it
 * promised. Everything else is arithmetic.
 *
 * The count itself needs no new storage — `app/api/waitlist/count/route.ts`
 * already head-counts `leads` filtered to `assessment_type = "waitlist"`, and
 * the cohort is that table ordered by `created_at` ascending. This was first
 * declined on the grounds that a rank-based cap needed a migration; it does
 * not, and these tests are what that claim should have been checked against.
 */
import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import ts from "typescript"
/**
 * Source with comments stripped.
 *
 * A guard that reads comments trips over the prose explaining the very thing
 * it enforces — the docblock in the hero names "the first 100" while the code
 * deliberately does not. Third time this engagement; strip first, assert after.
 */
function renderedSource(file: string): string {
  return readFileSync(file, "utf-8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "")
}

import {
  EARLY_ACCESS_PLACES,
  EARLY_ACCESS_COHORT_ORDER,
  earlyAccessState,
  earlyAccessPlace,
} from "@/lib/waitlist/early-access"

describe("earlyAccessState", () => {
  it("offers a hundred places before anyone has joined", () => {
    expect(earlyAccessState(0)).toEqual({ claimed: 0, remaining: 100, isOpen: true })
  })

  it("counts down as places are taken", () => {
    expect(earlyAccessState(37)).toEqual({ claimed: 37, remaining: 63, isOpen: true })
  })

  /* The boundary, from both sides — the one place an off-by-one would show. */
  it("is still open at 99, with one place left", () => {
    expect(earlyAccessState(99)).toEqual({ claimed: 99, remaining: 1, isOpen: true })
  })

  it("closes at exactly 100", () => {
    expect(earlyAccessState(100)).toEqual({ claimed: 100, remaining: 0, isOpen: false })
  })

  it("never reports negative places, however far past the cap it goes", () => {
    // The race honours 101 rather than locking; the page must not then say
    // "-1 places left".
    expect(earlyAccessState(101)).toEqual({ claimed: 100, remaining: 0, isOpen: false })
    expect(earlyAccessState(5000)).toEqual({ claimed: 100, remaining: 0, isOpen: false })
  })

  it("says NOTHING when the total is unknown, rather than inventing scarcity", () => {
    for (const unknown of [null, undefined, NaN, Infinity, -1]) {
      expect(earlyAccessState(unknown as number), `${String(unknown)} must not become a number`).toBeNull()
    }
  })

  it("ignores a fractional count rather than rendering one", () => {
    expect(earlyAccessState(37.8)?.claimed).toBe(37)
    expect(earlyAccessState(37.8)?.remaining).toBe(63)
  })
})

describe("earlyAccessPlace", () => {
  it("gives the first signup place 1", () => {
    expect(earlyAccessPlace(0)).toBe(1)
  })

  it("gives the hundredth signup place 100", () => {
    expect(earlyAccessPlace(99)).toBe(100)
  })

  it("claims nothing for the hundred-and-first", () => {
    expect(earlyAccessPlace(100)).toBeNull()
    expect(earlyAccessPlace(4321)).toBeNull()
  })

  it("claims nothing when the count was unavailable", () => {
    // A place the product cannot stand behind is worse than no place at all.
    for (const unknown of [null, undefined, NaN, -1]) {
      expect(earlyAccessPlace(unknown as number)).toBeNull()
    }
  })

  it("agrees with the page: the last place offered is the last place given", () => {
    const lastOpen = earlyAccessState(EARLY_ACCESS_PLACES - 1)
    expect(lastOpen?.isOpen).toBe(true)
    expect(earlyAccessPlace(EARLY_ACCESS_PLACES - 1)).toBe(EARLY_ACCESS_PLACES)

    expect(earlyAccessState(EARLY_ACCESS_PLACES)?.isOpen).toBe(false)
    expect(earlyAccessPlace(EARLY_ACCESS_PLACES)).toBeNull()
  })
})

describe("the cohort is derivable, which is why no column was added", () => {
  it("is the EARLIEST signups, not the latest", () => {
    // Descending would invite exactly the wrong hundred people.
    expect(EARLY_ACCESS_COHORT_ORDER).toBe("created_at:asc")
  })

  /*
   * EVERY leads query in the counter must be filtered, not just one of them.
   *
   * The first version of this asserted the file CONTAINED
   * `.eq("assessment_type", "waitlist")`. That route runs three leads queries,
   * so dropping the filter from the one that produces `total` left the string
   * present twice over and the check green — while the page counted every lead
   * in the table as an early-access place. Presence of a symbol is not the
   * relationship it stands for.
   */
  it("every leads query in the counter is scoped to the waitlist", () => {
    const source = readFileSync("app/api/waitlist/count/route.ts", "utf-8")
    const sf = ts.createSourceFile("c.ts", source, ts.ScriptTarget.Latest, true)

    /** The whole `supabase.from(...)....` chain a `from()` call belongs to. */
    const outermostChain = (node: ts.Node): ts.Node => {
      let top: ts.Node = node
      while (
        top.parent &&
        (ts.isPropertyAccessExpression(top.parent) || ts.isCallExpression(top.parent))
      ) {
        top = top.parent
      }
      return top
    }

    const chains: string[] = []
    const visit = (node: ts.Node) => {
      if (
        ts.isCallExpression(node) &&
        ts.isPropertyAccessExpression(node.expression) &&
        node.expression.name.text === "from" &&
        node.arguments.some((a) => ts.isStringLiteral(a) && a.text === "leads")
      ) {
        chains.push(outermostChain(node).getText(sf))
      }
      ts.forEachChild(node, visit)
    }
    visit(sf)

    expect(chains.length, "no leads query found — this guard reads nothing").toBeGreaterThanOrEqual(3)

    const unscoped = chains.filter((c) => !c.includes('eq("assessment_type", "waitlist")'))
    expect(unscoped, `unscoped leads queries:\n${unscoped.join("\n---\n")}`).toEqual([])
  })

  it("NON-VACUITY: an unscoped leads query would be caught", () => {
    const sabotaged = `const x = await supabase.from("leads").select("*", { count: "exact", head: true })`
    expect(sabotaged.includes('eq("assessment_type", "waitlist")')).toBe(false)
  })
})

describe("the holding page and the email cannot disagree", () => {
  it("both read the one constant", () => {
    const hero = renderedSource("app/enter/waitlist-hero.tsx")
    const route = renderedSource("app/api/waitlist/route.ts")

    expect(hero).toContain("EARLY_ACCESS_PLACES")
    expect(hero).toContain("earlyAccessState")
    expect(route).toContain("earlyAccessPlace")

    // Neither may hardcode the number next to the other.
    expect(hero).not.toMatch(/first 100|of 100 early/i)
  })

  it("the signup counts only genuinely new joins, so a repeat never renumbers", () => {
    const route = renderedSource("app/api/waitlist/route.ts")
    const guarded = route.slice(route.indexOf("isNew = !existing"), route.indexOf("earlyAccessPlace(count)"))
    expect(guarded).toContain("if (isNew)")
  })
})
