import { Hero } from "@/components/home/hero"
import { TheThreeBiotics } from "@/components/home/the-three-biotics"
import { ThePlate } from "@/components/home/the-plate"
import { Manifesto } from "@/components/home/manifesto"
import { WhatWereBuilding } from "@/components/home/what-were-building"
import { EatoSystemTeaser } from "@/components/home/eatosystem-teaser"
import { LatestFromSubstack } from "@/components/home/latest-from-substack"
import { NewsletterCta } from "@/components/home/newsletter-cta"

export default function Home() {
  return (
    <>
      <Hero />
      <TheThreeBiotics />
      <ThePlate />
      <Manifesto />
      <WhatWereBuilding />
      <div className="section-divider" />
      <EatoSystemTeaser />
      <div className="section-divider" />
      <LatestFromSubstack />
      <NewsletterCta />
    </>
  )
}
