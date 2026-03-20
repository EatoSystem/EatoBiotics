import { Hero } from "@/components/home/hero"
import { TheThreeBiotics } from "@/components/home/the-three-biotics"
import { ThePlate } from "@/components/home/the-plate"
import { Manifesto } from "@/components/home/manifesto"
import { WhatWereBuilding } from "@/components/home/what-were-building"
import { BookShowcase } from "@/components/home/book-showcase"
import { PodcastTeaser } from "@/components/home/podcast-teaser"
import { AppShowcase } from "@/components/home/app-showcase"
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
      <BookShowcase />
      <div className="section-divider" />
      <PodcastTeaser />
      <div className="section-divider" />
      <AppShowcase />
      <div className="section-divider" />
      <NewsletterCta />
      <LatestFromSubstack />
      <div className="section-divider" />
      <EatoSystemTeaser />
    </>
  )
}
