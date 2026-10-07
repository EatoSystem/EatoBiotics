/**
 * On-device check-in cache. Not a credential — the refresh token stays in
 * apps/mobile/src/auth/secure-storage.ts. This reuses expo-secure-store as the
 * store the companion already has, with a memory fallback when the native
 * module is missing (Expo web, tests). Failures are logged, not swallowed.
 */
import { Platform } from "react-native"
import type { KvStore } from "./check-in"

const memory = new Map<string, string>()

type SecureStoreModule = {
  getItemAsync: (key: string) => Promise<string | null>
  setItemAsync: (key: string, value: string) => Promise<void>
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
  } catch (error) {
    console.error("[mobile-twin-state] persist unavailable", error)
    store = null
  }
  return store
}

export const deviceKv: KvStore = {
  async getItem(key: string): Promise<string | null> {
    const s = await loadStore()
    if (!s) return memory.get(key) ?? null
    try {
      const value = await s.getItemAsync(key)
      return value ?? memory.get(key) ?? null
    } catch (error) {
      console.error("[mobile-twin-state] persist get failed", error)
      return memory.get(key) ?? null
    }
  },
  async setItem(key: string, value: string): Promise<void> {
    memory.set(key, value)
    const s = await loadStore()
    if (!s) return
    try {
      await s.setItemAsync(key, value)
    } catch (error) {
      console.error("[mobile-twin-state] persist set failed", error)
    }
  },
}
