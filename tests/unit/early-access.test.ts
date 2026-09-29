/**
 * Staged access: the First 100, then the First Course.
 *
 * ══ WHAT THIS PINS ══════════════════════════════════════════════════════════
 *
 * Three things a cohort campaign cannot get wrong: it must never invent a
 * number it did not count, it must close each rung at exactly the number it
 * promised, and it must not open a later rung before an earlier one is full.
 * Everything else is arithmetic.
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
  COHORTS,
  EARLY_ACCESS_PLACES,
  EARLY_ACCESS_COHORT_ORDER,
  FIRST_COURSE_MEMBERS,
  cohortLadderIsAscending,
  cohortLineText,
  cohortNameInSentence,
  joinCtaLabel,
  openCohort,
  earlyAccessPlace,
} from "@/lib/waitlist/early-access"
import {
  progressCue,
  resultForAnswers,
  SECONDS_PER_QUESTION,
} from "@/components/waitlist/food-system-experience"
import { QUICK_QUESTIONS, computeQuickResult } from "@/lib/quick-assessment"
import { buildWaitlistJoinBody } from "@/lib/waitlist/join"
import { waitlistConfirmationEmail } from "@/lib/email/waitlist-email"

describe("the cohort ladder", () => {
  it("is ascending, so a later rung cannot open before an earlier one fills", () => {
    expect(cohortLadderIsAscending()).toBe(true)
    // And the check is capable of saying no.
    expect(cohortLadderIsAscending([
      { id: "a", name: "A", through: 1000 },
      { id: "b", name: "B", through: 100 },
    ])).toBe(false)
  })

  it("keeps one number for the first cohort, derived rather than retyped", () => {
    expect(EARLY_ACCESS_PLACES).toBe(COHORTS[0].through)
    expect(FIRST_COURSE_MEMBERS).toBe(COHORTS[COHORTS.length - 1].through)
  })

  it("is cumulative — the First Course INCLUDES the first hundred", () => {
    // If `through` were per-cohort, 1000 would mean 1100 founding members.
    expect(FIRST_COURSE_MEMBERS).toBeGreaterThan(EARLY_ACCESS_PLACES)
  })
})

describe("the join label reads as a sentence", () => {
  it("lowers the article without touching the title", () => {
    expect(cohortNameInSentence(COHORTS[0])).toBe("the First 100")
    expect(COHORTS[0].name, "the title itself is untouched").toBe("The First 100")
  })

  it("names the open cohort, and falls back honestly when there is none", () => {
    expect(joinCtaLabel(openCohort(1))).toBe("Join the First 100")
    expect(joinCtaLabel(openCohort(500))).toBe("Join the First Course")
    // Full, and unknown, both become the plain waitlist ask — neither may
    // invite someone into a cohort that is not open.
    expect(joinCtaLabel(openCohort(5000))).toBe("Join the waitlist")
    expect(joinCtaLabel(null)).toBe("Join the waitlist")
  })
})

describe("openCohort", () => {
  it("opens the first cohort before anyone has joined", () => {
    const s = openCohort(0)
    expect(s?.cohort.id).toBe("first-100")
    expect(s?.remaining).toBe(100)
    expect(s?.capacity).toBe(100)
    expect(s?.isOpen).toBe(true)
    expect(s?.isFinal).toBe(false)
  })

  it("counts down inside the first cohort", () => {
    expect(openCohort(1)?.remaining).toBe(99)
    expect(openCohort(37)?.remaining).toBe(63)
    expect(openCohort(37)?.claimed).toBe(37)
  })

  it("holds the first cohort open at 99 and closes it at exactly 100", () => {
    expect(openCohort(99)?.cohort.id).toBe("first-100")
    expect(openCohort(99)?.remaining).toBe(1)
    expect(openCohort(99)?.isOpen).toBe(true)

    // The boundary: signup 100 fills it, and the NEXT rung opens.
    expect(openCohort(100)?.cohort.id).toBe("first-course")
    expect(openCohort(100)?.isOpen).toBe(true)
  })

  it("measures the second cohort by its own capacity, not the cumulative total", () => {
    const s = openCohort(100)
    expect(s?.capacity, "900 places of its own, not 1000").toBe(900)
    expect(s?.claimed).toBe(0)
    expect(s?.remaining, "900 left to reach a thousand members").toBe(900)
    expect(s?.isFinal).toBe(true)

    const later = openCohort(637)
    expect(later?.claimed).toBe(537)
    expect(later?.remaining).toBe(363)
  })

  it("closes the ladder at the final rung and stays closed", () => {
    for (const total of [1000, 1001, 50_000]) {
      const s = openCohort(total)
      expect(s?.cohort.id, `${total} must rest on the last rung`).toBe("first-course")
      expect(s?.isOpen).toBe(false)
      expect(s?.remaining, "never negative").toBe(0)
    }
  })

  it("says NOTHING rather than inventing a number when the count is unknown", () => {
    for (const unknown of [null, undefined, NaN, Infinity, -1, "40", {}]) {
      expect(openCohort(unknown as number), `${String(unknown)} must not become a number`).toBeNull()
    }
  })

  it("full and unknown are different states, and must not render the same", () => {
    // Full returns a cohort with isOpen false; unknown returns null. A page
    // that collapsed these would go silent at the moment it should say "full".
    expect(openCohort(5000)).not.toBeNull()
    expect(openCohort(null)).toBeNull()
  })

  it("floors a fractional count rather than rounding up into a place", () => {
    expect(openCohort(37.8)?.claimed).toBe(37)
    expect(openCohort(37.8)?.remaining).toBe(63)
  })
})

describe("earlyAccessPlace", () => {
  it("numbers the first signup #1 of the First 100", () => {
    const p = earlyAccessPlace(0)
    expect(p?.place).toBe(1)
    expect(p?.cohort.id).toBe("first-100")
  })

  it("numbers across the whole programme, not within the cohort", () => {
    // The email said "of the first 100" as a literal, so member 137 was told
    // they were one of the first hundred. The place is now absolute and
    // carries the cohort it belongs to.
    const p = earlyAccessPlace(136)
    expect(p?.place).toBe(137)
    expect(p?.cohort.name).toBe("The First Course")
  })

  it("puts the hundredth signup inside the first cohort and the next outside", () => {
    expect(earlyAccessPlace(99)?.cohort.id).toBe("first-100")
    expect(earlyAccessPlace(100)?.cohort.id).toBe("first-course")
  })

  it("claims nothing past the final rung, or when the count was unavailable", () => {
    expect(earlyAccessPlace(1000)).toBeNull()
    expect(earlyAccessPlace(4321)).toBeNull()
    for (const unknown of [null, undefined, NaN, -1, "7"]) {
      expect(earlyAccessPlace(unknown as number)).toBeNull()
    }
  })

  it("agrees with openCohort at every boundary", () => {
    for (const c of COHORTS) {
      expect(openCohort(c.through - 1)?.isOpen, `${c.name} open at its last place`).toBe(true)
      expect(earlyAccessPlace(c.through - 1)?.cohort.id).toBe(c.id)
    }
    expect(openCohort(FIRST_COURSE_MEMBERS)?.isOpen).toBe(false)
    expect(earlyAccessPlace(FIRST_COURSE_MEMBERS)).toBeNull()
  })
})

describe("a ladder that is not a ladder is refused, not guessed at", () => {
  /*
   * openCohort takes the ladder as a parameter for exactly this test. Without
   * it the ascending check was unreachable — the shipped COHORTS are ascending
   * — so deleting the check changed nothing any test could see, and a sabotage
   * case walked through it. An unreachable guard is not a guard.
   */
  it("returns null rather than opening a later rung before an earlier one", () => {
    const backwards = [
      { id: "b", name: "B", through: 1000 },
      { id: "a", name: "A", through: 100 },
    ]
    expect(openCohort(50, backwards)).toBeNull()
    expect(openCohort(0, [])).toBeNull()
  })

  it("still works on a well-formed ladder of a different shape", () => {
    const three = [
      { id: "x", name: "X", through: 10 },
      { id: "y", name: "Y", through: 50 },
      { id: "z", name: "Z", through: 100 },
    ]
    const s = openCohort(12, three)
    expect(s?.cohort.id).toBe("y")
    expect(s?.capacity).toBe(40)
    expect(s?.claimed).toBe(2)
    expect(s?.remaining).toBe(38)
  })
})

describe("the status line says nothing it has not counted", () => {
  it("is null when there is no count, and a sentence when there is", () => {
    expect(cohortLineText(null)).toBeNull()
    expect(cohortLineText(openCohort(1))).toBe("99 of 100 places remaining")
    expect(cohortLineText(openCohort(250))).toBe("750 of 900 places remaining")
    expect(cohortLineText(openCohort(5000))).toContain("places are taken")
  })
})

describe("the score belongs to a finished run", () => {
  const complete = Object.fromEntries(QUICK_QUESTIONS.map((q) => [q.id, 2]))

  it("computes nothing until every question is answered", () => {
    expect(resultForAnswers({})).toBeNull()
    for (let n = 1; n < QUICK_QUESTIONS.length; n++) {
      const partial = Object.fromEntries(QUICK_QUESTIONS.slice(0, n).map((q) => [q.id, 2]))
      expect(resultForAnswers(partial), `${n} of 5 answered must not produce a score`).toBeNull()
    }
    expect(resultForAnswers(complete)).not.toBeNull()
  })

  /*
   * The whole point of this rebuild being presentation-only: the same answers
   * must produce exactly what lib/quick-assessment.ts produces.
   *
   * `completedAt` is excluded, and deliberately rather than lazily.
   * computeQuickResult stamps Date.now() into its output, so it is not a pure
   * function of its input and two calls are equal only if they land in the
   * same millisecond. Written as a whole-object toEqual, this passed alone and
   * failed inside the full suite — a flake, and one that would have read as a
   * scoring regression to whoever hit it next. Everything the customer sees is
   * still compared exactly; only the clock is set aside.
   */
  it("is the real engine's number, untouched by the presentation layer", () => {
    const mine = resultForAnswers(complete)
    const engine = computeQuickResult(complete)

    expect(mine).not.toBeNull()
    const { completedAt: _a, ...minePersistent } = mine!
    const { completedAt: _b, ...enginePersistent } = engine
    expect(minePersistent).toEqual(enginePersistent)

    expect(mine?.overall).toBe(67)
    expect(typeof mine?.completedAt, "the timestamp is still produced").toBe("number")
  })
})

describe("the sixty seconds is arithmetic, not a slogan", () => {
  it("the estimate and the headline come from the same number", () => {
    expect(QUICK_QUESTIONS.length * SECONDS_PER_QUESTION).toBe(60)
  })

  it("counts down, then stops claiming precision it cannot have", () => {
    expect(progressCue(0, 5)).toBe("~60 seconds left")
    expect(progressCue(1, 5)).toBe("~50 seconds left")
    expect(progressCue(3, 5)).toBe("~25 seconds left")
    // The last question is qualitative — nobody's remaining time is knowable
    // to the second, and "~12 seconds left" asserts that it is.
    expect(progressCue(4, 5)).toBe("Almost there")
    expect(progressCue(5, 5)).toBe("Almost there")
    expect(progressCue(9, 5), "never negative").toBe("Almost there")
  })
})

describe("the confirmation email names the cohort it actually means", () => {
  /*
   * This line read "#${place} of the first 100" as a literal, so member #400
   * would have been told they were one of the first hundred. The ladder made
   * that wrong; nothing was testing it, so nothing said so.
   */
  it("says the First 100 inside the first hundred", () => {
    const { html } = waitlistConfirmationEmail("a@b.c", earlyAccessPlace(36))
    expect(html).toContain("#37 of The First 100")
  })

  it("says the First Course beyond it, not the first hundred", () => {
    const { html } = waitlistConfirmationEmail("a@b.c", earlyAccessPlace(136))
    expect(html).toContain("#137 of The First Course")
    expect(html, "must not still claim the first hundred").not.toContain("of the first 100")
  })

  it("claims no place at all when there is none to claim", () => {
    const { html } = waitlistConfirmationEmail("a@b.c", earlyAccessPlace(5000))
    expect(html).not.toMatch(/#\d+ of/)
    // The welcome still sends — a missing place is not a missing email.
    expect(html).toContain("Thank you for joining the waitlist")
  })
})

describe("one description of the join request", () => {
  it("flattens UTM onto the body, which is the shape the route reads", () => {
    const body = buildWaitlistJoinBody({
      email: "a@b.c",
      utm: { utm_source: "x", utm_campaign: "y" },
      result: { overall: 1 } as never,
      healthDataConsent: true,
    })
    expect(body.utm_source).toBe("x")
    expect(body.utm_campaign).toBe("y")
    expect(body.utm, "utm must not survive as a nested object").toBeUndefined()
    expect(body.email).toBe("a@b.c")
    expect(body.healthDataConsent).toBe(true)
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
    const line = renderedSource("components/waitlist/cohort-line.tsx")
    const section = renderedSource("components/waitlist/first-course.tsx")
    const route = renderedSource("app/api/waitlist/route.ts")

    // Every surface that names a number reads it from the ladder.
    expect(line).toContain("CohortState")
    expect(section).toContain("COHORTS")
    expect(route).toContain("earlyAccessPlace")

    // None of them may retype the numbers beside the module that owns them.
    for (const [name, src] of [["cohort-line", line], ["first-course", section]] as const) {
      expect(src, `${name} must not hardcode a cohort size`).not.toMatch(/\b100\b|\b1,?000\b/)
    }
  })

  it("the signup counts only genuinely new joins, so a repeat never renumbers", () => {
    const route = renderedSource("app/api/waitlist/route.ts")
    const guarded = route.slice(route.indexOf("isNew = !existing"), route.indexOf("earlyAccessPlace(count)"))
    expect(guarded).toContain("if (isNew)")
  })
})
