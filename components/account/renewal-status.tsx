import { Check } from "lucide-react"

/**
 * The subscription card's two renewal statements, kept out of
 * `live-dashboard.tsx` so they can be rendered and tested on their own.
 *
 * "Renewal cancelled" is the state between scheduling `cancel_at_period_end`
 * and the paid period ending: the member keeps access, and nothing on the card
 * may suggest another charge or offer to cancel again.
 */

function longDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IE", { day: "numeric", month: "long", year: "numeric" })
}

/** The line under an active plan's name. Never names a charge it doesn't know about. */
export function renewalLine(nextBillingDate: string | null): string {
  return nextBillingDate
    ? `Next billing ${new Date(nextBillingDate).toLocaleDateString("en-IE", { day: "numeric", month: "short", year: "numeric" })}`
    : "Active subscription"
}

export function RenewalCancelledNotice({ accessUntil }: { accessUntil: string | null }) {
  return (
    <div className="px-5 py-5 space-y-2" data-testid="renewal-cancelled">
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-full" style={{ background: "#f0fdf4" }}>
          <Check size={13} style={{ color: "var(--icon-green)" }} />
        </div>
        <p className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>Renewal cancelled</p>
      </div>
      <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
        {accessUntil ? (
          <>Your membership remains active until <strong>{longDate(accessUntil)}</strong>.</>
        ) : (
          "Your membership remains active until the end of your current billing period."
        )}
      </p>
    </div>
  )
}
