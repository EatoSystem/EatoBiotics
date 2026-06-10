import { redirect } from "next/navigation"

// The standalone €20/40/50 "Deep Assessment Reports" tiers were retired. The
// single €49 Personal Report is sold via the assessment → checkout flow, so
// send this URL to the canonical pricing page.
export default function ReportsPage() {
  redirect("/pricing")
}
