import { createCanvas } from "@napi-rs/canvas"
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs"

/**
 * Rasterise a generated PDF — Phase 4B-S3A.
 *
 * ══ WHY A VISUAL GATE EXISTS AT ALL ═════════════════════════════════════════
 *
 * Because this repository has already shipped PDF defects that every semantic
 * test passed. `lib/pdf/pdf-brand.ts` records a faint green border rendering
 * as SALMON — twice, once via hex-alpha and once via the equivalent rgba — and
 * says plainly: "the element tree, the tests, and a valid %PDF- header all
 * looked identical either way. This class of defect is invisible to everything
 * except looking at the page."
 *
 * Text equality cannot see colour. Colour is where this renderer's known
 * failure mode lives.
 *
 * ══ WHY NOT PIXEL-GOLDEN ════════════════════════════════════════════════════
 *
 * Because a golden image breaks on a react-pdf upgrade, a font revision or a
 * hinting change, none of which is a defect, and a gate that cries wolf gets
 * deleted. So this measures PROPERTIES a defect would violate and a version
 * bump would not: that pages paint at all, that none is blank, and that a
 * region which must be dark is dark.
 *
 * ══ WHY pdfjs + napi-rs/canvas AND NOT POPPLER ══════════════════════════════
 *
 * Neither poppler, mutool, ghostscript nor qpdf is present in this container,
 * and CI installs none of them. Both of these are ordinary devDependencies in
 * the lockfile, so the visual gate travels with the repository instead of
 * depending on an apt package that a future runner image may drop.
 */

export interface RasterPage {
  readonly width: number
  readonly height: number
  /** Proportion of pixels that are not near-white, 0..1. */
  readonly ink: number
  readonly png: Buffer
  /** Average colour of a rectangle, as [r, g, b]. Fractions of the page, 0..1. */
  sample(x: number, y: number, w: number, h: number): [number, number, number]
}

export async function rasterisePdf(pdf: Buffer, scale = 1.5): Promise<RasterPage[]> {
  const doc = await getDocument({ data: new Uint8Array(pdf), useSystemFonts: false, verbosity: 0 })
    .promise

  const out: RasterPage[] = []
  for (let n = 1; n <= doc.numPages; n += 1) {
    const page = await doc.getPage(n)
    const viewport = page.getViewport({ scale })
    const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height))
    const ctx = canvas.getContext("2d")

    // Paint the sheet white first. A PDF page has no background of its own, so
    // without this the canvas starts transparent and every "is it dark?" check
    // would read an unpainted page as black.
    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    await page.render({ canvasContext: ctx as never, viewport, canvas: canvas as never }).promise

    const { width, height } = canvas
    const pixels = ctx.getImageData(0, 0, width, height).data

    let inked = 0
    for (let i = 0; i < pixels.length; i += 4) {
      if (pixels[i] < 250 || pixels[i + 1] < 250 || pixels[i + 2] < 250) inked += 1
    }

    out.push({
      width,
      height,
      ink: inked / (width * height),
      png: Buffer.from(canvas.toBuffer("image/png")),
      sample(fx, fy, fw, fh) {
        const x0 = Math.floor(fx * width)
        const y0 = Math.floor(fy * height)
        const x1 = Math.min(width, Math.ceil((fx + fw) * width))
        const y1 = Math.min(height, Math.ceil((fy + fh) * height))
        let r = 0, g = 0, b = 0, count = 0
        for (let y = y0; y < y1; y += 1) {
          for (let x = x0; x < x1; x += 1) {
            const i = (y * width + x) * 4
            r += pixels[i]; g += pixels[i + 1]; b += pixels[i + 2]; count += 1
          }
        }
        return count === 0 ? [0, 0, 0] : [r / count, g / count, b / count]
      },
    })
  }
  return out
}
