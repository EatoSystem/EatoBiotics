import Link from "next/link"
import { WaitlistHero } from "./waitlist-hero"
import { PowersEverything } from "@/components/home/powers-everything"
import { HowItWorks } from "@/components/home/how-it-works"
import { TheFramework } from "@/components/home/the-framework"
import { ScorePreview } from "@/components/home/score-preview"
import { Ecosystem } from "@/components/home/ecosystem"
import { SocialProof } from "@/components/home/social-proof"

/**
 * Public pre-launch waitlist landing page.
 *
 * This is the page every visitor lands on while the site password gate is on
 * (proxy.ts redirects all traffic here). The hero captures waitlist emails;
 * everything below it reuses the real homepage showcase sections so the gated
 * page is a true preview of the product. Keep these sections in sync with
 * app/page.tsx. The founder / admin password login lives at /preview-access,
 * reached via the discreet footer link below.
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

      {/* ── Homepage showcase (mirrors app/page.tsx) ───────────────────── */}
      <div style={{ height: "2px", background: GRADIENT_BAR }} />
      <PowersEverything />
      <HowItWorks />
      <TheFramework />
      <ScorePreview />
      <SoftDivider />
      <Ecosystem />
      <SocialProof />

      {/* ── Founder note ───────────────────────────────────────────────── */}
      <div style={{ height: "2px", background: GRADIENT_BAR }} />
      <section className="px-6 py-20 md:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mx-auto mb-6 h-px w-16 rounded-full" style={{ background: GRADIENT_BAR }} />
          <p className="font-serif text-xl italic leading-relaxed text-foreground sm:text-2xl">
            &ldquo;EatoBiotics is built to help individuals and families eat optimal
            for health, community, and environment.&rdquo;
          </p>
          <p className="mt-4 text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            A note from the founder
          </p>
        </div>
      </section>

      {/* Discreet founder / admin access */}
      <div className="pb-16 text-center">
        <Link
          href="/preview-access"
          className="text-xs text-muted-foreground/40 transition-colors hover:text-muted-foreground"
        >
          Founder Access
        </Link>
      </div>
    </div>
  )
}
