import { WaitlistHero } from "./waitlist-hero"
import { PowersEverything } from "@/components/home/powers-everything"
import { HowItWorks } from "@/components/home/how-it-works"
import { TheFramework } from "@/components/home/the-framework"
import { ScorePreview } from "@/components/home/score-preview"
import { Ecosystem } from "@/components/home/ecosystem"
import { PreviewGuard } from "@/components/waitlist/preview-guard"

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
          main site. The same sections on app/page.tsx are NOT guarded. */}
      <PreviewGuard>
        <div style={{ height: "2px", background: GRADIENT_BAR }} />
        <PowersEverything />
        <HowItWorks />
        <TheFramework />
        <ScorePreview />
        <SoftDivider />
        <Ecosystem />
      </PreviewGuard>
    </div>
  )
}
