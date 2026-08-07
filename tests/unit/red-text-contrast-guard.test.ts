/* ── The red-500 AA gap, closed and guarded ────────────────────────────────
   #128 turned the sign-in error paragraph from never-rendered into the one
   thing a locked-out user must read, and flagged text-red-500 (below AA on
   white) as reported-not-fixed. This closes it everywhere the token appears
   as real copy, and guards against it coming back — either as a new site or
   as a silently-reintroduced one.

   Two layers, deliberately different from each other:

   1. THE MATH — proves the *choice* of red-600, not just that the class
      changed. Tailwind v4 defines its palette in OKLCH
      (node_modules/tailwindcss/theme.css), not the classic v3 hex most
      contrast write-ups (including #128's own body) assume. The hexes below
      are the real sRGB Tailwind renders, derived via the standard
      OKLab→linear-sRGB matrices and verified with a throwaway Node script —
      not the v3 guess. Converting matters: it moved the red-600 margin from
      an assumed 4.83:1 down to a real 4.76:1. Still comfortably over 4.5,
      just not the number anyone had written down.

   2. THE ALLOWLIST — a source-level check, not a repo-wide snapshot. Every
      real occurrence of text-red-500 left in app/ or components/ is icon or
      hover-only decoration (WCAG 1.4.11's non-text threshold is 3:1, and
      3.82:1 clears it), never copy. Counting occurrences per file and
      checking against an explicit map — rather than diffing whole files —
      means an unrelated edit two lines away from an allowed site can't trip
      this, and a genuinely new or reintroduced text-red-500 always will.
      Same shape as marketing-language-corpus.test.ts's KNOWN_FALSE_POSITIVES,
      checked in both directions so a stale entry fails too.
──────────────────────────────────────────────────────────────────────── */
import { describe, it, expect } from "vitest"
import fs from "node:fs"
import path from "node:path"

/** WCAG 2.x relative luminance + contrast ratio, sRGB hex in. */
function relativeLuminance(hex: string): number {
  const n = hex.replace("#", "")
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16) / 255)
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
}
function contrastRatio(a: string, b: string): number {
  const [l1, l2] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x)
  return (l1 + 0.05) / (l2 + 0.05)
}

/** The real sRGB Tailwind v4 renders for these OKLCH tokens — see file header. */
const RED_500_RENDERED = "#FB2C36"
const RED_600_RENDERED = "#E7000B"
const RED_700_RENDERED = "#C10007"
/** `--background` and `--card` in app/globals.css — both this literal hex. */
const WHITE = "#FFFFFF"

describe("the contrast choice itself", () => {
  it("red-500 fails AA normal-text contrast (4.5:1) on white — the bug", () => {
    expect(contrastRatio(RED_500_RENDERED, WHITE)).toBeLessThan(4.5)
  })

  it("red-600 clears AA on white — the fix used across this batch", () => {
    expect(contrastRatio(RED_600_RENDERED, WHITE)).toBeGreaterThanOrEqual(4.5)
  })

  it("red-700 clears AA on white with more margin — available if a background ever needs it", () => {
    expect(contrastRatio(RED_700_RENDERED, WHITE)).toBeGreaterThanOrEqual(4.5)
  })
})

/**
 * Every remaining text-red-500 in app/ or components/, and why each is
 * legitimate. All 8 are icon or hover-only decoration; none is copy.
 */
const ALLOWED_RED_500: Record<string, number> = {
  // AlertCircle icon, paired with an already-text-red-700 message right after it.
  "app/share/share-client.tsx": 1,
  "app/account/story/story-client.tsx": 1,
  "app/account/intelligence/intelligence-client.tsx": 1,
  "app/analyse/analyse-client.tsx": 1,
  // X icon, each paired with an already-text-red-600 message right after it.
  "components/analyse/guest-scan-flow.tsx": 2,
  // hover-only icon colour on a remove control; no adjacent text at all.
  "components/app/biotics-score-calculator.tsx": 1,
  "components/stability/StabilityTrackerForm.tsx": 1,
}

function listSourceFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const p = path.join(dir, entry.name)
    if (entry.isDirectory()) return listSourceFiles(p)
    return /\.tsx?$/.test(entry.name) ? [p] : []
  })
}

function countRedFiveHundred(relPath: string): number {
  const src = fs.readFileSync(path.join(process.cwd(), relPath), "utf8")
  return (src.match(/text-red-500\b/g) ?? []).length
}

describe("text-red-500 allowlist", () => {
  const files = [...listSourceFiles("app"), ...listSourceFiles("components")]
    .map((p) => p.replace(/\\/g, "/"))
    .sort()

  it("no file outside the allowlist uses text-red-500", () => {
    const unexpected = files
      .map((f) => [f, countRedFiveHundred(f)] as const)
      .filter(([f, count]) => count > 0 && !(f in ALLOWED_RED_500))

    expect(unexpected, "unexpected text-red-500 — new copy needs text-red-600, or icon-only decoration needs adding to ALLOWED_RED_500 with a reason").toEqual([])
  })

  it("every allowlisted file still matches its expected count (staleness)", () => {
    for (const [file, expected] of Object.entries(ALLOWED_RED_500)) {
      expect(countRedFiveHundred(file), `${file} — expected ${expected} text-red-500`).toBe(expected)
    }
  })

  it("the allowlist total matches the full-repo total — nothing double-counted or missed", () => {
    const total = files.reduce((sum, f) => sum + countRedFiveHundred(f), 0)
    const allowedTotal = Object.values(ALLOWED_RED_500).reduce((a, b) => a + b, 0)
    expect(total).toBe(allowedTotal)
  })
})
