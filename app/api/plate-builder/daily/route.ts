import { NextRequest, NextResponse } from "next/server"
import type { PlateId } from "@/lib/plate-builder-recipe"

const DAILY_PLATES: Array<{
  plateId: PlateId
  goal: string
  flavour: string
}> = [
  { plateId: "foundation", goal: "balance", flavour: "Bright and zesty" },
  { plateId: "function", goal: "immunity", flavour: "Fresh and herb-led" },
  { plateId: "diversity", goal: "diversity", flavour: "Warm and spiced" },
  { plateId: "restoration", goal: "recovery", flavour: "Clean and simple" },
]

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && req.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 })
  }

  const dayIndex = Math.floor(Date.now() / 86_400_000) % DAILY_PLATES.length
  const daily = DAILY_PLATES[dayIndex]
  const origin = req.nextUrl.origin
  const response = await fetch(`${origin}/api/plate-builder`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...daily,
      country: "None",
      dietaryStyle: "Flexible",
      cookingTime: "25 minutes",
      publish: true,
    }),
  })

  const data = await response.json()
  return NextResponse.json({
    ok: response.ok,
    daily,
    ...data,
  }, { status: response.ok ? 200 : 500 })
}
