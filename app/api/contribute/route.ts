import { NextRequest, NextResponse } from "next/server"

/**
 * Anonymised data contribution endpoint.
 * Receives only: overall score, sub-scores, profile type, and timestamp.
 * No personal identifiers are accepted or stored.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    // Destructure only safe, anonymised fields
    const { overall, subScores, profile, completedAt } = body as {
      overall: number
      subScores: Record<string, number>
      profile: { type: string }
      completedAt: number
    }

    // Log for now — can be extended to write to DB or file
    console.log(
      "[EATOBIOTICS CONTRIBUTE]",
      JSON.stringify({ overall, subScores, profile: profile?.type, completedAt })
    )

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 })
  }
}
