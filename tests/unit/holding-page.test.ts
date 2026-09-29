/**
 * The holding page makes one promise, and it is one the product can keep.
 *
 * ══ WHAT WENT WRONG ═════════════════════════════════════════════════════════
 *
 * `/waitlist` was served in V1 and sold: "Be first in line for the EatoBiotics
 * book, app, and course. One subscription — three launches", "Pre-order price
 * locked in", "Founding member pricing", "Waitlist-only early bird pricing".
 *
 * V1 sells the free Food System Assessment, the €49 Personal Food System
 * Consultation and EatoBiotics Member. No book, no app, no course, no
 * pre-order. Every commercial promise on that page was one the product could
 * not keep — and NO TEST READ THE FILE. It was absent from
 * `tests/unit/customer-surfaces.ts`, which exists precisely because "Phase 1's
 * guards were green while real live surfaces carried a competing product
 * model, for one reason: those files were never in any guard's corpus."
 *
 * ══ WHY THIS IS ONE CHANGE IN SEVERAL FILES ═════════════════════════════════
 *
 * Refusing the route alone would have left a dead "See what's coming — Book,
 * App & Course" link on `/enter`, the only page a gated visitor can see, plus
 * four more on the book pages. Removing the links alone would have left the
 * retired offer reachable by URL. Leaving it in the gate allowlist would let a
 * visitor reach the 404 more directly.
 *
 * So the pieces are pinned together here: no one of them can be restored
 * without the others failing.
 */
import { describe, it, expect } from "vitest"
import { readFileSync, existsSync } from "node:fs"
import { classifyPageRoute, isServableInV1 } from "@/lib/v1-surface"
import { MARKETING_SURFACES } from "./customer-surfaces"
import { foundingAccessDeadline } from "@/lib/waitlist/founding-access"

/** Everything that made the retired offer, in the words it used. */
const RETIRED_OFFER = [
  "book, app, and course",
  "three launches",
  "Pre-order price locked in",
  "early bird pricing",
  "Book, App & Course",
  "See all three launches",
  "See all launches",
]

/**
 * Source with comments stripped.
 *
 * A guard that reads comments fails on the prose explaining the very thing it
 * is enforcing — which is how a Step 6 check tripped over the note describing
 * the literal it had just removed. The docblock below this line names "the €49
 * Consultation"; the copy check must not see it.
 */
function renderedSource(file: string): string {
  return readFileSync(file, "utf-8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "")
}

describe("the retired waitlist offer is not reachable", () => {
  it("/waitlist is refused, and deliberately classified rather than merely unlisted", () => {
    expect(classifyPageRoute("/waitlist")).toBe("POST_V1")
    expect(isServableInV1("/waitlist")).toBe(false)
  })

  it("the password gate no longer waves it through", () => {
    const proxy = readFileSync("proxy.ts", "utf-8")
    const allowlist = proxy.slice(
      proxy.indexOf("function isEnterRoute"),
      proxy.indexOf("function isEnterRoute") + 1200,
    )
    expect(allowlist).toContain('pathname === "/enter"')
    expect(allowlist).not.toContain('pathname === "/waitlist"')
  })

  it("the holding page still lets a visitor in, and still opts them out", () => {
    // The refusal must not take the gate's own doors with it.
    for (const route of ["/enter", "/preview-access", "/unsubscribe", "/auth/callback"]) {
      expect(isServableInV1(route), `${route} must stay reachable`).toBe(true)
    }
  })
})

describe("no served page still advertises it", () => {
  /**
   * Every page that survives V1, as source.
   *
   * The three waitlist components are here because app/enter/waitlist-hero.tsx
   * is now a four-line wrapper. Reading only the wrapper would have kept these
   * checks green over a holding page that had gone back to advertising a book,
   * an app and a course — the guard passing because there was nothing left in
   * the file it was pointed at.
   */
  const SERVED_SOURCES = [
    "app/enter/page.tsx",
    "app/enter/waitlist-hero.tsx",
    "components/waitlist/food-system-experience.tsx",
    "components/waitlist/cohort-line.tsx",
    "components/waitlist/first-course.tsx",
    "app/book/page.tsx",
    "app/books/page.tsx",
    "app/book-family/page.tsx",
    "app/book-mind/page.tsx",
  ]

  it.each(SERVED_SOURCES)("%s links nowhere near /waitlist", (file) => {
    expect(existsSync(file), `${file} moved — this guard is reading nothing`).toBe(true)
    expect(readFileSync(file, "utf-8")).not.toContain('href="/waitlist"')
  })

  it.each([
    "app/enter/page.tsx",
    "app/enter/waitlist-hero.tsx",
    "components/waitlist/food-system-experience.tsx",
    "components/waitlist/cohort-line.tsx",
    "components/waitlist/first-course.tsx",
  ])(
    "%s does not carry the retired offer's words",
    (file) => {
      const source = renderedSource(file)
      const found = RETIRED_OFFER.filter((phrase) => source.includes(phrase))
      expect(found, `${file} still says: ${found.join(", ")}`).toEqual([])
    },
  )

  /*
   * RECORDED, NOT FIXED — /book, /book-mind and /book-family still offer
   * "Pre-order price locked in — Pay less than launch day pricing" as a perk.
   * The book is a real forthcoming thing, but there is no pre-order in V1 and
   * no mechanism behind that price promise.
   *
   * It is left alone on purpose: rewriting the founder's book marketing is a
   * product decision, not a scope-reduction one, and Step 7B's remit was the
   * holding page. Pinned here so the claim cannot spread to a fourth page
   * unnoticed while the decision is pending.
   */
  it("RECORDED: the book pages' pre-order price claim is unchanged and contained", () => {
    const pages = ["app/book/page.tsx", "app/book-mind/page.tsx", "app/book-family/page.tsx"]
    const carrying = pages.filter((f) => renderedSource(f).includes("Pre-order price locked in"))
    expect(carrying.sort()).toEqual(pages.sort())

    // And nowhere else.
    expect(renderedSource("app/books/page.tsx")).not.toContain("Pre-order price locked in")
    expect(renderedSource("app/enter/waitlist-hero.tsx")).not.toContain("Pre-order price locked in")
  })

  it("NON-VACUITY: the phrase list would catch the copy that was there", () => {
    const asItWas = `<Link href="/waitlist">See what's coming — Book, App & Course</Link>`
    expect(RETIRED_OFFER.some((p) => asItWas.includes(p))).toBe(true)
    expect(asItWas).toContain('href="/waitlist"')
  })
})

describe("the holding page is inside the guard corpus", () => {
  it("is read by the vocabulary guards, which is the half that stops a repeat", () => {
    // Being refused fixes today. Being guarded is what makes the next piece of
    // copy on this page answer to the same rules as every other surface.
    expect(MARKETING_SURFACES).toContain("app/enter/page.tsx")
    expect(MARKETING_SURFACES).toContain("app/enter/waitlist-hero.tsx")
    // The page wrapper being guarded is not the same as its copy being guarded.
    // app/enter/page.tsx mostly renders sections defined elsewhere, and the
    // framework cards — the largest block of product copy on the page — sat
    // outside every guard until this was added. Asserting membership here is
    // what makes the removal visible: dropping the file from the corpus simply
    // scans one file fewer, so no other guard can notice it going.
    expect(MARKETING_SURFACES).toContain("components/home/the-framework.tsx")
  })
})

/*
 * ══ THIS BLOCK FOLLOWED ITS SUBJECT, TWICE OVER ═════════════════════════════
 *
 * It read app/enter/waitlist-hero.tsx, which used to hold every word on the
 * top of the holding page. That file is now a four-line wrapper: the copy
 * lives in the experience, the cohort line and the First Course section. Left
 * pointed at the wrapper, these checks would have gone on passing over a file
 * with no copy in it — green because there was nothing left to fail.
 *
 * The "no rank" clause is also GONE ON PURPOSE, not lost in the move. It was
 * written when early access was framed by a DATE and a rank was the thing
 * being avoided, because there was no counter to stand behind one. There is a
 * counter now, the cohort is real and deliberate, and naming it is the point.
 * What must still never appear is a price or a discount.
 */
describe("early access promises access, not a discount", () => {
  const COPY_SURFACES = [
    "components/waitlist/food-system-experience.tsx",
    "components/waitlist/cohort-line.tsx",
    "components/waitlist/first-course.tsx",
  ]

  it("names no price and no discount, anywhere it speaks", () => {
    // "%" alone is not a claim — it is a CSS unit, and these files use it for
    // widths. The check looks for discount-SHAPED copy instead.
    for (const file of COPY_SURFACES) {
      const source = renderedSource(file)
      for (const claim of ["€", "% off", "discount", "half price", "free trial"]) {
        expect(source, `${file} must not claim "${claim}"`).not.toContain(claim)
      }
    }
  })

  it("applies no pressure the product has not counted", () => {
    // The cohort is real. Everything in this list is theatre, and the brief
    // ruled all of it out explicitly.
    for (const file of COPY_SURFACES) {
      const source = renderedSource(file)
      for (const trick of ["HURRY", "Hurry", "countdown", "people viewing", "Only ", "act now", "Act now"]) {
        expect(source, `${file} must not use "${trick}"`).not.toContain(trick)
      }
    }
  })

  /*
   * Behavioural, not structural. The first version of this asserted that the
   * source mentioned the env var and contained a ternary — which a mutation
   * setting the flag permanently true sailed straight through, because the
   * symbols were all still there. Presence of a symbol is not the behaviour it
   * is supposed to produce; that is the defect class this engagement keeps
   * finding, and it found it here too.
   */
  it("names no deadline unless one is configured and still ahead", () => {
    const FUTURE = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

    expect(foundingAccessDeadline(undefined), "unset → no promise").toBeNull()
    expect(foundingAccessDeadline(""), "empty → no promise").toBeNull()
    expect(foundingAccessDeadline("not-a-date"), "unreadable → no promise").toBeNull()
    expect(
      foundingAccessDeadline("2020-01-01T00:00:00.000Z"),
      "already passed → no promise",
    ).toBeNull()

    expect(foundingAccessDeadline(FUTURE)).toBeTruthy()
  })

  it("states the configured date when there is one", () => {
    const deadline = foundingAccessDeadline("2026-12-01T00:00:00.000Z", Date.UTC(2026, 9, 1))
    expect(deadline).toContain("2026")
    expect(deadline).toContain("December")
  })

  /*
   * renderedSource, not readFileSync — and this is the THIRD time in this
   * engagement that a guard matched the comment explaining the thing it was
   * supposed to be checking. Deleting the sentence that names the free product
   * left the guard green, because the docblock above it also says "Food System
   * Assessment". Developer notes are not customer copy.
   */
  it("uses the current product vocabulary", () => {
    const source = COPY_SURFACES.map((f) => renderedSource(f)).join("\n")
    expect(source).toContain("Food System Assessment")
    expect(source).toContain("Biotics Score")
  })

  /*
   * The free product is named where the PROMISE is, not merely somewhere.
   *
   * "Food System Assessment" appears in two places: the claim step, where
   * someone is deciding to hand over an email, and the First Course section,
   * which is the page's actual explanation of what joining gets you. Because
   * it is in two places, deleting either one leaves the joined-source check
   * above green — which is how a sabotage case that removed it from the
   * experience walked through. Naming the file makes the important one
   * load-bearing rather than incidental.
   */
  it("names the free product in the section that explains joining", () => {
    expect(renderedSource("components/waitlist/first-course.tsx")).toContain(
      "Food System Assessment",
    )
  })

  /*
   * The five-question score is never presented as the full product.
   *
   * The free Food System Assessment is fifteen questions and is what produces
   * a person's Biotics Score™. This flow is five, and it must therefore always
   * say "first". Without this the product ends up with one name for two
   * different numbers, and nothing else in the suite would notice.
   */
  it("calls the five-question result a FIRST Biotics Score, never the full one", () => {
    const source = renderedSource("components/waitlist/food-system-experience.tsx")

    const scoreMentions = source.match(/[A-Za-z’'\s]{0,24}Biotics(?:&nbsp;| )Score/g) ?? []
    expect(scoreMentions.length, "no Biotics Score mention found — this reads nothing").toBeGreaterThan(0)

    const unqualified = scoreMentions.filter((m) => !/first/i.test(m))
    expect(
      unqualified,
      `every reveal-facing mention must be qualified:\n${unqualified.join("\n")}`,
    ).toEqual([])
  })

  it("NON-VACUITY: an unqualified score claim would be caught", () => {
    const sabotaged = "Your Biotics Score"
    const found = (sabotaged.match(/[A-Za-z’'\s]{0,24}Biotics(?:&nbsp;| )Score/g) ?? [])
      .filter((m) => !/first/i.test(m))
    expect(found.length).toBe(1)
  })
})
