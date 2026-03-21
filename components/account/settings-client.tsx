"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseBrowser } from "@/lib/supabase-browser"
import { ArrowLeft, LogOut, Save, Check } from "lucide-react"
import Link from "next/link"

const AGE_BRACKETS = ["Under 20", "20–29", "30–39", "40–49", "50–59", "60+"]

interface SettingsClientProps {
  profile: {
    id: string
    email: string
    name: string | null
    age_bracket: string | null
    created_at?: string | null
  }
}

export function SettingsClient({ profile }: SettingsClientProps) {
  const router = useRouter()
  const [name, setName] = useState(profile.name ?? "")
  const [ageBracket, setAgeBracket] = useState(profile.age_bracket ?? "")
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const memberSince = profile.created_at
    ? new Date(profile.created_at).toLocaleDateString("en-IE", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const res = await fetch("/api/account/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() || null, age_bracket: ageBracket || null }),
      })
      if (!res.ok) throw new Error("Update failed")
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
      router.refresh()
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  const handleSignOut = async () => {
    const supabase = getSupabaseBrowser()
    await supabase.auth.signOut()
    router.push("/assessment")
  }

  return (
    <div className="mx-auto max-w-xl px-4 pb-20 sm:px-6">
      {/* Back link */}
      <div className="mb-6">
        <Link
          href="/account"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft size={14} />
          Back to dashboard
        </Link>
      </div>

      <h1 className="mb-6 font-serif text-2xl font-semibold text-foreground sm:text-3xl">
        Account Settings
      </h1>

      <form onSubmit={handleSave} className="space-y-5">
        {/* Email (read-only) */}
        <div className="rounded-2xl border bg-card p-5">
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Account email
          </label>
          <p className="text-sm font-medium text-foreground">{profile.email}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Email cannot be changed.</p>
        </div>

        {/* Member since */}
        {memberSince && (
          <div className="rounded-2xl border bg-card p-5">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Member since
            </label>
            <p className="text-sm font-medium text-foreground">{memberSince}</p>
          </div>
        )}

        {/* Name */}
        <div>
          <label
            htmlFor="settings-name"
            className="mb-1.5 block text-xs font-semibold text-foreground"
          >
            Name
          </label>
          <input
            id="settings-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none transition focus:border-[var(--icon-green)] focus:ring-1 focus:ring-[var(--icon-green)]/30"
          />
        </div>

        {/* Age bracket */}
        <div>
          <label
            htmlFor="settings-age"
            className="mb-1.5 block text-xs font-semibold text-foreground"
          >
            Age bracket
          </label>
          <select
            id="settings-age"
            value={ageBracket}
            onChange={(e) => setAgeBracket(e.target.value)}
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none transition focus:border-[var(--icon-green)] focus:ring-1 focus:ring-[var(--icon-green)]/30"
          >
            <option value="">Select your age range</option>
            {AGE_BRACKETS.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>

        {/* Error */}
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        {/* Save button */}
        <button
          type="submit"
          disabled={saving}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          style={{ background: "var(--icon-green)" }}
        >
          {saved ? (
            <>
              <Check size={15} />
              Saved!
            </>
          ) : saving ? (
            "Saving…"
          ) : (
            <>
              <Save size={15} />
              Save changes
            </>
          )}
        </button>
      </form>

      {/* Sign out */}
      <div className="mt-10 border-t border-border pt-6">
        <button
          onClick={handleSignOut}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <LogOut size={14} />
          Sign out of EatoBiotics
        </button>
      </div>
    </div>
  )
}
