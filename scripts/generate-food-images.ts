/**
 * Generate the food library's photography.
 *
 *   npx tsx scripts/generate-food-images.ts            # generate everything missing
 *   npx tsx scripts/generate-food-images.ts garlic     # regenerate specific slugs
 *   npx tsx scripts/generate-food-images.ts --force    # ignore existing files
 *
 * Writes `public/food-library/<slug>.webp`, refreshes the manifest in
 * `lib/food-images.ts`, and emits `public/food-library/_contact-sheet.html`
 * so the whole set can be eyeballed for consistency before committing.
 *
 * Reuses the house art direction already in production for recipe imagery
 * (`app/api/plate-builder/route.ts` → buildImagePrompt): square, overhead, pure
 * white background, no plate or props. The difference here is that each image is
 * a *single ingredient* portrait rather than a composed dish.
 *
 * Requires OPENAI_API_KEY. Costs a few dollars for the full set of 48.
 * This writes only to the repo — it touches no database and no storage bucket.
 */

import { mkdir, readFile, readdir, writeFile } from "node:fs/promises"
import { existsSync } from "node:fs"
import path from "node:path"
import { foods, type Food } from "../lib/foods"

const OUT_DIR = path.join(process.cwd(), "public", "food-library")
const MANIFEST = path.join(process.cwd(), "lib", "food-images.ts")
const MODEL = process.env.OPENAI_IMAGE_MODEL || "gpt-image-1.5"
const API_KEY = process.env.OPENAI_API_KEY

/** Existing brand food photography, used as a style anchor. */
const STYLE_REFERENCE_DIR = path.join(process.cwd(), "public")
const STYLE_REFERENCE_PATTERN = /^food-\d+\.webp$/

function buildPrompt(food: Food): string {
  return `Create a premium EatoBiotics food library photograph of a single ingredient: ${food.name}.

Visual style:
- Square 1:1 overhead editorial food photography.
- Pure white background only, edge to edge.
- No plate, no bowl, no cutlery, no table, no hands, no props, no packaging, no text, no labels.
- A single subject: ${food.name}, presented on its own as a clean specimen study.
- Premium health-food campaign quality: crisp detail, appetising, fresh, vivid natural colour, high contrast, soft even lighting with a gentle contact shadow.
- Match the EatoBiotics reference style: isolated ingredients on white, vivid greens, warm golds, bright fermented accents, polished social content.

Composition:
- Centre the subject with generous even white margin on all four sides.
- Show it the way someone would actually encounter it: ${presentationHint(food)}.
- Keep the silhouette clean and readable as a small thumbnail.
- Do not crop the subject at the frame edge. Do not tile or repeat the subject into a pattern.

The image must look like a single newly photographed ingredient, not a composed dish and not a copy of a reference image.`
}

/** A short, category-aware hint so each food is shown in a sensible form. */
function presentationHint(food: Food): string {
  switch (food.category) {
    case "Fermented":
      return "a generous portion of the ferment itself, glossy and textural, loosely heaped"
    case "Dairy":
      return "the dairy product itself, fresh and appetising, with visible texture"
    case "Fats & Oils":
      return "the whole ingredient alongside a small pour or pool of its oil"
    case "Nuts & Seeds":
      return "a loose scattered handful with a few broken open to show the interior"
    case "Grains & Legumes":
      return "a loose heap of the raw grain or legume with a few grains scattered nearby"
    case "Herbs & Spices":
      return "the fresh form together with a small mound of the ground or dried form"
    case "Protein":
      return "a single prepared portion, cooked and appetising"
    case "Fruit":
      return "whole fruit with one cut open to reveal the flesh"
    case "Sea Vegetables":
      return "the dried or rehydrated form arranged loosely to show its texture"
    default:
      return "whole and fresh, with one piece cut or halved to show the interior"
  }
}

async function loadStyleReferences(): Promise<{ bytes: Buffer; filename: string }[]> {
  try {
    const entries = await readdir(STYLE_REFERENCE_DIR)
    const matches = entries.filter((f) => STYLE_REFERENCE_PATTERN.test(f)).sort()
    const picked = matches.slice(0, 3)
    return Promise.all(
      picked.map(async (filename) => ({
        filename,
        bytes: await readFile(path.join(STYLE_REFERENCE_DIR, filename)),
      }))
    )
  } catch {
    return []
  }
}

/** Deterministic per-slug pick so re-runs stay stable. */
function hash(value: string): number {
  let h = 0
  for (let i = 0; i < value.length; i++) h = (h * 31 + value.charCodeAt(i)) | 0
  return Math.abs(h)
}

async function generate(
  food: Food,
  references: { bytes: Buffer; filename: string }[]
): Promise<Buffer> {
  const prompt = buildPrompt(food)

  // With a style reference we use the edits endpoint (as the plate builder does);
  // without one we fall back to plain generation so the script still works.
  let response: Response
  if (references.length > 0) {
    const reference = references[hash(food.slug) % references.length]
    const form = new FormData()
    form.append("model", MODEL)
    form.append("prompt", prompt)
    form.append("size", "1024x1024")
    form.append("quality", "high")
    form.append("n", "1")
    form.append(
      "image[]",
      new Blob([new Uint8Array(reference.bytes)], { type: "image/webp" }),
      reference.filename
    )
    response = await fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: { Authorization: `Bearer ${API_KEY}` },
      body: form,
    })
  } else {
    response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        prompt,
        size: "1024x1024",
        quality: "high",
        n: 1,
      }),
    })
  }

  if (!response.ok) {
    throw new Error(`${response.status} ${await response.text()}`)
  }

  const payload = (await response.json()) as {
    data?: { b64_json?: string; url?: string }[]
  }
  const item = payload.data?.[0]
  if (item?.b64_json) return Buffer.from(item.b64_json, "base64")
  if (item?.url) {
    const image = await fetch(item.url)
    return Buffer.from(await image.arrayBuffer())
  }
  throw new Error("No image data in response")
}

async function toWebp(png: Buffer): Promise<Buffer> {
  const { default: sharp } = await import("sharp")
  return sharp(png).resize(900, 900, { fit: "cover" }).webp({ quality: 82 }).toBuffer()
}

async function writeManifest(slugs: string[]) {
  const source = await readFile(MANIFEST, "utf8")
  const list = slugs.length
    ? `[\n${slugs.map((s) => `  "${s}",`).join("\n")}\n]`
    : "[]"
  const next = source.replace(
    /export const FOOD_IMAGE_SLUGS: string\[\] = [\s\S]*?\n\]|export const FOOD_IMAGE_SLUGS: string\[\] = \[\]/,
    `export const FOOD_IMAGE_SLUGS: string[] = ${list}`
  )
  await writeFile(MANIFEST, next)
}

async function writeContactSheet(slugs: string[]) {
  const cells = slugs
    .map(
      (slug) => `<figure><img src="./${slug}.webp" alt="${slug}" loading="lazy"><figcaption>${slug}</figcaption></figure>`
    )
    .join("\n")
  const html = `<!doctype html><meta charset="utf-8"><title>Food library contact sheet</title>
<style>
body{margin:0;padding:32px;background:#fff;font:14px/1.4 system-ui,sans-serif;color:#1A2E12}
h1{font:600 24px/1.2 Georgia,serif;margin:0 0 4px}
p{color:#5A6E50;margin:0 0 28px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:20px}
figure{margin:0}
img{width:100%;aspect-ratio:1;object-fit:cover;border-radius:12px;background:#F5F7F1}
figcaption{margin-top:6px;color:#5A6E50;font-size:12px}
</style>
<h1>Food library — contact sheet</h1>
<p>${slugs.length} images. Check for consistent lighting, background and scale; regenerate any outliers with <code>npx tsx scripts/generate-food-images.ts &lt;slug&gt;</code>.</p>
<div class="grid">
${cells}
</div>`
  await writeFile(path.join(OUT_DIR, "_contact-sheet.html"), html)
}

async function main() {
  const args = process.argv.slice(2)
  const force = args.includes("--force")
  const only = args.filter((a) => !a.startsWith("--"))

  if (!API_KEY) {
    console.error("OPENAI_API_KEY is not set. Export it and re-run.")
    process.exit(1)
  }

  await mkdir(OUT_DIR, { recursive: true })
  const references = await loadStyleReferences()
  console.log(
    references.length
      ? `Style references: ${references.map((r) => r.filename).join(", ")}`
      : "No style references found — falling back to plain generation."
  )

  const targets = foods.filter((food) => {
    if (only.length && !only.includes(food.slug)) return false
    if (force) return true
    return !existsSync(path.join(OUT_DIR, `${food.slug}.webp`))
  })

  console.log(`${targets.length} image(s) to generate.\n`)

  const failed: string[] = []
  for (const [index, food] of targets.entries()) {
    const label = `[${index + 1}/${targets.length}] ${food.slug}`
    try {
      process.stdout.write(`${label} … `)
      const png = await generate(food, references)
      const webp = await toWebp(png)
      await writeFile(path.join(OUT_DIR, `${food.slug}.webp`), webp)
      console.log(`${(webp.length / 1024).toFixed(0)}KB`)
    } catch (error) {
      failed.push(food.slug)
      console.log(`FAILED — ${(error as Error).message.slice(0, 160)}`)
    }
    // Gentle on rate limits.
    if (index < targets.length - 1) await new Promise((r) => setTimeout(r, 1200))
  }

  // Manifest reflects what is actually on disk, not what we attempted.
  const onDisk = foods
    .filter((food) => existsSync(path.join(OUT_DIR, `${food.slug}.webp`)))
    .map((food) => food.slug)

  await writeManifest(onDisk)
  await writeContactSheet(onDisk)

  console.log(`\n${onDisk.length}/${foods.length} foods have images.`)
  if (failed.length) console.log(`Failed: ${failed.join(", ")}`)
  console.log("Contact sheet: public/food-library/_contact-sheet.html")
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
