import { describe, it, expect } from "vitest"
import { readFileSync, readdirSync, statSync } from "node:fs"
import { join, relative, sep } from "node:path"

import { NARRATIVE_ACCEPTANCE_GATE } from "@/lib/report/narrative/contract"
import { SPECIALIST_GATES } from "@/lib/consultation/science-contract"
import {
  NARRATIVE_GENERATION_SETTINGS,
  NARRATIVE_PROMPT_RULES,
  narrativeSystemPrompt,
} from "@/lib/report/narrative/authoring/prompt"

/**
 * The boundaries S3 must not cross — Phase 4A-S3.
 *
 * ══ WHY THIS FILE WALKS THE TREE ════════════════════════════════════════════
 *
 * It used to call `readdirSync` once, non-recursively, and filter to `.ts`.
 * The moment an `authoring/` subdirectory appeared, that entry was filtered
 * out before every assertion — the exact-module list would still have passed,
 * and four new files would have been scanned by nothing at all. The repair
 * that introduced the subdirectory would have SILENTLY REDUCED coverage while
 * appearing to add structure.
 *
 * So the walk is recursive, the runtime and authoring sets are both pinned by
 * name, and a test asserts the walk actually reached inside `authoring/`.
 *
 * ══ TWO RULE SETS, NOT ONE ══════════════════════════════════════════════════
 *
 * Authoring may name a rewriter and may be async; that is what it is for.
 * Runtime may do neither, and may not import authoring at all. A single rule
 * set would have to be the looser of the two, which would stop saying anything
 * about the code that runs in a customer's request.
 */

const NARRATIVE_DIR = join(process.cwd(), "lib", "report", "narrative")

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) walk(full, out)
    else if (entry.endsWith(".ts")) out.push(full)
  }
  return out
}

const FILES = walk(NARRATIVE_DIR)
  .map((f) => relative(NARRATIVE_DIR, f).split(sep).join("/"))
  .sort()
const SOURCE = new Map(FILES.map((f) => [f, readFileSync(join(NARRATIVE_DIR, f), "utf8")]))

const RUNTIME_MODULES = [
  "contract.ts",
  "digest.ts",
  "order.ts",
  "overlay.ts",
  "trust.ts",
  "types.ts",
  "variant-pack.ts",
] as const

const AUTHORING_MODULES = [
  "authoring/contract.ts",
  "authoring/generate.ts",
  "authoring/lexicons.ts",
  "authoring/project.ts",
  "authoring/prompt.ts",
  "authoring/rewriter.ts",
  "authoring/validate.ts",
] as const

const runtimeSource = () => FILES.filter((f) => !f.startsWith("authoring/"))
const authoringSource = () => FILES.filter((f) => f.startsWith("authoring/"))

describe("the walk sees everything", () => {
  it("is recursive, and actually reached inside authoring/", () => {
    // The assertion that would have failed under the old non-recursive guard.
    expect(authoringSource().length).toBeGreaterThan(0)
    expect(FILES).toContain("authoring/validate.ts")
  })

  it("pins the exact runtime and authoring module sets", () => {
    expect(runtimeSource()).toEqual([...RUNTIME_MODULES])
    expect(authoringSource()).toEqual([...AUTHORING_MODULES])
    expect(FILES.length).toBe(RUNTIME_MODULES.length + AUTHORING_MODULES.length)
  })
})

describe("every narrative module reaches nothing it should not", () => {
  it("imports no database, no model SDK and no framework runtime", () => {
    for (const [file, source] of SOURCE) {
      for (const forbidden of [
        "@/lib/supabase",
        "supabase-js",
        "@anthropic-ai",
        "openai",
        "ai/rsc",
        "next/server",
        "next/headers",
        "guardAiUsage",
        "AI_LIMITS",
        "fetch(",
        "process.env",
      ]) {
        expect(source, `${file} reaches ${forbidden}`).not.toContain(forbidden)
      }
    }
  })

  it("logs nothing at all, so it cannot log a sentence", () => {
    for (const [file, source] of SOURCE) {
      expect(source, `${file} logs`).not.toMatch(/console\.\w+\(/)
    }
  })

  it("never asks who the customer is", () => {
    for (const [file, source] of SOURCE) {
      for (const identity of ["userId", "user_id", "email", "customerId", "getUser"]) {
        expect(source, `${file} names ${identity}`).not.toContain(identity)
      }
    }
  })

  /*
   * `.update(` is deliberately absent from this list. It is also how a hash is
   * fed its bytes, which `digest.ts` does, so banning the substring would ban
   * the digest rather than the write. The table-scoped `.from(` covers the
   * Supabase shape this is actually about.
   */
  it("writes nothing down — no persistence of any kind", () => {
    for (const [file, source] of SOURCE) {
      for (const persistence of [".insert(", ".upsert(", ".from(", "localStorage", "writeFile"]) {
        expect(source, `${file} persists`).not.toContain(persistence)
      }
    }
  })

  /*
   * Phrased as "reads no file", not "does not contain the path".
   *
   * The gate record NAMES where the human evidence will be committed, which is
   * the point of the field — a guard banning the substring would ban the
   * declaration rather than the dependency, and matched its own subject on the
   * first run. What must be true is that no module opens anything.
   */
  it("never reads the committed review record, or any other file", () => {
    for (const [file, source] of SOURCE) {
      for (const read of ["readFileSync", "readFile(", "require(", "import("]) {
        expect(source, `${file} reads from disk`).not.toContain(read)
      }
      expect(source, `${file} imports something named for the review`).not.toMatch(
        /from\s+["'][^"']*review/,
      )
    }
  })
})

describe("the runtime is generation-free", () => {
  it("imports nothing from authoring/", () => {
    for (const file of runtimeSource()) {
      const source = SOURCE.get(file)!
      expect(source, `${file} imports authoring`).not.toContain("./authoring/")
      expect(source, `${file} imports authoring`).not.toContain("narrative/authoring")
    }
  })

  it("does not so much as name a rewriter", () => {
    for (const file of runtimeSource()) {
      const source = SOURCE.get(file)!
      for (const generation of ["NarrativeRewriter", "rewrite(", "NarrativeRewriteRequest"]) {
        expect(source, `${file} names ${generation}`).not.toContain(generation)
      }
    }
  })

  it("is synchronous — no promise, no deadline, no worker pool", () => {
    for (const file of runtimeSource()) {
      const source = SOURCE.get(file)!
      for (const asynchrony of ["async ", "await ", "Promise<", "setTimeout("]) {
        expect(source, `${file} is asynchronous`).not.toContain(asynchrony)
      }
    }
  })

  it("consults no authoring screen and no expansion bound", () => {
    for (const file of runtimeSource()) {
      const source = SOURCE.get(file)!
      for (const screen of ["validateRewrite", "EXPANSION_BOUNDS", "allowedLengthWindow"]) {
        expect(source, `${file} consults ${screen}`).not.toContain(screen)
      }
    }
  })
})

describe("the deterministic Core is not touched", () => {
  it("no narrative module lives inside the Core directory", () => {
    const core = readdirSync(join(process.cwd(), "lib", "report", "deterministic"))
    for (const file of FILES) {
      expect(core, `${file} landed in the Core`).not.toContain(file)
    }
  })

  it("no Core module imports the narrative layer", () => {
    const coreDir = join(process.cwd(), "lib", "report", "deterministic")
    for (const file of readdirSync(coreDir).filter((f) => f.endsWith(".ts"))) {
      const source = readFileSync(join(coreDir, file), "utf8")
      // The dependency runs one way only. A Core module that imported from
      // here would put a model-facing layer inside the purity firewall, and
      // the firewall would still be green because it only scans its own files.
      expect(source, `${file} imports the narrative layer`).not.toContain("report/narrative")
      expect(source, `${file} imports the narrative layer`).not.toContain("../narrative")
    }
  })

  it("the narrative layer reads the Core and never writes to it", () => {
    for (const [file, source] of SOURCE) {
      for (const constructor of [
        "buildProposition(",
        "buildQuotationProposition(",
        "buildLoopStepProposition(",
        "composePersonalFoodSystemReport(",
      ]) {
        expect(source, `${file} builds canonical content`).not.toContain(constructor)
      }
    }
  })
})

describe("the dormant S2 invariants are not presented as live", () => {
  it("no narrative module names them or advertises multi-source composition", () => {
    for (const [file, source] of SOURCE) {
      for (const dormant of ["mixed-basis", "no-source", "aggregateEvidenceStatus", "weakest-wins"]) {
        expect(source, `${file} reaches for ${dormant}`).not.toContain(dormant)
      }
      expect(source, `${file} describes multi-source composition`).not.toMatch(
        /multi-source|several answers|combine[sd]? propositions/i,
      )
    }
  })
})

describe("the Narrative Acceptance Gate is a product gate, kept out of the science contract", () => {
  it("is not in SPECIALIST_GATES", () => {
    expect(Object.keys(SPECIALIST_GATES)).not.toContain("narrative-acceptance")
    expect(JSON.stringify(SPECIALIST_GATES)).not.toContain("narrative")
  })

  it("the science contract knows nothing about the narrative layer", () => {
    const source = readFileSync(
      join(process.cwd(), "lib", "consultation", "science-contract.ts"),
      "utf8",
    )
    expect(source.toLowerCase()).not.toContain("narrative")
  })

  it("states its own activation bar, and does not claim to have cleared it", () => {
    expect(NARRATIVE_ACCEPTANCE_GATE.status).toBe("OPEN")
    expect(NARRATIVE_ACCEPTANCE_GATE.kind).toBe("product-quality-and-safety")
    expect(NARRATIVE_ACCEPTANCE_GATE.safetyRule).toContain("ZERO")
    expect(NARRATIVE_ACCEPTANCE_GATE.readabilityThresholds).toBeNull()
    expect(NARRATIVE_ACCEPTANCE_GATE.perVariantApprovalRequired).toBe(true)
    expect(NARRATIVE_ACCEPTANCE_GATE.perCustomerApprovalRequired).toBe(false)
    expect(NARRATIVE_ACCEPTANCE_GATE.corpus.length).toBeGreaterThanOrEqual(7)
  })

  it("names where the human evidence will be committed", () => {
    expect(NARRATIVE_ACCEPTANCE_GATE.reviewRecordLocation).toBe(
      "docs/reviews/phase-4a-s3/narrative-variant-pack-v1.review.json",
    )
  })
})

describe("the prompt is reviewed copy, and is not a safety control", () => {
  it("keeps every prohibition that mirrors a deterministic check", () => {
    const prompt = narrativeSystemPrompt()
    for (const rule of [
      "Do not add information",
      "Do not remove information",
      "Do not give advice",
      "Keep every number",
      "Keep every negative",
      "Keep the same degree of certainty",
      "Keep who is speaking",
      "one sentence",
    ]) {
      expect(prompt, `the prompt lost: ${rule}`).toContain(rule)
    }
    expect(NARRATIVE_PROMPT_RULES.length).toBeGreaterThanOrEqual(10)
  })

  it("permits no elaboration, however it is phrased", () => {
    const prompt = narrativeSystemPrompt().toLowerCase()
    for (const softening of [
      "extra context",
      "helpful",
      "feel free",
      "if it helps",
      "you may add",
      "elaborate",
    ]) {
      expect(prompt, `the prompt permits: ${softening}`).not.toContain(softening)
    }
  })

  it("offers the safe action of returning the sentence unchanged", () => {
    expect(narrativeSystemPrompt()).toContain(
      "Returning it unchanged is always an acceptable answer",
    )
  })

  it("pins deterministic generation settings", () => {
    expect(NARRATIVE_GENERATION_SETTINGS.temperature).toBe(0)
    expect(NARRATIVE_GENERATION_SETTINGS.structuredOutput).toBe(true)
    expect(NARRATIVE_GENERATION_SETTINGS.responseShape).toEqual({ rewritten: "string" })
  })

  it("is wired to nothing — no module sends it anywhere", () => {
    for (const [file, source] of SOURCE) {
      if (file === "authoring/prompt.ts") continue
      expect(source, `${file} uses the prompt`).not.toContain("narrativeSystemPrompt")
    }
  })
})
