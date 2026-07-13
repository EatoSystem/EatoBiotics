import { promises as fs } from "fs"
import path from "path"
import { chapters as canonicalChapters } from "@/lib/chapters"
import { sha256, mirrorSlug, type SourceChapter, type SourceReadProblem } from "@/lib/cms/chapter-import"

/* Server-only: reads the canonical chapters (lib/chapters.ts metadata +
   content/book/chapter-N.mdx bodies) into the pure SourceChapter shape the
   resolver consumes. Read-only on the filesystem — it never writes MDX or
   lib/chapters.ts. Kept separate from chapter-import.ts so the resolver stays
   pure and unit-testable without touching disk. */

const BOOK_DIR = "content/book"

/** Deterministic hash of the mapped metadata fields (not the body) — lets the
 *  divergence check notice a metadata-only change in lib/chapters.ts. */
function metaHash(c: {
  number: number
  title: string
  summary: string
  part: string
  partTitle: string
  sourcePublished: boolean
  publicationTarget: string[]
}): string {
  return sha256(
    JSON.stringify({
      number: c.number,
      title: c.title,
      summary: c.summary,
      part: c.part,
      partTitle: c.partTitle,
      sourcePublished: c.sourcePublished,
      publicationTarget: c.publicationTarget,
    })
  )
}

export interface LoadedSources {
  sources: SourceChapter[]
  scanned: number                 // MDX files successfully read
  expected: number                // lib/chapters.ts entries
  unreadable: SourceReadProblem[] // source paths that could not be read (missing/unreadable), with reason
}

/** Load every canonical chapter. A file that cannot be read is reported (not
 *  thrown) with a distinct reason so the dry run can surface it and the
 *  validator can BLOCK the import; it is never silently dropped into a smaller
 *  plan. */
export async function loadCanonicalChapters(cwd: string = process.cwd()): Promise<LoadedSources> {
  const expected = canonicalChapters.length
  const unreadable: SourceReadProblem[] = []
  const sources: SourceChapter[] = []

  for (const c of canonicalChapters) {
    const sourcePath = `${BOOK_DIR}/${c.slug}.mdx`
    let body: string
    try {
      body = await fs.readFile(path.join(cwd, sourcePath), "utf8")
    } catch (err) {
      const e = err as NodeJS.ErrnoException
      const reason = e?.code === "ENOENT" ? "file not found" : `read error: ${e?.code ?? e?.message ?? "unknown"}`
      unreadable.push({ sourcePath, reason })
      continue
    }
    const sourcePublished = c.status === "published"
    const publicationTarget = ["website", ...(c.substackUrl ? ["substack"] : [])]
    const summary = c.description ?? ""
    sources.push({
      number: c.number,
      sourceSlug: c.slug,
      mirrorSlug: mirrorSlug(c.slug),
      sourcePath,
      title: c.title,
      summary,
      part: c.part,
      partTitle: c.partTitle,
      body,
      sourcePublished,
      publicationTarget,
      sourceSha256: sha256(body),
      bodySha256: sha256(body), // v1 stores the body verbatim, so body === snapshot
      metaSha256: metaHash({
        number: c.number,
        title: c.title,
        summary,
        part: c.part,
        partTitle: c.partTitle,
        sourcePublished,
        publicationTarget,
      }),
    })
  }

  return { sources, scanned: sources.length, expected, unreadable }
}
