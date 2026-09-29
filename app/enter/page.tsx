import { WaitlistHero } from "./waitlist-hero"
import { PowersEverything } from "@/components/home/powers-everything"
import { HowItWorks } from "@/components/home/how-it-works"
import { TheFramework } from "@/components/home/the-framework"
import { ScorePreview } from "@/components/home/score-preview"
import { Ecosystem } from "@/components/home/ecosystem"
import { FirstCourse } from "@/components/waitlist/first-course"
import { PreviewGuard } from "@/components/waitlist/preview-guard"
import { LiveSignups } from "@/components/waitlist/live-signups"

/**
 * Public pre-launch waitlist landing page.
 *
 * This is the page every visitor lands on while the site password gate is on
 * (proxy.ts redirects all traffic here). The hero captures waitlist emails;
 * everything below it reuses the real homepage showcase sections so the gated
 * page is a true preview of the product. Keep these sections in sync with
 * app/page.tsx. The founder / admin password login lives at /preview-access
 * (reachable directly by URL).
 */

const GRADIENT_BAR =
  "linear-gradient(90deg, var(--icon-lime), var(--icon-green), var(--icon-teal), var(--icon-yellow), var(--icon-orange))"

function SoftDivider() {
  return (
    <div
      aria-hidden
      className="mx-auto h-px w-full max-w-[1100px]"
      style={{ background: "linear-gradient(90deg, transparent, color-mix(in srgb, var(--icon-green) 18%, transparent), transparent)" }}
    />
  )
}

export default function WaitlistPage() {
  return (
    <div className="relative overflow-hidden bg-background">
      {/* Waitlist hero + email capture */}
      <WaitlistHero />

      {/* ── Homepage showcase (mirrors app/page.tsx) ───────────────────────
          Wrapped in PreviewGuard so its CTAs don't navigate into the gated
          main site. The same sections on app/page.tsx are NOT guarded.

          `StateOfProduct` ("Honest By Design") and `GlobalDirection` ("The
          science is global") were removed from the holding page. Both
          components remain on disk and unchanged — this is a decision about
          what a pre-launch visitor should be shown, not a deletion — and
          neither is rendered anywhere else, so nothing else changes. The page
          now ends on Ecosystem, and the divider that used to separate the two
          removed sections went with them rather than leaving a rule under
          nothing. */}
      <PreviewGuard>
        <div style={{ height: "2px", background: GRADIENT_BAR }} />
        <PowersEverything />
        <HowItWorks />
        <TheFramework />
        <ScorePreview />
        <SoftDivider />
        <Ecosystem />
      </PreviewGuard>

      {/* The First Course sits OUTSIDE PreviewGuard: its CTA scrolls to #start
          on this same page rather than navigating into the gated site, so the
          guard would only be intercepting a link that never leaves. */}
      <FirstCourse />

      {/* Subtle "just joined" social-proof card (fixed, page-level so it escapes
          any transformed/overflow wrappers above). */}
      <LiveSignups />
    </div>
  )
}
