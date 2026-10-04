import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { buildAccountTwin } from "@/lib/agent-loop/account-twin"
import { twinVisualState } from "@/lib/account/twin-visual"
import { LiveDashboard } from "@/components/account/live-dashboard"
import {
  AUDIT_FIXTURES,
  AUDIT_FIXTURE_PURPOSE,
  AUDIT_FIXTURE_STATES,
  type AuditFixtureState,
} from "@/lib/experience-audit/fixtures"
import { isExperienceAuditFixtureEligible } from "@/lib/experience-audit/fixture-policy"
import { AUDIT_CLOCK, TWIN_FIXTURE_INPUT } from "@/lib/experience-audit/fixtures"

/**
 * THE EXPERIENCE AUDIT FIXTURE — Experience 0.
 *
 * ══ WHAT THIS PAGE IS ═══════════════════════════════════════════════════════
 *
 * An instrument, not a product surface. It renders the REAL
 * `components/account/live-dashboard.tsx` — the component a signed-in member
 * actually sees — from deterministic fixture props, so the UX audit can
 * photograph it at 390/834/1280 and count what is on screen.
 *
 * ══ WHY IT HAD TO EXIST ═════════════════════════════════════════════════════
 *
 * `/account` requires a production Supabase session, and this programme is
 * read-only against production. `app/demo/account/page.tsx` renders
 * `dashboard-client.tsx`, a DIFFERENT ten-tab component that CLAUDE.md warns
 * is never used by the real route. Auditing either would have produced
 * confident conclusions about the wrong thing.
 *
 * ══ WHAT IT DOES NOT DO ═════════════════════════════════════════════════════
 *
 * No Supabase read, no Supabase write, no Stripe call, no authentication, no
 * customer data, no persistence, no navigation entry, and no import from
 * `app/demo/**`. It modifies no production component: `LiveDashboard` takes
 * every prop optional with a default, which is why no change was needed.
 *
 * `email` is null in every fixture state, and that is load-bearing rather than
 * incidental — see the header of `lib/experience-audit/fixtures.ts`.
 *
 * ══ WHAT IT IS NOT ══════════════════════════════════════════════════════════
 *
 * Not a product preview, not a demo, not staging, and NOT a proposal for the
 * future account architecture. The screenshots are evidence; this scaffolding
 * is disposable and should be deleted once Experience 0 closes.
 */

export const metadata: Metadata = {
  title: "Experience Audit Fixture — not a product surface",
  robots: "noindex, nofollow",
}

/*
 * Per request, in the Node runtime.
 *
 * Without this, Next prerenders a server component with no dynamic inputs at
 * BUILD time and bakes the gate's answer into static HTML — the finding
 * recorded in full in `lib/v1-surface.ts` and repeated on
 * `app/preview/food-system-v1/page.tsx`. The failure is in the safe direction,
 * which is exactly why it needs stating: a gate that is accidentally too
 * strict looks like it works, and the only symptom is that the people meant to
 * review something cannot reach it either.
 */
export const dynamic = "force-dynamic"

function resolveState(raw: string | string[] | undefined): AuditFixtureState {
  const first = Array.isArray(raw) ? raw[0] : raw
  return AUDIT_FIXTURE_STATES.includes(first as AuditFixtureState)
    ? (first as AuditFixtureState)
    : "representative"
}

export default async function ExperienceAuditFixturePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  if (!isExperienceAuditFixtureEligible()) notFound()

  const params = await searchParams
  const state = resolveState(params.state)
  const props = AUDIT_FIXTURES[state]

  /*
   * ── THE TWIN, BUILT BY THE REAL BUILDER ───────────────────────────────────
   *
   * Nine Twin components are imported directly by `live-dashboard.tsx` and are
   * therefore LIVE on `/account`. Every other fixture state passes
   * `twin: null`, so until now this audit had never rendered a single one of
   * them — their claims were live and unexamined.
   *
   * The twin is composed by `buildAccountTwin`, the SAME function
   * `app/account/page.tsx:279` calls, from fixed inputs. Hand-writing a
   * `FoodSystemDigitalTwin` would have produced a shape I invented rather than
   * one the product produces, and the audit would then be reading my fiction.
   *
   * `updatedAt` is overridden because `lib/agent-loop/engine.ts` stamps it with
   * `Date.now()`, which would make the corpus drift between runs. It is the one
   * value replaced, and only for determinism.
   *
   * SAFETY IS UNCHANGED: `email` stays null in this state as in every other, so
   * the mount effect at `live-dashboard.tsx:857` (`if (propEmail)
   * pushTwinState(store)`) cannot fire. That is asserted BY RENDER in
   * `tests/e2e/audit-capture.spec.ts`, not inferred from this comment.
   */
  const built = state === "twin-present" ? await buildAccountTwin(TWIN_FIXTURE_INPUT) : null
  const twin = built ? { ...built.twin, updatedAt: Date.parse(AUDIT_CLOCK) } : null

  /*
   * `twinVisual` is REQUIRED, not optional: `live-dashboard.tsx:1095` gates the
   * whole Twin block on `twin && twinVisual`. Supplying the twin alone rendered
   * nothing, which is how this was found — the first twin-present capture
   * looked identical to `representative`.
   *
   * Derived with `twinVisualState`, the same call `app/account/page.tsx:294`
   * makes, so the visual state is the product's rather than mine.
   */
  const twinVisual = twin ? twinVisualState(twin) : null

  return (
    <div className="min-h-screen bg-background">
      {/*
        The banner. Unmissable, and worded so that a screenshot of this page
        cannot be mistaken for a screenshot of the product — which matters,
        because the whole point is to produce screenshots of the product.

        Fixed position and a high z-index on purpose: the dashboard has sticky
        regions of its own, and a banner that scrolled away would leave later
        captures unlabelled.
      */}
      <div
        className="sticky top-0 z-[9999] border-b px-4 py-2 text-center"
        style={{
          borderColor: "var(--border)",
          background: "color-mix(in srgb, var(--icon-orange) 16%, var(--background))",
        }}
        data-audit-fixture="true"
        data-audit-state={state}
      >
        <p className="text-[11px] font-semibold uppercase tracking-wider text-foreground">
          Experience Audit Fixture · invented data · not a product surface
        </p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          State <strong>{state}</strong> — {AUDIT_FIXTURE_PURPOSE[state]}
        </p>
        <p className="mt-0.5 text-[10px] text-muted-foreground">
          {AUDIT_FIXTURE_STATES.map((s) => (
            <span key={s}>
              <a href={`?state=${s}`} style={{ textDecoration: s === state ? "underline" : "none" }}>
                {s}
              </a>
              {s === AUDIT_FIXTURE_STATES[AUDIT_FIXTURE_STATES.length - 1] ? "" : " · "}
            </span>
          ))}
        </p>
      </div>

      {/*
        The real component, unmodified, with fixture props.

        `key` forces a remount when the state changes, so a capture of `sparse`
        can never inherit mounted state from `dense`. A fixture that carried
        state between captures would produce screenshots nobody could trust.
      */}
      <LiveDashboard key={state} {...props} twin={twin} twinVisual={twinVisual} twinFeed={built?.feed ?? null} />
    </div>
  )
}
