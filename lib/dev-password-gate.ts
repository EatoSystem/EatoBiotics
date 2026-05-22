export const DEV_COOKIE = "eb_dev_auth"

export function isPasswordGateEnabled(): boolean {
  const forceOff = process.env.EATOBIOTICS_PASSWORD_GATE_DISABLED?.trim().toLowerCase()
  if (forceOff === "true" || forceOff === "1" || forceOff === "on") return false

  // During redevelopment, setting DEV_PASSWORD is the switch that protects the site.
  // This avoids a hardcoded fallback password while making Vercel setup simple.
  if (getDevPassword()) return true

  const gateSetting = process.env.EATOBIOTICS_PASSWORD_GATE?.trim().toLowerCase()
  if (gateSetting === "true" || gateSetting === "1" || gateSetting === "on") return true

  return false
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
