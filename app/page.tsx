import { Suspense } from "react"
import { Hero } from "@/components/home/hero"
import { Pathways } from "@/components/home/pathways"
import { TheThreeBiotics } from "@/components/home/the-three-biotics"
import { HowItWorks } from "@/components/home/how-it-works"
import { ThePlate } from "@/components/home/the-plate"
import { ScorePreview } from "@/components/home/score-preview"
import { MembershipTeaser } from "@/components/home/membership-teaser"
import { Testimonials } from "@/components/home/testimonials"
import { TrustDisclaimer } from "@/components/home/trust-disclaimer"
import { FAQ } from "@/components/home/faq"
import { StickyCta } from "@/components/start/sticky-cta"

export default function Home() {
  return (
    <>
      <Suspense fallback={null}><Hero /></Suspense>
      <div style={{ height: "2px", background: "linear-gradient(90deg, var(--icon-lime), var(--icon-green), var(--icon-teal), var(--icon-yellow), var(--icon-orange))" }} />
      <Pathways />
      <TheThreeBiotics />
      <HowItWorks />
      <ThePlate />
      <div className="section-divider" />
      <ScorePreview />
      <div className="section-divider" />
      <MembershipTeaser />
      <div className="section-divider" />
      <Testimonials />
      <div className="section-divider" />
      <TrustDisclaimer />
      <FAQ />
      <StickyCta />
    </>
  )
}
