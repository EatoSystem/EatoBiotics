import { Hero } from "@/components/home/hero"
import { Pathways } from "@/components/home/pathways"
import { HowItWorks } from "@/components/home/how-it-works"
import { TheThreeBiotics } from "@/components/home/the-three-biotics"
import { ThePlate } from "@/components/home/the-plate"
import { AppShowcase } from "@/components/home/app-showcase"
import { MembershipTeaser } from "@/components/home/membership-teaser"
import { Manifesto } from "@/components/home/manifesto"
import { WhatWereBuilding } from "@/components/home/what-were-building"
import { BookShowcase } from "@/components/home/book-showcase"
import { PodcastTeaser } from "@/components/home/podcast-teaser"
import { EatoSystemTeaser } from "@/components/home/eatosystem-teaser"
import { LatestFromSubstack } from "@/components/home/latest-from-substack"
import { NewsletterCta } from "@/components/home/newsletter-cta"

export default function Home() {
  return (
    <>
      <Hero />
      <div style={{ height: "2px", background: "linear-gradient(90deg, var(--icon-lime), var(--icon-green), var(--icon-teal), var(--icon-yellow), var(--icon-orange))" }} />
      <HowItWorks />
      <TheThreeBiotics />
      <ThePlate />
      <div className="section-divider" />
      <AppShowcase />
      <div className="section-divider" />
      <MembershipTeaser />
      <div className="section-divider" />
      <Manifesto />
      <WhatWereBuilding />
      <div className="section-divider" />
      <BookShowcase />
      <div className="section-divider" />
      <PodcastTeaser />
      <div className="section-divider" />
      <NewsletterCta />
      <LatestFromSubstack />
      <div className="section-divider" />
      <EatoSystemTeaser />
    </>
  )
}
