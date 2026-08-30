/**
 * Agent INSTRUCTIONS must not teach a product model we no longer sell.
 *
 * Separate from tests/unit/retired-vocabulary.test.ts on purpose, and not
 * because of tidiness. That guard runs `copyOf`, which strips comments — the
 * right call for a .tsx file, where a comment is a developer note and not
 * customer copy. Here the prose IS the artefact: CLAUDE.md is read by every
 * agent session before it writes anything, so a stale commercial claim in it
 * does not sit inertly in a file, it propagates into the next diff.
 *
 * ── Why this exists now ─────────────────────────────────────────────────────
 *
 * PR #127 (`.claude/skills/claims-lint/SKILL.md`) states that "the Heal pillar
 * name is acceptable". It is unmerged and stays unmerged, but it is exactly the
 * failure this guards: an instruction file that licenses vocabulary the product
 * has retired, quietly outvoting the guard on the customer surfaces. If that
 * text is ever copied onto main, this fails.
 *
 * ── Scope ───────────────────────────────────────────────────────────────────
 *
 * NAMED files only, never a documentation sweep. Most docs in this repository
 * are history — REVIEW.md records what was believed at the time, and rewriting
 * history to match today's names would destroy the record. This checks only
 * files that are ACTIVE INSTRUCTIONS to an agent, and only their current-model
 * claims.
 */
import { describe, it, expect } from "vitest"
import { readFileSync, existsSync } from "node:fs"

/** Active agent instruction files. Add a file here only if an agent reads it as instruction. */
const AGENT_INSTRUCTIONS = ["CLAUDE.md"].filter((p) => existsSync(p))

/**
 * Each rule is the CURRENT-MODEL sense of a claim, not the word.
 *
 * CLAUDE.md legitimately documents `membership_tier` values, legacy Stripe env
 * vars (`STRIPE_GROW_PRICE_ID # ... (€9.99/mo)`), and the `heal` alias key —
 * all of which must keep working. So every rule below is written against the
 * shape of an ASSERTION about what is current, not against a mention.
 */
const FORBIDDEN: Array<[string, RegExp]> = [
  [
    "Snapshot taught as the free product",
    /\bfood system snapshot\b/i,
  ],
  [
    "Heal taught as a current pathway name",
    /\bheal\s+(pillar|pathway)\s+(name\s+)?is\s+(acceptable|correct|current|fine)\b/i,
  ],
  [
    // Line-anchored: a line that NAMES the retired score in order to rule it
    // out is the guard working, not a violation, so a negator anywhere on the
    // line disarms it. Without this, the very sentence in CLAUDE.md that says
    // the free product is `not "Food System Score"` failed the rule — which it
    // did, on the first run.
    "Food System Score taught as the branded person score",
    /^(?![^\n]*\b(retired|legacy|no longer|not|never|instead of)\b)[^\n]*\bfood system score\b/im,
  ],
  [
    "G/R/T taught as current sellable plans",
    /\b(grow|restore|transform)\b[^\n]{0,60}\b(are|is)\s+the\s+(current|new)\s+(subscription\s+)?(tier|plan|product|offer)s?\b/i,
  ],
  [
    "the five-pillar model taught as current",
    /^(?![^\n]*\b(retired|legacy|no longer|not|never|instead of)\b)[^\n]*\b(five|5)[- ]pillar\s+(model|framework)\b/im,
  ],
]

function hits(): string[] {
  const out: string[] = []
  for (const file of AGENT_INSTRUCTIONS) {
    const text = readFileSync(file, "utf8")
    for (const [name, rule] of FORBIDDEN) {
      const m = text.match(rule)
      if (m) out.push(`${file} → ${name}: "${m[0].slice(0, 80)}"`)
    }
  }
  return out.sort()
}

describe("agent instructions teach the current commercial model", () => {
  it("carries no retired-model instruction", () => {
    expect(hits(), "retired product model in an active agent instruction").toEqual([])
  })

  it("states the three current offers", () => {
    // The other half. A file can be free of forbidden claims by saying nothing
    // at all, which is not the same as being correct — an agent with no model
    // reinvents one. These are the names Phase 1 froze.
    const text = readFileSync("CLAUDE.md", "utf8")
    for (const name of [
      "Food System Assessment",
      "Personal Food System Consultation",
      "Personal Food System Report",
      "EatoBiotics Member",
      "Biotics Score™",
      "Meal Biotics Score",
    ]) {
      expect(text, `CLAUDE.md must name ${name}`).toContain(name)
    }
    // And it must say what G/R/T now are, not merely stop selling them.
    expect(text).toMatch(/\b(grow|restore|transform)\b[^\n]*\blegacy entitlements\b/i)
  })

  it("each rule matches the shape it is written for", () => {
    // A rule against a shape the docs never use passes by finding nothing.
    // These probes are the real sentences, including PR #127's exact claim.
    const probes: Array<[string, string]> = [
      ["Begin with your free Food System Snapshot.", "Snapshot taught as the free product"],
      ["the Heal pillar name is acceptable", "Heal taught as a current pathway name"],
      ["Their Food System Score is the person-level brand.", "Food System Score taught as the branded person score"],
      ["Grow, Restore and Transform are the current subscription tiers.", "G/R/T taught as current sellable plans"],
      ["EatoBiotics uses a five-pillar model.", "the five-pillar model taught as current"],
    ]
    for (const [probe, expected] of probes) {
      const matched = FORBIDDEN.filter(([, r]) => r.test(probe)).map(([n]) => n)
      expect(matched, `"${probe}" should trip ${expected}`).toContain(expected)
    }
  })

  it("tolerates the legitimate mentions the docs must keep", () => {
    // The failure mode opposite to the one above: a rule broad enough to
    // demand deleting true documentation. Each of these is a real line in
    // CLAUDE.md that must never fail.
    const allowed = [
      "STRIPE_GROW_PRICE_ID          # Stripe Price ID for Grow (€9.99/mo)",
      "| membership_tier | text | `free \\| trial \\| member \\| grow \\| restore \\| transform` |",
      "`grow | restore | transform` are legacy entitlements that must keep working",
      'the third *key* stays `"heal"` because it is written into stored assessment records',
    ]
    for (const line of allowed) {
      const matched = FORBIDDEN.filter(([, r]) => r.test(line)).map(([n]) => n)
      expect(matched, `must not fire on: ${line}`).toEqual([])
    }
  })
})
