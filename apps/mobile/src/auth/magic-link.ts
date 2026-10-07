import { SITE_URL } from "../config"

export type MagicLinkResult =
  | { ok: true; emailSent: boolean }
  | { ok: false; reason: "invalid_email" | "send_failed" | "network" }

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function requestMagicLink(email: string): Promise<MagicLinkResult> {
  const trimmed = email.trim().toLowerCase()
  if (!EMAIL.test(trimmed)) return { ok: false, reason: "invalid_email" }

  try {
    const res = await fetch(`${SITE_URL}/api/auth/send-magic-link`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: trimmed, client: "mobile" }),
    })
    if (!res.ok) return { ok: false, reason: "send_failed" }
    const body = (await res.json()) as { ok?: boolean; emailSent?: boolean; skipped?: boolean }
    if (body.ok === false) return { ok: false, reason: "send_failed" }
    return { ok: true, emailSent: body.emailSent === true }
  } catch {
    return { ok: false, reason: "network" }
  }
}
