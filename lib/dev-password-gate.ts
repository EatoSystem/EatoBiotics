export const DEV_COOKIE = "eb_dev_auth"

export function isPasswordGateEnabled(): boolean {
  const gateSetting = process.env.EATOBIOTICS_PASSWORD_GATE?.trim().toLowerCase()
  if (gateSetting === "false" || gateSetting === "0" || gateSetting === "off") return false
  if (gateSetting === "true" || gateSetting === "1" || gateSetting === "on") return true

  // During redevelopment, Vercel may only have DEV_PASSWORD configured.
  // A missing password still keeps the gate off; there is no hardcoded fallback.
  return Boolean(getDevPassword())
}

export function getDevPassword(): string | null {
  return process.env.DEV_PASSWORD?.trim() || null
}

export async function devPasswordToken(password: string): Promise<string> {
  const data = new TextEncoder().encode(`eatobiotics-preview:${password}`)
  const digest = await crypto.subtle.digest("SHA-256", data)
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")
}
