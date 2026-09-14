import type { Metadata } from "next"
import Link from "next/link"
import { getSupabase } from "@/lib/supabase"
import { hasFoundersCapReached, FOUNDERS_CAP } from "@/lib/founding"
import { ApplyForm } from "@/components/founding/apply-form"

export const metadata: Metadata = {
  title: "Apply for the Founding 100 | EatoBiotics",
  description:
    "Applications open for the first 100 people to use EatoBiotics — Food System Assessment and Biotics Score™ across prebiotics, probiotics, and postbiotics.",
  openGraph: {
    title: "Apply for the Founding 100 | EatoBiotics",
    description:
      "Applications open for the first 100 people to use EatoBiotics — Food System Assessment and Biotics Score™ across prebiotics, probiotics, and postbiotics.",
  },
}

async function getAdmittedCount(): Promise<number | null> {
  const db = getSupabase()
  if (!db) return null
  try {
    const { count, error } = await db
      .from("founding_applications")
      .select("*", { head: true, count: "exact" })
      .eq("status", "admitted")
    if (error) {
      console.warn("[/apply] count error:", error.message)
      return null
    }
    return count ?? 0
  } catch {
    return null
  }
}

export default async function ApplyPage() {
  const admittedCount = await getAdmittedCount()
  const closed = hasFoundersCapReached(admittedCount)

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
        Founding 100 · Applications open
      </div>
      <h1 className="font-serif text-3xl md:text-4xl font-semibold tracking-tight">
        {closed ? "Founding 100 is full" : "Apply to be one of the first 100"}
      </h1>
      <p className="mt-3 text-lg text-muted-foreground">
        {closed ? (
          <>We’ve filled the first 100 spots. Join the Next 1,000 list to be first in line when we open wider.</>
        ) : (
          <>Get your Biotics Score™ across Prebiotics, Probiotics, and Postbiotics — and help shape EatoBiotics before we open to 1,000, then everyone.</>
        )}
      </p>

      {!closed ? (
        <div className="mt-8">
          <ApplyForm />
          <p className="mt-4 text-sm text-muted-foreground">
            Not medical advice. Educational tool for understanding your food system. Spots limited to {FOUNDERS_CAP} admitted people (not {FOUNDERS_CAP} applications).
          </p>
        </div>
      ) : (
        <div className="mt-8">
          <Link
            href="/waitlist"
            className="inline-flex items-center rounded-full bg-[var(--icon-green)] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90"
          >
            Join the Next 1,000 list
          </Link>
        </div>
      )}
    </div>
  )
}

