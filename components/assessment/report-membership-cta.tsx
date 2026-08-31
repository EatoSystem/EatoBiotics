"use client"

import Link from "next/link"
import { ArrowRight, Check, Compass } from "lucide-react"
// Pure tier vocabulary. lib/membership.ts imports the service-role Supabase
// client and must not be pulled into a "use client" component.
import { isPaidTierName } from "@/lib/membership-tiers"

interface ReportMembershipCTAProps {
  /** The customer's current overall score — the one real number this report
   *  produced. No future score is shown anywhere: a questionnaire cannot
   *  honestly forecast one, and the old projection card once promised a
   *  98/100 customer they could reach "100–100". */
  overall?: number
  /** Display label of the pathway the report chose to start with. */
  priorityLabel?: string
  membershipBridge?: string
  membershipTier?: string
}

/**
 * The one current continuation product.
 *
 * This was a three-card ladder — Grow €9.99, Restore €49, Transform €99 —
 * shown to every €49 buyer at the end of their report. Those tiers are retired
 * as a purchase option: the live continuation is a single EatoBiotics Member
 * plan, and Restore's "€49/mo" sat one screen away from the €49 ONE-TIME
 * report, which is a genuinely confusing thing to put in front of someone who
 * has just paid.
 *
 * The tier ids remain valid internally — existing Grow/Restore/Transform
 * subscribers keep their access and their Stripe mappings, and
 * `hasActiveMembership` below still recognises them. Retired as an offer, not
 * as data.
 */
const MEMBER_PLAN = {
  name: "EatoBiotics Member",
  price: "€24.99",
  period: "/mo",
  color: "var(--icon-green)",
  gradient: "linear-gradient(135deg, var(--icon-lime), var(--icon-teal))",
  tagline: "Keep building your Food System",
  features: [
    "Daily meal analyses",
    "Your score history over time",
    "Daily habit nudges and streak",
    "Create My Plate — AI meal plans",
  ],
}


/* The score-projection card that used to live here rendered a predicted
 * future score with a deadline ("You could reach 74–84 in 8–10 weeks") — a
 * result-by-date forecast a questionnaire cannot honestly make, and one that
 * degenerated to "100–100" for high scorers. Replaced by ContinuationCard:
 * the real current score, the report's own priority pathway, and what
 * membership is actually for — practising the plan, not receiving a number. */
function ContinuationCard({
  overall,
  priorityLabel,
}: {
  overall: number
  priorityLabel?: string
}) {
  return (
    <div
      className="rounded-2xl border-2 border-transparent p-5"
      style={{
        background:
          "linear-gradient(var(--background), var(--background)) padding-box, linear-gradient(135deg, var(--icon-lime), var(--icon-green), var(--icon-teal)) border-box",
      }}
    >
      <div className="flex items-center gap-2 mb-4">
        <Compass size={15} aria-hidden style={{ color: "var(--icon-green)" }} />
        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--icon-green)" }}>
          Where your report hands over
        </p>
      </div>

      <div className="flex items-center gap-6">
        <div className="shrink-0 text-center">
          <p className="font-serif text-3xl font-bold leading-none text-foreground">{overall}</p>
          <p className="mt-1 text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
            Today&apos;s score
          </p>
        </div>

        <div className="flex-1">
          <p className="font-serif text-base font-bold text-foreground leading-snug">
            {priorityLabel
              ? `Your plan starts with ${priorityLabel} — membership is where you practise it.`
              : "Your plan is set — membership is where you practise it."}
          </p>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            Log what you actually eat, watch your{" "}
            {priorityLabel ? `${priorityLabel} habits` : "new habits"} hold through ordinary
            weeks, and retake the assessment after your 30-day cycle. Your score is
            recalculated from your answers each time — individual outcomes vary.
          </p>
        </div>
      </div>
    </div>
  )
}

export function ReportMembershipCTA({
  overall,
  priorityLabel,
  membershipBridge,
  membershipTier,
}: ReportMembershipCTAProps) {
  /*
   * Every tier that already carries access — not just the retired three.
   *
   * This listed only grow/restore/transform, so an active `member` or a `trial`
   * buyer (the two tiers the product actually issues today) fell through to the
   * upsell and was sold something they already had. isPaidTierName reads the
   * shared PAID_TIERS list, so a future tier is recognised here by default
   * rather than by remembering to edit this line.
   *
   * `membershipTier` is the paid/access field. It is never the `membership`
   * referral field, which means something else entirely.
   */
  const hasActiveMembership = isPaidTierName(membershipTier)

  return (
    <div className="space-y-5 pt-2">
      {/* Section label */}
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground px-2">
          Your Next Step
        </span>
        <div className="h-px flex-1 bg-border" />
      </div>

      {/* Continuation — current score + priority, never a forecast */}
      {typeof overall === "number" && (
        <ContinuationCard overall={overall} priorityLabel={priorityLabel} />
      )}

      {/* Membership bridge */}
      {membershipBridge && (
        <div
          className="rounded-xl border-l-4 py-3 px-4 text-sm leading-relaxed text-foreground/80"
          style={{
            borderColor: "var(--icon-green)",
            background: "color-mix(in srgb, var(--icon-green) 6%, transparent)",
          }}
        >
          {membershipBridge}
        </div>
      )}

      {/* Already a member */}
      {hasActiveMembership ? (
        <div
          className="flex items-center gap-3 rounded-2xl border p-4"
          style={{
            background: "color-mix(in srgb, var(--icon-green) 6%, transparent)",
            borderColor: "color-mix(in srgb, var(--icon-green) 25%, transparent)",
          }}
        >
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
            style={{ background: "color-mix(in srgb, var(--icon-green) 15%, transparent)" }}
          >
            <Check size={16} style={{ color: "var(--icon-green)" }} />
          </span>
          <div>
            <p className="text-sm font-semibold text-foreground capitalize">
              {/* Never print the raw tier id. `grow` rendered verbatim showed the
                * customer a retired product name as though it were their current
                * plan — and a lowercase database value at that. Legacy tiers get
                * neutral wording rather than a name that reads like an offer;
                * their access is unchanged. */}
              {membershipTier === "member" ? "Your Member plan" : "Your existing plan"} is tracking your progress
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Use daily meal analyses to monitor the changes from this report
            </p>
          </div>
          <Link
            href="/account"
            className="ml-auto shrink-0 flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-foreground transition hover:bg-secondary"
          >
            Dashboard <ArrowRight size={11} />
          </Link>
        </div>
      ) : (
        <>
          {/* One current plan */}
          <p className="text-sm font-semibold text-foreground text-center">
            Keep building your Food System
          </p>
          <div
            className="relative flex flex-col rounded-2xl border overflow-hidden"
            style={{
              borderColor: `color-mix(in srgb, ${MEMBER_PLAN.color} 40%, transparent)`,
              background: `color-mix(in srgb, ${MEMBER_PLAN.color} 4%, var(--card))`,
            }}
          >
            <div className="h-1 w-full" style={{ background: MEMBER_PLAN.gradient }} />
            <div className="flex flex-1 flex-col p-5">
              <p
                className="text-xs font-bold uppercase tracking-widest"
                style={{ color: MEMBER_PLAN.color }}
              >
                {MEMBER_PLAN.name}
              </p>
              <div className="mt-1 flex items-baseline gap-0.5">
                <span className="text-3xl font-bold text-foreground">{MEMBER_PLAN.price}</span>
                <span className="text-xs text-muted-foreground">{MEMBER_PLAN.period}</span>
              </div>
              <p className="mt-1 mb-4 text-[11px] text-muted-foreground">{MEMBER_PLAN.tagline}</p>

              <ul className="mb-5 flex-1 space-y-1.5 sm:grid sm:grid-cols-2 sm:gap-x-4 sm:space-y-0">
                {MEMBER_PLAN.features.map((f) => (
                  <li key={f} className="flex items-start gap-1.5 text-[11px] text-foreground/80">
                    <Check size={11} className="mt-0.5 shrink-0" style={{ color: MEMBER_PLAN.color }} />
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                href="/pricing"
                className="flex w-full items-center justify-center gap-1.5 rounded-xl py-3 text-sm font-semibold text-white transition hover:opacity-90"
                style={{ background: MEMBER_PLAN.gradient }}
              >
                Become a Member <ArrowRight size={13} />
              </Link>
            </div>
          </div>

          <p className="text-center text-xs text-muted-foreground">
            €24.99/month · Cancel any time
          </p>

        </>
      )}
    </div>
  )
}
