import { describe, it, expect } from "vitest"
import fs from "node:fs"
import path from "node:path"

import { CLAIMS, copyOf, marketingCopy } from "./helpers/marketing-language"

/**
 * Corpus guard — the whole public marketing surface, not the tuned slice.
 *
 * The five per-page guards cover 17 hand-picked files. An audit of the other
 * 188 public pages found the claims those PRs kept removing were still live on
 * pages nobody guarded — "powers your energy" in the homepage's own metadata,
 * "measures how well your diet supports your microbiome" on /biotics.
 *
 * It also found the rules could not simply be pointed at the rest of the site:
 * they were tuned against those 17 files, and on ordinary pages they fired on
 * code, on developer comments, on legal boilerplate, and on the ordinary
 * English verb "treats". A guard that cries wolf gets deleted, so the extractor
 * was hardened first (see copyOf and DENIAL_BOILERPLATE) and this file is the
 * proof that it worked.
 *
 * This test asserts the *exact* set of claim hits across the corpus. Two
 * properties are worth the maintenance cost:
 *
 *   - any NEW hit fails the build, on any public page, guarded or not;
 *   - the real claims below stop being a note in a PR body and become an
 *     asserted list. The copy PR that follows deletes entries as it fixes
 *     lines, and is only green when the copy is genuinely fixed.
 *
 * Adding an entry here is not the same as exempting a file. Each entry pins one
 * rule and one matched fragment on one page; anything else on that page still
 * fails.
 */

/**
 * Pages that sell. Legal, support and transactional routes are deliberately
 * out of scope: the CLAIMS rules are about health marketing, and a privacy
 * policy saying "We will respond within 30 days" or a test-mode banner saying
 * "No real charge will be made" is not making a claim about anybody's body.
 * Excluding them is scoping, not an exemption — the alternative is narrowing
 * general rules like `will <verb>` to a verb list, which is exactly what let
 * claims through in #196 and #197.
 */
const NON_MARKETING =
  /^app\/(account|admin|cms|api|demo|auth|privacy|terms|help|live|login|enter|offline|unsubscribe|preview-access|share)\b/

/** Book chapters are long-form book content, not marketing copy. */
const BOOK_CHAPTER = /^app\/book-chapter-/

function publicPages(dir = "app"): string[] {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .flatMap((e) => {
      const p = path.join(dir, e.name)
      return e.isDirectory() ? publicPages(p) : e.name === "page.tsx" ? [p] : []
    })
    .filter((p) => !NON_MARKETING.test(p) && !BOOK_CHAPTER.test(p))
    .sort()
}

/**
 * Marketing copy that lives in components rather than pages — named explicitly.
 *
 * `publicPages` collects `page.tsx` only, so a component holding customer-facing
 * copy was invisible to every rule. That is not hypothetical:
 * `components/report/demo-report.tsx` renders /report-you, /report-mind and
 * /report-family, and it carried eleven dated outcome promises — "Measurable
 * bacterial diversity increase", "Mood baseline shifts noticeably" — until #209
 * rewrote them by hand. Nothing would have caught them, and nothing stopped that
 * fix regressing afterwards.
 *
 * **Explicit list, not a walk.** There are 324 files under components/, and most
 * are UI primitives, dashboards and admin surfaces that no health-claim rule
 * should ever run against. Sweeping them all is how this guard starts crying wolf,
 * and a guard that cries wolf gets deleted — the same argument the header makes
 * for excluding legal and transactional routes.
 *
 * Keep this disjoint from the components already covered by the per-page guards
 * (you-, glucose-, mind-stability-marketing-language). Those call `assertClean`,
 * which permits nothing at all; listing a file in both places would let an
 * allowlist entry here silently contradict a hard assertion there.
 */
/**
 * Per-component extraction floors and anchors, so a moved disclaimer marker, a
 * rename, or an over-eager strip cannot quietly empty a file out of the corpus
 * while every assertion below passes on nothing.
 *
 * The two paid-report components joined after the €49 audit found the LIVE
 * report carrying exactly the claims this suite had scrubbed from the sample
 * pages — "will show meaningful, measurable change", "You could reach 74–84 in
 * 8–10 weeks" — invisible to every rule because nothing under
 * components/assessment/ was in the corpus.
 *
 * One extraction subtlety, measured: paid-report-client.tsx's mission-note
 * comment contains the word "disclaimers", so DISCLAIMER_SECTION strips from
 * that comment to end of file. Everything the rules need sits before it, and
 * the anchor below proves that stays true.
 */
const MARKETING_COMPONENTS: Record<string, { minChars: number; anchor: string }> = {
  "components/report/demo-report.tsx": {
    minChars: 5_000,
    anchor: "Your plan, stage by stage",
  },
  "components/assessment/paid-report-client.tsx": {
    minChars: 2_000,
    anchor: "Your 30-day cycle",
  },
  "components/assessment/report-membership-cta.tsx": {
    minChars: 1_000,
    anchor: "Keep building your Food System",
  },
  // Joined after the PR #215 review flagged a live "will show meaningful,
  // measurable progress" claim here — pre-existing, not introduced by that PR,
  // and not on the production paid-report path (this component only renders
  // via the dev-fallback branches of /assessment/report and the demo surface),
  // but still real customer-facing copy that deserves the same guard.
  "components/assessment/full-report-client.tsx": {
    minChars: 2_000,
    anchor: "Your recommended retest date",
  },
  // The three surfaces that actually sell the €49 report, added with the offer
  // rewrite. NON_MARKETING keeps app/pricing/page.tsx in the corpus, but the
  // page is a shell — every word of the offer lives in pricing-client.tsx, a
  // component, so no rule had ever read it. Between them these three promised
  // "Top 10 food recommendations", a "weekly shopping framework" and an
  // "avoid/reduce list" against a report that generates five foods and renders
  // neither of the other two. That is the same shape as the demo-report.tsx
  // case described above: real customer copy, invisible because of where it
  // happened to live.
  "app/pricing/pricing-client.tsx": {
    minChars: 3_000,
    anchor: "Take the free assessment first",
  },
  // Floor raised 800 -> 4_000 in Phase 2F. This file is now the ONE place
  // EatoBiotics offers the €49 Consultation: the You result's inline copy of
  // the same offer was deleted and its callers point here instead, so roughly
  // 3.2k characters of commercial copy arrived. A floor left at 800 would no
  // longer notice most of this surface going missing.
  "components/assessment/personal-report-cta.tsx": {
    minChars: 4_000,
    anchor: "A guided digital process",
  },
  // Phase 2D deleted ~1.1k characters here (a duplicate report brochure and
  // the six-card starter pack) and moved the floor 8_000 -> 6_000, with a
  // warning attached: do not lower this again casually — if the file is
  // restructured again, reconsider the corpus strategy instead.
  //
  // Phase 2F is that restructure, and this is the reconsidered strategy rather
  // than another mechanical lowering. The €49 offer did not disappear; it MOVED
  // into personal-report-cta.tsx, which is already in this corpus and whose
  // floor is raised by 3.2k in the same change. Total guarded copy goes UP:
  //
  //   assessment-results.tsx    6_913 -> 4_631 chars  (offer moved out)
  //   personal-report-cta.tsx     ~1.1k -> 4_396 chars  (offer moved in)
  //
  // The anchor moves for the same reason — "Personal Food System Consultation"
  // now lives in the other file. The educational disclaimer was tried first
  // and rejected by this very guard: DISCLAIMER_SECTION strips everything from
  // the retake block's comment onward, so the disclaimer is not in the
  // extracted copy by design. The anchor is instead the Phase 2D free cluster
  // heading, which is inside the extracted range and which that phase froze.
  "components/assessment/assessment-results.tsx": {
    minChars: 4_000,
    anchor: "A few more ideas",
  },
}

/**
 * Email templates — customer copy that no rule reached until now.
 *
 * `publicPages` collects `app/**\/page.tsx`, and NON_MARKETING excludes
 * `app/api` wholesale, so every lifecycle email was outside the corpus. That is
 * not a theoretical gap: `/api/email/sequence` and `/api/email/paid-onboarding`
 * are daily crons in vercel.json, and between them they were sending "a score
 * improvement of 8–18 points within 30 days", "you're already in the top 20%",
 * and "microbial diversity has increased" — asserted about a reader who may
 * have done nothing since taking the assessment. A claim in an email is worse
 * than the same claim on a page: the reader did not go looking for it.
 *
 * **A walk here, an explicit list for components.** The header above argues
 * against sweeping the 324 files under components/, and that argument still
 * holds — most of them are UI primitives no health rule should run against.
 * lib/email/ is the opposite case: every file in it exists to write to a
 * customer. Three are infrastructure rather than copy and are named out.
 *
 * The route walk is nearly all future-proofing, and worth saying plainly: five
 * of the six routes delegate their copy to lib/email/ and carry none of their
 * own. `app/api/email/nurture/route.ts` is the exception, with 37 lines of
 * inline HTML holding the same claims in the same words — which is the argument
 * for scanning all six rather than just the one. This phrasing gets copied
 * forward, and the next route to inline a paragraph is guarded on the day it
 * does.
 */
const EMAIL_INFRASTRUCTURE = new Set(["send.ts", "unsubscribe.ts", "brand-layout.ts"])

function emailTemplates(): string[] {
  const templates = fs
    .readdirSync("lib/email")
    .filter((f) => f.endsWith(".ts") && !EMAIL_INFRASTRUCTURE.has(f))
    .map((f) => path.join("lib/email", f))

  const routes = fs
    .readdirSync("app/api/email", { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => path.join("app/api/email", e.name, "route.ts"))
    .filter((p) => fs.existsSync(p))

  return [...templates, ...routes].sort()
}

/**
 * Extraction floors for the email files that have actually carried claims.
 *
 * Deliberately a subset rather than one entry per file. The walk auto-includes
 * anything new — that is the point of a walk — so an exhaustive list would be a
 * second thing to keep in sync and would fail every time an email is added,
 * training whoever hits it to append rather than read. What must not happen
 * silently is a file *leaving* the corpus: marketingCopy throws on a rename,
 * corpusHits catches and continues, and the file's claims stop being checked
 * with every assertion still green. These four are the ones where that would
 * matter most, and the count floor below covers the rest.
 *
 * Anchors are copy this change rewrote, so they double as proof the rewrite is
 * the version being scanned.
 */
const EMAIL_FLOORS: Record<string, { minChars: number; anchor: string }> = {
  "lib/email/sequence-email.ts": {
    minChars: 3_000,
    anchor: "Your score isn't a verdict",
  },
  "lib/email/paid-onboarding-email.ts": {
    minChars: 2_000,
    anchor: "Two weeks is long enough",
  },
  "lib/email/paid-report-email.ts": {
    minChars: 2_000,
    anchor: "Build the food system inside you",
  },
  "app/api/email/nurture/route.ts": {
    minChars: 2_000,
    anchor: "That's the foundation",
  },
}

const CORPUS = () => [...publicPages(), ...Object.keys(MARKETING_COMPONENTS), ...emailTemplates()]

/**
 * Known hits, as `page|rule|fragment`.
 *
 * REAL — live claims awaiting a copy fix. Empty is the goal state, and it *was*
 * empty from #207 until this file joined the corpus. Anything here is a claim
 * someone has decided to ship while it waits to be fixed, so an entry should be
 * short-lived and carry a reason.
 *
 * Note what this list counts. `corpusHits` records the *first* match per rule
 * per file, so one entry can hide others behind it — #206's "22 claims" were 22
 * rule×file pairs, and clearing them surfaced further instances in the same
 * paragraphs. The list shrinking to zero is what proves the corpus clean, not
 * the entry count.
 *
 * Empty again as of the demo-report copy pass: the three entries #210 recorded
 * were 8 instances, and all 8 are rewritten. One of the three was reclassified
 * rather than softened — see the retake note in KNOWN_FALSE_POSITIVES below.
 */
const REAL_CLAIMS: string[] = []

/**
 * NOT CLAIMS — rule limitations, measured and left in place deliberately.
 * Each one was tried and the fix rejected for a stated reason.
 */
const KNOWN_FALSE_POSITIVES = [
  // `\w+s your <body noun>` cannot tell a verb from a plural noun. Here
  // "compounds" is a noun: "the beneficial compounds your microbiome produces".
  //
  // A lookahead excluding a following verb was built and measured: it silences
  // this one and loses three real claim shapes — "boosts your immunity levels",
  // "improves your health outcomes", "transforms your energy levels" — because
  // separating "produces" from "outcomes" needs a verb list. That is the
  // narrowing that let claims through in #196/#197, so the false positive stays
  // and the rule keeps its reach. Same limitation documented in #204 when
  // widening the noun list to gut|brain was measured and rejected.
  "app/about/page.tsx|acts on the body|compounds your microbiome",
  // Product roadmap, not a body promise: "Baby isn't live yet — but it will
  // build directly on your You or Family Food System." The object is a product,
  // not the reader. Left as an entry rather than a weakened `will <verb>` rule.
  "app/baby/page.tsx|promise|will build",
  "app/birth/page.tsx|promise|will build",
  "app/longevity/page.tsx|promise|will build",
  "app/recovery/page.tsx|promise|will build",
  // Same shape as the four above, and reclassified for the same reason: "Set a
  // reminder for 30 days from today. Your retake will show you exactly what
  // moved — and where to focus next." The object is the retake, a product
  // function, not the reader's body — it says the retake shows changed scores,
  // which is what it does. The sentence that *was* a claim ("Gut microbiome
  // composition can shift measurably in 3-4 weeks") sat in the same paragraph
  // and was removed with the rest of the demo-report copy pass.
  //
  // Note the fragment is `will show`, not the `will have` #210 recorded. Both
  // lived in this file; once "these five foods will have the highest impact" was
  // rewritten, the first `promise` match moved to this line. corpusHits records
  // first-match-per-rule, so carrying the old fragment across would have left a
  // stale entry AND produced an unknown hit.
  "components/report/demo-report.tsx|promise|will show",
  // "Waitlist pricing guaranteed" — a price promise, not a health guarantee.
  "app/course/page.tsx|guarantee|guaranteed",
  // "You have awareness and some strong habits" — describes the reader's
  // habits from their own answers, not a fact asserted about their body.
  "app/assessment/deep/page.tsx|states a fact about the body|You have",
]

const ALLOWED = new Set([...REAL_CLAIMS, ...KNOWN_FALSE_POSITIVES])

function corpusHits(): string[] {
  const hits: string[] = []
  for (const p of CORPUS()) {
    let copy: string
    try {
      copy = marketingCopy(p)
    } catch {
      continue // a page that cannot be read is the extraction floors' problem
    }
    for (const [name, re] of CLAIMS) {
      const m = copy.match(re)
      if (m) hits.push(`${p}|${name}|${m[0]}`)
    }
  }
  return hits.sort()
}

/**
 * Direct proof for the extractor strips.
 *
 * Three of the four hardening fixes are provable by reverting them and watching
 * a corpus false positive come back. The line-comment strip is not: the
 * "treats X as Y" lookahead independently silences the case it was written for,
 * so on today's corpus it removes zero hits. These assertions are how it is
 * verified rather than assumed — including the ordering bug that makes it
 * non-obvious, and the URL case that constrains it.
 */
describe("copyOf strips what is not customer copy", () => {
  it("strips line comments", () => {
    expect(copyOf(`const a = 1 // treat as free\n<p>Real copy</p>`)).not.toMatch(/treat/)
  })

  it("keeps URLs, which contain the same slashes", () => {
    // The reason the strip is colon-guarded rather than a plain //.* — a naive
    // version eats the rest of any line containing a link.
    const out = copyOf(`<a href="https://eatobiotics.com/you">Your food system</a>`)
    expect(out).toMatch(/eatobiotics\.com/)
    expect(out).toMatch(/Your food system/)
  })

  it("strips comments per line, so one // cannot eat the file", () => {
    // The ordering trap: copyOf joins lines with a space, and a strip applied
    // after that join would delete everything following the first //.
    const out = copyOf(`// a comment\n<p>Copy that must survive</p>\n// another`)
    expect(out).toMatch(/Copy that must survive/)
    expect(out).not.toMatch(/comment|another/)
  })

  it("strips method calls, which are code and not copy", () => {
    // [...SCORE_BANDS].reverse() read as the medical claim "reverse".
    expect(copyOf(`const bands = [...SCORE_BANDS].reverse()`)).not.toMatch(/reverse/)
  })

  it("does not strip ordinary prose that merely contains a full stop", () => {
    // Over-correction guard for the method-call strip: `.\w+(` must not eat
    // sentences. Nothing here is code.
    expect(copyOf(`<p>Small steps. Every day. That is the method.</p>`)).toMatch(
      /Small steps\. Every day\. That is the method\./,
    )
  })
})

describe("the public marketing corpus holds no unknown claims", () => {
  it("finds a corpus worth checking", () => {
    // Floor, for the same reason every per-page guard has one: a walk that
    // silently returns nothing would make every assertion below vacuous.
    const pages = publicPages()
    expect(pages.length).toBeGreaterThan(60)
    expect(pages).toContain("app/page.tsx")
    expect(marketingCopy("app/page.tsx").length).toBeGreaterThan(500)
  })

  it("still extracts real copy from each named component", () => {
    // The components need their own floor, and one hazard makes it load-bearing
    // rather than ceremonial: marketingCopy strips DISCLAIMER_SECTION — the
    // `{/* …disclaimer… */}` marker **to end of file**. #208 added a disclaimer
    // to demo-report.tsx. It sits at line 2316 of 2358, so 1% is dropped and the
    // scan is honest; move that marker up the file and the guard would quietly
    // scan a fraction of the component and still pass.
    //
    // A rename or deletion has the same shape: marketingCopy would throw,
    // corpusHits would `continue`, and the file would leave the corpus in
    // silence. Assert the extraction instead of trusting it.
    expect(Object.keys(MARKETING_COMPONENTS).length).toBeGreaterThan(0)
    for (const [c, floor] of Object.entries(MARKETING_COMPONENTS)) {
      const copy = marketingCopy(c)
      expect(copy.length, `${c} extracted only ${copy.length} chars`).toBeGreaterThan(
        floor.minChars,
      )
      // Anchors are copy from beyond the point where an extraction failure
      // would truncate — their presence proves the disclaimer split and the
      // strips did not eat the body of that specific file.
      expect(copy, `${c} is missing its anchor phrase`).toContain(floor.anchor)
    }
  })

  it("keeps the component list disjoint from the per-page guards", () => {
    // Those guards call assertClean, which permits nothing. A file in both places
    // could carry an allowlist entry here while being asserted clean there — two
    // guards disagreeing about the same file, with the stricter one winning by
    // accident rather than by decision.
    const asserted = fs
      .readdirSync("tests/unit")
      .filter((f) => f.endsWith("-marketing-language.test.ts"))
      .flatMap((f) =>
        [...fs.readFileSync(path.join("tests/unit", f), "utf8").matchAll(/"(components\/[^"]+\.tsx)"/g)].map(
          (m) => m[1],
        ),
      )
    const overlap = Object.keys(MARKETING_COMPONENTS).filter((c) => asserted.includes(c))
    expect(overlap, `also asserted clean by a per-page guard:\n${overlap.join("\n")}`).toEqual([])
  })

  it("still scans every email template, and real copy from each", () => {
    // Same argument as the component floor above, for the same failure: a
    // rename or a move makes marketingCopy throw, corpusHits `continue`s, and
    // the file leaves the corpus in silence with every assertion still green.
    const emails = emailTemplates()
    expect(emails.length, "the email walk found almost nothing").toBeGreaterThan(15)
    // lib/email/ holds the templates; app/api/email/ holds the routes. Losing
    // either root would halve the corpus without failing anything.
    expect(emails.some((f) => f.startsWith("lib/email/"))).toBe(true)
    expect(emails.some((f) => f.startsWith("app/api/email/"))).toBe(true)
    // Infrastructure is excluded on purpose; if send.ts appears here the
    // exclusion has broken and the corpus is scanning transport code.
    expect(emails).not.toContain("lib/email/send.ts")

    for (const [file, floor] of Object.entries(EMAIL_FLOORS)) {
      expect(emails, `${file} is no longer in the walk`).toContain(file)
      const copy = marketingCopy(file)
      expect(copy.length, `${file} extracted only ${copy.length} chars`).toBeGreaterThan(
        floor.minChars,
      )
      expect(copy, `${file} is missing its anchor phrase`).toContain(floor.anchor)
    }
  })

  it("produces no claim hit that is not already known", () => {
    const unknown = corpusHits().filter((h) => !ALLOWED.has(h))
    expect(unknown, `unknown claim hits:\n${unknown.join("\n")}`).toEqual([])
  })

  it("still finds every known hit — the list does not rot", () => {
    // The other direction. Without this, a fixed line or an over-eager strip
    // would leave a stale entry sitting here looking like coverage.
    const hits = new Set(corpusHits())
    const stale = [...ALLOWED].filter((a) => !hits.has(a)).sort()
    expect(stale, `allowlist entries that no longer match:\n${stale.join("\n")}`).toEqual([])
  })
})
