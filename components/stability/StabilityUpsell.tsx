import Link from "next/link"
import { ArrowRight, Lock, Check } from "lucide-react"

interface StabilityUpsellProps {
  title: string
  description: string
  bullets: string[]
  /** Pricing deep-link feature key, e.g. "stability-report". */
  feature: string
}

/**
 * Soft gate shown to free/grow users on the premium Stability surfaces
 * (monthly report + insights). Mirrors the GLP-1 companion upsell. The
 * assessment, results, and daily tracker stay free — only the longitudinal
 * analytics live behind membership.
 */
export function StabilityUpsell({ title, description, bullets, feature }: StabilityUpsellProps) {
  return (
    <div className="mx-auto max-w-xl px-2 py-10 text-center">
      <span
        className="inline-flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-sm"
        style={{ background: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))" }}
      >
        <Lock size={22} />
      </span>
      <h2 className="mt-5 font-serif text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
        {title}
      </h2>
      <p className="mx-auto mt-3 max-w-md text-base text-muted-foreground">{description}</p>

      <ul className="mx-auto mt-6 max-w-sm space-y-2.5 text-left">
        {bullets.map((b) => (
          <li key={b} className="flex items-start gap-2.5 text-sm text-foreground">
            <Check size={16} className="mt-0.5 shrink-0" style={{ color: "var(--icon-green)" }} />
            {b}
          </li>
        ))}
      </ul>

      <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Link
          href={`/pricing?feature=${feature}`}
          className="inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))" }}
        >
          Unlock with membership <ArrowRight size={14} />
        </Link>
        <Link
          href="/stability/tracker"
          className="text-sm font-medium underline underline-offset-4 text-muted-foreground"
        >
          Keep tracking for free
        </Link>
      </div>
    </div>
  )
}
