import type {
  LoopStep,
  PersonalFoodSystemReportV1,
  ReportSection,
} from "@/lib/report/deterministic/report-types"
import type { VisualAccent } from "@/lib/report/visual-token"

import { presentationCopyFor } from "./frozen-copy"
import { renderKey, type PresentationRegion } from "./keys"

/**
 * The Presentation Model — Phase 4B-S2.
 *
 * ══ ONE TRUTH, TWO RENDER TARGETS ═══════════════════════════════════════════
 *
 * Frozen principle: web and print are two render targets of the SAME customer
 * truth. PDF and email are delivery concerns and belong to S3.
 *
 * This is not a theoretical tidiness. `food-system-section.tsx` records that
 * the PDF renderer "still renders the legacy DeepReport shape and knows nothing
 * about this block", and `lens-section.tsx` records the intended discipline as
 * a hand-maintained promise that "the PDF orders it the same way". Web and
 * print have already drifted apart once, by each making its own ordering and
 * inclusion decisions in its own JSX. A shared model is the fix for that, and
 * only if it is genuinely output-agnostic — so there is no JSX here, no CSS
 * class, no Tailwind, and no hex.
 *
 * ══ WHAT MAY CROSS THE BOUNDARY ═════════════════════════════════════════════
 *
 * The S1 exposure allowlist, enforced by construction rather than by review.
 * Emitted: foundation, section titles, proposition text, loop week and beat,
 * the customer's quotation, the reviewed safety note, and `finalisedAt`.
 *
 * READ but never emitted: `safety.state` and `safety.specificFoodsSuppressed`.
 * They may decide WHICH blocks exist — that is presentation logic — and they
 * may not appear in the output.
 *
 * Never emitted at all: `proposition.id`, `sources`, `sourceQuestionIds`,
 * `sourceFields`, `basis`, `allowedUse`, `target`, `templateId`,
 * `evidenceStatus`, `requiredCapabilities`, `suppressionReasons`, and every
 * `provenance` field except `finalisedAt`. That is engine identity, permission
 * bookkeeping and science-contract versioning: it is how the Report was
 * authorised, not what the customer was told.
 *
 * ══ THIS MODEL INVENTS NOTHING ══════════════════════════════════════════════
 *
 * Every customer-visible string is copied from the canonical Report, or from
 * reviewed copy FROZEN FOR THAT REPORT'S RECORDED CONTENT-PACK VERSION. There
 * are no computed summaries, no derived counts, no scores, no bands. The
 * canonical document has no metric of any kind by design, and a presentation
 * layer that added one would be asserting something no reviewed content pack
 * authorised.
 *
 * The loop heading is the one string the Report cannot carry itself —
 * `thirtyDayLoop` is an ARRAY, not a `ReportSection` — and it took two attempts
 * to get right. The first version invented a heading. The second read the LIVE
 * `STRUCTURAL_COPY`, which looks like the fix and is a different bug wearing
 * its clothes: it would wrap tomorrow's wording around today's immutable bytes
 * the day the pack version moves. It now comes from `frozen-copy.ts`, selected
 * by the Report's own `provenance.contentPackVersion`.
 *
 * ══ THE QUOTATION IS ATOMIC ═════════════════════════════════════════════════
 *
 * `quotation.text` is built by `proposition.ts` as
 *
 *     `${STRUCTURAL_COPY.quotationLeadIn} “${answer}”`
 *
 * — the attribution and the customer's own quoted words are ONE reviewed
 * string, and `compose.ts` records the intent: the words appear in quotation
 * marks after a lead-in that attributes them to the customer.
 *
 * A renderer may give that whole sentence a quotation treatment. It may NOT
 * split it to typeset the quoted half on its own. Cutting a reviewed string to
 * restyle part of it is the presentation layer editorialising the one piece of
 * content the architecture protects hardest — the narrative layer excludes
 * `quotation` from rewriting entirely, so that the only words the customer
 * wrote never leave the application in a form anybody edited.
 */

/* ══ Colour, as intent rather than as a value ══════════════════════════════ */

/**
 * Colour travels as an accent NAME plus what it is for.
 *
 * Never a hex and never `var(--icon-*)`: the raw hues measure 1.55:1 to 2.96:1
 * on white and fail WCAG AA as copy, so which getter a renderer reaches for is
 * a correctness decision, not a styling one. Naming the intent here means each
 * target resolves it with its own calibrated getter — `accentText` on the web,
 * the matching one in `lib/pdf/pdf-brand.ts` in print — and neither target can
 * accidentally paint body copy with a fill colour.
 */
export type AccentIntent = "fill" | "text"

export interface PresentationAccent {
  readonly accent: VisualAccent
  readonly intent: AccentIntent
}

/* ══ Page-break semantics, as data ════════════════════════════════════════ */

/**
 * What print should do at this block.
 *
 * `app/globals.css` carries 238 lines of working A4 print CSS, hooked entirely
 * to `.rpt-*` marker classes. Carrying the intent here rather than hard-coding
 * class names in JSX keeps the decision in the shared model, where S3's PDF can
 * read the same field instead of re-deciding where pages break.
 */
export type PrintBreak = "page-before" | "avoid-inside" | "none"

/* ══ Lines ════════════════════════════════════════════════════════════════ */

/**
 * One rendered sentence.
 *
 * `text` and a key, and deliberately nothing else. Every other field on a
 * `ReportProposition` is engine-room, and a line that carried "which template
 * produced me" would put that in the DOM the first time somebody spread it onto
 * an element.
 */
export interface PresentationLine {
  readonly key: string
  readonly text: string
}

/* ══ Blocks ═══════════════════════════════════════════════════════════════ */

/**
 * A discriminated union rather than a generic block with optional everything.
 *
 * The five set-pieces the design elevates — snapshot, lever, loop, family,
 * closing — differ in SHAPE, not only in styling, and a renderer that received
 * `{ title, lines }` for all of them would have to re-derive which is which
 * from the title string.
 */
export type PresentationBlock =
  | {
      readonly kind: "prose"
      readonly region: PresentationRegion
      readonly key: string
      readonly title: string
      readonly lines: readonly PresentationLine[]
      readonly accent: PresentationAccent
      readonly printBreak: PrintBreak
    }
  | {
      readonly kind: "lever"
      readonly region: "lever"
      readonly key: string
      readonly title: string
      /** Exactly one. The Report's whole point is that there is one place to start. */
      readonly line: PresentationLine
      readonly accent: PresentationAccent
      readonly printBreak: PrintBreak
    }
  | {
      readonly kind: "loop"
      readonly region: "loop"
      readonly key: string
      readonly title: string
      readonly steps: readonly {
        readonly key: string
        readonly week: 1 | 2 | 3 | 4
        readonly beat: string
        readonly text: string
      }[]
      readonly accent: PresentationAccent
      readonly printBreak: PrintBreak
    }
  | {
      readonly kind: "quotation"
      readonly region: "quotation"
      readonly key: string
      /** The customer's own words. Quoted, never read, never restyled. */
      readonly text: string
      readonly printBreak: PrintBreak
    }
  | {
      readonly kind: "note"
      readonly region: "safety"
      readonly key: string
      /** Reviewed copy. Present only when the canonical Report carries one. */
      readonly text: string
      readonly accent: PresentationAccent
      readonly printBreak: PrintBreak
    }

/**
 * What the projection can answer.
 *
 * A refusal is a VALUE, following the rule `lib/report/persisted/outcomes.ts`
 * sets for the persistence service: throwing here would make "this build cannot
 * present this Report faithfully" indistinguishable from a crash, at the one
 * boundary that decides whether a customer is shown a document or an apology.
 *
 * A union rather than `PresentationReport | null` so a second reason can arrive
 * without reshaping every caller, and so a customer-facing route can map it
 * onto the frozen external outcomes when one eventually exists.
 */
export type PresentationResult =
  | { readonly ok: true; readonly report: PresentationReport }
  | {
      readonly ok: false
      readonly reason: "unsupported-content-pack-version"
      readonly detail: string
    }

export interface PresentationReport {
  readonly foundation: "you" | "family"
  /** ISO instant, from `provenance.finalisedAt`. The only provenance field shown. */
  readonly finalisedAt: string
  /** In presentation order. The ORDER IS THE MODEL'S, not the renderer's. */
  readonly blocks: readonly PresentationBlock[]
}

/* ══ Projection ═══════════════════════════════════════════════════════════ */

function linesFrom(section: ReportSection, region: PresentationRegion): PresentationLine[] {
  return section.propositions.map((proposition, index) => ({
    key: renderKey(region, index),
    // `.text` and nothing else. Spreading the proposition would carry every
    // engine field across the boundary in one keystroke.
    text: proposition.text,
  }))
}

function loopStepsFrom(steps: readonly LoopStep[]) {
  return steps.map((step, index) => ({
    key: renderKey("loop", index),
    week: step.week,
    beat: step.beat,
    text: step.proposition.text,
  }))
}

/**
 * Canonical Report → what a customer may see.
 *
 * ══ THE EMPTY-CONSTRAINTS SHAPE IS THE NORMAL ONE ═══════════════════════════
 *
 * `constraints` composes EMPTY today, and will until the dietetic gate closes:
 * the composer builds constraint propositions against the `foodTools` target,
 * which needs the `specificFoods` capability, which that gate disables — so all
 * fifteen constraint sentences are suppressed at the admission boundary.
 *
 * A block with a heading and no sentences reads as a hole where a promise was,
 * so an empty section is OMITTED.
 *
 * What fills the gap depends on the safety state, and for one state nothing
 * does. `report-safety.ts` sets a note for `unresolved-avoidance`,
 * `undisclosed` and `contradictory`, and NOT for `constraints-known` — the
 * state where the customer actually told us what they work around. Those
 * Reports currently say nothing about constraints at all.
 *
 * That silence is left visible on purpose. Inventing reassuring copy here would
 * be exactly the "information the canonical Report does not contain" this layer
 * exists to refuse, and a renderer is the wrong place to decide what a customer
 * with a declared allergy is told. `report-presentation-model.test.ts` pins the
 * state so it cannot drift unnoticed, and closing it belongs to whoever owns
 * the content pack and the gate.
 */
export function toPresentation(report: PersonalFoodSystemReportV1): PresentationResult {
  /*
   * The Report's OWN recorded version selects the wording, before a single
   * block is built. Read server-side and never emitted — the exposure tests
   * forbid `provenance` anywhere in the output and name this field directly.
   *
   * An unknown version refuses. Falling back to the newest entry is the one
   * thing that must not happen: it would silently re-word exactly those
   * Reports too old for this build to describe, which are the documents least
   * able to survive being re-worded.
   */
  const copy = presentationCopyFor(report.provenance.contentPackVersion)
  if (!copy) {
    return {
      ok: false,
      reason: "unsupported-content-pack-version",
      /*
       * SERVER-SIDE ONLY. This names an internal pack version, so when a
       * customer-facing route eventually exists it must map onto the frozen
       * external outcome `report_cannot_be_produced` and never reach a browser
       * — S1's external-outcome map already forbids `detail` crossing that
       * boundary. Noted here because this is where the next person wiring a
       * route will be looking.
       */
      detail: `no frozen presentation copy for ${report.provenance.contentPackVersion}`,
    }
  }

  const blocks: PresentationBlock[] = []

  blocks.push({
    kind: "prose",
    region: "snapshot",
    key: renderKey("snapshot"),
    title: report.systemSnapshot.title,
    lines: linesFrom(report.systemSnapshot, "snapshot"),
    accent: { accent: "teal", intent: "text" },
    printBreak: "none",
  })

  // Exactly one lever, guaranteed by the composer's cardinality rule. Guarded
  // rather than indexed blindly: a Report that somehow carried none would
  // otherwise render `undefined` into the customer's single most important
  // sentence.
  const lever = report.priorityLever.propositions[0]
  if (lever) {
    blocks.push({
      kind: "lever",
      region: "lever",
      key: renderKey("lever"),
      title: report.priorityLever.title,
      line: { key: renderKey("lever", 0), text: lever.text },
      accent: { accent: "green", intent: "fill" },
      printBreak: "avoid-inside",
    })
  }

  if (report.thirtyDayLoop.length > 0) {
    blocks.push({
      kind: "loop",
      region: "loop",
      key: renderKey("loop"),
      title: copy.thirtyDayLoopTitle,
      steps: loopStepsFrom(report.thirtyDayLoop),
      accent: { accent: "lime", intent: "fill" },
      printBreak: "page-before",
    })
  }

  if (report.familyContext && report.familyContext.propositions.length > 0) {
    blocks.push({
      kind: "prose",
      region: "family",
      key: renderKey("family"),
      title: report.familyContext.title,
      lines: linesFrom(report.familyContext, "family"),
      accent: { accent: "teal", intent: "text" },
      printBreak: "avoid-inside",
    })
  }

  if (report.constraints.propositions.length > 0) {
    blocks.push({
      kind: "prose",
      region: "constraints",
      key: renderKey("constraints"),
      title: report.constraints.title,
      lines: linesFrom(report.constraints, "constraints"),
      accent: { accent: "orange", intent: "text" },
      printBreak: "avoid-inside",
    })
  }

  // Amber marks strain; the product never shames, so this is never red.
  if (report.safety.note) {
    blocks.push({
      kind: "note",
      region: "safety",
      key: renderKey("safety"),
      text: report.safety.note,
      accent: { accent: "orange", intent: "text" },
      printBreak: "avoid-inside",
    })
  }

  if (report.quotation) {
    blocks.push({
      kind: "quotation",
      region: "quotation",
      key: renderKey("quotation"),
      text: report.quotation.text,
      printBreak: "avoid-inside",
    })
  }

  return {
    ok: true,
    report: {
      foundation: report.foundation,
      finalisedAt: report.provenance.finalisedAt,
      blocks,
    },
  }
}
