/**
 * EatoBiotics — Maskable Icon Generator
 *
 * Creates public/icons/icon-512-maskable.png:
 * - 512×512 canvas with a solid brand-green (#56C135) background
 * - The existing icon-512.png composited at 70% scale (358×358) centred
 *   inside the safe zone, meeting Android's maskable icon spec.
 *
 * Run: node scripts/generate-maskable-icon.mjs
 */

import sharp from "sharp"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, "..")

const SIZE = 512
const LOGO_SIZE = Math.round(SIZE * 0.7) // 358px — within the 80% safe zone

const inputPath = path.join(ROOT, "public", "icons", "icon-512.png")
const outputPath = path.join(ROOT, "public", "icons", "icon-512-maskable.png")

async function generate() {
  // Resize the logo to 70% of canvas
  const logo = await sharp(inputPath)
    .resize(LOGO_SIZE, LOGO_SIZE, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer()

  // Composite onto a solid brand-green background, centred
  const offset = Math.round((SIZE - LOGO_SIZE) / 2)

  await sharp({
    create: {
      width: SIZE,
      height: SIZE,
      channels: 4,
      background: { r: 86, g: 193, b: 53, alpha: 1 }, // #56C135
    },
  })
    .composite([{ input: logo, top: offset, left: offset }])
    .png()
    .toFile(outputPath)

  console.log(`✅  Maskable icon written to ${outputPath}`)
}

generate().catch((err) => {
  console.error("❌  Failed to generate maskable icon:", err)
  process.exit(1)
})
