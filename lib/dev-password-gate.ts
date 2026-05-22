export const DEV_COOKIE = "eb_dev_preview_auth"
const TEMPORARY_DEVELOPMENT_PASSWORD = "Monkstown"

export function isPasswordGateEnabled(): boolean {
  // Temporary redevelopment lock: prefer Vercel's DEV_PASSWORD, then the short-term
  // fallback requested for the private build. Remove the fallback before launch.
  if (getDevPassword()) return true

  const forceOff = process.env.EATOBIOTICS_PASSWORD_GATE_DISABLED?.trim().toLowerCase()
  if (forceOff === "true" || forceOff === "1" || forceOff === "on") return false

  const gateSetting = process.env.EATOBIOTICS_PASSWORD_GATE?.trim().toLowerCase()
  if (gateSetting === "true" || gateSetting === "1" || gateSetting === "on") return true

  return false
}

export function getDevPassword(): string | null {
  return process.env.DEV_PASSWORD?.trim() || TEMPORARY_DEVELOPMENT_PASSWORD
}

export async function devPasswordToken(password: string): Promise<string> {
  const data = new TextEncoder().encode(`eatobiotics-preview:${password}`)
  const digest = await crypto.subtle.digest("SHA-256", data)
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")
}
