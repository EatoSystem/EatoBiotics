import { PaymentCTA } from "./payment-cta"
import type { AssessmentResult } from "@/lib/assessment-scoring"

interface PremiumTeaserProps {
  result: AssessmentResult
}

export function PremiumTeaser({ result }: PremiumTeaserProps) {
  return <PaymentCTA result={result} />
}
