"use client"

import type { CSSProperties } from "react"
import * as Icons from "lucide-react"
import { ScrollReveal } from "@/components/scroll-reveal"
import { DigitalTwinFigure } from "@/components/digital-twin/parts"
import { FoodTool, PathwayIcon } from "@/components/report/food-tool"
import { CARD_SHADOW, SectionHeader } from "@/components/report/report-section"
import {
  accentFill,
  accentText,
  accentTextOnTint,
  bioticAccent,
  coerceBiotic,
  type VisualAccent,
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

/* ── State presentation ──────────────────────────────────────────────────────
 * Node state must never be conveyed by colour alone — a colour-only badge is
 * both an accessibility failure and unreadable in a printed report. Each state
 * carries its own words. */

const STATE_LABEL: Record<FoodSystemNode["state"], string> = {
  strong: "Well supported",
  building: "Building",
  strained: "Room to grow",
  unknown: "Not enough to say",
}

const STATE_ACCENT: Record<FoodSystemNode["state"], VisualAccent> = {
  strong: "green",
  building: "teal",
  strained: "orange",
  unknown: "yellow",
}

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

function StateBadge({ state }: { state: FoodSystemNode["state"] }) {
  const accent = STATE_ACCENT[state]
  return (
    <span
      className="inline-flex w-fit items-center rounded-full px-2.5 py-0.5 text-xs font-bold"
      style={{
        background: `color-mix(in srgb, ${accentFill(accent)} 15%, transparent)`,
        color: accentTextOnTint(accent),
      }}
    >
      {STATE_LABEL[state]}
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
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
            <p className="text-sm font-bold text-foreground">{node.label}</p>
            <StateBadge state={node.state} />
            {typeof node.score === "number" && (
              <span className="text-xs font-semibold text-muted-foreground">
                {node.score}/100
              </span>
            )}
          </div>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {node.explanation}
          </p>
        </div>
      </div>
    </div>
  )
}

/** The three pathway scores, as capsules rather than another ring. */
function PathwayScores({ scores }: { scores: Record<BioticScoreKey, number> }) {
  const keys: BioticScoreKey[] = ["prebiotics", "probiotics", "postbiotics"]
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {keys.map((key) => {
        const accent = bioticAccent(key)
        return (
          <div
            key={key}
            className="rounded-2xl border border-border bg-background p-4 text-center"
            style={{ boxShadow: CARD_SHADOW }}
          >
            <span
              className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-xl"
              style={{
                background: `color-mix(in srgb, ${accentFill(accent)} 16%, transparent)`,
                color: accentText(accent),
              }}
            >
              <PathwayIcon biotic={key} size={18} />
            </span>
            <p
              className="font-serif text-2xl font-semibold"
              style={{ color: accentText(accent) }}
            >
              {scores[key]}
              <span className="text-sm font-normal text-muted-foreground">/100</span>
            </p>
            <p className="mt-0.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              {PATHWAY_LABEL[key]}
            </p>
          </div>
        )
      })}
    </div>
  )
}

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

function RingNode({
  pathway,
  state,
  x,
  y,
}: {
  pathway: BioticScoreKey
  state: FoodSystemNode["state"]
  x: string
  y: string
}) {
  const accent = bioticAccent(pathway)
  return (
    <li
      className="flex items-center gap-2.5 sm:absolute sm:left-[var(--x)] sm:top-[var(--y)] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:flex-col sm:gap-1.5 sm:text-center"
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
        {/* State reaches the reader here as words, and only as words. The
         * accent on this node is bioticAccent(pathway) — it marks which pathway
         * the node is, not how that pathway is doing, and its position on the
         * ring is orientation rather than meaning. (StateBadge, further up, is
         * the one that colours by state.) So this text is not a caption for a
         * colour: remove it and the state is simply gone. */}
        <span
          className="block text-xs font-semibold"
          style={{ color: accentText(accent) }}
        >
          {STATE_LABEL[state]}
        </span>
      </span>
    </li>
  )
}

function FoodSystemHero({ report }: { report: FoodSystemReport }) {
  const nodes = report.foodSystemMap.filter((n): n is FoodSystemNode & { id: BioticScoreKey } =>
    n.id === "prebiotics" || n.id === "probiotics" || n.id === "postbiotics",
  )
  // Evenly spaced from the top: 12 o'clock, 4 o'clock, 8 o'clock.
  const positions = [
    { x: "50%", y: "4%" },
    { x: "90%", y: "72%" },
    { x: "10%", y: "72%" },
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

        <ul className="mt-6 space-y-3 sm:mt-0 sm:space-y-0">
          {nodes.map((node, i) => (
            <RingNode
              key={node.id}
              pathway={node.id}
              state={node.state}
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
            <PathwayScores scores={report.bioticScores} />
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
                    <Field label="Why it matters" value={mod.whyItMatters} />
                    <Field
                      label="What your answers suggest"
                      value={mod.whatYourAnswersSuggest}
                    />
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

      {/* Chapter 2 (map) — the system, part by part */}
      <section>
        <ScrollReveal>
          <ChapterHeader
            number={ch()}
            eyebrow="The Map"
            title="Your Food System, Part by Part"
            subtitle="Where each pathway stands right now."
          />
          <div className="space-y-3">
            {report.foodSystemMap.map((node) => (
              <NodeCard key={node.id} node={node} />
            ))}
          </div>
        </ScrollReveal>
      </section>

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
  // Widest ring first so the figure sits on top; the gradient walks the brand
  // ramp outward, lime through orange.
  const rings = [
    { inset: "0%", accent: "orange" },
    { inset: "8%", accent: "yellow" },
    { inset: "17%", accent: "teal" },
    { inset: "26%", accent: "green" },
    { inset: "35%", accent: "lime" },
  ] as const

  return (
    <div className="mx-auto w-full max-w-[360px]">
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
        <div className="absolute left-1/2 top-1/2 w-[46%] -translate-x-1/2 -translate-y-1/2">
          <DigitalTwinFigure size={150} src={assetPath} alt={alt} showParticles={false} />
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
