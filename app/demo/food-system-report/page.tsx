import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { CanonicalReportDocument } from "@/components/report/canonical/canonical-report"
import { isCanonicalReportPreviewEligible } from "@/lib/report/presentation/preview-policy"
import { toPresentation } from "@/lib/report/presentation/model"
import { previewReport } from "@/lib/report/preview/fixture"

/**
 * The canonical Report, previewed — Phase 4B-S2.
 *
 * ══ WHAT THIS PAGE IS ═══════════════════════════════════════════════════════
 *
 * A fixture Report, composed by the real composer, projected by the real
 * Presentation Model, rendered by the real renderer. It exists so the €49
 * document can be designed and reviewed before anything real is wired to it.
 *
 * ══ WHAT IT DELIBERATELY IS NOT ═════════════════════════════════════════════
 *
 * No database read. No S1 authority layer — that phase built the capability
 * resolver and left it dormant, and a preview page is not the thing that wakes
 * it. No `ensurePersistedConsultationReport`, so nothing is written and
 * Migration 49's table is not consulted. No Stripe. No customer data of any
 * kind. No fallback to the legacy paid Report.
 *
 * And no public access: `isCanonicalReportPreviewEligible` denies production
 * outright, with no flag, header or query parameter that can say otherwise.
 * `notFound()` rather than a redirect or an explanatory page — an ineligible
 * runtime should not confirm that the route exists.
 *
 * It is `noindex`, absent from `app/sitemap.ts`, and absent from `lib/nav.ts`:
 * nothing links to it and nothing should.
 */

export const metadata: Metadata = {
  title: "Report preview",
  robots: "noindex",
}

/**
 * Rendered per request, not at build time.
 *
 * The eligibility decision reads the RUNTIME environment, and a statically
 * prerendered page would carry the build machine's answer into whatever
 * deployment served it — which is exactly the way a fail-closed check becomes
 * decorative.
 */
export const dynamic = "force-dynamic"

export default function CanonicalReportPreviewPage() {
  if (!isCanonicalReportPreviewEligible()) notFound()

  const projected = toPresentation(previewReport("you"))

  // A refusal is a value, not an exception, and the honest answer to "this
  // build has no frozen copy for that pack version" is not a half-rendered
  // document. On a preview page it is simply a 404.
  if (!projected.ok) notFound()

  return <CanonicalReportDocument report={projected.report} />
}
