import type { Metadata } from "next"
import { ShieldCheck } from "lucide-react"
import { EbHero } from "@/components/eatobetics/home/hero"
import { EbHowItWorks } from "@/components/eatobetics/home/how-it-works"
import { EbScorePreview } from "@/components/eatobetics/home/score-preview"
import { EbTheThree } from "@/components/eatobetics/home/the-three"
import { EbThePlate } from "@/components/eatobetics/home/the-plate"
import { EbPathways } from "@/components/eatobetics/home/pathways"
import { EbMembershipTeaser } from "@/components/eatobetics/home/membership-teaser"
import { EbTestimonials } from "@/components/eatobetics/home/testimonials"
import { EbTrustDisclaimer } from "@/components/eatobetics/home/trust-disclaimer"
import { EbFaq } from "@/components/eatobetics/home/faq"
import { EbClosingCta } from "@/components/eatobetics/home/closing-cta"
import { EbStickyCta } from "@/components/eatobetics/home/sticky-cta"

export const metadata: Metadata = {
  title: { absolute: "EatoBetics | The Glucose System Inside You" },
  description:
    "EatoBetics is a glucose intelligence platform that helps people understand how food affects energy, cravings, glucose stability, and long-term metabolic health. Take the free assessment, get your EatoBetics Score, and follow a personalised 30-day plan.",
  openGraph: {
    title: "EatoBetics | The Glucose System Inside You",
    description:
      "Understand how food affects your energy, cravings, glucose stability, and long-term metabolic health.",
  },
}

export default function EatoBeticsPage() {
  return (
    <main className="overflow-hidden bg-white">
      <EbHero />
      <div style={{ height: "2px", background: "linear-gradient(90deg, var(--icon-lime), var(--icon-green), var(--icon-teal), var(--icon-yellow), var(--icon-orange))" }} />
      <EbHowItWorks />
      <div className="section-divider" />
      <EbScorePreview />
      <EbTheThree />
      <EbThePlate />
      <div className="section-divider" />
      <EbPathways />
      <div className="section-divider" />
      <EbMembershipTeaser />
      <div className="section-divider" />
      <EbTestimonials />
      <EbTrustDisclaimer />
      <EbFaq />
      <EbClosingCta />

      {/* Medical disclaimer — important for a glucose / metabolic-health product */}
      <section className="px-6 py-12" style={{ background: "#f7f7f5" }}>
        <div className="mx-auto flex max-w-3xl items-start gap-3">
          <ShieldCheck size={18} className="mt-0.5 shrink-0" style={{ color: "var(--muted-foreground)" }} />
          <p className="text-xs leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
            EatoBetics is an educational food intelligence platform. It does not diagnose, treat, cure, or prevent diabetes or any medical condition. The information provided is for general education and lifestyle support only. Always consult a qualified healthcare professional for medical advice, diagnosis, testing, or treatment, especially if you have diabetes, prediabetes, use medication, or have concerns about your blood glucose.
          </p>
        </div>
      </section>

      <EbStickyCta />
    </main>
  )
}
