import { CARD_SHADOW } from "@/components/report/report-section"
import { ScrollReveal } from "@/components/scroll-reveal"
import type {
  PresentationAccent,
  PresentationBlock,
  PresentationReport,
} from "@/lib/report/presentation/model"
import { accentFill, accentText, accentTextOnTint } from "@/lib/report/visual-token"

import { printMarker } from "./print-markers"

/**
 * The canonical Report, rendered — Phase 4B-S2.
 *
 * ══ THE ONE RULE ════════════════════════════════════════════════════════════
 *
 *     canonical Report ─┐
 *                       ├─→ Presentation Model ─→ this renderer
 *     version-frozen  ──┘
 *     reviewed copy
 *
 * The input is a `PresentationReport` and NOTHING UPSTREAM OF IT. This file
 * imports no canonical Report type, no composer, no content pack, no persisted
 * Report module, no trusted answers and none of the S1 access layer — a guard
 * test walks this directory and proves it, so the fence is mechanical rather
 * than remembered.
 *
 * And the rule the fence exists to serve: THIS RENDERER INVENTS NO WORDS.
 * Every customer-visible string in the markup below comes off the model. Not
 * one eyebrow, not one caption, not one "Here's what we found". If a string is
 * needed and the model has none, the answer is never to type it here:
 *
 *   • it is already canonical → it belongs in the Presentation Model, projected
 *     from the Report's own bytes; or
 *   • it is structural presentation copy → it belongs in the version-bound
 *     frozen snapshot (`lib/report/presentation/frozen-copy.ts`), and reaches
 *     the page through the model like everything else.
 *
 * That is what lets S3 build a PDF off the same prepared truth without adding
 * prose of its own, and what stops a €49 document acquiring wording nobody
 * reviewed. Web and print have already drifted once by each deciding things in
 * its own JSX.
 *
 * ══ WHAT THIS FILE IS ALLOWED TO DECIDE ═════════════════════════════════════
 *
 * Typography, rhythm, colour resolution, and where the reader's eye rests.
 * Order, inclusion and page breaks are the model's — they are read, never
 * re-derived. Notice there is no `.filter()` and no `.sort()` below.
 *
 * ══ FINALISED-AT IS CARRIED, NOT SHOWN ══════════════════════════════════════
 *
 * The model exposes `finalisedAt` because S3's delivery needs it. Nothing here
 * prints it, and a test asserts the rendered output does not contain it, so
 * "available in the model" cannot quietly become "on the customer's page".
 *
 * ══ COLOUR SAFETY ══════════════════════════════════════════════════════════
 *
 * The raw brand hues measure 1.55:1–2.96:1 on white and fail AA as copy, and
 * the calibrated `-text` variants invert that on a dark ground. So the ground
 * decides the getter, every time:
 *
 *     white ground   → accentText()
 *     tinted ground  → accentTextOnTint()
 *     dark ground    → the raw hue, or plain white
 *     never text     → accentFill(), for rules, tints and capsules only
 *
 * The model names an INTENT rather than a value for this reason, and
 * `accentCss` below is the single place that turns one into the other.
 */

/* ══ Heading levels ═══════════════════════════════════════════════════════ */

/**
 * The level of the document's own title.
 *
 * A prop, because this document is not always the page. `app/layout.tsx`
 * already supplies the one `<main>` and the skip link, and a fixed `h1` here
 * would produce a second one the moment the Report is embedded under a page
 * that has its own. Block titles sit one level down, loop steps one below that.
 */
export type DocumentHeadingLevel = 1 | 2

type Level = 1 | 2 | 3 | 4

function Heading({
  level,
  className,
  style,
  children,
}: {
  level: Level
  className?: string
  style?: React.CSSProperties
  children: React.ReactNode
}) {
  const Tag = `h${level}` as "h1" | "h2" | "h3" | "h4"
  return (
    <Tag className={className} style={style}>
      {children}
    </Tag>
  )
}

/* ══ Colour ═══════════════════════════════════════════════════════════════ */

/** The single place an accent intent becomes a CSS value. See the note above. */
function accentCss(accent: PresentationAccent): string {
  return accent.intent === "fill" ? accentFill(accent.accent) : accentText(accent.accent)
}

/** A calm wash of an accent, for a block that needs a ground rather than a rule. */
function tint(accent: PresentationAccent, percent: number): string {
  return `color-mix(in srgb, var(--icon-${accent.accent}) ${percent}%, #fff)`
}

/* ══ Blocks ═══════════════════════════════════════════════════════════════ */

function section(printBreak: PresentationBlock["printBreak"], extra: string): string {
  const marker = printMarker(printBreak)
  return marker ? `${extra} ${marker}` : extra
}

/**
 * Snapshot, household and constraints: chaptered prose.
 *
 * A coloured serif heading and sentences that are allowed to breathe. No card,
 * no tile, no rule — the document's body is meant to read as writing, and the
 * set-pieces earn their weight by being the exception.
 */
function ProseBlock({
  block,
  level,
}: {
  block: Extract<PresentationBlock, { kind: "prose" }>
  level: Level
}) {
  return (
    <section className={section(block.printBreak, "px-5 py-10 sm:py-14")}>
      <div className="mx-auto max-w-2xl">
        <Heading
          level={level}
          className="font-serif text-2xl font-bold tracking-tight text-balance sm:text-3xl"
          style={{ color: accentCss(block.accent) }}
        >
          {block.title}
        </Heading>
        <div className="mt-5 space-y-4">
          {block.lines.map((line) => (
            <p key={line.key} className="text-[17px] leading-[1.75] text-foreground">
              {line.text}
            </p>
          ))}
        </div>
      </div>
    </section>
  )
}

/**
 * The priority lever: one sentence, given a whole movement.
 *
 * The Report's entire argument is that there is one place to start, so this is
 * the only place in the document where a single sentence is set at display
 * size. Making it look like the others would be an editorial claim that it is
 * like the others.
 */
function LeverBlock({
  block,
  level,
}: {
  block: Extract<PresentationBlock, { kind: "lever" }>
  level: Level
}) {
  return (
    <section className={section(block.printBreak, "px-5 py-10 sm:py-14")}>
      <div
        className="mx-auto max-w-2xl overflow-hidden rounded-3xl border border-border"
        style={{ background: tint(block.accent, 8), boxShadow: CARD_SHADOW }}
      >
        <div className="h-1.5 w-full" style={{ background: accentFill(block.accent.accent) }} />
        <div className="px-6 py-8 sm:px-10 sm:py-10">
          <Heading
            level={level}
            className="text-xs font-bold uppercase tracking-[0.18em]"
            style={{ color: accentTextOnTint(block.accent.accent) }}
          >
            {block.title}
          </Heading>
          <p className="mt-4 font-serif text-[22px] leading-[1.45] text-foreground text-balance sm:text-[28px]">
            {block.line.text}
          </p>
        </div>
      </div>
    </section>
  )
}

/**
 * The four-week loop.
 *
 * `label` and `beat` both arrive finished. `week` is present on the step and is
 * deliberately not printed on its own — the reviewed label already contains it,
 * and rendering the bare numeral somewhere else would put a second, unreviewed
 * way of naming a week on the page.
 */
function LoopBlock({
  block,
  level,
}: {
  block: Extract<PresentationBlock, { kind: "loop" }>
  level: Level
}) {
  const stepLevel = (level + 1) as Level
  return (
    <section className={section(block.printBreak, "px-5 py-10 sm:py-14")}>
      <div className="mx-auto max-w-2xl">
        {/*
          The loop's accent is a FILL, so it becomes a mark rather than the
          heading's colour — the one getter that is safe for an accent named
          this way. It also stops this heading reading as a prose chapter that
          simply lost its colour: the loop is a set-piece, like the lever, and
          should look chosen. The shape echoes the hero and the closing band.
        */}
        <div className="biotic-pill mb-5" style={{ background: accentFill(block.accent.accent) }} />
        <Heading
          level={level}
          className="font-serif text-2xl font-bold tracking-tight text-foreground text-balance sm:text-3xl"
        >
          {block.title}
        </Heading>
        <ol className="mt-6 space-y-3">
          {block.steps.map((step) => (
            <li
              key={step.key}
              data-week={step.week}
              className="rpt-keep rounded-2xl border border-border bg-background px-5 py-5 sm:px-7 sm:py-6"
              style={{ boxShadow: CARD_SHADOW }}
            >
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <Heading
                  level={stepLevel}
                  className="text-xs font-bold uppercase tracking-[0.18em]"
                  style={{ color: accentTextOnTint(block.accent.accent) }}
                >
                  {step.label}
                </Heading>
                <span
                  className="inline-flex items-center rounded-full px-3 py-1 font-serif text-[13px] font-bold"
                  style={{
                    background: tint(block.accent, 14),
                    color: accentTextOnTint(block.accent.accent),
                  }}
                >
                  {step.beat}
                </span>
              </div>
              <p className="mt-3 text-[17px] leading-[1.7] text-foreground">{step.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

/**
 * The reviewed safety note.
 *
 * Amber marks strain, and is never red: this product does not shame anybody for
 * what they eat. Set on white with an amber rule and amber copy, because the
 * calibrated text variant is AA on white and stops being AA on a tint.
 */
function NoteBlock({ block }: { block: Extract<PresentationBlock, { kind: "note" }> }) {
  return (
    <section className={section(block.printBreak, "px-5 py-6")}>
      <div className="mx-auto max-w-2xl">
        <p
          className="border-l-[3px] py-1 pl-4 text-[15px] leading-relaxed"
          style={{
            borderColor: accentFill(block.accent.accent),
            color: accentCss(block.accent),
          }}
        >
          {block.text}
        </p>
      </div>
    </section>
  )
}

/**
 * The customer's own words, as the document's ending.
 *
 * Dark, because the document should close the way it opened, and because the
 * last thing a reader sees should be the one thing in here they wrote
 * themselves.
 *
 * `text` is rendered WHOLE. It is one reviewed string — the attributing lead-in
 * and the quoted answer together — and the narrative layer refuses to rewrite
 * it at all. Splitting it to typeset the quoted half on its own would be this
 * layer editorialising the one piece of content the architecture protects
 * hardest, so there is no `.split()` and no second field to split on.
 */
function QuotationBlock({ block }: { block: Extract<PresentationBlock, { kind: "quotation" }> }) {
  return (
    <section
      className={section(block.printBreak, "rpt-quote px-5 py-14 sm:py-20")}
      // Explicit colour for the same reason as the hero: print forces
      // `color: inherit` inside this band, and an undeclared colour inherits
      // dark-on-dark from `body`.
      style={{ background: "var(--foreground)", color: "#ffffff" }}
    >
      <figure className="mx-auto max-w-2xl">
        <div className="biotic-pill mb-7" style={{ background: accentFill("lime") }} />
        <blockquote className="font-serif text-[22px] italic leading-[1.5] text-white text-balance sm:text-[30px]">
          {block.text}
        </blockquote>
      </figure>
    </section>
  )
}

/* ══ The document ═════════════════════════════════════════════════════════ */

/**
 * Renders a prepared Report.
 *
 * Never its own `<main>`: the root layout provides the single main landmark and
 * the skip link that targets it, and a second one would break both.
 */
export function CanonicalReportDocument({
  report,
  headingLevel = 1,
}: {
  report: PresentationReport
  headingLevel?: DocumentHeadingLevel
}) {
  const blockLevel = (headingLevel + 1) as Level

  return (
    <article data-foundation={report.foundation}>
      {/*
        `color` is set explicitly alongside the background, not left to the
        Tailwind text class alone. The print stylesheet forces `color: inherit`
        on everything inside a dark band so the band keeps its own colour — with
        no colour declared on the band itself that inherits from `body`, which
        print sets to the SAME dark green as this background. The heading would
        vanish into it, on paper only, where nobody would see it until a
        customer did.
      */}
      <header
        className="rpt-hero px-5 py-16 sm:py-24"
        style={{ background: "var(--foreground)", color: "#ffffff" }}
      >
        <div className="mx-auto max-w-2xl">
          <Heading
            level={headingLevel}
            className="font-serif text-[34px] font-bold leading-[1.1] tracking-tight text-white text-balance sm:text-[52px]"
          >
            {report.documentTitle}
          </Heading>
          <div className="biotic-pill mt-8" style={{ background: accentFill("lime") }} />
        </div>
      </header>

      <div className="section-divider" aria-hidden="true" />

      <div className="bg-background">
        {report.blocks.map((block) => {
          // One `ScrollReveal` per block: one moment at a time, and the reveal
          // wraps the section rather than living inside it, so a block that
          // opts out later changes nothing about the block itself.
          switch (block.kind) {
            case "prose":
              return (
                <ScrollReveal key={block.key}>
                  <ProseBlock block={block} level={blockLevel} />
                </ScrollReveal>
              )
            case "lever":
              return (
                <ScrollReveal key={block.key}>
                  <LeverBlock block={block} level={blockLevel} />
                </ScrollReveal>
              )
            case "loop":
              return (
                <ScrollReveal key={block.key}>
                  <LoopBlock block={block} level={blockLevel} />
                </ScrollReveal>
              )
            case "note":
              return (
                <ScrollReveal key={block.key}>
                  <NoteBlock block={block} />
                </ScrollReveal>
              )
            case "quotation":
              return <QuotationBlock key={block.key} block={block} />
          }
        })}
      </div>
    </article>
  )
}
