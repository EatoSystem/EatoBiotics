import { describe, it, expect, afterEach } from "vitest"
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import {
  AUDIT_ROOT,
  CORPUS_ROOT,
  COMMITTED_ROOT,
  MANIFEST_JSON,
  SCREENSHOT_INDEX_MD,
  WRITE_FROZEN_FLAG,
  copyToCommitted,
  frozenWritesAllowed,
  manifestTarget,
  screenshotIndexTarget,
} from "../e2e/audit-manifest"

/* ════════════════════════════════════════════════════════════════════════════
   0R-6R · THE FROZEN AUDIT EVIDENCE IS IMMUTABLE TO AN ORDINARY RUN.

   ══ WHY THIS FILE EXISTS ════════════════════════════════════════════════════

   `docs/experience/audit/screenshots/`, `manifest.json` and
   `SCREENSHOT_INDEX.md` were last written at `5274e03` — the Experience 0
   freeze. Measured: EVERY `playwright test` run since has rewritten them. Six
   remediation tranches each left those files dirty and each restored them by
   hand, and the only thing standing between a verification run and the audit's
   own before-evidence was the operator remembering to `git restore`.

       FROZEN BEFORE-EVIDENCE MUST BE IMMUTABLE TO NORMAL REGRESSION RUNS.

   ══ WHAT IS ASSERTED, AND WHY HERE RATHER THAN IN PLAYWRIGHT ════════════════

   The gate is a pure function of the environment, so a unit test can prove it
   without a browser, a server or a 7-minute suite — and it runs in CI on every
   commit rather than only when someone runs the e2e suite.

   The Playwright specs remain the thing that exercises the WRITE; this file
   proves the write cannot reach the frozen tree, and that the generated
   destination is one `.gitignore` already covers.
   ════════════════════════════════════════════════════════════════════════════ */

const ORIGINAL = process.env[WRITE_FROZEN_FLAG]

afterEach(() => {
  if (ORIGINAL === undefined) delete process.env[WRITE_FROZEN_FLAG]
  else process.env[WRITE_FROZEN_FLAG] = ORIGINAL
})

describe("the audit's frozen evidence is not writable by default", () => {
  it("fails closed with the flag absent", () => {
    delete process.env[WRITE_FROZEN_FLAG]
    expect(frozenWritesAllowed()).toBe(false)
    expect(manifestTarget()).not.toBe(MANIFEST_JSON)
    expect(screenshotIndexTarget()).not.toBe(SCREENSHOT_INDEX_MD)
  })

  /*
   * An exact-string opt-in, for the reason `isUnverifiedPaidFlowAllowed` is one:
   * a truthiness check opens on "0", "false" and "no", which are three ways a
   * CI config says the opposite of what it means.
   */
  it.each(["", "0", "true", "TRUE", "yes", "on", " 1", "1 ", "2"])(
    "fails closed for %o, which is not the exact string",
    (value) => {
      process.env[WRITE_FROZEN_FLAG] = value
      expect(frozenWritesAllowed()).toBe(false)
      expect(manifestTarget()).not.toBe(MANIFEST_JSON)
    },
  )

  it("opens only for the exact string, so the flag is still usable", () => {
    // NON-VACUITY: if this did not pass, the gate would be a permanent block
    // rather than a gate, and the corpus could never be refreshed at all.
    process.env[WRITE_FROZEN_FLAG] = "1"
    expect(frozenWritesAllowed()).toBe(true)
    expect(manifestTarget()).toBe(MANIFEST_JSON)
    expect(screenshotIndexTarget()).toBe(SCREENSHOT_INDEX_MD)
  })

  it("sends the default writes somewhere .gitignore already covers", () => {
    delete process.env[WRITE_FROZEN_FLAG]
    for (const target of [manifestTarget(), screenshotIndexTarget()]) {
      expect(target.startsWith(`${CORPUS_ROOT}/`), target).toBe(true)
    }

    /*
     * Read the real .gitignore rather than trusting the path. The corpus was
     * gitignored at Experience 0 step 3 because it outgrew Git, and this gate
     * now depends on that for a second reason — so if the ignore is ever
     * removed, the gate silently starts producing committable files.
     */
    const ignore = readFileSync(".gitignore", "utf8")
    expect(ignore).toContain(`${CORPUS_ROOT}/`)
  })
})

/*
 * ── THE COPY ITSELF, NOT ONLY THE FLAG — FOUND WRITING SABOTAGE 1534 ────────
 *
 * Everything above tests `frozenWritesAllowed()` and the two computed targets.
 * None of it calls `copyToCommitted`, so deleting its `if (!frozenWritesAllowed())`
 * line — the one statement that actually declines the write — broke no
 * assertion. One edit, back to writing the frozen tree on every run, silently.
 *
 * So this calls the function. A temporary directory stands in for
 * `COMMITTED_ROOT`, because a test that proves a write is skipped must not be
 * the thing that performs it.
 */
describe("copyToCommitted declines the write, and says so", () => {
  function fixture() {
    const dir = mkdtempSync(join(tmpdir(), "audit-frozen-"))
    const from = join(dir, "source.png")
    writeFileSync(from, "not-really-a-png", "utf8")
    return { from, committedDir: join(dir, "committed"), file: "shot.png" }
  }

  it("writes nothing and reports archive-only without the flag", () => {
    delete process.env[WRITE_FROZEN_FLAG]
    const { from, committedDir, file } = fixture()

    expect(copyToCommitted(from, committedDir, file)).toBe("archive-only")
    expect(
      existsSync(join(committedDir, file)),
      "copyToCommitted wrote into the committed set with the gate closed",
    ).toBe(false)
    // Not even the directory, so a later bare write has nowhere ready to land.
    expect(existsSync(committedDir)).toBe(false)
  })

  it("writes and reports committed under the flag", () => {
    // NON-VACUITY: the function still works, so the corpus can be refreshed
    // deliberately. Without this the test above would pass on a no-op stub.
    process.env[WRITE_FROZEN_FLAG] = "1"
    const { from, committedDir, file } = fixture()

    expect(copyToCommitted(from, committedDir, file)).toBe("committed")
    expect(readFileSync(join(committedDir, file), "utf8")).toBe("not-really-a-png")
  })

  it("the manifest row never claims a storage the run did not perform", () => {
    /*
     * The row's `storage` field is what a reader of `manifest.json` trusts, so
     * the return value and the filesystem have to agree in both directions.
     */
    delete process.env[WRITE_FROZEN_FLAG]
    const closed = fixture()
    const closedStorage = copyToCommitted(closed.from, closed.committedDir, closed.file)

    process.env[WRITE_FROZEN_FLAG] = "1"
    const open = fixture()
    const openStorage = copyToCommitted(open.from, open.committedDir, open.file)

    expect([closedStorage, openStorage]).toEqual(["archive-only", "committed"])
    expect(existsSync(join(closed.committedDir, closed.file))).toBe(false)
    expect(existsSync(join(open.committedDir, open.file))).toBe(true)
  })
})

describe("every write path to the frozen tree goes through the gate", () => {
  /*
   * The gate is only worth as much as its coverage, so this reads the capture
   * specs and the manifest module rather than taking it on trust. Three paths
   * reached the frozen tree before 0R-6R and all three are named here.
   */
  const SPECS = [
    "audit-capture.spec.ts",
    "audit-capture-assessment.spec.ts",
    "audit-capture-fss.spec.ts",
    "audit-capture-reports.spec.ts",
  ] as const

  it.each(SPECS)("%s copies into the committed set only via copyToCommitted", (spec) => {
    const src = readFileSync(join("tests/e2e", spec), "utf8")

    // NON-VACUITY: this spec really does maintain a representative subset.
    expect(src).toContain("COMMITTED")
    expect(src).toContain("copyToCommitted(")

    /*
     * The shape that shipped: a bare `copyFileSync` into `${COMMITTED}/…`,
     * which wrote the frozen tree on every run.
     */
    expect(
      /copyFileSync\s*\([^)]*COMMITTED/.test(src),
      `${spec} writes the committed set directly. Route it through ` +
        `copyToCommitted so the frozen-write gate applies.`,
    ).toBe(false)
  })

  it("the manifest and index are never written to a hard-coded frozen path", () => {
    const manifest = readFileSync("tests/e2e/audit-manifest.ts", "utf8")
    const capture = readFileSync("tests/e2e/audit-capture.spec.ts", "utf8")

    // The writes go to the computed target.
    expect(manifest).toContain("writeFileSync(\n    target,")
    expect(capture).toContain("screenshotIndexTarget()")

    // And not to the literal the index writer used to carry.
    expect(
      capture.includes('"docs/experience/audit/SCREENSHOT_INDEX.md"'),
      "the index is written to a hard-coded frozen path again",
    ).toBe(false)
  })

  it("the three frozen paths are the ones this gate is about", () => {
    // Pinned so a rename cannot quietly move the evidence out from under it.
    expect(AUDIT_ROOT).toBe("docs/experience/audit")
    expect(COMMITTED_ROOT).toBe("docs/experience/audit/screenshots")
    expect(MANIFEST_JSON).toBe("docs/experience/audit/manifest.json")
    expect(SCREENSHOT_INDEX_MD).toBe("docs/experience/audit/SCREENSHOT_INDEX.md")
  })
})
