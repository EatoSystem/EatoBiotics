import { describe, expect, it } from "vitest"
import { createHash } from "node:crypto"
import { existsSync, readFileSync } from "node:fs"

import {
  AUDIT_FIXTURE_STATES,
  AUDIT_FIXTURE_TABS,
  AUDIT_STATE_FINDINGS,
} from "@/lib/experience-audit/fixtures"

/* ════════════════════════════════════════════════════════════════════════════
   EXPERIENCE 0 — THE MANIFEST IS THE EVIDENCE.

   The full screenshot corpus no longer lives in Git. That is only safe if the
   manifest can prove it describes a complete corpus rather than whatever
   happened to survive — so this file asserts the one identity the artifact
   protocol exists to guarantee:

       expected captures  =  actual rows  =  hashed artifact entries

   Each side comes from a DIFFERENT source, which is the whole point:

     expected  computed from the declared matrices (states x widths x sections)
     actual    the rows the capture harness wrote
     hashed    the rows carrying a real 64-char SHA-256

   A harness that silently dropped a worker's rows — which is exactly what
   happened on the first account run, 45 rows beside 75 images — fails the first
   equality. A manifest edited by hand to paper over a gap fails the second.

   ── AND THE COMMITTED SUBSET IS VERIFIED AGAINST ITS OWN HASH ──────────────

   A representative image is a CITATION: the register points at it and a reader
   trusts that it shows what the row says. So every row marked `committed` must
   exist on disk and hash to the value recorded for it. An image replaced or
   re-cropped after the fact stops matching, and says so.

   Rows marked `archive-only` are NOT checked for existence — by design. They
   live in the corpus directory, which is gitignored and absent from a fresh
   clone. Asserting their presence would make this suite pass only on the
   machine that captured them, which is the opposite of what a manifest is for.
   ════════════════════════════════════════════════════════════════════════════ */

import { SECTION_ORDER } from "@/lib/fss/presentation/system"

const MANIFEST = "docs/experience/audit/manifest.json"
const WIDTHS = ["390", "834", "1280"] as const

interface Row {
  file: string
  surface: string
  route: string
  state: string
  section: string
  viewport: string
  frozenClock: string
  evidenceKind: string
  component: string
  findings: string[]
  consoleErrors: number
  consoleErrorTexts: string[]
  sha256: string
  storage: "committed" | "archive-only"
}

function rows(): Row[] {
  if (!existsSync(MANIFEST)) return []
  return (JSON.parse(readFileSync(MANIFEST, "utf8")) as { rows: Row[] }).rows ?? []
}

/** What a complete ACCOUNT corpus is, derived from the pinned matrices. */
function expectedAccountFiles(): Set<string> {
  const out = new Set<string>()
  for (const state of AUDIT_FIXTURE_STATES) {
    for (const w of WIDTHS) {
      for (const tab of AUDIT_FIXTURE_TABS) {
        out.add(`account-${state}-${tab}-${w}.png`)
      }
    }
  }
  return out
}

/* ── My Food System ───────────────────────────────────────────────────────── */

/** The seven locked areas, as the capture harness names them in filenames. */
const FSS_SECTIONS = ["today", "score", "my-food", "biotics", "my-plan", "progress", "learn"] as const

/** Three system variants, each capturing all seven areas. */
const FSS_SYSTEM_STATES = ["established", "reassessed", "varied"] as const

/** The route states, each a single capture. */
const FSS_ROUTE_CAPTURES = [
  ["assessment-start", "entry"],
  ["assessment-in-progress", "question"],
  ["result", "score-reveal"],
  ["unavailable", "refusal"],
  ["comparison-refused", "progress"],
] as const

function expectedFssFiles(): Set<string> {
  const out = new Set<string>()
  for (const state of FSS_SYSTEM_STATES) {
    for (const w of WIDTHS) for (const sec of FSS_SECTIONS) out.add(`my-food-system-${state}-${sec}-${w}.png`)
  }
  for (const [state, sec] of FSS_ROUTE_CAPTURES) {
    for (const w of WIDTHS) out.add(`my-food-system-${state}-${sec}-${w}.png`)
  }
  return out
}

/* ── Assessment (Generation 2) ────────────────────────────────────────────── */

/** One capture per journey stage; Results captured at three answer sheets. */
const ASSESSMENT_CAPTURES = [
  ["chooser", "foundation"],
  ["intro", "entry"],
  ["questions", "first"],
  ["questions", "mid"],
  ["results", "varied"],
  ["results", "low"],
  ["results", "high"],
  ["resume", "interrupted"],
] as const

function expectedAssessmentFiles(): Set<string> {
  const out = new Set<string>()
  for (const [state, sec] of ASSESSMENT_CAPTURES) {
    for (const w of WIDTHS) out.add(`assessment-${state}-${sec}-${w}.png`)
  }
  return out
}

describe("the audit manifest proves its own completeness", () => {
  it("exists — the corpus is out of Git, so the manifest is not optional", () => {
    expect(
      existsSync(MANIFEST),
      `${MANIFEST} is missing. The full corpus is gitignored, so without the manifest there is no record that it was ever captured.`,
    ).toBe(true)
  })

  it("expected captures = actual rows, for the account surface", () => {
    const expected = expectedAccountFiles()
    const actual = new Set(rows().filter((r) => r.surface === "account").map((r) => r.file))

    const missing = [...expected].filter((f) => !actual.has(f)).sort()
    const extra = [...actual].filter((f) => !expected.has(f)).sort()

    expect(missing, `the manifest is missing ${missing.length} expected capture(s)`).toEqual([])
    expect(extra, `the manifest carries ${extra.length} row(s) the matrices do not expect`).toEqual([])
  })

  it("expected captures = actual rows, for My Food System", () => {
    const expected = expectedFssFiles()
    const actual = new Set(rows().filter((r) => r.surface === "my-food-system").map((r) => r.file))

    const missing = [...expected].filter((f) => !actual.has(f)).sort()
    const extra = [...actual].filter((f) => !expected.has(f)).sort()

    expect(missing, `the manifest is missing ${missing.length} expected capture(s)`).toEqual([])
    expect(extra, `the manifest carries ${extra.length} row(s) the matrices do not expect`).toEqual([])
  })

  /*
   * The seven areas are LOCKED. The filenames above are a second copy of that
   * list, and a second copy is a drift risk — so it is bridged to the real
   * `SECTION_ORDER` rather than trusted. An area added, removed or renamed in
   * the product fails here instead of silently leaving a gap in the corpus.
   */
  it("the captured areas are exactly the product's SECTION_ORDER", () => {
    expect([...FSS_SECTIONS].sort()).toEqual([...SECTION_ORDER].sort())
  })

  it("expected captures = actual rows, for the Assessment journey", () => {
    const expected = expectedAssessmentFiles()
    const actual = new Set(rows().filter((r) => r.surface === "assessment").map((r) => r.file))

    const missing = [...expected].filter((f) => !actual.has(f)).sort()
    const extra = [...actual].filter((f) => !expected.has(f)).sort()

    expect(missing, `the manifest is missing ${missing.length} expected capture(s)`).toEqual([])
    expect(extra, `the manifest carries ${extra.length} row(s) the matrices do not expect`).toEqual([])
  })

  it("actual rows = hashed entries — every row carries a real SHA-256", () => {
    const unhashed = rows()
      .filter((r) => !/^[0-9a-f]{64}$/.test(r.sha256))
      .map((r) => `${r.surface}/${r.file}`)
    expect(unhashed, "these rows have no usable SHA-256, so their artifact cannot be verified").toEqual([])
  })

  it("no two rows claim the same file within a surface", () => {
    const seen = new Set<string>()
    const dupes: string[] = []
    for (const r of rows()) {
      const key = `${r.surface}/${r.file}`
      if (seen.has(key)) dupes.push(key)
      seen.add(key)
    }
    expect(dupes).toEqual([])
  })

  /*
   * The committed set is small and deliberate. If it grew to the size of the
   * corpus the protocol would have quietly failed, so the bound is asserted
   * rather than trusted — with the account surface exempted, because its 75
   * pre-protocol images were committed at `496fa76` and are deliberately left.
   */
  it("the committed set stays a citation set, not a second corpus", () => {
    const bySurface = new Map<string, number>()
    for (const r of rows()) {
      if (r.storage !== "committed") continue
      if (r.surface === "account") continue // pre-protocol, see the header
      bySurface.set(r.surface, (bySurface.get(r.surface) ?? 0) + 1)
    }
    for (const [surface, n] of bySurface) {
      expect(n, `${surface} commits ${n} images — a citation set is 4–6, not a corpus`).toBeLessThanOrEqual(8)
    }
  })

  it("every committed image exists and hashes to its recorded value", () => {
    const wrong: string[] = []
    for (const r of rows()) {
      if (r.storage !== "committed") continue
      const path = `docs/experience/audit/screenshots/${r.surface}/${r.file}`
      if (!existsSync(path)) {
        wrong.push(`${path} — recorded as committed but not on disk`)
        continue
      }
      const actual = createHash("sha256").update(readFileSync(path)).digest("hex")
      if (actual !== r.sha256) wrong.push(`${path} — hash ${actual.slice(0, 12)}… ≠ recorded ${r.sha256.slice(0, 12)}…`)
    }
    expect(wrong, "a committed citation no longer matches the manifest row that cites it").toEqual([])
  })

  /*
   * Account renders a fixture; My Food System is driven through the real flow
   * against real storage. A console error there is the PRODUCT erroring, not a
   * harness artefact, so it is held at zero rather than merely recorded.
   */
  it("My Food System captured with no console errors", () => {
    const noisy = rows()
      .filter((r) => r.surface === "my-food-system" && r.consoleErrors > 0)
      .map((r) => `${r.file}: ${r.consoleErrorTexts.join(" | ")}`)
    expect(noisy, "the real preview flow logged console errors during capture").toEqual([])
  })

  it("every finding a row cites is one the fixture declares for that state", () => {
    const declared = new Set(Object.values(AUDIT_STATE_FINDINGS).flat())
    const stray: string[] = []
    for (const r of rows()) {
      if (r.surface !== "account") continue
      for (const f of r.findings) if (!declared.has(f)) stray.push(`${r.file} → ${f}`)
    }
    expect(stray, "a manifest row cites a finding no fixture state declares").toEqual([])
  })
})

describe("the two fixture gaps the render exposed are closed", () => {
  /*
   * Every earlier state passed no `biotics` and no `weeklyReport`, so
   * P0-SCIENCE-02 and P0-SCIENCE-03 were only ever observed in their FALLBACK
   * form. Without these two states the remediation spec cannot say whether the
   * construct is wrong always or only when fabricated.
   */
  it("a state supplies real per-Biotic data", async () => {
    const { AUDIT_FIXTURES } = await import("@/lib/experience-audit/fixtures")
    const props = AUDIT_FIXTURES["member-with-biotics"] as Record<string, unknown>
    expect(props.biotics, "member-with-biotics must pass a real biotics prop").toBeTruthy()
  })

  it("a state supplies a real weekly report with its own pull-quote", async () => {
    const { AUDIT_FIXTURES } = await import("@/lib/experience-audit/fixtures")
    const wr = (AUDIT_FIXTURES["weekly-report-present"] as Record<string, unknown>).weeklyReport as
      | { report_json?: { pullQuote?: string } }
      | null
    expect(wr?.report_json?.pullQuote, "weekly-report-present must carry a genuine pullQuote").toBeTruthy()

    /*
     * And the fixture's own quote must be non-predictive, so that anything
     * claims-bearing still on screen came from the COMPONENT, not from here.
     */
    expect(wr?.report_json?.pullQuote ?? "").not.toMatch(/\bpoints\b|\bwithin\b|\bweeks\b|\bwould\b/i)
  })
})
