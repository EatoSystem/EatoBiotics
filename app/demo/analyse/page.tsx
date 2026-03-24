import type { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"
import { ArrowLeft, Loader2 } from "lucide-react"
import { AnalyseClient } from "@/app/analyse/analyse-client"

export const metadata: Metadata = {
  title: "Meal Analysis Demo — EatoBiotics",
  description: "Try the EatoBiotics meal analyser — no account needed.",
  robots: "noindex",
}

export default function DemoAnalysePage() {
  return (
    <div className="min-h-screen bg-background pt-[57px]">
      {/* Demo banner */}
      <div
        className="border-b px-4 py-2.5"
        style={{
          background: "color-mix(in srgb, var(--icon-teal) 8%, var(--background))",
          borderColor: "color-mix(in srgb, var(--icon-teal) 20%, transparent)",
        }}
      >
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/demo"
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft size={12} /> Demo hub
            </Link>
            <span className="text-muted-foreground/40 text-xs">·</span>
            <p className="text-xs font-semibold" style={{ color: "var(--icon-teal)" }}>
              Demo mode — no account needed. Analysis uses the public endpoint.
            </p>
          </div>
          <Link
            href="/pricing"
            className="shrink-0 text-xs font-semibold hover:underline"
            style={{ color: "var(--icon-teal)" }}
          >
            See paid plans →
          </Link>
        </div>
      </div>

      {/* Full analyse UI — no gate, no tier prop → calls /api/analyse-plate */}
      <Suspense
        fallback={
          <div className="flex min-h-[60vh] items-center justify-center">
            <Loader2 size={24} className="animate-spin text-muted-foreground" />
          </div>
        }
      >
        <AnalyseClient />
      </Suspense>
    </div>
  )
}
