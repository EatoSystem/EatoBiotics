/**
 * expo-secure-store adapter for the Supabase session.
 *
 * The refresh token must not live in AsyncStorage. SecureStore's per-value
 * limit is ~2KB on some devices; a session JSON can exceed that, so values
 * are chunked. Web (unsupported for this companion) falls back to memory
 * so the module does not crash under Expo web — it is not a persistence path.
 */
import { Platform } from "react-native"

const CHUNK = 1800
const memory = new Map<string, string>()

type SecureStoreModule = {
  getItemAsync: (key: string) => Promise<string | null>
  setItemAsync: (key: string, value: string) => Promise<void>
  deleteItemAsync: (key: string) => Promise<void>
}

let store: SecureStoreModule | null | undefined

async function loadStore(): Promise<SecureStoreModule | null> {
  if (store !== undefined) return store
  if (Platform.OS === "web") {
    store = null
    return null
  }
  try {
    store = (await import("expo-secure-store")) as SecureStoreModule
  } catch {
    store = null
  }
  return store
}

export const secureAuthStorage = {
  async getItem(key: string): Promise<string | null> {
    const s = await loadStore()
    if (!s) return memory.get(key) ?? null
    const chunksRaw = await s.getItemAsync(`${key}_chunks`)
    if (!chunksRaw) return s.getItemAsync(key)
    const n = Number(chunksRaw)
    if (!Number.isFinite(n) || n < 1) return null
    const parts: string[] = []
    for (let i = 0; i < n; i++) {
      const part = await s.getItemAsync(`${key}_${i}`)
      if (part == null) return null
      parts.push(part)
    }
    return parts.join("")
  },

  async setItem(key: string, value: string): Promise<void> {
    const s = await loadStore()
    if (!s) {
      memory.set(key, value)
      return
    }
    const n = Math.max(1, Math.ceil(value.length / CHUNK))
    await s.setItemAsync(`${key}_chunks`, String(n))
    for (let i = 0; i < n; i++) {
      await s.setItemAsync(`${key}_${i}`, value.slice(i * CHUNK, (i + 1) * CHUNK))
    }
  },

  async removeItem(key: string): Promise<void> {
    const s = await loadStore()
    if (!s) {
      memory.delete(key)
      return
    }
    const chunksRaw = await s.getItemAsync(`${key}_chunks`)
    const n = chunksRaw ? Number(chunksRaw) : 0
    await s.deleteItemAsync(`${key}_chunks`)
    await s.deleteItemAsync(key)
    for (let i = 0; i < n; i++) {
      await s.deleteItemAsync(`${key}_${i}`)
    }
  },
}
