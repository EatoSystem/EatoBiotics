import type { Metadata } from "next"
import { ConceptHero } from "@/components/newhome/hero"
import { Process } from "@/components/newhome/process"
import { ScoreExample } from "@/components/newhome/score-example"
import { GlobalDirection } from "@/components/newhome/global-direction"
import { Foundation } from "@/components/newhome/foundation"
import { DigitalTwin } from "@/components/newhome/digital-twin"
import { Start } from "@/components/newhome/start"

/*
 * Alternative homepage, for review and real visitor testing against `/`.
 * The production homepage is deliberately untouched so the two can be compared.
 *
 * Not linked from navigation, footer or sitemap; noindex/nofollow below.
 * Promotion path: fold approved chapters into `/` via a separate PR, then
 * delete app/newhome + components/newhome in one step.
 *
 * Seven chapters, ordered so the product proof arrives early:
 *   1. Hero            — the category and the primary action
 *   2. Process         — what the product does (Assess → Score → Understand → Improve)
 *   3. Sample score    — the principal proof moment, kept high on the page
 *   4. Global/local    — the differentiator, and the page's dark contrast band
 *   5. Foundation      — what the person does (Feed. Seed. Regenerate.) + the plate
 *   6. Digital Twin    — what happens after the first score
 *   7. Start           — You/Family, pricing, trust and the close
 *
 * Chapters 2 and 5 carry deliberately different jobs — product mechanism versus
 * personal behaviour — so they no longer read as two versions of one idea.
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
      <Process />
      <ScoreExample />
      <GlobalDirection />
      <Foundation />
      <DigitalTwin />
      <Start />
    </div>
  )
}
