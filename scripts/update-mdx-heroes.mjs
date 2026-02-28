/**
 * update-mdx-heroes.mjs
 *
 * Updates the first <ImagePlaceholder in each chapter MDX file to include
 * src and alt props pointing to the generated hero SVG.
 *
 * Usage: node scripts/update-mdx-heroes.mjs
 * Modifies: content/book/chapter-{1..25}.mdx
 */

import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, "..")
const CONTENT_DIR = path.join(ROOT, "content", "book")

/* ── Per-chapter alt text ─────────────────────────────────────────────── */
const ALT_TEXT = {
  1:  "Abstract illustration of the gut system — a flowing organic tube with inner curves representing the digestive pathway",
  2:  "Abstract illustration of a bacterial colony — clusters of organic circles representing gut microbe communities",
  3:  "Abstract illustration of three overlapping circles representing prebiotics, probiotics, and postbiotics — the 3 Biotics framework",
  4:  "Abstract illustration of a branching root network representing the interconnected ecosystem of the gut microbiome",
  5:  "Abstract illustration of flowing fiber strands — wavy parallel lines representing dietary fiber pathways",
  6:  "Abstract illustration of three rising pillars representing the three biotic pillars — prebiotics, probiotics, and postbiotics",
  7:  "Abstract illustration of a sprouting seed — a small form reaching upward representing prebiotic growth and nourishment",
  8:  "Abstract illustration of fermentation bubbles rising — varied circles representing the fermentation process in probiotic foods",
  9:  "Abstract illustration of a molecular shield — a protective hexagonal form with connected nodes representing postbiotic defence",
  10: "Abstract illustration of a DNA double helix — intertwined curves representing the genetic science behind biotics",
  11: "Abstract illustration of overlapping food profile cards representing the structured approach to biotic food analysis",
  12: "Abstract illustration of a fermentation jar with rising bubbles representing cultured and fermented dairy foods",
  13: "Abstract illustration of the brain-gut axis — two connected circles representing the bidirectional communication pathway",
  14: "Abstract illustration of leaves and roots in a garden arrangement representing plant-based prebiotic foods",
  15: "Abstract illustration of grain stalks flowing upward representing whole grains, legumes, and their fibre content",
  16: "Abstract illustration of a divided plate representing the balanced composition of a 3 Biotics meal",
  17: "Abstract illustration of a clock arc with markers representing meal timing and the daily rhythm of gut health",
  18: "Abstract illustration of pantry shelves with containers representing the practical kitchen setup for biotic eating",
  19: "Abstract illustration of an organized index grid representing the structured food reference system",
  20: "Abstract illustration of a shopping basket representing the practical guide to shopping for biotic foods",
  21: "Abstract illustration of a four-quadrant seasonal cycle representing how gut health adapts across the seasons",
  22: "Abstract illustration of community figures — a group of abstract forms representing families and communities eating together",
  23: "Abstract illustration of a calendar grid with highlighted cells representing the 30-day biotic reset programme",
  24: "Abstract illustration of concentric ripple circles expanding outward representing the growing movement of gut-conscious eating",
  25: "Abstract illustration of an interconnected network of nodes representing the EatoSystem food network across communities",
}

/* ── Main ─────────────────────────────────────────────────────────────── */
console.log("Updating first ImagePlaceholder in each chapter MDX...\n")

let updated = 0
let skipped = 0

for (let ch = 1; ch <= 25; ch++) {
  const mdxPath = path.join(CONTENT_DIR, `chapter-${ch}.mdx`)
  if (!fs.existsSync(mdxPath)) {
    console.log(`  chapter-${ch}.mdx — NOT FOUND, skipping`)
    skipped++
    continue
  }

  let content = fs.readFileSync(mdxPath, "utf-8")

  // Check if already has a hero src
  const firstPlaceholderIdx = content.indexOf("<ImagePlaceholder")
  if (firstPlaceholderIdx === -1) {
    console.log(`  chapter-${ch}.mdx — no <ImagePlaceholder found, skipping`)
    skipped++
    continue
  }

  // Check if this first placeholder already has src=
  const closingIdx = content.indexOf("/>", firstPlaceholderIdx)
  const multiLineClosingIdx = content.indexOf(">", firstPlaceholderIdx)
  const endIdx = closingIdx !== -1 ? closingIdx : multiLineClosingIdx
  const firstTag = content.slice(firstPlaceholderIdx, endIdx + 2)

  if (firstTag.includes('src=')) {
    console.log(`  chapter-${ch}.mdx — first placeholder already has src, skipping`)
    skipped++
    continue
  }

  // Insert src and alt props right after "<ImagePlaceholder"
  const insertAt = firstPlaceholderIdx + "<ImagePlaceholder".length
  const srcProp = `\n  src="/images/book/ch${ch}/hero.svg"\n  alt="${ALT_TEXT[ch]}"`

  content = content.slice(0, insertAt) + srcProp + content.slice(insertAt)

  fs.writeFileSync(mdxPath, content, "utf-8")
  console.log(`  chapter-${ch}.mdx — updated`)
  updated++
}

console.log(`\nDone! ${updated} files updated, ${skipped} skipped.`)
