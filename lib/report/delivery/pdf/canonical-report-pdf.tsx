import React from "react"
import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer"

import { FONT } from "@/lib/pdf/pdf-fonts"
import type { PresentationBlock, PresentationReport } from "@/lib/report/presentation/model"

import { accentColour, breakProps, fill, textOnTint, tint } from "./pdf-tokens"

/**
 * The canonical Report as a PDF — Phase 4B-S3A.
 *
 * ══ NOT A PUBLIC ENTRY POINT ════════════════════════════════════════════════
 *
 * Production code reaches a PDF through `render.ts` and nowhere else, because
 * the FONT GATE lives there. `lib/pdf/pdf-fonts.ts` deliberately degrades to
 * Helvetica when the brand files are missing — correct for the legacy report
 * ("a plainer PDF instead of no PDF"), and NOT the standard for the canonical
 * €49 artifact, where a silently plainer document is a different document.
 *
 * Importing this module directly would render straight past that gate. A guard
 * asserts that only `render.ts` and the tests do so.
 *
 * ══ THE RULE, UNCHANGED FROM THE WEB TARGET ═════════════════════════════════
 *
 *     canonical Report ─┐
 *                       ├─→ Presentation Model ─→ this target
 *     version-frozen  ──┘
 *     reviewed copy
 *
 * The input is a `PresentationReport` and nothing upstream of it. This target
 * authors NO customer-visible word — not a heading, not a caption, not a page
 * number, not a date, not a footer line, not a disclaimer.
 *
 * Page numbers are words too. react-pdf offers `render={({pageNumber}) => …}`
 * and a fixed footer costs one line, which is exactly why it is called out:
 * "Page 1 of 3" is customer-visible text no content pack authorised, and the
 * web Report shows nothing of the kind. If pagination furniture is ever wanted
 * it becomes reviewed copy on the model first.
 *
 * ══ WHAT THIS FILE MAY DECIDE ═══════════════════════════════════════════════
 *
 * Type sizes, spacing, and how a block sits on a sheet. NOT order, NOT
 * inclusion, NOT page breaks — those are read from the model. There is no
 * `.filter()`, no `.sort()`, and no `break` or `wrap` written inline: every
 * pagination instruction comes through `breakProps`.
 */

/* ══ Styles ═══════════════════════════════════════════════════════════════ */

/**
 * ══ NO `letterSpacing` IN THIS DOCUMENT, AND THE REASON IS NOT TASTE ════════
 *
 * The web target sets a wide tracking on the two eyebrow labels. Ported here,
 * it broke the phase's binding gate, immediately and loudly:
 *
 *     expected  "… Where to start …"
 *     extracted "… W h e r e  t o  s t a r t …"
 *
 * react-pdf implements letter spacing by emitting each glyph as its own
 * positioned run, so pdfjs reports one text item per LETTER. The extractor's
 * rule — an item boundary is whitespace in reading order — is then false, and
 * the document's own words stop being mechanically checkable.
 *
 * The tempting fix is to teach the normaliser to re-join single-character
 * runs. That is the wrong way round: it would weaken the comparison until the
 * typography passed, and the next real defect of the same shape would be
 * absorbed silently. A €49 document that can be verified is worth more than
 * one with prettier small caps, so the TYPOGRAPHY yields and the invariant
 * stays true.
 *
 * Weight, size and case carry the eyebrow treatment instead. If tracking is
 * ever genuinely needed, the extractor has to be revisited first — deliberately
 * and with the gate red, not by loosening the comparison.
 */

const INK = "#1A2E12"
const BODY = "#1A2E12"
const RULE = "#E5E5E5"

const styles = StyleSheet.create({
  page: { paddingTop: 0, paddingBottom: 48, paddingHorizontal: 0, backgroundColor: "#ffffff" },
  band: { backgroundColor: INK, paddingVertical: 48, paddingHorizontal: 56 },
  bandTitle: { fontFamily: FONT.serifBold, fontSize: 30, color: "#ffffff", lineHeight: 1.15 },
  pill: { width: 56, height: 6, borderRadius: 3, marginTop: 22 },
  pillAbove: { width: 56, height: 6, borderRadius: 3, marginBottom: 18 },

  section: { paddingHorizontal: 56, paddingTop: 30 },
  proseHeading: { fontFamily: FONT.serifBold, fontSize: 17, marginBottom: 12 },
  proseLine: { fontFamily: FONT.sans, fontSize: 11, lineHeight: 1.65, color: BODY, marginBottom: 9 },

  leverCard: { borderRadius: 10, overflow: "hidden" },
  leverRule: { height: 5 },
  leverBody: { paddingVertical: 22, paddingHorizontal: 26 },
  leverEyebrow: { fontFamily: FONT.sansBold, fontSize: 8, marginBottom: 10 },
  leverLine: { fontFamily: FONT.serif, fontSize: 17, lineHeight: 1.45, color: BODY },

  loopHeading: { fontFamily: FONT.serifBold, fontSize: 17, color: BODY, marginBottom: 14 },
  step: { borderWidth: 1, borderColor: RULE, borderStyle: "solid", borderRadius: 8, padding: 16, marginBottom: 10 },
  stepRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  stepLabel: { fontFamily: FONT.sansBold, fontSize: 8 },
  stepBeat: { fontFamily: FONT.serifBold, fontSize: 9, paddingVertical: 3, paddingHorizontal: 9, borderRadius: 9, marginLeft: 10 },
  stepText: { fontFamily: FONT.sans, fontSize: 11, lineHeight: 1.6, color: BODY },

  note: { borderLeftWidth: 3, borderLeftStyle: "solid", paddingLeft: 14, paddingVertical: 4 },
  noteText: { fontFamily: FONT.sans, fontSize: 10, lineHeight: 1.6 },

  quote: { fontFamily: FONT.serifItalic, fontSize: 17, lineHeight: 1.5, color: "#ffffff" },
})

/* ══ Blocks ═══════════════════════════════════════════════════════════════ */

function Prose({ block }: { block: Extract<PresentationBlock, { kind: "prose" }> }) {
  return (
    <View style={styles.section} {...breakProps(block.printBreak)}>
      <Text style={[styles.proseHeading, { color: accentColour(block.accent) }]}>{block.title}</Text>
      {block.lines.map((line) => (
        <Text key={line.key} style={styles.proseLine}>
          {line.text}
        </Text>
      ))}
    </View>
  )
}

function Lever({ block }: { block: Extract<PresentationBlock, { kind: "lever" }> }) {
  return (
    <View style={styles.section} {...breakProps(block.printBreak)}>
      <View style={[styles.leverCard, { backgroundColor: tint(block.accent.accent, 8) }]}>
        {/* Solid, never translucent: a translucent border renders as an
            unrelated hue in react-pdf, twice caught only by rasterising. */}
        <View style={[styles.leverRule, { backgroundColor: fill(block.accent.accent) }]} />
        <View style={styles.leverBody}>
          <Text style={[styles.leverEyebrow, { color: textOnTint(block.accent.accent) }]}>
            {block.title}
          </Text>
          <Text style={styles.leverLine}>{block.line.text}</Text>
        </View>
      </View>
    </View>
  )
}

function Loop({ block }: { block: Extract<PresentationBlock, { kind: "loop" }> }) {
  return (
    <View style={styles.section} {...breakProps(block.printBreak)}>
      <View style={[styles.pillAbove, { backgroundColor: fill(block.accent.accent) }]} />
      <Text style={styles.loopHeading}>{block.title}</Text>
      {block.steps.map((step) => (
        // The step's OWN break intent, from the model. S2's repair: this was
        // once hardcoded, which produced correct paper and an unreadable rule.
        <View key={step.key} style={styles.step} {...breakProps(step.printBreak)}>
          <View style={styles.stepRow}>
            <Text style={[styles.stepLabel, { color: textOnTint(block.accent.accent) }]}>
              {step.label}
            </Text>
            <Text
              style={[
                styles.stepBeat,
                { backgroundColor: tint(block.accent.accent, 14), color: textOnTint(block.accent.accent) },
              ]}
            >
              {step.beat}
            </Text>
          </View>
          <Text style={styles.stepText}>{step.text}</Text>
        </View>
      ))}
    </View>
  )
}

function Note({ block }: { block: Extract<PresentationBlock, { kind: "note" }> }) {
  return (
    <View style={styles.section} {...breakProps(block.printBreak)}>
      <View style={[styles.note, { borderLeftColor: fill(block.accent.accent) }]}>
        <Text style={[styles.noteText, { color: accentColour(block.accent) }]}>{block.text}</Text>
      </View>
    </View>
  )
}

/**
 * The customer's own words, closing the document as they close the page.
 *
 * `text` is rendered WHOLE. One reviewed string — attribution and quoted answer
 * together — which the narrative layer refuses to rewrite at all. There is no
 * `.split()` here and no second field to split on.
 */
function Quotation({ block }: { block: Extract<PresentationBlock, { kind: "quotation" }> }) {
  return (
    <View style={[styles.band, { marginTop: 38 }]} {...breakProps(block.printBreak)}>
      <View style={[styles.pillAbove, { backgroundColor: fill("lime") }]} />
      <Text style={styles.quote}>{block.text}</Text>
    </View>
  )
}

/* ══ The document ═════════════════════════════════════════════════════════ */

/**
 * INTERNAL. Reach a PDF through `renderCanonicalReportPdf` in `render.ts`.
 *
 * No cover page and no forced break after the opening: a ten-sentence Report
 * padded onto a sheet of its own reads as inflated, and a page break is a
 * pagination decision the model does not authorise. The title band opens the
 * document and the body continues straight on.
 */
export function CanonicalReportPdf({ report }: { report: PresentationReport }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.band}>
          <Text style={styles.bandTitle}>{report.documentTitle}</Text>
          <View style={[styles.pill, { backgroundColor: fill("lime") }]} />
        </View>

        {report.blocks.map((block) => {
          switch (block.kind) {
            case "prose":
              return <Prose key={block.key} block={block} />
            case "lever":
              return <Lever key={block.key} block={block} />
            case "loop":
              return <Loop key={block.key} block={block} />
            case "note":
              return <Note key={block.key} block={block} />
            case "quotation":
              return <Quotation key={block.key} block={block} />
          }
        })}
      </Page>
    </Document>
  )
}
