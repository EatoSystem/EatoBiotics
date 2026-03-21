import sharp from "sharp"
import { mkdir } from "fs/promises"
import { join, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, "..")
const src = join(root, "public", "eatobiotics-icon.png")
const outDir = join(root, "public", "icons")

async function main() {
  await mkdir(outDir, { recursive: true })

  await sharp(src)
    .resize(192, 192, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .png()
    .toFile(join(outDir, "icon-192.png"))
  console.log("✓ icon-192.png")

  await sharp(src)
    .resize(512, 512, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .png()
    .toFile(join(outDir, "icon-512.png"))
  console.log("✓ icon-512.png")

  console.log("PWA icons generated successfully.")
}

main().catch((err) => {
  console.error("Error generating icons:", err.message)
  process.exit(1)
})
