import type { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"
import { ArrowLeft } from "lucide-react"
import { ConsultClient } from "@/app/account/consult/consult-client"

export const metadata: Metadata = {
  title: "EatoBiotic Demo Consultation — EatoBiotics",
  description: "Try a live AI food system consultation with sample data.",
  robots: "noindex",
}

export default function DemoConsultPage() {
  return (
    <div className="min-h-screen bg-background pt-[57px]">
      {/* Demo banner */}
      <div
        className="border-b px-4 py-2.5"
        style={{
          background: "color-mix(in srgb, var(--icon-orange) 10%, var(--background))",
          borderColor: "color-mix(in srgb, var(--icon-orange) 25%, transparent)",
        }}
      >
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/demo/account/transform"
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft size={12} /> Back to Transform
            </Link>
            <span className="text-muted-foreground/40 text-xs">·</span>
            <p className="text-xs font-semibold" style={{ color: "var(--icon-orange)" }}>
              Live demo — sample data for <strong>Sarah M.</strong> Score: 62/100
            </p>
          </div>
          <Link
            href="/assessment"
            className="shrink-0 text-xs font-semibold hover:underline"
            style={{ color: "var(--icon-orange)" }}
          >
            Get your real account →
          </Link>
        </div>
      </div>

      <Suspense
        fallback={
          <div className="flex min-h-[60vh] items-center justify-center">
            <span className="text-sm text-muted-foreground">Loading EatoBiotic…</span>
          </div>
        }
      >
        <ConsultClient
          memberName="Sarah M."
          overallScore={62}
          subScores={{
            diversity:   55,
            feeding:     68,
            adding:      38,
            consistency: 72,
            feeling:     58,
          }}
          pastConsultations={[]}
          dailyCount={1}
          monthlyCount={8}
          apiEndpoint="/api/demo/consult"
        />
      </Suspense>
    </div>
  )
}
