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

/** The public production surface. No pack argument, no wording lookup. */
const RUNTIME_MODULES = [
  "contract.ts",
  "digest.ts",
  "order.ts",
  "overlay.ts",
  "trust.ts",
  "types.ts",
  "variant-pack.ts",
] as const

/** The pack-taking implementations. Reachable from three places, pinned below. */
const INTERNAL_MODULES = [
  "internal/build.ts",
  "internal/committed-packs.ts",
  "internal/lookup.ts",
  "internal/render.ts",
] as const

/** The test seam. Importable only from tests/, proved by a repo walk. */
const TESTING_MODULES = ["testing/pack-seam.ts"] as const

const AUTHORING_MODULES = [
  "authoring/contract.ts",
  "authoring/generate.ts",
  "authoring/lexicons.ts",
  "authoring/project.ts",
  "authoring/prompt.ts",
  "authoring/rewriter.ts",
  "authoring/validate.ts",
] as const

const authoringSource = () => FILES.filter((f) => f.startsWith("authoring/"))
const testingSource = () => FILES.filter((f) => f.startsWith("testing/"))
const internalSource = () => FILES.filter((f) => f.startsWith("internal/"))
const publicSource = () =>
  FILES.filter(
    (f) => !f.startsWith("authoring/") && !f.startsWith("testing/") && !f.startsWith("internal/"),
  )
/** Everything that can run inside a customer request: public + internal. */
const runtimeSource = () => [...publicSource(), ...internalSource()]

describe("the walk sees everything", () => {
  it("is recursive, and actually reached inside authoring/", () => {
    // The assertion that would have failed under the old non-recursive guard.
    expect(authoringSource().length).toBeGreaterThan(0)
    expect(FILES).toContain("authoring/validate.ts")
  })

  it("pins all four module sets exactly", () => {
    expect(publicSource()).toEqual([...RUNTIME_MODULES])
    expect(internalSource()).toEqual([...INTERNAL_MODULES])
    expect(authoringSource()).toEqual([...AUTHORING_MODULES])
    expect(testingSource()).toEqual([...TESTING_MODULES])
    expect(FILES.length).toBe(
      RUNTIME_MODULES.length +
        INTERNAL_MODULES.length +
        AUTHORING_MODULES.length +
        TESTING_MODULES.length,
    )
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

describe("authority cannot be handed in by a caller", () => {
  /*
   * The blocker this section exists for: both public entry points used to take
   * a pack, so the CALLER supplied the object that established reviewed
   * wording. Pack validation accepts any `test:` version, so anybody could
   * assemble a variant with a real template, a real role, the correct digest
   * and arbitrary wording, and render it through the same path a customer's
   * Report takes.
   */
  /*
   * Scoped to the INPUT INTERFACE, not the whole file.
   *
   * Both entry points legitimately pass a pack onward — that is what resolving
   * one means — so a file-wide ban on the word would ban the fix rather than
   * the defect. What must be absent is a pack the CALLER can name, so the
   * check slices each input type and looks only there.
   */
  const inputInterface = (source: string, name: string): string => {
    const start = source.indexOf(`export interface ${name} {`)
    expect(start, `${name} not found`).toBeGreaterThanOrEqual(0)
    return source.slice(start, source.indexOf("\n}", start))
  }

  it("neither public entry point accepts a pack", () => {
    const overlay = SOURCE.get("overlay.ts")!
    const trust = SOURCE.get("trust.ts")!

    // A FIELD DECLARATION, not the word. `enabled`'s doc comment mentions the
    // committed pack while explaining why the switch is still worth having,
    // and a guard that banned the noun would ban the explanation.
    const declaresPack = /\bpack\??\s*:/
    expect(inputInterface(overlay, "BuildNarrativeOverlayInput")).not.toMatch(declaresPack)
    expect(inputInterface(trust, "NarrativeRenderPlanInput")).not.toMatch(declaresPack)
    for (const [name, source] of [
      ["overlay.ts", overlay],
      ["trust.ts", trust],
    ] as const) {
      expect(source, `${name} takes a pack from its input`).not.toContain("input.pack")
    }

    // …and each resolves one itself, from the committed registry.
    expect(overlay).toContain("currentCommittedPack()")
    expect(trust).toContain("committedPackForVersion(")
  })

  /*
   * Matched as an export or a call, not as a substring.
   *
   * `variant-pack.ts` NAMES both lookups in the paragraph explaining why they
   * were moved out of it, and that paragraph is the most useful thing in the
   * file for the next reader. A guard that forbade the explanation would be
   * decoration; what must be absent is the function, not the sentence.
   */
  it("the public modules hand out no narrative wording", () => {
    for (const file of publicSource()) {
      const source = SOURCE.get(file)!
      for (const primitive of ["variantById", "reviewedVariantForProposition", "indexByBinding"]) {
        expect(source, `${file} exports ${primitive}`).not.toMatch(
          new RegExp(`export\\s+(async\\s+)?function\\s+${primitive}\\b|export\\s*\\{[^}]*\\b${primitive}\\b`),
        )
        expect(source, `${file} calls ${primitive}`).not.toMatch(new RegExp(`${primitive}\\(`))
      }
    }
  })

  /*
   * REPO-WIDE, not directory-scoped.
   *
   * This check used to iterate the narrative directory only, which meant a
   * file under `app/` or elsewhere in `lib/` could import
   * `@/lib/report/narrative/internal/render` and the "exactly three places"
   * claim would not have seen it. The walk below is the same one the test seam
   * already used, and it asserts it scanned a real tree before drawing any
   * conclusion from an empty result.
   *
   * Matched on actual import specifiers — `from "…"`, `require("…")`,
   * `import("…")` — never on prose. Several narrative files legitimately
   * DISCUSS the internal boundary in the paragraph explaining why it exists.
   */
  it("the internal modules are importable only from the approved places", () => {
    const allowed = new Set([
      "lib/report/narrative/overlay.ts",
      "lib/report/narrative/trust.ts",
      "lib/report/narrative/testing/pack-seam.ts",
    ])

    const importers = repoFiles
      .map((file) => ({
        file: file.replace(`${process.cwd()}/`, ""),
        source: readFileSync(file, "utf8"),
      }))
      .filter(({ source }) =>
        /*
         * Matched by MODULE NAME, not by the path prefix. The two entry points
         * import `./internal/build` relatively, so a pattern anchored on
         * `narrative/internal/` saw neither of them — and the guard would have
         * concluded, from an empty list, that nothing imports the internals.
         * The not-vacuous assertions below are what caught that.
         */
        INTERNAL_MODULES.map((m) => m.replace("internal/", "").replace(".ts", "")).some(
          (name) =>
            new RegExp(`(?:from\\s*|require\\(\\s*|import\\(\\s*)["'][^"']*internal/${name}["']`).test(
              source,
            ),
        ),
      )
      .map(({ file }) => file)

    // Not vacuous: the two entry points really do import internals.
    expect(importers).toContain("lib/report/narrative/overlay.ts")
    expect(importers).toContain("lib/report/narrative/trust.ts")

    for (const importer of importers) {
      const permitted =
        allowed.has(importer) ||
        importer.startsWith("lib/report/narrative/internal/") ||
        importer.startsWith("tests/")
      expect(permitted, `${importer} imports narrative/internal/`).toBe(true)
    }
  })

  it("the registry is source-controlled and takes no registration", () => {
    const registry = SOURCE.get("internal/committed-packs.ts")!
    // No caller-facing way to add a pack: the list is a frozen literal, and a
    // `register…` entry point would be exactly the hole the argument was.
    expect(registry).not.toMatch(/export function register/)
    expect(registry).toContain("Object.freeze")
    for (const lookup of ["process.env", "fetch(", "supabase", "readFileSync"]) {
      expect(registry, `the registry looks packs up via ${lookup}`).not.toContain(lookup)
    }
  })
})

/**
 * Every source file the repo can import from, walked once.
 *
 * Shared by the two importer proofs below, because a boundary that is only
 * checked inside its own directory is not checked.
 */
const repoFiles = (() => {
  const out: string[] = []
  const scan = (dir: string) => {
    for (const entry of readdirSync(dir)) {
      if (entry === "node_modules" || entry === ".next" || entry === ".git") continue
      const full = join(dir, entry)
      if (statSync(full).isDirectory()) scan(full)
      else if (/\.(ts|tsx|mjs)$/.test(entry)) out.push(full)
    }
  }
  for (const dir of ["app", "components", "lib", "scripts", "tests"]) {
    const full = join(process.cwd(), dir)
    try {
      scan(full)
    } catch {
      /* a directory that does not exist is not an importer */
    }
  }
  return out
})()

describe("the boundaries are proved against the whole repository", () => {
  it("scanned a real tree", () => {
    // A walk that silently examined nothing would pass every assertion drawn
    // from it.
    expect(repoFiles.length).toBeGreaterThan(300)
  })
})

describe("the test seam is a test seam", () => {
  it("is imported only by files under tests/", () => {
    const importers = repoFiles
      .filter((f) => /narrative\/testing\/pack-seam/.test(readFileSync(f, "utf8")))
      .map((f) => f.replace(`${process.cwd()}/`, ""))

    expect(importers.length).toBeGreaterThan(0)
    for (const importer of importers) {
      expect(importer.startsWith("tests/"), `${importer} imports the test seam`).toBe(true)
    }
  })

  /*
   * An import statement, not a mention. `overlay.ts` points a reader at the
   * seam in the paragraph explaining why it takes no pack, which is exactly
   * where somebody looking for it should be sent.
   */
  it("no narrative module imports it", () => {
    for (const [file, source] of SOURCE) {
      if (file.startsWith("testing/")) continue
      expect(source, `${file} imports the test seam`).not.toMatch(
        /from\s+["'][^"']*testing\/pack-seam/,
      )
    }
  })

  it("refuses to build anything that could pass for production", () => {
    // Asserted in narrative-pack.test.ts behaviourally; pinned here as source,
    // because a seam that stopped checking would be a seam that could mint a
    // production-looking pack.
    expect(SOURCE.get("testing/pack-seam.ts")!).toContain(
      "TEST_NARRATIVE_VARIANT_PACK_PREFIX",
    )
  })

  /*
   * There is no separate NODE_ENV test, and that is deliberate.
   *
   * `process.env` is already banned outright across every narrative module by
   * the reaches-nothing-it-should-not guard above, so any environment branch
   * is caught there — a second check matching the bare string would only
   * succeed at flagging the comment that explains why the seam does not use
   * one. The isolation is the module graph, not a runtime condition.
   */
  it("is isolated by the module graph, not by a runtime condition", () => {
    for (const [file, source] of SOURCE) {
      expect(source, `${file} branches on the environment`).not.toMatch(/process\.env\./)
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
