/**
 * update-all-mdx.mjs
 *
 * Adds src and alt props to ALL remaining <ImagePlaceholder tags in each
 * chapter MDX file (skipping any that already have src=). Works in
 * reverse order within each file to avoid offset invalidation.
 *
 * Usage: node scripts/update-all-mdx.mjs
 * Modifies: content/book/chapter-{1..25}.mdx
 */

import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, "..")
const CONTENT_DIR = path.join(ROOT, "content", "book")

/* ── Derive alt text from idea prop ───────────────────────────────────── */
function deriveAlt(idea) {
  // Strip leading structural labels
  let text = idea
    .replace(
      /^(Full-Page Spread|Section opener|Opening spread|Closing spread|Summary infographic|Closing Graphic|Chapter \d+ overview)[:\s—–-]*/i,
      ""
    )
    .trim()

  // Take first 120 chars, truncate at word boundary
  if (text.length > 120) {
    text = text.substring(0, 120)
    const lastSpace = text.lastIndexOf(" ")
    if (lastSpace > 80) text = text.substring(0, lastSpace)
  }

  // Clean up trailing punctuation
  text = text.replace(/[—–,;:]+$/, "").trim()
  if (!text.endsWith(".")) text += "."

  return `Abstract illustration: ${text}`
}

/* ── Find all ImagePlaceholder tags with their positions ──────────────── */
function findPlaceholders(content) {
  const results = []
  let searchFrom = 0
  let index = 0

  while (true) {
    const tagStart = content.indexOf("<ImagePlaceholder", searchFrom)
    if (tagStart === -1) break

    const tagEnd = content.indexOf("/>", tagStart)
    if (tagEnd === -1) break

    index++
    const fullTag = content.slice(tagStart, tagEnd + 2)
    const hasSrc = /\bsrc\s*=/.test(fullTag)
    const ideaMatch = fullTag.match(/\bidea\s*=\s*"([^"]*)"/)
    const idea = ideaMatch ? ideaMatch[1] : ""

    results.push({
      index,
      hasSrc,
      idea,
      insertAt: tagStart + "<ImagePlaceholder".length,
    })

    searchFrom = tagEnd + 2
  }

  return results
}

/* ── Main ─────────────────────────────────────────────────────────────── */
console.log("Updating all remaining ImagePlaceholders with src and alt...\n")

let totalUpdated = 0
let totalSkipped = 0

for (let ch = 1; ch <= 25; ch++) {
  const mdxPath = path.join(CONTENT_DIR, `chapter-${ch}.mdx`)
  if (!fs.existsSync(mdxPath)) {
    console.log(`  chapter-${ch}.mdx — NOT FOUND, skipping`)
    continue
  }

  let content = fs.readFileSync(mdxPath, "utf-8")
  const placeholders = findPlaceholders(content)

  // Process in reverse order to preserve offsets
  let chapterUpdated = 0
  const toUpdate = placeholders.filter((p) => !p.hasSrc).reverse()

  for (const ph of toUpdate) {
    const fileName = `img-${ph.index}.svg`
    const srcPath = `/images/book/ch${ch}/${fileName}`
    const altText = deriveAlt(ph.idea)

    // Escape any double quotes in alt text
    const safeAlt = altText.replace(/"/g, "&quot;")

    const insertion = `\n  src="${srcPath}"\n  alt="${safeAlt}"`
    content =
      content.slice(0, ph.insertAt) + insertion + content.slice(ph.insertAt)

    chapterUpdated++
    totalUpdated++
  }

  totalSkipped += placeholders.filter((p) => p.hasSrc).length

  if (chapterUpdated > 0) {
    fs.writeFileSync(mdxPath, content, "utf-8")
    console.log(`  chapter-${ch}.mdx — ${chapterUpdated} placeholders updated`)
  } else {
    console.log(`  chapter-${ch}.mdx — all already have src, skipping`)
  }
}

console.log(
  `\nDone! ${totalUpdated} placeholders updated, ${totalSkipped} already had src (skipped).`
)
