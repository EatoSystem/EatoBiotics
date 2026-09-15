import { describe, it, expect } from "vitest"
import { readFileSync, readdirSync, statSync } from "node:fs"
import { join, relative, sep } from "node:path"

/**
 * Who may reach what — Phase 4A-S4.
 *
 * ══ WHY SOURCE GUARDS, AND WHAT THEY ARE NOT ════════════════════════════════
 *
 * The behavioural suites prove a persisted Report survives the live world
 * moving. They can only prove that because the historical modules do not
 * IMPORT the live world — and no behavioural test can establish an absence.
 * These are tripwires for exactly that: the module graph, read as text, with
 * matches on real import specifiers rather than on prose. Several of the files
 * below legitimately discuss the boundary in the paragraph explaining why it
 * exists, and a guard that matched its own rationale would be decoration.
 */

const PERSISTED_DIR = join(process.cwd(), "lib/report/persisted")

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) walk(full, out)
    else if (entry.endsWith(".ts")) out.push(full)
  }
  return out
}

const FILES = walk(PERSISTED_DIR)
  .map((f) => relative(PERSISTED_DIR, f).split(sep).join("/"))
  .sort()
const SOURCE = new Map(FILES.map((f) => [f, readFileSync(join(PERSISTED_DIR, f), "utf8")]))

/**
 * The same file with its comments removed.
 *
 * Several of these modules explain the boundary by NAMING what they may not
 * reach — "not `SCIENCE_CONTRACT_VERSION`", "no `onConflict`", "`paid_report_intents`
 * expires after thirty days". That paragraph is the most useful thing in the
 * file for the next reader, and a guard that flagged it would be asking for the
 * explanation to be deleted to keep the rule. What must be absent is the CODE.
 */
const CODE = new Map(
  FILES.map((f) => [
    f,
    SOURCE.get(f)!.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, ""),
  ]),
)

/** Every module in the layer, pinned. A new file must be classified. */
const HISTORICAL_MODULES = [
  "decode-consultation.ts",
  "decode-report.ts",
  "digest.ts",
  "internal/historical-read.ts",
  "outcomes.ts",
  "serialise-persisted.ts",
  "types.ts",
  "v1-consultation-wire.ts",
  "v1-wire.ts",
] as const

/** May use the live composer and readers, because it IS the current producer. */
const CURRENT_MODULES = ["internal/first-generation.ts"] as const

const PLUMBING_MODULES = ["ensure-report.ts", "internal/ensure-core.ts"] as const
const TESTING_MODULES = ["testing/report-seam.ts"] as const

/** Import specifiers only — `from "…"`, `require("…")`, `import("…")`. */
function importsFrom(source: string, specifier: string): boolean {
  return new RegExp(
    `(?:from\\s*|require\\(\\s*|import\\(\\s*)["'][^"']*${specifier}`,
  ).test(source)
}

describe("the layer is fully classified", () => {
  it("pins every module", () => {
    expect(FILES).toEqual(
      [...HISTORICAL_MODULES, ...CURRENT_MODULES, ...PLUMBING_MODULES, ...TESTING_MODULES].sort(),
    )
  })
})

describe("the historical modules cannot reach the live world", () => {
  const forbidden = [
    "lib/consultation/",
    "lib/report/deterministic/",
    "lib/addon-types",
    "stripe",
    "@/lib/supabase",
  ]

  it("imports none of it", () => {
    for (const file of HISTORICAL_MODULES) {
      const source = SOURCE.get(file)!
      for (const specifier of forbidden) {
        expect(importsFrom(source, specifier), `${file} imports ${specifier}`).toBe(false)
      }
    }
  })

  it("and the guard is not vacuous — the current producer does import them", () => {
    const current = SOURCE.get("internal/first-generation.ts")!
    expect(importsFrom(current, "lib/report/deterministic/")).toBe(true)
    expect(importsFrom(current, "lib/consultation/")).toBe(true)
  })

  it("names no live version constant", () => {
    /*
     * The frozen lists are deliberately named after what they freeze —
     * `V1_KNOWN_SCIENCE_CONTRACT_VERSIONS` contains the live constant's name as
     * a substring. A guard that matched that would be flagging the copy for
     * resembling the original, so the frozen names are removed before the
     * search rather than renamed to something less clear.
     */
    const FROZEN_NAMES = [
      "V1_KNOWN_SCIENCE_CONTRACT_VERSIONS",
      "V1_KNOWN_FINALISATION_VERSIONS",
      "V1_KNOWN_PRODUCER_IDENTITIES",
      "V1_REPORT_SCHEMA_VERSION",
      "V1_SNAPSHOT_SCHEMA_VERSION",
      "V1_STATE_SCHEMA_VERSION",
      "V1_FINALISATION_SCHEMA_VERSION",
    ]
    for (const file of HISTORICAL_MODULES) {
      let source = CODE.get(file)!
      for (const frozen of FROZEN_NAMES) source = source.split(frozen).join("«frozen»")
      for (const symbol of [
        "SCIENCE_CONTRACT_VERSION",
        "COMPOSER_VERSION",
        "CONTENT_PACK_VERSION",
        "REPORT_USE_RECORD_VERSION",
        "REPORT_V1_SUPPORTED_BANKS",
        "CONSULTATION_BANK_V1",
        "reportCapabilities(",
        "asAddonType(",
      ]) {
        expect(source.includes(symbol), `${file} names ${symbol}`).toBe(false)
      }
    }
  })

  it("keeps the frozen wire modules import-free", () => {
    for (const file of ["v1-wire.ts", "v1-consultation-wire.ts", "types.ts"]) {
      const source = CODE.get(file)!
      expect(source, `${file} imports something`).not.toMatch(/^import\s/m)
    }
  })
})

describe("S4 is free of payment machinery", () => {
  /*
   * `stripe_session_id` is the COLUMN the assessment row is keyed by, and the
   * service must keep naming it — it is how a row is found. What must be absent
   * is the SDK and the payment-summary helpers, so the patterns below match
   * calls and imports rather than the six letters.
   */
  const forbidden = [
    "stripe.checkout",
    "stripe-server",
    "from \"stripe\"",
    "isCheckoutSessionSettled",
    "resolvePaidReportSummary",
    "getPaidReportSummaryFromSession",
    "paid_report_intents",
    "free_scores",
  ]

  it("no module names any of it", () => {
    for (const file of FILES) {
      const source = CODE.get(file)!
      for (const term of forbidden) {
        expect(source.includes(term), `${file} names ${term}`).toBe(false)
      }
    }
  })

  it("the entry point takes a session id and nothing else", () => {
    const entry = SOURCE.get("ensure-report.ts")!
    const signature = entry.slice(
      entry.indexOf("export async function ensurePersistedConsultationReport"),
      entry.indexOf("): Promise<EnsureReportResult>"),
    )
    expect(signature).toContain("sessionId: string")
    for (const field of [
      "stripeSession",
      "supabase",
      "client",
      "finalisation",
      "handoffId",
      "report",
      "digest",
      "foundation",
      "lens",
      "bankVersion",
    ]) {
      expect(signature, `the entry point accepts ${field}`).not.toMatch(
        new RegExp(`\\b${field}\\??\\s*:`),
      )
    }
  })
})

describe("the question authority is selected by the Report's own version", () => {
  /*
   * A SOURCE tripwire, and named as one. There is only one report-use version
   * today, so hardcoding it behaves identically — the versioning exists for the
   * day `report-use-v2` ships, and on that day a timeless map would silently
   * re-describe every v1 Report already persisted. Nothing behavioural can see
   * the difference yet, so this watches the code instead.
   */
  it("passes the provenance value to the lookup, not a literal", () => {
    const decoder = CODE.get("decode-report.ts")!
    expect(decoder).toContain("v1QuestionAuthorityFor(provenance.reportUseRecordVersion)")
    expect(decoder).not.toMatch(/v1QuestionAuthorityFor\(\s*["']/)
  })
})

describe("first generation proves the Report is readable before storing it", () => {
  /*
   * Also a source tripwire. The self-check refuses a composed Report the frozen
   * decoder cannot read — but a deterministic composer over a valid seal never
   * produces one, so there is no input that exercises the branch behaviourally.
   * Removing it would be invisible until the day it mattered.
   */
  it("rehearses the FULL historical read against a candidate row, and refuses on failure", () => {
    /*
     * Repair 1. This used to assert a decode and a handoff comparison — most of
     * the check, and therefore the dangerous amount: a producer regression could
     * satisfy it and still INSERT a Report the very next read would refuse, into
     * a table with no UPDATE and no DELETE.
     *
     * What is asserted now is REUSE. A copy of the binding checks would drift,
     * and the drift would be invisible until an immutable row had been written,
     * so the forbidden list below is the fields a copy would have to name.
     */
    const gen = CODE.get("internal/first-generation.ts")!
    expect(gen).toContain("const candidate: PersistedReportRow = {")
    expect(gen).toContain("readPersistedReport({ row, reportRow: candidate, seal: frozenSeal.context })")
    expect(gen).toContain("if (!rehearsal.ok)")
    expect(gen).toContain('refuse("self-check-failed"')
    expect(gen).toContain("resolveHistoricalSeal(row)")
    for (const copied of ["bankFingerprint", "finalisedAt", "supportedEntitledLenses", "scienceContractVersion"]) {
      expect(gen, `first generation reimplements ${copied}`).not.toContain(copied)
    }
  })
})

describe("the write path is insert-only", () => {
  it("names no upsert, and no database update or delete", () => {
    /*
     * `.update(` also spells the hash API — `createHash("sha256").update(text)`
     * — so the database verbs are matched through the query builder that
     * precedes them rather than on their own.
     */
    for (const file of FILES) {
      const source = CODE.get(file)!
      for (const forbidden of [".upsert(", "onConflict"]) {
        expect(source.includes(forbidden), `${file} calls ${forbidden}`).toBe(false)
      }
      for (const verb of ["update", "delete", "upsert"]) {
        expect(source, `${file} ${verb}s a table`).not.toMatch(
          new RegExp(`from\\(\\s*["'][a-z_]+["']\\s*\\)[\\s\\S]{0,120}?\\.${verb}\\(`),
        )
      }
    }
  })

  it("writes to exactly one table, and only by inserting", () => {
    const entry = CODE.get("ensure-report.ts")!
    expect(entry.match(/\.insert\(/g) ?? []).toHaveLength(1)
    expect(entry).toContain('from("consultation_reports").insert(')
    // Never the sealed columns: S4 does not finalise, and cannot.
    for (const column of ["consultation_finalisation:", "consultation_handoff_id:"]) {
      const writes = entry.slice(entry.indexOf(".insert("))
      expect(writes.includes("consultation_handoff_id: handoffId")).toBe(true)
      void column
    }
    expect(entry).not.toContain('from("deep_assessments").update')
    expect(entry).not.toContain('from("deep_assessments").insert')
  })

  it("distinguishes a unique violation from every other database error", () => {
    const entry = SOURCE.get("ensure-report.ts")!
    expect(entry).toContain('=== "23505"')
    expect(entry).toContain("uniqueViolation:")
  })

  it("never treats a read error as an absent row", () => {
    const entry = SOURCE.get("ensure-report.ts")!
    // `data ?? null` is only reachable after the error has been returned.
    for (const reader of ["readAssessment", "readReport"]) {
      const body = entry.slice(entry.indexOf(`async ${reader}`), entry.indexOf("} catch", entry.indexOf(`async ${reader}`)))
      expect(body, `${reader} ignores the error`).toContain("if (error) return { ok: false")
    }
    const core = SOURCE.get("internal/ensure-core.ts")!
    expect(core).toContain("if (!existing.ok) return unavailable")
  })
})

describe("internal and testing boundaries", () => {
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
      try {
        scan(join(process.cwd(), dir))
      } catch {
        /* a directory that does not exist is not an importer */
      }
    }
    return out
  })()

  it("scanned a real tree", () => {
    expect(repoFiles.length).toBeGreaterThan(300)
  })

  const importersOf = (specifier: string) =>
    repoFiles
      .map((file) => ({ file: file.replace(`${process.cwd()}/`, ""), source: readFileSync(file, "utf8") }))
      .filter(({ source }) => importsFrom(source, specifier))
      .map(({ file }) => file)

  it("persisted/internal is reachable only from the entry point, its siblings and tests", () => {
    const importers = importersOf("report/persisted/internal/")
    expect(importers.length).toBeGreaterThan(0)
    for (const importer of importers) {
      const permitted =
        importer === "lib/report/persisted/ensure-report.ts" ||
        importer === "lib/report/persisted/testing/report-seam.ts" ||
        importer.startsWith("lib/report/persisted/internal/") ||
        importer.startsWith("tests/")
      expect(permitted, `${importer} imports persisted/internal/`).toBe(true)
    }
  })

  it("the test seam is imported only by tests", () => {
    /*
     * Matched on the module NAME, not the path prefix. The production entry
     * point would import it as `./testing/report-seam`, which contains no
     * `report/persisted/` for a prefix pattern to find — a sabotage case that
     * added exactly that import slipped past an earlier draft of this guard.
     */
    const importers = importersOf("testing/report-seam")
    expect(importers.length).toBeGreaterThan(0)
    for (const importer of importers) {
      expect(importer.startsWith("tests/"), `${importer} imports the seam`).toBe(true)
    }
  })

  it("the production entry point does not import the test seam", () => {
    const entry = CODE.get("ensure-report.ts")!
    expect(entry, "the entry point reaches the seam").not.toMatch(
      /from\s+["'][^"']*testing\/report-seam/,
    )
  })

  it("no application route calls the service, and none queries the table", () => {
    const appFiles = repoFiles.filter((f) => f.includes(`${sep}app${sep}`))
    expect(appFiles.length).toBeGreaterThan(50)
    for (const file of appFiles) {
      const source = readFileSync(file, "utf8")
      expect(
        source.includes("ensurePersistedConsultationReport"),
        `${file} calls the S4 service`,
      ).toBe(false)
      expect(source.includes("consultation_reports"), `${file} queries consultation_reports`).toBe(
        false,
      )
    }
  })

  it("S4 adds no Report route", () => {
    expect(readdirSync(join(process.cwd(), "app/api/consultation"))).not.toContain("report")
  })
})
