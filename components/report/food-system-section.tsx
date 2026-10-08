"use client"

import type { CSSProperties } from "react"
import * as Icons from "lucide-react"
import { ScrollReveal } from "@/components/scroll-reveal"
import { LensSection } from "@/components/report/lens-section"
import { DigitalTwinFigure } from "@/components/digital-twin/parts"
import { FoodTool, PathwayIcon } from "@/components/report/food-tool"
import { CARD_SHADOW, SectionHeader } from "@/components/report/report-section"
import {
  accentFill,
  accentText,
  accentTextOnTint,
  bioticAccent,
  coerceBiotic,
} from "@/lib/report/visual-token"
import { PATHWAY_LABEL, type BioticScoreKey } from "@/lib/report/subscores"
import type {
  BodyZone,
  FoodSystemNode,
  FoodSystemReport,
} from "@/lib/report/food-system-report-types"

/**
 * Renders the educational Food System report inside the existing paid web report.
 *
 * ── Why this is a separate component ─────────────────────────────────────────
 *
 * Phase 2 (#192) built the `foodSystem` block and nothing rendered it. Phase 3
 * (#193) surfaced it in the existing card idiom. Phase 4 — this — gives it a
 * visual architecture: the body figure is the spine of the chapter, the three
 * pathways sit on a ring around it, chapters are numbered so the block reads as
 * one report, and it closes on the brief's inside-out mission diagram.
 *
 * Everything the Phase 3 version showed is still shown. The redesign changes how
 * the same data is arranged and framed, not how much of it the reader gets.
 *
 * Still not in scope: the legacy paid-report chapters keep their order, and the
 * PDF renderer is untouched — it still renders the legacy DeepReport shape and
 * knows nothing about this block.
 *
 * ── Colour ───────────────────────────────────────────────────────────────────
 *
 * accentFill() for capsules, rings and tints; accentText() for anything the
 * reader reads. The raw --icon-* hues measure 1.55:1–2.96:1 on white and fail AA
 * as copy — that is the bug #184 shipped and #187 fixed, and it is easy to
 * reintroduce here because every section has an accent.
 *
 * ── Language ─────────────────────────────────────────────────────────────────
 *
 * Every string comes from the report object as built. This component adds no
 * health copy of its own, so it cannot weaken the non-diagnostic framing the
 * builder is careful about.
 */

/* ══ 0R-6R · THE STATE TABLES AND `StateBadge` ARE DELETED ══════════════════
 *
 * `STATE_LABEL` turned a per-Biotic band into the words a reader saw — "Well
 * supported", "Building", "Room to grow" — and `STATE_ACCENT` gave each a
 * colour. Together they rendered a personal Prebiotic/Probiotic/Postbiotic
 * STATE in three forms at once: a band word, a colour, and (beside it in
 * `NodeCard`) the number.
 *
 * The old header here argued the right thing for the wrong invariant: "node
 * state must never be conveyed by colour alone — each state carries its own
 * words". That is an accessibility rule, and it was satisfied. The state itself
 * was never ours to show.
 *
 * `FoodSystemNode` no longer carries `state` or `score`, so this file cannot
 * render either — and `foodSystemMap` is now the body signals only, which have
 * a label, a reviewed explanation and a zone token.
 */

const ZONE_ICON: Record<BodyZone, string> = {
  gut: "Donut",
  brain: "Brain",
  energy: "Zap",
  immune: "Shield",
  sleep: "Moon",
  "whole-body": "PersonStanding",
  "family-table": "Users",
}

function NodeIcon({ node, size = 18 }: { node: FoodSystemNode; size?: number }) {
  const name =
    node.visualToken.iconName ??
    (node.visualToken.bodyZone ? ZONE_ICON[node.visualToken.bodyZone] : "Circle")
  const Icon = (Icons as unknown as Record<string, Icons.LucideIcon>)[name] ?? Icons.Circle
  const accent = node.visualToken.accent
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-xl"
      style={{
        width: size + 18,
        height: size + 18,
        background: `color-mix(in srgb, ${accentFill(accent)} 16%, transparent)`,
        color: accentText(accent),
      }}
    >
      <Icon size={size} strokeWidth={2} aria-hidden />
    </span>
  )
}

function NodeCard({ node }: { node: FoodSystemNode }) {
  return (
    <div
      className="rounded-2xl border border-border bg-background p-5 transition-shadow hover:shadow-lg"
      style={{ boxShadow: CARD_SHADOW }}
    >
      <div className="flex items-start gap-3">
        <NodeIcon node={node} />
        <div className="min-w-0 flex-1">
          {/* 0R-6R · the state badge and the "{node.score}/100" beside it are
            * gone with the fields. What a signal card says now is what it is
            * and what to notice — which is all it ever measured. */}
          <p className="text-sm font-bold text-foreground">{node.label}</p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {node.explanation}
          </p>
        </div>
      </div>
    </div>
  )
}

/* ══ 0R-6R · `PathwayScores` IS DELETED ═════════════════════════════════════
 *
 * Three capsules, each with the member's score for one Biotic as a large serif
 * numeral — "71" — a "/100" beside it, the pathway name beneath, and all of it
 * in `bioticAccent(key)`. On the opening chapter of the €49 Report, above the
 * fold.
 *
 * This is the construct Tranche 1 removed from the pre-launch reveal, 2A from
 * `/assessment/results` and the share card, 2C from `sequence-email.ts`, Gate
 * 3.6 from fifteen account sites and 0R-5 from six more. It survived here
 * because the Report family was in no claims corpus until 0R-1 and in no
 * form-track module until 0R-6 — and because `bioticScores` was on the product
 * model, so a renderer only had to ask.
 */

/* ── The body as the spine ───────────────────────────────────────────────────
 *
 * The figure is the chapter's organising visual, not a header image: the three
 * pathways sit on a ring around it, so the reader sees the system before they
 * read about it.
 *
 * Two deliberate departures from OrbitHub (components/digital-twin/orbit-hub.tsx),
 * which is otherwise the reference for this layout:
 *
 *  - No rotation. Orbiting labels are fine on a marketing page; in a report the
 *    reader is comparing three states, and moving text makes that harder.
 *  - The nodes are one DOM list, not a desktop ring plus a mobile copy. Below
 *    `sm` they lay out in normal flow under the figure; from `sm` up the same
 *    elements take their ring position from the --x/--y custom properties. A
 *    second copy would read every label twice to a screen reader.
 */

/*
 * 0R-6R · `RingNode` no longer takes a `state`.
 *
 * Each node carried `STATE_LABEL[state]` under the pathway name, in
 * `accentText(bioticAccent(pathway))` — so the ring around a figure of the
 * member's BODY captioned all three of their Biotic states at once. The old
 * comment on that caption argued it was "not a caption for a colour: remove it
 * and the state is simply gone", which was true and is now the point: the state
 * is gone.
 *
 * The pathway NAME and its colour stay. Those identify which pathway a node is
 * — taxonomy, symmetric across all three, which `visual-token.ts` serves for
 * exactly this purpose — and the ring position is orientation. What left is the
 * only thing on the node that was a claim about the reader.
 */
function RingNode({
  pathway,
  x,
  y,
}: {
  pathway: BioticScoreKey
  x: string
  y: string
}) {
  const accent = bioticAccent(pathway)
  return (
    <li
      // sm:w-28 is what keeps the three nodes symmetrical. Without a fixed
      // width each node sizes to its own state string, so the widest one hits
      // the container edge and wraps while the others do not — which is exactly
      // how "Probiotics / Room to / grow" appeared next to two single-line
      // siblings. Equal width means all three break the same way, or none do,
      // whatever state the report happens to produce.
      className="flex items-center gap-2.5 sm:absolute sm:left-[var(--x)] sm:top-[var(--y)] sm:w-28 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:flex-col sm:gap-1.5 sm:text-center"
      style={{ "--x": x, "--y": y } as CSSProperties}
    >
      <span
        className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border bg-background"
        style={{
          borderColor: `color-mix(in srgb, ${accentFill(accent)} 45%, transparent)`,
          color: accentText(accent),
          boxShadow: CARD_SHADOW,
        }}
      >
        <PathwayIcon biotic={pathway} size={19} />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-bold text-foreground">
          {PATHWAY_LABEL[pathway]}
        </span>
      </span>
    </li>
  )
}

const RING_PATHWAYS: readonly BioticScoreKey[] = ["prebiotics", "probiotics", "postbiotics"]

function FoodSystemHero({ report }: { report: FoodSystemReport }) {
  // Evenly spaced from the top: 12 o'clock, 4 o'clock, 8 o'clock.
  //
  // The outer two sit at 84/16 rather than 90/10 because each node is w-28
  // (112px) centred on its position: at 90% of the 420px container the right
  // edge landed at ~425px, past the container, and the text wrapped. 84% puts
  // it at 409px, and 16% leaves 11px on the left.
  const positions = [
    { x: "50%", y: "4%" },
    { x: "84%", y: "72%" },
    { x: "16%", y: "72%" },
  ]

  return (
    <div className="relative">
      {/* The glow is w-full, not the wider box it wants to be: an oversized
       * absolute child still counts toward document scrollWidth, and a 120%
       * version pushed the page into horizontal overflow at every width up to
       * 768px. blur-3xl spreads the paint past the box anyway, so the visual is
       * unchanged. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 opacity-50 blur-3xl"
        style={{
          background:
            "radial-gradient(50% 50% at 50% 40%, color-mix(in srgb, var(--icon-lime) 30%, transparent), transparent 72%)",
        }}
      />

      <div className="relative mx-auto w-full max-w-[420px] sm:aspect-square">
        {/* Guide rings — decoration. Everything they imply is written below. */}
        <div
          aria-hidden
          className="absolute inset-[6%] hidden rounded-full sm:block"
          style={{ border: "1.5px dashed color-mix(in srgb, var(--icon-green) 26%, transparent)" }}
        />
        <div
          aria-hidden
          className="absolute inset-[20%] hidden rounded-full sm:block"
          style={{ border: "1.5px dashed color-mix(in srgb, var(--icon-orange) 22%, transparent)" }}
        />

        <div className="sm:absolute sm:left-1/2 sm:top-1/2 sm:w-[52%] sm:-translate-x-1/2 sm:-translate-y-1/2">
          <DigitalTwinFigure
            size={240}
            src={report.visualTheme.bodyAssetPath}
            alt={report.title}
            showParticles={false}
          />
        </div>

        {/*
          * 0R-6R · the ring is built from the three pathway KEYS, not from the
          * report. It used to filter `report.foodSystemMap` for the three
          * Biotic nodes and read each one's `state`; `foodSystemMap` is now the
          * body signals, and a pathway node carries no state to read. The three
          * pathways are a constant of the product, so they are written as one.
          */}
        <ul className="mt-6 space-y-3 sm:mt-0 sm:space-y-0">
          {RING_PATHWAYS.map((pathway, i) => (
            <RingNode
              key={pathway}
              pathway={pathway}
              x={positions[i]?.x ?? "50%"}
              y={positions[i]?.y ?? "50%"}
            />
          ))}
        </ul>
      </div>
    </div>
  )
}

/* ── Chapter framing ─────────────────────────────────────────────────────────
 * A numeral per chapter, so the block reads as one report rather than a stack
 * of unrelated cards.
 *
 * The body-led opener is deliberately NOT numbered — it is the chapter's cover,
 * and numbering it would make the first teaching chapter read as the second.
 * So the numerals run 01–07, or 01–08 on a family report, where the household
 * chapter slots in before Evidence. The count is derived at render time for
 * exactly that reason. */

function ChapterHeader({
  number,
  eyebrow,
  title,
  subtitle,
}: {
  number: string
  eyebrow: string
  title: string
  subtitle?: string
}) {
  return (
    <div className="mb-6">
      <div className="mb-3 flex items-center gap-3">
        <span
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-serif text-sm font-semibold text-white"
          style={{ background: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))" }}
        >
          {number}
        </span>
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--icon-green-text)]">
          {eyebrow}
        </p>
      </div>
      <h2 className="font-serif text-2xl font-semibold text-foreground sm:text-3xl text-balance">
        {title}
      </h2>
      {subtitle && <p className="mt-2 leading-relaxed text-muted-foreground">{subtitle}</p>}
    </div>
  )
}

/* ── Chapters 1–9 ────────────────────────────────────────────────────────── */

export function FoodSystemSection({ report }: { report: FoodSystemReport }) {
  // JSX evaluates top-down, so a counter gives stable numbering that closes
  // over the conditional family chapter without hand-maintaining an index.
  // Starts at 01 on the first chapter AFTER the opener; the opener is unnumbered.
  let n = 0
  const ch = () => String(++n).padStart(2, "0")

  return (
    <>
      {/* Chapter 1 — the body-led opener */}
      <section>
        <ScrollReveal>
          <SectionHeader
            eyebrow="Your Food System"
            title={report.title}
            subtitle={report.systemSnapshot.oneLine}
          />
          <div className="space-y-8">
            <FoodSystemHero report={report} />
            <div
              className="rounded-3xl border border-border bg-background p-6 space-y-4"
              style={{ boxShadow: CARD_SHADOW }}
            >
              <p className="text-base leading-relaxed text-foreground/80">
                {report.systemSnapshot.dominantPattern}
              </p>
              <div className="h-px bg-border" />
              <div>
                <p className="mb-1 text-xs font-bold uppercase tracking-widest text-[var(--icon-green-text)]">
                  Your main lever
                </p>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {report.systemSnapshot.mainLever}
                </p>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* Chapters 2–4 — the 3-Biotics engine, taught before anything is recommended */}
      <section>
        <ScrollReveal>
          <ChapterHeader
            number={ch()}
            eyebrow="How It Works"
            title="Your 3-Biotics Engine"
            subtitle="What each pathway does, and what your answers suggest about yours."
          />
          <div className="space-y-4">
            {report.educationModules.map((mod, i) => {
              const accent = mod.visualToken.accent
              return (
                <div
                  key={i}
                  className="rounded-3xl border border-border bg-background p-6 transition-shadow hover:shadow-lg"
                  style={{ boxShadow: CARD_SHADOW }}
                >
                  <div className="mb-4 flex items-center gap-3">
                    <span
                      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                      style={{
                        background: `color-mix(in srgb, ${accentFill(accent)} 16%, transparent)`,
                        color: accentText(accent),
                      }}
                    >
                      <ModuleIcon iconName={mod.visualToken.iconName} />
                    </span>
                    <h3 className="font-serif text-lg font-semibold text-foreground">
                      {mod.title}
                    </h3>
                  </div>
                  <dl className="space-y-3">
                    <Field label="In plain English" value={mod.plainEnglish} />
                    {/*
                      * 0R-6R · the third field is gone. It was labelled "What
                      * your answers suggest" and carried
                      * `BAND_SUGGESTS[pathway][band(score)]` — a possessive
                      * sentence about this reader's state in one Biotic. The
                      * two that remain explain the pathway and why it matters,
                      * which is what this teaching card is for.
                      */}
                    <Field label="Why it matters" value={mod.whyItMatters} />
                  </dl>
                  <div
                    className="mt-4 rounded-xl px-4 py-3"
                    style={{
                      background: `color-mix(in srgb, ${accentFill(accent)} 8%, transparent)`,
                    }}
                  >
                    <p className="text-sm leading-relaxed text-foreground/80">
                      <span
                        className="font-semibold"
                        style={{ color: accentTextOnTint(accent) }}
                      >
                        Try this:{" "}
                      </span>
                      {mod.actionBridge}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </ScrollReveal>
      </section>

      {/*
        ══ 0R-6R · CHAPTER 2 IS RETIRED ════════════════════════════════════════

        "Your Food System, Part by Part — WHERE EACH PATHWAY STANDS RIGHT NOW",
        then a card per Biotic with a coloured band word, a score out of 100 and
        a possessive sentence from `BAND_SUGGESTS[pathway][band]`.

        The subtitle is the clearest statement of the construct anywhere in the
        product: the chapter existed to tell a reader where their three Biotics
        stand. Nothing a questionnaire collects reaches any of the three.

        It is retired rather than emptied. With the band, the number and the
        band sentence gone, each card would have been a pathway name and a
        general explanation — which the education chapter above already does, at
        length and without claiming to describe the reader. An emptied chapter
        would have left that heading making a promise its contents no longer
        kept, which is the mistake the "greatest opportunity" subtitle made at
        0R-6 when the sort under it was removed.
      */}

      {/* Chapter 5 — body signals, as clues rather than findings */}
      <section>
        <ScrollReveal>
          <ChapterHeader
            number={ch()}
            eyebrow="Body Signals"
            title="What To Notice"
            subtitle="Food-pattern clues, not diagnoses. Treat them as feedback on what you changed."
          />
          <div className="space-y-3">
            {report.bodySignalMap.map((node) => (
              <NodeCard key={node.id} node={node} />
            ))}
          </div>
        </ScrollReveal>
      </section>

      {/* Chapter 6 — the one thing to do first */}
      <section>
        <ScrollReveal>
          <ChapterHeader number={ch()} eyebrow="Start Here" title="Your Priority Lever" />
          <div
            className="rounded-3xl border border-[var(--icon-green)]/20 border-l-4 border-l-[var(--icon-green)] p-6 space-y-4"
            style={{ background: "color-mix(in srgb, var(--icon-green) 8%, transparent)" }}
          >
            <p className="font-serif text-lg font-semibold text-foreground">
              {report.priorityLever.title}
            </p>
            <dl className="space-y-3">
              <Field label="Why this first" value={report.priorityLever.whyThisFirst} />
              <Field label="Your first step" value={report.priorityLever.firstStep} />
              <Field label="What to notice" value={report.priorityLever.whatToNotice} />
            </dl>
          </div>
        </ScrollReveal>
      </section>

      {/* Chapter 7 — foods as tools, with mechanisms */}
      <section>
        <ScrollReveal>
          <ChapterHeader
            number={ch()}
            eyebrow="Food Tools"
            title="Foods As Tools, Not A Shopping List"
            subtitle="What each one does inside your system — and why it suits your answers."
          />
          <div className="space-y-4">
            {report.foodTools.map((tool, i) => (
              <div
                key={i}
                className="rounded-2xl border border-border bg-background p-5 transition-shadow hover:shadow-lg"
                style={{ boxShadow: CARD_SHADOW }}
              >
                <FoodTool
                  food={tool.food}
                  headingLevel="h3"
                  biotic={coerceBiotic(tool.biotic)}
                  mechanism={tool.mechanism}
                  why={tool.whyForThisCustomer}
                  howToUse={tool.howToUse}
                />
                {(tool.swap || tool.familyAdaptation) && (
                  <div className="mt-3 space-y-1.5 border-t border-border pt-3">
                    {tool.swap && (
                      <p className="text-xs leading-relaxed text-muted-foreground">
                        <span className="font-semibold text-foreground">Swap: </span>
                        {tool.swap}
                      </p>
                    )}
                    {tool.familyAdaptation && (
                      <p className="text-xs leading-relaxed text-muted-foreground">
                        <span className="font-semibold text-foreground">For a family: </span>
                        {tool.familyAdaptation}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollReveal>
      </section>

      {/* Chapter 8 — the 30-day loop */}
      <section>
        <ScrollReveal>
          <ChapterHeader
            number={ch()}
            eyebrow="The Loop"
            title="Your 30-Day Improvement Loop"
            subtitle="Four weeks, one focus each — built to survive an ordinary week."
          />
          <div className="space-y-3">
            {report.thirtyDayLoop.map((week) => (
              <div
                key={week.week}
                className="flex items-start gap-4 rounded-2xl border border-border bg-background p-5 transition-shadow hover:shadow-lg"
                style={{ boxShadow: CARD_SHADOW }}
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full brand-gradient text-sm font-bold text-white">
                  {week.week}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">
                    Week {week.week} — {week.focus}
                  </p>
                  <p className="text-sm leading-relaxed text-foreground">{week.action}</p>
                  <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                    {week.why}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ScrollReveal>
      </section>

      {/* Chapter 9 — family variant, only when the report carries it */}
      {report.familyContext && (
        <section>
          <ScrollReveal>
            <ChapterHeader
              number={ch()}
              eyebrow="Your Household"
              title="The Family Table"
              subtitle="How this applies where more than one person eats."
            />
            <div
              className="rounded-3xl border border-[var(--icon-teal)]/20 border-l-4 border-l-[var(--icon-teal)] p-6 space-y-4"
              style={{ background: "color-mix(in srgb, var(--icon-teal) 8%, transparent)" }}
            >
              <p className="text-base leading-relaxed text-foreground/80">
                {report.familyContext.householdPattern}
              </p>
              {report.familyContext.constraints.length > 0 && (
                <div>
                  <p className="mb-1.5 text-xs font-bold uppercase tracking-widest text-[var(--icon-teal-text)]">
                    Working around
                  </p>
                  <ul className="space-y-1.5">
                    {report.familyContext.constraints.map((c, i) => (
                      <li
                        key={i}
                        className="flex gap-2 text-sm leading-relaxed text-muted-foreground"
                      >
                        <span className="mt-0.5 shrink-0 text-[var(--icon-teal-text)]">→</span>
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {report.familyContext.memberNotes.length > 0 && (
                <div>
                  <p className="mb-1.5 text-xs font-bold uppercase tracking-widest text-[var(--icon-teal-text)]">
                    Notes per person
                  </p>
                  <ul className="space-y-1.5">
                    {report.familyContext.memberNotes.map((n, i) => (
                      <li key={i} className="text-sm leading-relaxed text-muted-foreground">
                        {n}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <dl>
                <Field label="Your shared lever" value={report.familyContext.sharedLever} />
              </dl>
            </div>
          </ScrollReveal>
        </section>
      )}

      {/* The purchased lens, if any. Placed here on purpose: after the system
        * has been explained and the loop given, before Evidence and the closing
        * mission page. It shares the `ch()` counter, so the chapter numbering
        * stays continuous whether or not a lens exists. */}
      {report.lens && <LensSection lens={report.lens} chapterNumber={ch()} />}

      {/* Evidence — the claims above, with something a reader can check */}
      <section>
        <ScrollReveal>
          <ChapterHeader
            number={ch()}
            eyebrow="Evidence"
            title="Where This Comes From"
            subtitle="The sources behind the general claims in this report."
          />
          <ol className="space-y-3">
            {report.evidenceNotes.map((note, i) => (
              <li
                key={i}
                className="rounded-2xl border border-border bg-secondary/20 p-4"
              >
                <p className="text-sm leading-relaxed text-foreground/80">{note.claim}</p>
                <a
                  href={note.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--icon-teal-text)] underline underline-offset-2"
                >
                  {note.sourceTitle}
                  <Icons.ExternalLink size={12} aria-hidden strokeWidth={2.5} />
                </a>
              </li>
            ))}
          </ol>
        </ScrollReveal>
      </section>
    </>
  )
}

/* ── Chapter 10 — the closing mission page ───────────────────────────────── */

/**
 * The inside-out visual the brief asks for: the reader at the centre, then the
 * widening circles their eating actually touches.
 *
 * The rings themselves are aria-hidden decoration. The six levels render as a
 * written ordered list underneath, which is what carries the meaning — a reader
 * on a screen reader, a printed page, or a 320px phone gets the same argument
 * as someone looking at the diagram. Labelling each ring in place looked better
 * at 1440px and fell apart everywhere else.
 */

const INSIDE_OUT_LEVELS = [
  "You",
  "Family",
  "Community",
  "County",
  "Country",
  "The Food System",
] as const

function InsideOutRings({ assetPath, alt }: { assetPath: string; alt: string }) {
  // Five rings for six levels: the figure at the centre IS "You", so the rings
  // are Family outward to The Food System. Widest first so the figure sits on
  // top; the gradient walks the brand ramp outward, lime through orange.
  const rings = [
    { inset: "0%", accent: "orange" },
    { inset: "8%", accent: "yellow" },
    { inset: "17%", accent: "teal" },
    { inset: "26%", accent: "green" },
    { inset: "35%", accent: "lime" },
  ] as const

  return (
    <div className="mx-auto w-full max-w-[420px]">
      <div className="relative aspect-square">
        {rings.map((r) => (
          <div
            key={r.inset}
            aria-hidden
            className="absolute rounded-full"
            style={{
              inset: r.inset,
              border: `1.5px solid color-mix(in srgb, ${accentFill(r.accent)} 38%, transparent)`,
              background: `color-mix(in srgb, ${accentFill(r.accent)} 4%, transparent)`,
            }}
          />
        ))}
        {/* DigitalTwinFigure draws the figure at size*0.66 inside an aura at
         * size*0.95, so at size={150} a 99px figure sat inside a 142px glow and
         * read as a glow with something in it. Scaling the whole diagram up and
         * damping the aura here — rather than in DigitalTwinFigure, which
         * /digital-twin and OrbitHub also render — puts the figure at 139px and
         * lets "you at the centre" actually land. */}
        <div className="absolute left-1/2 top-1/2 w-[56%] -translate-x-1/2 -translate-y-1/2 [&_.eb-aura]:opacity-40">
          <DigitalTwinFigure size={210} src={assetPath} alt={alt} showParticles={false} />
        </div>
      </div>

      <ol className="mt-5 flex flex-wrap items-center justify-center gap-x-2 gap-y-1.5">
        {INSIDE_OUT_LEVELS.map((level, i) => (
          <li key={level} className="flex items-center gap-2">
            <span className="text-xs font-semibold text-foreground">{level}</span>
            {i < INSIDE_OUT_LEVELS.length - 1 && (
              <span aria-hidden className="text-xs text-muted-foreground">
                →
              </span>
            )}
          </li>
        ))}
      </ol>
    </div>
  )
}

export function FoodSystemClosing({ report }: { report: FoodSystemReport }) {
  const { closingMissionPage: closing } = report
  return (
    <section>
      <ScrollReveal>
        <div
          className="relative overflow-hidden rounded-3xl border border-border p-8 text-center sm:p-10"
          style={{ boxShadow: CARD_SHADOW }}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-1 brand-gradient"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -inset-x-10 -top-24 -z-10 h-64 opacity-40 blur-3xl"
            style={{
              background:
                "radial-gradient(50% 50% at 50% 50%, color-mix(in srgb, var(--icon-green) 30%, transparent), transparent 70%)",
            }}
          />

          <InsideOutRings
            assetPath={closing.visualToken.assetPath ?? report.visualTheme.bodyAssetPath}
            alt="You at the centre of a widening food system"
          />

          <h2 className="mt-8 font-serif text-3xl font-semibold leading-snug text-foreground sm:text-4xl">
            {closing.headlineLines.map((line) => (
              <span key={line} className="block text-balance">
                {line}
              </span>
            ))}
          </h2>

          <div className="mx-auto mt-8 max-w-xl space-y-4 text-left">
            <p className="text-base leading-relaxed text-foreground/80">
              {closing.insideYou}
            </p>
            <p className="text-base leading-relaxed text-foreground/80">
              {closing.aroundYou}
            </p>
          </div>

          <div
            className="mx-auto mt-8 max-w-xl rounded-2xl px-5 py-4"
            style={{ background: "color-mix(in srgb, var(--icon-green) 8%, transparent)" }}
          >
            <p className="text-sm leading-relaxed text-foreground/80">
              <span
                className="font-semibold"
                style={{ color: accentTextOnTint("green") }}
              >
                Your next step:{" "}
              </span>
              {closing.nextAction}
            </p>
          </div>
        </div>

        <p className="mt-6 text-center text-xs leading-relaxed text-muted-foreground">
          {report.safetyFooter}
        </p>
      </ScrollReveal>
    </section>
  )
}

/* ── Small shared bits ───────────────────────────────────────────────────── */

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 text-sm leading-relaxed text-foreground/80">{value}</dd>
    </div>
  )
}

function ModuleIcon({ iconName }: { iconName?: string }) {
  const Icon =
    (Icons as unknown as Record<string, Icons.LucideIcon>)[iconName ?? ""] ?? Icons.Sprout
  return <Icon size={20} strokeWidth={2} aria-hidden />
}
