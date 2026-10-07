/**
 * Supabase session for the companion. Anon URL + key only — both are public
 * (the same values as NEXT_PUBLIC_* on the web). No service-role, Stripe,
 * Anthropic, or cron secret enters this module.
 */
import { createClient, type Session, type SupabaseClient } from "@supabase/supabase-js"
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "../config"
import { secureAuthStorage } from "./secure-storage"

let client: SupabaseClient | null = null

export function getMobileSupabase(): SupabaseClient | null {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null
  if (client) return client
  client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      storage: secureAuthStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  })
  return client
}

export async function readSession(): Promise<Session | null> {
  const supabase = getMobileSupabase()
  if (!supabase) return null
  const { data } = await supabase.auth.getSession()
  return data.session ?? null
}

export async function signOut(): Promise<void> {
  const supabase = getMobileSupabase()
  if (!supabase) return
  await supabase.auth.signOut()
}
