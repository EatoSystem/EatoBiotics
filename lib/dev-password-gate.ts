export const DEV_COOKIE = "eb_dev_preview_auth_v3"
export const OLD_DEV_COOKIES = ["eb_dev_auth", "eb_dev_preview_auth", "eb_dev_preview_auth_v2"]

export function isPasswordGateEnabled(): boolean {
  // Explicit kill-switch always wins, so production can be force-public.
  const forceOff = process.env.EATOBIOTICS_PASSWORD_GATE_DISABLED?.trim().toLowerCase()
  if (forceOff === "true" || forceOff === "1" || forceOff === "on") return false

  // The gate is OFF by default. It only turns on when explicitly configured:
  //   - DEV_PASSWORD is set (the password to bypass it), or
  //   - EATOBIOTICS_PASSWORD_GATE is "true"/"1"/"on".
  // There is NO hardcoded fallback password — a real customer must always be
  // able to complete assessment → payment → report → magic link → account in
  // production. To run the pre-launch waitlist instead, set DEV_PASSWORD.
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
