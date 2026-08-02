"use client"

import * as Icons from "lucide-react"
import { ScrollReveal } from "@/components/scroll-reveal"
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
 * The `foodSystem` block has been built, validated and persisted since Phase 2
 * (#192) and nothing rendered it — every paid report carried the data and showed
 * the reader none of it. This closes that with the smallest change that proves
 * the data end-to-end: the existing report keeps its structure and these sections
 * are appended, in the existing visual language.
 *
 * It is NOT the body-led redesign. The brief's inside-out ring diagram, the
 * chapter reordering and the PDF rewrite are later phases. Keeping the new markup
 * in one file means those phases restyle here rather than unpicking it from a
 * 600-line report component.
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

/* ── Chapters 1–9 ────────────────────────────────────────────────────────── */

export function FoodSystemSection({ report }: { report: FoodSystemReport }) {
  return (
    <>
      {/* Chapter 1 — Your Food System snapshot */}
      <section>
        <ScrollReveal>
          <SectionHeader
            eyebrow="Your Food System"
            title={report.title}
            subtitle={report.systemSnapshot.oneLine}
          />
          <div className="space-y-4">
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
          <SectionHeader
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
          <SectionHeader
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
          <SectionHeader
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
          <SectionHeader eyebrow="Start Here" title="Your Priority Lever" />
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
          <SectionHeader
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
          <SectionHeader
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
            <SectionHeader
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
          <SectionHeader
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
          <h2 className="font-serif text-3xl font-semibold leading-snug text-foreground sm:text-4xl">
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
