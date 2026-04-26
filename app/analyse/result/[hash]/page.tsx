import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowRight, ArrowLeft } from "lucide-react"
import { getSupabase } from "@/lib/supabase"
import { ResultBuilder, type AnalysisResult } from "@/components/analyse/result-builder"

export const dynamic = "force-dynamic"

/* ── Metadata ──────────────────────────────────────────────────────── */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ hash: string }>
}): Promise<Metadata> {
  const { hash } = await params
  const supabase = getSupabase()
  if (!supabase) return {}

  const { data } = await supabase
    .from("meal_scans")
    .select("result_json, biotics_score")
    .eq("hash", hash)
    .single()

  if (!data) return {}

  const result = data.result_json as AnalysisResult
  const mealName = result.mealName ?? "Meal Analysis"
  const score = data.biotics_score ?? result.score ?? 0

  return {
    title: `${mealName} — ${score}/100 | EatoBiotics`,
    description: `This meal scored ${score}/100 on EatoBiotics. How does yours score? Take the free analysis.`,
    openGraph: {
      title: `${mealName} scored ${score}/100 on EatoBiotics`,
      description: `How does your meal compare? Get your free Biotics Score at eatobiotics.com`,
    },
  }
}

/* ── Page ──────────────────────────────────────────────────────────── */

export default async function ResultPage({
  params,
}: {
  params: Promise<{ hash: string }>
}) {
  const { hash } = await params
  const supabase = getSupabase()

  if (!supabase) {
    return <ResultNotFound />
  }

  const { data } = await supabase
    .from("meal_scans")
    .select("result_json, biotics_score, name, created_at")
    .eq("hash", hash)
    .single()

  if (!data) {
    return <ResultNotFound />
  }

  const result = data.result_json as AnalysisResult

  return (
    <main className="min-h-screen px-4 py-12 md:py-16">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <Link
            href="/analyse"
            className="mb-6 inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={12} /> Back to Analyse
          </Link>
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Shared Result
          </p>
          <h1 className="mt-2 font-serif text-2xl font-semibold text-foreground">
            {result.mealName ?? "Meal Analysis"}
          </h1>
          {data.name && (
            <p className="mt-1 text-sm text-muted-foreground">
              Shared by <span className="font-semibold text-foreground">{data.name}</span>
            </p>
          )}
        </div>

        {/* Rainbow divider */}
        <div
          className="h-0.5 w-full mb-8 rounded-full"
          style={{
            background: "linear-gradient(90deg, var(--icon-lime), var(--icon-green), var(--icon-teal), var(--icon-yellow), var(--icon-orange))",
          }}
        />

        {/* Results */}
        <ResultBuilder result={result} isGuest />

        {/* Try yours CTA */}
        <div className="mt-8 rounded-2xl border border-border bg-card p-6 text-center">
          <h2 className="font-serif text-xl font-semibold text-foreground">
            What does your meal score?
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Upload a photo or describe your meal. Free. Takes 30 seconds.
          </p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/analyse"
              className="flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))" }}
            >
              Score My Meal — Free <ArrowRight size={14} />
            </Link>
            <Link
              href="/assessment"
              className="flex items-center justify-center gap-2 rounded-full border border-border px-6 py-3 text-sm font-semibold text-foreground hover:bg-muted transition-colors"
            >
              Get My Full Biotics Score
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}

/* ── Not Found State ─────────────────────────────────────────────────── */

function ResultNotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="mx-auto max-w-sm text-center">
        <span className="text-5xl">🌿</span>
        <h1 className="mt-4 font-serif text-2xl font-semibold text-foreground">
          Result not found
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This result may have expired or the link is incorrect.
        </p>
        <Link
          href="/analyse"
          className="mt-6 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))" }}
        >
          Analyse a meal <ArrowRight size={14} />
        </Link>
      </div>
    </main>
  )
}
