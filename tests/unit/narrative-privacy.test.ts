import { describe, it, expect } from "vitest"
import { readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"

import { NARRATIVE_ACCEPTANCE_GATE } from "@/lib/report/narrative/contract"
import { SPECIALIST_GATES } from "@/lib/consultation/science-contract"
import {
  NARRATIVE_GENERATION_SETTINGS,
  NARRATIVE_PROMPT_RULES,
  narrativeSystemPrompt,
} from "@/lib/report/narrative/prompt"

/**
 * The boundaries S3 must not cross — Phase 4A-S3.
 *
 * ══ WHAT A SOURCE GUARD IS AND IS NOT ═══════════════════════════════════════
 *
 * A tripwire. Every claim worth making about behaviour is made behaviourally
 * elsewhere in this suite; these assertions catch the class of change that is
 * invisible at runtime until the day it matters — a database import that is
 * only reached on an error path, a log line that only fires in production.
 */

const NARRATIVE_DIR = join(process.cwd(), "lib", "report", "narrative")
const FILES = readdirSync(NARRATIVE_DIR).filter((f) => f.endsWith(".ts"))
const SOURCE = new Map(FILES.map((f) => [f, readFileSync(join(NARRATIVE_DIR, f), "utf8")]))

describe("the narrative layer reaches nothing it should not", () => {
  it("has the expected modules and no others", () => {
    expect(FILES.slice().sort()).toEqual([
      "contract.ts",
      "lexicons.ts",
      "order.ts",
      "overlay.ts",
      "project.ts",
      "prompt.ts",
      "types.ts",
      "validate.ts",
    ])
  })

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
   * fed its bytes (`createHash(...).update(...)`), which the overlay does for
   * its digests, so banning the substring would ban the digest rather than the
   * write. The table-scoped `.from(` covers the Supabase shape this is
   * actually about, and the `@/lib/supabase` ban above covers the import.
   */
  it("writes nothing down — no persistence of any kind", () => {
    for (const [file, source] of SOURCE) {
      for (const persistence of [".insert(", ".upsert(", ".from(", "localStorage", "writeFile"]) {
        expect(source, `${file} persists`).not.toContain(persistence)
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
      // A doc comment describing composition across several answers as
      // something this layer works with would be the same claim in prose.
      expect(source, `${file} describes multi-source composition`).not.toMatch(
        /multi-source|several answers|combine[sd]? propositions/i,
      )
    }
  })
})

describe("the Narrative Acceptance Gate is a product gate, kept out of the science contract", () => {
  it("is not in SPECIALIST_GATES", () => {
    const gateNames = Object.keys(SPECIALIST_GATES)
    expect(gateNames).not.toContain("narrative-acceptance")
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
    // Deliberately unset: the readability numbers are calibrated against the
    // corpus before activation, and a number invented here would be a guess
    // with a constant's authority.
    expect(NARRATIVE_ACCEPTANCE_GATE.readabilityThresholds).toBeNull()
    expect(NARRATIVE_ACCEPTANCE_GATE.corpus.length).toBeGreaterThanOrEqual(6)
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
    expect(narrativeSystemPrompt()).toContain("Returning it unchanged is always an acceptable answer")
  })

  it("pins deterministic generation settings", () => {
    expect(NARRATIVE_GENERATION_SETTINGS.temperature).toBe(0)
    expect(NARRATIVE_GENERATION_SETTINGS.structuredOutput).toBe(true)
    expect(NARRATIVE_GENERATION_SETTINGS.responseShape).toEqual({ rewritten: "string" })
  })

  it("is wired to nothing — no module sends it anywhere", () => {
    for (const [file, source] of SOURCE) {
      if (file === "prompt.ts") continue
      expect(source, `${file} uses the prompt`).not.toContain("narrativeSystemPrompt")
    }
  })
})
