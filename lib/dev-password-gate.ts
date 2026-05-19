export const DEV_COOKIE = "eb_dev_auth"

export function isPasswordGateEnabled(): boolean {
  return process.env.EATOBIOTICS_PASSWORD_GATE === "true"
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
