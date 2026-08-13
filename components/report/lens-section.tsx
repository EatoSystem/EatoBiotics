import { ExternalLink } from "lucide-react"
import { ScrollReveal } from "@/components/scroll-reveal"
import { CARD_SHADOW } from "@/components/report/report-section"
import { PATHWAY_LABEL } from "@/lib/report/subscores"
import type { FoodSystemLens } from "@/lib/report/food-system-report-types"

/**
 * The purchased add-on's chapter.
 *
 * ── Where it sits, and why ───────────────────────────────────────────────────
 *
 * After the 30-day loop and before Evidence/closing. A lens is a reading OF the
 * food system, so it cannot come before the system has been explained; and the
 * mission page has to stay last, because it is the report's closing statement.
 *
 * ── What it deliberately is not ──────────────────────────────────────────────
 *
 * Not a second plan. The actions render as additions to the loop the reader has
 * just been given, labelled by the week they belong to, rather than as a rival
 * schedule. Someone who paid for a lens should finish the report with one plan,
 * not two.
 *
 * ── Accessibility ────────────────────────────────────────────────────────────
 *
 * Pathway state is carried in text, never in colour alone: each pathway row
 * prints its own name and its explanation, and the accent bar beside it is
 * aria-hidden decoration. No emoji anywhere — the icons in this report are SVG,
 * and an emoji would read aloud as its unicode name in a screen reader.
 */
export function LensSection({ lens, chapterNumber }: { lens: FoodSystemLens; chapterNumber: string }) {
  return (
    <section>
      <ScrollReveal>
        {/* Header — names the purchased lens explicitly. The customer chose
          * this and paid for it; the chapter should say so in its own title. */}
        <div className="mb-6">
          <p className="text-xs font-bold uppercase tracking-widest text-[var(--icon-green-text)]">
            <span className="tabular-nums">{chapterNumber}</span>
            <span className="mx-2 text-muted-foreground/40">·</span>
            Your Focus Area
          </p>
          <h2 className="mt-2 font-serif text-2xl font-semibold text-foreground sm:text-3xl text-balance">
            {lens.name}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            What this looks at: {lens.examines}
          </p>
        </div>

        {/* The answer-linked read. */}
        <div
          className="rounded-3xl border border-border bg-background p-6"
          style={{ boxShadow: CARD_SHADOW, borderLeftWidth: 4, borderLeftColor: lens.accent }}
        >
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            What your answers describe
          </p>
          <p className="mt-3 leading-relaxed text-foreground">{lens.patternSummary}</p>
        </div>

        {/* How the lens meets the three pathways. */}
        <div className="mt-6">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            How this connects to your Food System
          </p>
          <dl className="mt-3 space-y-3">
            {lens.pathwayConnections.map((pc) => (
              <div
                key={pc.pathway}
                className="flex gap-3 rounded-2xl border border-border bg-secondary/20 p-4"
              >
                <span
                  aria-hidden
                  className="mt-1 w-1 shrink-0 rounded-full"
                  style={{ backgroundColor: `var(--icon-${pc.pathway === "prebiotics" ? "lime" : pc.pathway === "probiotics" ? "teal" : "orange"})` }}
                />
                <div>
                  <dt className="text-sm font-semibold text-foreground">{PATHWAY_LABEL[pc.pathway]}</dt>
                  <dd className="mt-1 text-sm leading-relaxed text-muted-foreground">{pc.connection}</dd>
                </div>
              </div>
            ))}
          </dl>
        </div>

        {/* The one connection that matters most — derived from the core score
          * ranking, so it agrees with the rest of the report by construction. */}
        <div
          className="mt-6 rounded-3xl border p-6"
          style={{
            borderColor: "color-mix(in srgb, var(--icon-teal) 24%, transparent)",
            background: "color-mix(in srgb, var(--icon-teal) 7%, transparent)",
          }}
        >
          <p className="text-xs font-bold uppercase tracking-widest text-[var(--icon-teal-text)]">
            Where it matters most
          </p>
          <p className="mt-2 text-base font-semibold text-foreground">
            {PATHWAY_LABEL[lens.priorityConnection.pathway]}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {lens.priorityConnection.why}
          </p>
        </div>

        {/* Observations, never diagnoses. */}
        <div className="mt-6">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            What to notice
          </p>
          <ul className="mt-3 space-y-3">
            {lens.signals.map((s) => (
              <li key={s.label} className="rounded-2xl border border-border bg-background p-4">
                <p className="text-sm font-semibold text-foreground">{s.label}</p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{s.whatToNotice}</p>
              </li>
            ))}
          </ul>
        </div>

        {/* Additions to the EXISTING loop, by week — not a competing plan. */}
        <div className="mt-6">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Added to your 30-day loop
          </p>
          <ol className="mt-3 space-y-3">
            {lens.loopAdditions.map((l) => (
              <li key={l.week} className="flex gap-4 rounded-2xl border border-border bg-secondary/20 p-4">
                <span className="shrink-0 text-xs font-bold uppercase tracking-widest text-[var(--icon-green-text)]">
                  Week {l.week}
                </span>
                <p className="text-sm leading-relaxed text-foreground">{l.action}</p>
              </li>
            ))}
          </ol>
        </div>

        {/* Fixed per-lens safety wording. Never generated, never paraphrased.
          *
          * Above the citations, deliberately. This used to be the last thing on
          * the page, set small and grey — which put "this lens does not measure
          * blood glucose" underneath three journal citations, exactly where a
          * reader stops. The sentence that says what the lens CANNOT tell you
          * is the most important sentence in the chapter, so it gets read
          * before the sources, not after them, and it is styled as a callout
          * rather than as small print. The PDF orders it the same way. */}
        <div
          className="mt-6 rounded-3xl border p-6"
          style={{
            borderColor: "color-mix(in srgb, var(--icon-teal) 30%, transparent)",
            borderLeftWidth: 4,
            borderLeftColor: "var(--icon-teal)",
          }}
        >
          <p className="text-xs font-bold uppercase tracking-widest text-[var(--icon-teal-text)]">
            What this lens does not do
          </p>
          <p className="mt-3 text-sm leading-relaxed text-foreground">{lens.safetyNote}</p>
        </div>

        {/* Evidence. Rendered only when a lens exists — which is the only way
          * this component is reached — and every source shows BOTH what it
          * supports and what it does not show. A citation that prints only the
          * supporting half makes a report look more authoritative without
          * making it more true. */}
        <div className="mt-6">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            The evidence behind this
          </p>
          <ol className="mt-3 space-y-3">
            {lens.evidenceNotes.map((note) => (
              <li key={note.url} className="rounded-2xl border border-border bg-secondary/20 p-4">
                <a
                  href={note.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-start gap-1.5 text-sm font-semibold text-[var(--icon-teal-text)] underline underline-offset-2"
                >
                  {note.title}
                  <ExternalLink size={12} aria-hidden strokeWidth={2.5} className="mt-1 shrink-0" />
                </a>
                <p className="mt-1 text-xs text-muted-foreground">
                  {note.organisation} · {note.year}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-foreground/80">
                  <span className="font-semibold">What it supports: </span>
                  {note.whatItSupports}
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  <span className="font-semibold">What it does not show: </span>
                  {note.limitation}
                </p>
              </li>
            ))}
          </ol>
        </div>

      </ScrollReveal>
    </section>
  )
}
