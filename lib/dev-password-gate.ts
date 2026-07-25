export const DEV_COOKIE = "eb_dev_preview_auth_v3"
export const OLD_DEV_COOKIES = ["eb_dev_auth", "eb_dev_preview_auth", "eb_dev_preview_auth_v2"]

export function isPasswordGateEnabled(): boolean {
  // Go-live kill-switch always wins: set EATOBIOTICS_PASSWORD_GATE_DISABLED=true
  // (or 1/on) to take the site fully public.
  const forceOff = process.env.EATOBIOTICS_PASSWORD_GATE_DISABLED?.trim().toLowerCase()
  if (forceOff === "true" || forceOff === "1" || forceOff === "on") return false

  // Gate is ON whenever a preview password is configured (private-beta mode).
  // The temporary hardcoded fallback password is gone: with no DEV_PASSWORD and
  // no explicit EATOBIOTICS_PASSWORD_GATE=true, the gate is OFF and the site is
  // public. To stay in private beta, DEV_PASSWORD must be set in the deploy env.
  if (getDevPassword()) return true

  const gateSetting = process.env.EATOBIOTICS_PASSWORD_GATE?.trim().toLowerCase()
  if (gateSetting === "true" || gateSetting === "1" || gateSetting === "on") return true

  return false
}

export function getDevPassword(): string | null {
  return process.env.DEV_PASSWORD?.trim() || null
}

export async function devPasswordToken(password: string): Promise<string> {
  const data = new TextEncoder().encode(`eatobiotics-preview-v3:${password}`)
  const digest = await crypto.subtle.digest("SHA-256", data)
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")
}
