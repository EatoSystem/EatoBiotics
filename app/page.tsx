import Image from "next/image"
import { Hero } from "@/components/home/hero"
import { Pathways } from "@/components/home/pathways"
import { HowItWorks } from "@/components/home/how-it-works"
import { TheThreeBiotics } from "@/components/home/the-three-biotics"
import { ThePlate } from "@/components/home/the-plate"
import { AppShowcase } from "@/components/home/app-showcase"
import { MembershipTeaser } from "@/components/home/membership-teaser"
import { Manifesto } from "@/components/home/manifesto"
import { FounderTeaser } from "@/components/home/founder-teaser"
import { WhatWereBuilding } from "@/components/home/what-were-building"
import { LatestFromSubstack } from "@/components/home/latest-from-substack"
import { TrustDisclaimer } from "@/components/home/trust-disclaimer"
import { FAQ } from "@/components/home/faq"
import { TryAMealTeaser } from "@/components/home/try-a-meal-teaser"
import { Testimonials } from "@/components/home/testimonials"
import { StickyCta } from "@/components/start/sticky-cta"

export default function Home() {
  return (
    <>
      <Hero />
      <div style={{ height: "2px", background: "linear-gradient(90deg, var(--icon-lime), var(--icon-green), var(--icon-teal), var(--icon-yellow), var(--icon-orange))" }} />
      <Pathways />
      <HowItWorks />
      <TheThreeBiotics />
      <ThePlate />
      <div className="section-divider" />
      <TryAMealTeaser />
      <div className="section-divider" />
      <AppShowcase />
      <div className="section-divider" />
      <MembershipTeaser />
      <div className="section-divider" />
      <Testimonials />
      <div className="section-divider" />
      <Manifesto />
      <FounderTeaser />
      <WhatWereBuilding />
      <div className="section-divider" />
      <LatestFromSubstack />
      <div className="section-divider" />
      <TrustDisclaimer />
      <FAQ />
      <StickyCta />
    </>
  )
}
