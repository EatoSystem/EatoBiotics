/**
 * The €49 offer must describe the report that exists.
 *
 * Six surfaces sold the report and each carried its own hand-written feature
 * list. Every one of them promised "Top 10 food recommendations" against a
 * generator that produces FIVE, a "weekly shopping framework" that has no field
 * in the schema and no section in either renderer, and two of them an
 * "avoid/reduce list" that nothing produces at all. The buyer paid, received a
 * report, and could count the difference.
 *
 * That is a worse failure than the €19 CTA removed in #245 or the €50/€75/€100
 * CTAs removed in #248: those advertised products that could not be bought, so
 * the mistake was visible before any money moved. This one was only visible
 * after.
 *
 * ── What this guard checks, and why in this shape ────────────────────────────
 *
 * The count is DERIVED from the generator prompt rather than asserted against a
 * hardcoded 5. A guard that says "the copy must say five" and a prompt that says
 * five are two independent statements of the same fact, and two statements of
 * one fact is the drift this whole file exists to stop — raise the prompt to ten
 * and a hardcoded guard passes while the copy goes wrong in the other direction.
 * Same principle as the schema-drift guard reading production and the processor
 * guard reading the imports.
 *
 * The dead-phrase scan is deliberately wider than the six known files, because
 * the six known files are the ones I found. A seventh is exactly what a guard is
 * for.
 */
import { describe, it, expect } from "vitest"
import { readFileSync, readdirSync, statSync } from "node:fs"
import { join } from "node:path"
import { copyOf } from "./helpers/marketing-language"
import {
  REPORT_FOOD_COUNT,
  REPORT_FOOD_COUNT_WORD,
  REPORT_OFFER_FEATURES,
  REPORT_OFFER_SENTENCE,
  REPORT_PRICE_EUR,
} from "@/lib/report/offer"

const GENERATOR = readFileSync("app/api/submit-deep-assessment/route.ts", "utf8")

/**
 * How many foods the FULL-tier prompt asks the model for.
 *
 * The `personal` tier — the only one on sale — is mapped to `full` at the top of
 * buildPrompt (`const effectiveTier = tier === "personal" ? "full" : tier`), so
 * the full block is the one that describes what a €49 buyer receives. Sliced
 * from that branch rather than the whole file, because starter and premium
 * carry their own food lists and counting across all three would produce a
 * number that is nobody's report.
 */
function promptFoodCount(): number {
  const branch = GENERATOR.indexOf('effectiveTier === "full"')
  expect(branch, "the full-tier branch has moved or been renamed").toBeGreaterThan(-1)
  const line = GENERATOR.slice(branch).match(/"specificFoodList": \[[\s\S]*?\],\n/)?.[0]
  expect(line, "no specificFoodList literal after the full-tier branch").toBeTruthy()
  return [...line!.matchAll(/\{"food":/g)].length
}

/** Every .ts/.tsx file under the app's own source roots. */
function sourceFiles(): string[] {
  const out: string[] = []
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir)) {
      if (entry === "node_modules" || entry.startsWith(".")) continue
      const full = join(dir, entry)
      if (statSync(full).isDirectory()) walk(full)
      else if (/\.(ts|tsx)$/.test(entry)) out.push(full)
    }
  }
  for (const root of ["app", "components", "lib"]) walk(root)
  return out
}

describe("the offer names the number of foods the generator produces", () => {
  it("promises exactly what the full-tier prompt asks for", () => {
    // Change either side alone and this fails. That is the whole point: the
    // copy said ten for as long as the prompt said five.
    expect(promptFoodCount()).toBe(REPORT_FOOD_COUNT)
  })

  it("spells that number the same way in prose", () => {
    const spelled: Record<number, string> = { 3: "three", 4: "four", 5: "five", 6: "six", 7: "seven" }
    expect(REPORT_FOOD_COUNT_WORD).toBe(spelled[REPORT_FOOD_COUNT])
    expect(REPORT_OFFER_FEATURES.join(" ")).toContain(`${REPORT_FOOD_COUNT_WORD}-food`)
    expect(REPORT_OFFER_SENTENCE).toContain(`${REPORT_FOOD_COUNT_WORD}-food`)
  })

  it("is reading a real prompt, not an empty slice", () => {
    // Without this the count could be 0 on both sides of a broken regex and the
    // assertion above would pass by finding nothing — the failure mode that
    // makes a drift guard worthless.
    expect(promptFoodCount()).toBeGreaterThan(0)
    expect(GENERATOR).toContain('"specificFoodList"')
    expect(GENERATOR, "the personal→full mapping is what makes the full block the right one")
      .toContain('tier === "personal" ? "full" : tier')
  })
})

describe("the retired promises are gone from the whole tree", () => {
  /**
   * Comments are stripped first. lib/report/offer.ts documents what was removed
   * and why — that is the record of the decision, not a claim being made to a
   * customer — and a scan that could not tell those apart would either fail on
   * its own documentation or force the documentation to be deleted.
   */
  const DEAD_PROMISES = [
    // No shopping section exists in the schema, in paid-report-client.tsx, or in
    // report-pdf.tsx — in any report shape, which is what makes this tree-wide.
    /weekly shopping framework/i,
    // Nothing produces a list of foods to avoid. topTrigger is "the single most
    // impactful finding", which is not the same thing.
    /avoid ?\/ ?reduce list/i,
  ]

  it("has no surface still making them", () => {
    const offenders: string[] = []
    for (const file of sourceFiles()) {
      const copy = copyOf(readFileSync(file, "utf8"))
      for (const dead of DEAD_PROMISES) {
        const hit = copy.match(dead)
        if (hit) offenders.push(`${file} → ${hit[0]}`)
      }
    }
    expect(offenders, "offer copy promising what the report does not contain").toEqual([])
  })

  it("would catch one, and is scanning files that exist", () => {
    // Direct proof the patterns match the real phrasing rather than a near-miss
    // of it — the guard I nearly wrote against `href="/report/..."` in #248
    // matched nothing because the live code used the property form.
    expect(copyOf('<span>Weekly shopping framework</span>')).toMatch(DEAD_PROMISES[0])
    expect(copyOf('"Food swaps and avoid/reduce list"')).toMatch(DEAD_PROMISES[1])
    expect(sourceFiles().length).toBeGreaterThan(300)
  })

  it("does not fire on the file that documents the removal", () => {
    // The over-correction check for the comment strip: offer.ts names all three
    // dead phrases in its header, and must stay scannable rather than exempt.
    const offer = readFileSync("lib/report/offer.ts", "utf8")
    expect(offer, "the reasoning is recorded in the source").toContain("weekly shopping framework")
    for (const dead of DEAD_PROMISES) expect(copyOf(offer)).not.toMatch(dead)
    expect(copyOf(offer)).not.toMatch(FOOD_COUNT_CLAIM)
  })
})

/**
 * Any surface naming the price, in customer copy, is selling the report.
 *
 * A literal "€49" is the tell, and it is what found the fifth surface I had
 * missed: components/home/membership-teaser.tsx, rendered on the homepage
 * (app/page.tsx:81), listing "Understand your stability, diversity, and
 * recovery scores" — three scores the €49 report does not produce. Five lists
 * became six the same way.
 */
function offerSurfaces(): string[] {
  return sourceFiles().filter((f) => {
    if (f === "lib/report/offer.ts") return false
    return new RegExp(`€${REPORT_PRICE_EUR}\\b`).test(copyOf(readFileSync(f, "utf8")))
  })
}

/** A promised food count, in any phrasing that names a number of foods. */
const FOOD_COUNT_CLAIM = /\btop (\d+) foods?\b/i

describe("one offer definition, not one per surface", () => {
  const CONSUMERS = [
    "app/pricing/pricing-client.tsx",
    "components/assessment/personal-report-cta.tsx",
    "components/assessment/assessment-results.tsx",
    "components/home/membership-teaser.tsx",
    "lib/email/paid-report-email.ts",
  ]

  for (const file of CONSUMERS) {
    it(`${file} reads the shared list`, () => {
      expect(readFileSync(file, "utf8")).toMatch(/from "@\/lib\/report\/offer"/)
    })
  }

  it("finds every surface that sells the report, not just the listed ones", () => {
    // The enumeration-independent half, and the reason it earns its place: it
    // failed on first run and named membership-teaser.tsx, which none of the
    // per-file assertions above would ever have looked at.
    //
    // A surface may name the price without listing features — a CTA button, a
    // one-line mention — so what is required is not the import but the absence
    // of a competing feature list. Anything enumerating what the report contains
    // has to source that from one place.
    const rogue = offerSurfaces().filter((f) => {
      const source = readFileSync(f, "utf8")
      if (/from "@\/lib\/report\/offer"/.test(source)) return false
      return /\bfood recommendations?\b|shopping framework|meal timing|\btop \d+ foods?\b/i.test(
        copyOf(source),
      )
    })
    expect(rogue, "these sell the report with a feature list of their own").toEqual([])
  })

  it("never promises a food count other than the one generated", () => {
    // Scoped to the surfaces that sell the €49 report rather than run tree-wide,
    // and the distinction is real rather than a convenience: the retired demo
    // renderers name their own counts truthfully. full-report-client.tsx says
    // "Your Top 12 Foods" and renders `report.top12Foods` — a different, legacy
    // report shape — and /assessment/preview describes those static demos. Their
    // numbers are true of what they render; only the €49 offer's was not.
    const wrong: string[] = []
    for (const file of offerSurfaces()) {
      const hit = copyOf(readFileSync(file, "utf8")).match(FOOD_COUNT_CLAIM)
      if (hit && Number(hit[1]) !== REPORT_FOOD_COUNT) wrong.push(`${file} → ${hit[0]}`)
    }
    expect(wrong, `the report generates ${REPORT_FOOD_COUNT} foods`).toEqual([])
  })

  it("is scanning surfaces that exist, and the claim shape is the real one", () => {
    // Both assertions above pass on an empty list, so prove the list is not.
    expect(offerSurfaces().length).toBeGreaterThan(2)
    expect(offerSurfaces()).toContain("app/pricing/pricing-client.tsx")
    expect("Your top 10 food recommendations").toMatch(FOOD_COUNT_CLAIM)
    expect("Your Top 12 Foods").toMatch(FOOD_COUNT_CLAIM)
  })

  it("keeps the list traceable to rendered fields", () => {
    // A floor, not a content assertion: the list is copy and will be edited.
    // What must not happen is it quietly emptying, which would make every
    // consumer render nothing and every assertion above still pass.
    expect(REPORT_OFFER_FEATURES.length).toBeGreaterThanOrEqual(6)
    expect(REPORT_PRICE_EUR).toBe(49)
    // Each of these names a field that exists in DeepFullReport and renders in
    // components/assessment/paid-report-client.tsx.
    const joined = REPORT_OFFER_FEATURES.join(" ").toLowerCase()
    for (const promised of ["7-day starter plan", "30-day roadmap", "key insight"]) {
      expect(joined, `${promised} is a rendered section and should be sold`).toContain(promised)
    }
  })
})
