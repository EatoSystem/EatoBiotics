import type { PrintBreak } from "@/lib/report/presentation/model"

/**
 * Page-break intent → the marker class that carries it — Phase 4B-S2.
 *
 * ══ WHY A MARKER RATHER THAN AN INLINE STYLE ════════════════════════════════
 *
 * `app/globals.css` already holds working A4 print CSS, hooked entirely to
 * marker classes rather than to component internals. Emitting a marker keeps
 * the canonical document inside that system instead of starting a second one
 * beside it, and it keeps the break rules where a designer can read them all
 * together.
 *
 * ══ WHY THE DECISION IS NOT MADE HERE ═══════════════════════════════════════
 *
 * This is a lookup, not a judgement. WHICH break a block gets is decided in the
 * Presentation Model, because web and print are two render targets of one truth
 * and S3's PDF must be able to read the same field. The two have drifted apart
 * once already, each JSX deciding its own ordering and inclusion — a renderer
 * that chose its own breaks would restart exactly that.
 */

const MARKER: Record<PrintBreak, string> = {
  /** Start this block on a fresh sheet. */
  "page-before": "rpt-break-before",
  /** Never split this block across two sheets. */
  "avoid-inside": "rpt-keep",
  /** Let it flow. Deliberately an empty string, not a class that does nothing. */
  none: "",
}

export function printMarker(printBreak: PrintBreak): string {
  return MARKER[printBreak]
}
