import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

/**
 * Server-side Supabase client (service role).
 * Returns null if env vars are not configured — callers must handle this.
 */
export function getSupabase() {
  if (!supabaseUrl || !supabaseKey) return null
  return createClient(supabaseUrl, supabaseKey)
}
