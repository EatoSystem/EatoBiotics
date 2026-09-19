import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs"

/**
 * Read the visible text out of a generated PDF — Phase 4B-S3A.
 *
 * ══ WHY A REAL PDF ENGINE AND NOT A STRING SEARCH ═══════════════════════════
 *
 * Because a string search over the bytes finds NOTHING, and would therefore
 * "prove" that every forbidden value is absent from a document in which
 * nothing at all is findable. Measured during the S3 survey:
 *
 *   raw buffer contains a canary?                    no — FlateDecode
 *   inflate + decode <hex> TJ runs, base-14 fonts    yes
 *   inflate + decode <hex> TJ runs, BRANDED fonts    nothing recoverable
 *   pdfjs-dist, BRANDED fonts                        full text recovered
 *
 * The first conclusion drawn from those middle rows was that branded PDFs are
 * mechanically unextractable. That was wrong, and the review caught it: a
 * custom TJ decoder ignores the embedded font mappings a real engine uses. The
 * lesson kept here is the narrow one — a naive byte assertion is vacuous, and
 * a vacuous absence test is worse than none because it is trusted.
 *
 * ══ THE WHITESPACE RULE, AND ITS LIMIT ══════════════════════════════════════
 *
 * `getTextContent()` emits one item per laid-out run, and a soft wrap ends an
 * item. Joining with "" welds the halves: a wrapped "Fewer rushed mornings"
 * came back as "Fewer rushedmornings". So items are joined with a SPACE and
 * the result is whitespace-collapsed.
 *
 * That is a rule proven for THIS renderer's output over the fixture corpus, not
 * a universal claim about PDF. If future typography splits a styled run inside
 * a word, this normaliser would insert a space that is not there and exact
 * equality would fail — which is the correct outcome. The gate should then
 * force a look at the extractor, NOT a quiet loosening of the comparison.
 */

/** Collapse runs of whitespace. Applied to both sides of every comparison. */
export function normaliseSpace(value: string): string {
  return value.replace(/\s+/g, " ").trim()
}

/**
 * Every string a reader would see, in reading order, whitespace-normalised.
 *
 * An item boundary becomes a space because it is always whitespace in reading
 * order for this renderer — either a block boundary or a soft wrap, never a
 * word join. See the limit above.
 */
export async function pdfVisibleText(pdf: Buffer): Promise<string> {
  const doc = await getDocument({
    data: new Uint8Array(pdf),
    useSystemFonts: false,
    // Silence is not a virtue in a test harness, but pdfjs warns about font
    // subsets on every page and the noise buries real failures.
    verbosity: 0,
  }).promise

  const pages: string[] = []
  for (let page = 1; page <= doc.numPages; page += 1) {
    const content = await (await doc.getPage(page)).getTextContent()
    pages.push(
      content.items
        .map((item) => ("str" in item ? item.str : ""))
        .join(" "),
    )
  }
  return normaliseSpace(pages.join(" "))
}

/** Physical page count, read from the document rather than guessed. */
export async function pdfPageCount(pdf: Buffer): Promise<number> {
  const doc = await getDocument({ data: new Uint8Array(pdf), useSystemFonts: false, verbosity: 0 })
    .promise
  return doc.numPages
}
