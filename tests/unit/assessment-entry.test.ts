/**
 * What a customer understands before answering question one.
 *
 * Phase 2A changes only the entry: the route the default You CTAs take, and the
 * orientation on the intro. It ends before q1.
 *
 * Two defects motivated it, and both are the same shape — a surface describing
 * something other than what exists.
 *
 * The intro sold the OUTPUT. Its h1 was "The Food System Inside You" (the brand
 * line) and its start button read "Get My Free Biotics Score", so the product —
 * the Food System Assessment — appeared only as small text on a form card. A
 * reader met the promise before they met the thing.
 *
 * And three counts of the profiles disagreed: the copy claimed "one of six
 * profiles", the array rendered four cards, and getProfile() has six branches
 * carrying five distinct names — one of the four cards being a label
 * getProfile() never returns.
 *
 * These are source assertions rather than rendered-DOM ones because the
 * repository has no React testing library; the same style as
 * checkout-acknowledgement.test.ts, and for the same reason.
 */
import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { copyOf } from "./helpers/marketing-language"

const INTRO_PATH = "components/assessment/assessment-intro.tsx"
const INTRO = readFileSync(INTRO_PATH, "utf8")
const INTRO_COPY = copyOf(INTRO)
const CLIENT = readFileSync("components/assessment/assessment-client.tsx", "utf8")
const SCORING = readFileSync("lib/assessment-scoring.ts", "utf8")

/* ── The product, and what it produces ──────────────────────────────────── */

describe("the intro names the product before its output", () => {
  it("makes Food System Assessment the heading", () => {
    // The h1, not a card label. `copyOf` joins wrapped JSX, so the split
    // <GradientText>Food System</GradientText> Assessment reads as one phrase.
    expect(INTRO_COPY).toMatch(/<h1[^>]*>\s*<GradientText>\s*Food System\s*<\/GradientText>\s*Assessment/)
  })

  it("names the Biotics Score as what the Assessment produces", () => {
    expect(INTRO_COPY).toMatch(/Produces your.{0,60}Biotics Score™/)
  })

  it("states the length before anything is asked", () => {
    expect(INTRO_COPY).toMatch(/15 questions/)
    expect(INTRO_COPY).toMatch(/about 5 minutes/)
  })

  it("says plainly that it is educational and not a diagnosis", () => {
    expect(INTRO_COPY).toMatch(/educational/i)
    expect(INTRO_COPY).toMatch(/not a medical test or diagnosis/i)
  })

  it("does not carry a retired name for the free product", () => {
    for (const retired of [/Food System Snapshot/i, /\bSnapshot\b/, /Gut Health Assessment/i]) {
      expect(INTRO_COPY, `retired product name ${retired}`).not.toMatch(retired)
    }
  })
})

describe("the start control names the Assessment, not the score", () => {
  it("reads Begin My Food System Assessment", () => {
    expect(INTRO_COPY).toMatch(/Begin My Food System Assessment/)
  })

  it("no longer offers the score as the thing being started", () => {
    // "Get My Free Biotics Score" made the output the offer. Asserted against
    // the rendered copy so the doc comment explaining the change cannot satisfy
    // — or trip — the rule.
    expect(INTRO_COPY).not.toMatch(/Get My Free Biotics Score/)
  })
})

/* ── §8 The three Biotics, with nothing fabricated ──────────────────────── */

describe("the three Biotics are previewed without inventing a number", () => {
  it("names all three", () => {
    for (const biotic of ["Prebiotics", "Probiotics", "Postbiotics"]) {
      expect(INTRO_COPY, biotic).toContain(biotic)
    }
  })

  it("shows no placeholder score and no empty bar", () => {
    // A "Your score / ??" row is a fabricated number with the digits withheld.
    expect(INTRO_COPY).not.toMatch(/\?\?/)
    expect(INTRO, "no score-row label in the preview card").not.toMatch(/>Your score</)
    expect(INTRO, "no zero-width teaser bar").not.toMatch(/w-0 rounded-full/)
  })

  it("claims no rank against other people", () => {
    expect(INTRO_COPY).not.toMatch(/percentile|top \d+%|higher than \d+%/i)
  })

  it("does not claim the free Assessment measures metabolites", () => {
    // It reads fifteen self-reported answers. "the compounds your gut produces"
    // told a reader otherwise.
    expect(INTRO_COPY).not.toMatch(/compounds your gut produces/i)
    expect(INTRO_COPY).not.toMatch(/metabolite|biomarker/i)
  })
})

/* ── §9 The profile teaser ──────────────────────────────────────────────── */

/** Every profile name getProfile() can actually return, read from the source. */
function realProfileNames(): string[] {
  const body = SCORING.slice(SCORING.indexOf("export function getProfile("))
  return [...new Set([...body.matchAll(/^\s*type: "([^"]+)"/gm)].map((m) => m[1]))]
}

/** Every profile name the intro shows as an example. */
function teaserNames(): string[] {
  const block = INTRO.slice(INTRO.indexOf("const PROFILES = ["), INTRO.indexOf("const STEPS = ["))
  return [...block.matchAll(/type: "([^"]+)"/g)].map((m) => m[1])
}

describe("the profile teaser promises nothing the scoring cannot deliver", () => {
  it("makes no claim about how many profiles there are", () => {
    // The copy said six, the array showed four, getProfile() carries five names.
    // Option B: the count goes rather than being corrected, because an accurate
    // one would have to explain that "Developing System" has three branches.
    expect(INTRO_COPY).not.toMatch(/one of (six|five|four|\d+) profiles/i)
    expect(INTRO_COPY).not.toMatch(/\b(six|five|\d+) profiles\b/i)
  })

  it("shows only names a real result can carry", () => {
    // Derived from lib/assessment-scoring.ts, not hand-copied — a rename there
    // fails here instead of shipping an example nobody can be given. This is
    // the rule that catches "Thriving System" vs "Thriving Food System".
    const real = realProfileNames()
    expect(real.length, "getProfile() must expose parseable type names").toBeGreaterThan(3)
    for (const name of teaserNames()) {
      expect(real, `"${name}" is not a profile getProfile() returns`).toContain(name)
    }
  })

  it("presents them as examples rather than a catalogue", () => {
    expect(INTRO_COPY).toMatch(/examples of the kind/i)
  })
})

/* ── §6 The consent contract, untouched ─────────────────────────────────── */

describe("Phase 2A leaves the consent architecture exactly as it was", () => {
  it("still renders the shared control, unticked", () => {
    // Matched as rendered JSX with props: `toContain` on the bare name matches
    // the import line, so deleting the render would leave a bare check green.
    expect(INTRO).toMatch(/<HealthConsentCheckbox\s/)
    expect(INTRO).toContain("const [healthConsent, setHealthConsent] = useState(false)")
  })

  it("still blocks on consent and still sends the same payload", () => {
    expect(INTRO).toMatch(/if \(!healthConsent\) e\.healthConsent = HEALTH_CONSENT_REQUIRED_MESSAGE/)
    expect(INTRO).toMatch(/healthDataConsent: healthConsent/)
  })

  it("still collects name, email and age with the age gate intact", () => {
    for (const bit of ["lead-name", "lead-email", "lead-age", "isUnderMinimumAge"]) {
      expect(INTRO, bit).toContain(bit)
    }
  })

  it("does not introduce a second consent", () => {
    // One statement, one field. A second control here would mean two records of
    // different text for the same processing.
    expect((INTRO.match(/<HealthConsentCheckbox\s/g) ?? []).length).toBe(1)
  })
})

/* ── §2 The default You funnel ──────────────────────────────────────────── */

/**
 * CTAs whose own words state individual intent, so the chooser is a detour.
 * Selected by reading each label, not by pattern: `href="/assessment"` appears
 * ~80 times in the tree and most of those are not this.
 */
const YOU_CTAS = [
  "components/home/hero.tsx",
  "components/home/score-preview.tsx",
  "components/home/how-it-works.tsx",
  "components/home/closing-cta.tsx",
  "components/start/start-hero.tsx",
  "components/start/start-final.tsx",
  "components/start/start-how.tsx",
  "components/start/start-problem.tsx",
  "components/start/start-solution.tsx",
  "components/start/start-trust.tsx",
  "components/start/start-pressure.tsx",
  "components/start/sticky-cta.tsx",
  "components/start/score-mock.tsx",
]

describe("the default You journey goes straight to the You assessment", () => {
  for (const file of YOU_CTAS) {
    it(`${file} links to /assessment/you`, () => {
      const source = readFileSync(file, "utf8")
      expect(source).toContain('href="/assessment/you"')
      expect(source, "must not still route through the chooser").not.toContain(
        'href="/assessment"',
      )
    })
  }

  it("the Family chooser is still reachable", () => {
    // Routing simplification, not deletion. Someone deliberately choosing Family
    // still needs this route, and Family is out of scope for Phase 2A.
    const page = readFileSync("app/assessment/page.tsx", "utf8")
    expect(page).toContain("FoundationChooser")
    const chooser = readFileSync("components/assessment/foundation-chooser.tsx", "utf8")
    expect(chooser).toContain("FOUNDATIONS[key].route")
  })

  it("the You route declares its own foundation", () => {
    // FoundationChooser sets foundationType BEFORE navigating. Now that CTAs
    // bypass it, a user who once completed Family would keep foundationType:
    // "family" and resolvedFoundation() would return it even after taking You —
    // a value that reaches personal-report-cta.tsx and /api/checkout.
    expect(CLIENT).toMatch(/patchJourney\(\{ foundationType: "you" \}\)/)
  })

  it("states a duration matching the Assessment", () => {
    // Two of these CTAs sat above "Takes about 3 minutes" while the Assessment
    // is fifteen questions and about five.
    for (const file of ["components/home/score-preview.tsx", "components/home/how-it-works.tsx"]) {
      const source = readFileSync(file, "utf8")
      expect(source, file).not.toMatch(/about 3 minutes/)
      expect(source, file).toMatch(/about 5 minutes/)
    }
  })
})
