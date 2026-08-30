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
import { describe, it, expect, beforeAll, afterAll } from "vitest"
import { readFileSync, existsSync, readdirSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"

/**
 * The active AI instruction corpus, discovered rather than enumerated.
 *
 * ── Why this is a walk and not a list ───────────────────────────────────────
 *
 * The first version was `["CLAUDE.md"]`. The rules below already knew how to
 * catch PR #127's exact sentence — a sabotage run proved it — but #127 puts that
 * sentence in `.claude/skills/claims-lint/SKILL.md`, and nothing would have
 * opened the file. A rule that can judge a file it never reads is a guard that
 * reports green over the one case it was written for, which is worse than no
 * guard: it looks like coverage.
 *
 * So skills are found, not registered. A future skill is protected the day it
 * lands, without anyone remembering to edit this file — and remembering is the
 * step that fails.
 *
 * ── Why the scope stops here ────────────────────────────────────────────────
 *
 * `CLAUDE.md` and `.claude/skills/**\/SKILL.md` are what an agent READS AS
 * INSTRUCTION before it writes anything. Deliberately not included: docs/,
 * REVIEW.md, and every other markdown file. Most documentation in this
 * repository is history — it records what was believed at the time — and
 * rewriting history to match today's product names would destroy the record.
 * This is not a documentation sweep and must not become one.
 *
 * `root` is a parameter so discovery can be proved against a temporary fixture
 * instead of by committing a real skill file to the repository. `.claude/skills`
 * does not exist here today, and its absence is the normal state: the collector
 * returns just CLAUDE.md and everything passes.
 */
export function collectInstructionFiles(root = process.cwd()): string[] {
  const found: string[] = []

  const claudeMd = join(root, "CLAUDE.md")
  if (existsSync(claudeMd)) found.push(claudeMd)

  // Bounded depth: skills nest a level or two, and an unbounded walk of a
  // directory anyone can add to is a way to make this test slow and surprising.
  const walk = (dir: string, depth: number) => {
    if (depth > 4 || !existsSync(dir)) return
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name)
      if (entry.isDirectory()) walk(full, depth + 1)
      else if (entry.name === "SKILL.md") found.push(full)
    }
  }
  walk(join(root, ".claude", "skills"), 0)

  return found.sort()
}

const AGENT_INSTRUCTIONS = collectInstructionFiles()

/** PR #127's exact sentence. Named once so the rule probe and the fixture cannot drift. */
const HEAL_CLAIM = "the Heal pillar name is acceptable"

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

/** The rules, applied to one file's text. Shared by the real run and the fixture proof. */
function violations(file: string, text: string): string[] {
  const out: string[] = []
  for (const [name, rule] of FORBIDDEN) {
    const m = text.match(rule)
    if (m) out.push(`${file} → ${name}: "${m[0].slice(0, 80)}"`)
  }
  return out
}

function hits(): string[] {
  const out: string[] = []
  for (const file of AGENT_INSTRUCTIONS) {
    out.push(...violations(file, readFileSync(file, "utf8")))
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
      [HEAL_CLAIM, "Heal taught as a current pathway name"],
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

describe("the corpus finds active skills, not just CLAUDE.md", () => {
  /**
   * Both halves have to hold, and only together do they mean anything: the rule
   * must catch the contradiction, AND the collector must actually open the file
   * the contradiction lives in. Proving one without the other is how the gap
   * this test closes came to exist.
   *
   * Built in a temp directory rather than by committing `.claude/skills/...`
   * here. Putting a real skill file in the repository to exercise a test would
   * mean shipping PR #127's content onto main to prove we can catch it.
   */
  let root: string

  beforeAll(() => {
    root = mkdtempSync(join(tmpdir(), "eb-agent-corpus-"))
    writeFileSync(join(root, "CLAUDE.md"), "# Project\n")
    const skills = join(root, ".claude", "skills")
    mkdirSync(join(skills, "claims-lint"), { recursive: true })
    writeFileSync(
      join(skills, "claims-lint", "SKILL.md"),
      // PR #127's exact claim, and the reason this whole file exists.
      `# Claims lint\n\nWhen linting claims, ${HEAL_CLAIM} for pathway copy.\n`,
    )
    // Nested, to prove the walk is not one level deep.
    mkdirSync(join(skills, "group", "nested"), { recursive: true })
    writeFileSync(join(skills, "group", "nested", "SKILL.md"), "# Nested skill\n")
    // Neighbours that must NOT be collected: a skill's supporting notes are not
    // its instructions, and a README is documentation.
    writeFileSync(join(skills, "claims-lint", "NOTES.md"), `${HEAL_CLAIM}\n`)
    writeFileSync(join(skills, "README.md"), `${HEAL_CLAIM}\n`)
  })

  afterAll(() => rmSync(root, { recursive: true, force: true }))

  it("collects CLAUDE.md and every .claude/skills/**/SKILL.md", () => {
    const found = collectInstructionFiles(root).map((f) => f.slice(root.length + 1))
    expect(found).toEqual([
      ".claude/skills/claims-lint/SKILL.md",
      ".claude/skills/group/nested/SKILL.md",
      "CLAUDE.md",
    ])
  })

  it("collects only SKILL.md, not every markdown file beside it", () => {
    const found = collectInstructionFiles(root)
    expect(found.some((f) => f.endsWith("NOTES.md"))).toBe(false)
    expect(found.some((f) => f.endsWith("README.md"))).toBe(false)
  })

  it("would actually catch PR #127's claim in a skill, not merely be able to", () => {
    // The join. Discover the file the way the real run does, then judge it with
    // the same rules the real run uses.
    const skill = collectInstructionFiles(root).find((f) => f.includes("claims-lint"))
    expect(skill, "the claims-lint skill must be discovered").toBeDefined()
    const found = violations(skill!, readFileSync(skill!, "utf8"))
    expect(found.join(" ")).toContain("Heal taught as a current pathway name")
  })

  it("is quiet when a project has no skills at all", () => {
    // Today's state, and it must stay green: `.claude/skills` does not exist in
    // this repository, so the collector returns CLAUDE.md and nothing else.
    const bare = mkdtempSync(join(tmpdir(), "eb-agent-bare-"))
    writeFileSync(join(bare, "CLAUDE.md"), "# Project\n")
    expect(collectInstructionFiles(bare).map((f) => f.slice(bare.length + 1))).toEqual(["CLAUDE.md"])
    rmSync(bare, { recursive: true, force: true })
  })

  it("reflects this repository as it stands", () => {
    // Not a tautology: it records that the real corpus is CLAUDE.md TODAY and
    // that skills are absent — so the day one is added, it joins the corpus
    // without anyone editing this file.
    const real = collectInstructionFiles().map((f) => f.slice(process.cwd().length + 1))
    expect(real).toContain("CLAUDE.md")
    expect(existsSync(join(process.cwd(), ".claude", "skills"))).toBe(false)
  })
})
