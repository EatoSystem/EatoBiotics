import { NextRequest, NextResponse } from "next/server"
import { getUser } from "@/lib/supabase-server"
import { getSupabase } from "@/lib/supabase"
import { ownerOrFilter } from "@/lib/supabase-filters"

const SIGNED_URL_TTL_SECONDS = 5 * 60

/**
 * Mints a fresh, short-lived signed URL for a purchased report's PDF, instead
 * of relying on the one-time 7-day signed URL cached in deep_assessments.pdf_url
 * (which goes dead after a week with no warning). The storage object key is
 * derived server-side from the ownership-verified DB row, never from a
 * client-supplied path — the client only ever sends a session id.
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const session = req.nextUrl.searchParams.get("session")
    if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 })

    const adminSupabase = getSupabase()
    if (!adminSupabase) return NextResponse.json({ error: "Not found" }, { status: 404 })

    // Same "not found" response whether the row is missing, not owned by this
    // user, or not yet uploaded — never signals which case it was.
    const { data: row } = await adminSupabase
      .from("deep_assessments")
      .select("stripe_session_id, pdf_status")
      .eq("stripe_session_id", session)
      .or(ownerOrFilter(user.id, user.email))
      .maybeSingle()

    if (!row || row.pdf_status !== "uploaded") {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    const { data: signedData, error } = await adminSupabase.storage
      .from("pdf-reports")
      .createSignedUrl(`${row.stripe_session_id}.pdf`, SIGNED_URL_TTL_SECONDS)

    if (error || !signedData?.signedUrl) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    return NextResponse.json({ pdfUrl: signedData.signedUrl, expiresInSeconds: SIGNED_URL_TTL_SECONDS })
  } catch (err) {
    console.error("[account/pdf-url]", err)
    return NextResponse.json({ error: "Could not refresh PDF link" }, { status: 500 })
  }
}
