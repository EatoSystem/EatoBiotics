import { test, expect } from "@playwright/test"
import { readFileSync, mkdirSync, writeFileSync } from "node:fs"
import { join } from "node:path"

/**
 * The canonical Report PDF, actually looked at — Phase 4B-S3A.
 *
 * ══ WHY A VISUAL GATE EXISTS ════════════════════════════════════════════════
 *
 * `lib/pdf/pdf-brand.ts` records a faint green border rendering as SALMON —
 * twice, once as hex-alpha and once as the equivalent rgba — and states:
 * "the element tree, the tests, and a valid %PDF- header all looked identical
 * either way. This class of defect is invisible to everything except looking
 * at the page."
 *
 * Text equality cannot see colour, and colour is where this renderer's known
 * failure mode lives.
 *
 * ══ WHY IN A BROWSER, AND NOT IN VITEST ═════════════════════════════════════
 *
 * The first attempt rasterised in Node with `@napi-rs/canvas`. It worked on
 * this machine and would not have worked in CI, for two separate reasons that
 * only appeared once the project's real runtime was used:
 *
 *   pdfjs 5.6 → canvas   "Value is none of these types `String`, `Path`"
 *   pdfjs 4.10 → canvas  fails in `paintChar`
 *
 * pdfjs draws through canvas APIs that the Node canvas binding does not fully
 * implement, and the mismatch moves with every version pair. A BROWSER canvas
 * is pdfjs's primary supported target, and Playwright already installs
 * Chromium in CI, so this route removes a native dependency instead of adding
 * one — and removes the apt package the alternative would have needed.
 *
 * ══ WHY NOT PIXEL-GOLDEN ════════════════════════════════════════════════════
 *
 * A golden image breaks on a react-pdf upgrade, a font revision or a hinting
 * change, none of which is a defect, and a gate that cries wolf gets deleted.
 * These assert properties a real defect violates and a version bump does not.
 */

const FIXTURE = join(process.cwd(), "tests/.artifacts/canonical-report.pdf")
const ARTIFACTS = join(process.cwd(), "tests/.artifacts")

/** Rendered page measurements, taken in the browser. */
interface PageShot {
  width: number
  height: number
  ink: number
  band: [number, number, number]
  body: [number, number, number]
  png: string
}

test("the canonical Report PDF paints, and paints the right colours", async ({ page }) => {
  // Built by the unit suite, which owns generation. If it is missing the whole
  // gate is meaningless, so say so rather than skipping quietly.
  let pdf: Buffer
  try {
    pdf = readFileSync(FIXTURE)
  } catch {
    throw new Error(
      `${FIXTURE} is missing — run the unit suite first; it writes the fixture this gate reads`,
    )
  }
  expect(pdf.subarray(0, 5).toString()).toBe("%PDF-")

  await page.goto("about:blank")
  await page.addScriptTag({
    path: join(process.cwd(), "node_modules/pdfjs-dist/build/pdf.min.mjs"),
    type: "module",
  })

  // pdfjs in a browser needs its worker. Handed over as a blob URL built from
  // the file on disk, so the version rendering is exactly the pinned one and
  // nothing is fetched over the network.
  const workerSource = readFileSync(
    join(process.cwd(), "node_modules/pdfjs-dist/build/pdf.worker.min.mjs"),
    "utf8",
  )

  const shots = await page.evaluate<PageShot[], { base64: string; workerSource: string }>(
    async ({ base64, workerSource }) => {
    const w = window as unknown as { pdfjsLib: typeof import("pdfjs-dist") }
    const lib = w.pdfjsLib
    lib.GlobalWorkerOptions.workerSrc = URL.createObjectURL(
      new Blob([workerSource], { type: "text/javascript" }),
    )

    const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))
    const doc = await lib.getDocument({ data: bytes }).promise

    const out: PageShot[] = []
    for (let n = 1; n <= doc.numPages; n += 1) {
      const pdfPage = await doc.getPage(n)
      const viewport = pdfPage.getViewport({ scale: 1.5 })
      const canvas = document.createElement("canvas")
      canvas.width = Math.ceil(viewport.width)
      canvas.height = Math.ceil(viewport.height)
      const ctx = canvas.getContext("2d")!
      // A PDF page has no background of its own; without this the canvas
      // starts transparent and an unpainted page would read as black.
      ctx.fillStyle = "#ffffff"
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      await pdfPage.render({ canvasContext: ctx, viewport, canvas } as never).promise

      const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data
      let inked = 0
      for (let i = 0; i < pixels.length; i += 4) {
        if (pixels[i] < 250 || pixels[i + 1] < 250 || pixels[i + 2] < 250) inked += 1
      }

      const sample = (fx: number, fy: number, fw: number, fh: number): [number, number, number] => {
        const x0 = Math.floor(fx * canvas.width)
        const y0 = Math.floor(fy * canvas.height)
        const x1 = Math.min(canvas.width, Math.ceil((fx + fw) * canvas.width))
        const y1 = Math.min(canvas.height, Math.ceil((fy + fh) * canvas.height))
        let r = 0, g = 0, b = 0, count = 0
        for (let y = y0; y < y1; y += 1) {
          for (let x = x0; x < x1; x += 1) {
            const i = (y * canvas.width + x) * 4
            r += pixels[i]; g += pixels[i + 1]; b += pixels[i + 2]; count += 1
          }
        }
        return [r / count, g / count, b / count]
      }

      out.push({
        width: canvas.width,
        height: canvas.height,
        ink: inked / (canvas.width * canvas.height),
        band: sample(0.1, 0.03, 0.8, 0.06),
        body: sample(0.1, 0.45, 0.8, 0.1),
        png: canvas.toDataURL("image/png"),
      })
    }
    return out
    },
    { base64: pdf.toString("base64"), workerSource },
  )

  // Review artifacts, so a person can look at the page the gate measured.
  mkdirSync(ARTIFACTS, { recursive: true })
  shots.forEach((shot, i) => {
    writeFileSync(join(ARTIFACTS, `canonical-report-p${i + 1}.png`), Buffer.from(shot.png.split(",")[1], "base64"))
  })

  expect(shots.length, "the document rasterised to no pages").toBeGreaterThan(1)

  for (const [i, shot] of shots.entries()) {
    const at = `page ${i + 1}`
    expect(shot.width, `${at} has no width`).toBeGreaterThan(500)
    expect(shot.height, `${at} has no height`).toBeGreaterThan(700)
    // A4 portrait, whatever the scale.
    expect(shot.height, `${at} is not portrait`).toBeGreaterThan(shot.width)
    // A page that paints nothing is the failure a page count cannot see.
    expect(shot.ink, `${at} is blank`).toBeGreaterThan(0.002)
    // …and one that paints everything means the sampler is broken, not that
    // the document is very full.
    expect(shot.ink, `${at} is entirely inked`).toBeLessThan(0.9)
  }

  // ── The opening band ──────────────────────────────────────────────────────
  //
  // #1A2E12: dark, and GREEN-DOMINANT. The earlier version of this assertion
  // only required each channel below a ceiling, which pure black satisfies —
  // so it would have passed on a band that failed to paint its colour at all,
  // which is the exact defect class this test exists for. Dominance is
  // asserted positively, with a tolerance that survives antialiasing and a
  // font-rendering change but not a wrong colour.
  const [r, g, b] = shots[0].band
  expect(Math.max(r, g, b), `the opening band is not dark: ${[r, g, b]}`).toBeLessThan(90)
  expect(g - r, `the band is not green-dominant over red: ${[r, g, b]}`).toBeGreaterThan(8)
  expect(g - b, `the band is not green-dominant over blue: ${[r, g, b]}`).toBeGreaterThan(8)

  // ── The body stays light ──────────────────────────────────────────────────
  const [br, bg, bb] = shots[0].body
  expect(Math.min(br, bg, bb), "the body region is not light").toBeGreaterThan(200)
})
