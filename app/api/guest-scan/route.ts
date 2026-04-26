import { NextRequest, NextResponse } from "next/server"
import { getSupabase } from "@/lib/supabase"

export const dynamic = "force-dynamic"

interface GuestScanBody {
  email?: string
  name?: string
  result: Record<string, unknown>
  hash: string
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as GuestScanBody
    const { email, name, result, hash } = body

    if (!result || !hash) {
      return NextResponse.json({ error: "Missing result or hash" }, { status: 400 })
    }

    const supabase = getSupabase()
    if (!supabase) {
      // DB unavailable — non-fatal, return success anyway
      return NextResponse.json({ success: true, shareUrl: `/analyse/result/${hash}` })
    }

    const biotics_score = typeof result.score === "number" ? Math.round(result.score) : null

    // 1. Insert into meal_scans
    const { error: scanError } = await supabase
      .from("meal_scans")
      .insert({
        hash,
        email: email || null,
        name: name || null,
        result_json: result,
        biotics_score,
      })

    if (scanError) {
      console.error("[guest-scan] meal_scans insert error:", scanError.message)
      // Non-fatal — continue to lead upsert
    }

    // 2. If email provided, upsert into leads
    if (email) {
      const { error: leadError } = await supabase
        .from("leads")
        .upsert(
          {
            email,
            name: name || null,
            overall_score: null,
          },
          { onConflict: "email", ignoreDuplicates: false }
        )

      if (leadError) {
        console.error("[guest-scan] leads upsert error:", leadError.message)
        // Non-fatal
      }
    }

    return NextResponse.json({ success: true, shareUrl: `/analyse/result/${hash}` })
  } catch (err) {
    console.error("[guest-scan] error:", err)
    // Always return success — don't block the user experience on DB errors
    return NextResponse.json({ success: true })
  }
}
