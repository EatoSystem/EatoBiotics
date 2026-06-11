import { NextResponse } from "next/server"
import { getUser } from "@/lib/supabase-server"
import { canAccess, getUserMembershipTier } from "@/lib/membership"

/* ── /api/eatobiotic/voice-token ─────────────────────────────────────────
   Mints a short-lived ElevenLabs signed URL for the voice agent. Voice is a
   paid-tier perk, so this:
     1. requires a signed-in user,
     2. requires a tier with `ai_voice` access,
     3. returns a signed URL only when ElevenLabs is configured.

   Until ELEVENLABS_API_KEY + ELEVENLABS_AGENT_ID are set in the environment
   it responds { configured: false } so the client can show a graceful
   "voice is being set up" state instead of a broken connection. The agent ID
   is never exposed to the browser — the signed URL is minted server-side.
──────────────────────────────────────────────────────────────────────── */

export async function POST() {
  const user = await getUser().catch(() => null)
  if (!user) {
    return NextResponse.json({ error: "sign_in_required" }, { status: 401 })
  }

  const tier = await getUserMembershipTier(user.id)
  if (!canAccess(tier, "ai_voice")) {
    return NextResponse.json({ error: "upgrade_required" }, { status: 403 })
  }

  const apiKey  = process.env.ELEVENLABS_API_KEY
  const agentId = process.env.ELEVENLABS_AGENT_ID
  if (!apiKey || !agentId) {
    // Feature is gated-on but the provider isn't wired up yet.
    return NextResponse.json({ configured: false })
  }

  try {
    const res = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${encodeURIComponent(agentId)}`,
      { headers: { "xi-api-key": apiKey }, cache: "no-store" },
    )
    if (!res.ok) {
      console.error("[eatobiotic/voice-token] ElevenLabs error:", res.status)
      return NextResponse.json({ error: "voice_unavailable" }, { status: 502 })
    }
    const data = (await res.json()) as { signed_url?: string }
    if (!data.signed_url) {
      return NextResponse.json({ error: "voice_unavailable" }, { status: 502 })
    }
    return NextResponse.json({ configured: true, signedUrl: data.signed_url })
  } catch (err) {
    console.error("[eatobiotic/voice-token]", err)
    return NextResponse.json({ error: "voice_unavailable" }, { status: 502 })
  }
}
