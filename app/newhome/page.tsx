import type { Metadata } from "next"
import { ConceptHero } from "@/components/newhome/hero"
import { ScoreExample } from "@/components/newhome/score-example"
import { FeedSeedHeal } from "@/components/newhome/feed-seed-heal"
import { Journey } from "@/components/newhome/journey"
import { StateOfProduct } from "@/components/newhome/state-of-product"
import { Pathways } from "@/components/newhome/pathways"
import { MealMap } from "@/components/newhome/meal-map"
import { GlobalDirection } from "@/components/newhome/global-direction"
import { TrustAndConnection } from "@/components/newhome/trust-and-connection"

/*
 * TEMPORARY homepage concept for internal design/positioning review only.
 * Not linked from navigation, footer, or sitemap; noindex/nofollow below.
 * Promotion path: fold approved sections into `/` via a separate PR, then
 * delete app/newhome + components/newhome in one step.
 */
export const metadata: Metadata = {
  title: "New homepage concept — EatoBiotics",
  description: "Internal homepage concept for review. Not a public page.",
  robots: { index: false, follow: false },
}

export default function NewHomeConceptPage() {
  return (
    <div className="bg-white">
      <ConceptHero />
      <ScoreExample />
      <FeedSeedHeal />
      <Journey />
      <StateOfProduct />
      <Pathways />
      <MealMap />
      <GlobalDirection />
      <TrustAndConnection />
    </div>
  )
}
