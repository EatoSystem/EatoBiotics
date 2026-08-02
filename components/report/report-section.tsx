/**
 * The two presentational primitives every report section is built from.
 *
 * Both were defined inside components/assessment/paid-report-client.tsx and are
 * lifted here so the educational Food System sections sit beside the existing
 * ones rather than introducing a second, slightly-different heading style.
 *
 * ── One deliberate change from the original ──────────────────────────────────
 *
 * The eyebrow was `text-[var(--icon-green)]` — the RAW brand hue, which measures
 * 2.96:1 on white and fails WCAG AA as copy. axe confirmed it: #4cb648 on
 * #ffffff, "serious", once per section. It is the exact bug #184 shipped and
 * #187 fixed elsewhere, and it was already live on every paid report.
 *
 * Switching it to the calibrated -text variant (4.82:1) fixes the existing
 * failures rather than duplicating them across the eight new sections. It is a
 * colour token change only — no markup, no structure.
 */

/** Unified soft card shadow (matches the account dashboard + homepage). */
export const CARD_SHADOW = "0 2px 12px rgba(26,46,18,0.05)"

export function SectionHeader({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow?: string
  title: string
  subtitle?: string
}) {
  return (
    <div className="mb-6">
      {eyebrow && (
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[var(--icon-green-text)]">
          {eyebrow}
        </p>
      )}
      <h2 className="font-serif text-2xl font-semibold text-foreground sm:text-3xl text-balance">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-2 leading-relaxed text-muted-foreground">{subtitle}</p>
      )}
    </div>
  )
}
