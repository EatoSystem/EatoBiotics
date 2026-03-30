import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { getUser } from "@/lib/supabase-server"
import { getUserMembershipTier, canAccess } from "@/lib/membership"
import PlateCreatorClient from "./plate-creator-client"

export const metadata: Metadata = {
  title: "Create My Plate — EatoBiotics",
  description:
    "Generate a personalised daily or weekly meal plate optimised for food system health, powered by the EatoBiotics 3-Biotics framework and Claude AI.",
}

const BIOTICS = [
  {
    key: "prebiotic",
    icon: "🌿",
    label: "Prebiotic",
    description: "Feeds your beneficial gut bacteria",
    color: "var(--icon-green)",
  },
  {
    key: "probiotic",
    icon: "🦠",
    label: "Probiotic",
    description: "Adds live cultures to your microbiome",
    color: "var(--icon-teal)",
  },
  {
    key: "postbiotic",
    icon: "🔥",
    label: "Postbiotic",
    description: "Produces gut-healing compounds",
    color: "var(--icon-orange)",
  },
]

export default async function CreateMyPlatePage() {
  // Auth gate
  const user = await getUser()
  if (!user) redirect("/assessment?signin=1")

  // Tier gate — paid plans only
  const tier = await getUserMembershipTier(user.id)
  if (!canAccess(tier, "create_my_plate")) {
    redirect("/pricing?feature=create-my-plate")
  }

  return (
    <main className="min-h-screen bg-background">
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden px-4 pb-10 pt-16 text-center sm:pt-20">
        {/* Radial glow */}
        <div
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(ellipse 80% 50% at 50% 0%, color-mix(in srgb, var(--icon-lime) 18%, transparent), transparent 70%)",
          }}
        />

        {/* Label badge */}
        <div
          className="mb-5 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold"
          style={{
            background: "color-mix(in srgb, var(--icon-lime) 15%, transparent)",
            color: "var(--icon-green)",
          }}
        >
          <span>🌱</span>
          EatoBiotics — Plate Creator
        </div>

        {/* Heading */}
        <h1 className="font-serif text-4xl font-bold leading-tight sm:text-5xl">
          Build your{" "}
          <span className="brand-gradient-text">food system plate</span>
        </h1>

        {/* Subtitle */}
        <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground">
          Tell us your goal and dietary preferences — our AI generates a personalised
          meal plan using the 3-Biotics framework, complete with nutrition data,
          a food system insight, and a shopping list.
        </p>

        {/* 3 Biotics cards */}
        <div className="mx-auto mt-10 grid max-w-2xl grid-cols-3 gap-3 sm:gap-4">
          {BIOTICS.map((b) => (
            <div
              key={b.key}
              className="rounded-2xl border p-4 text-left"
              style={{
                background: `color-mix(in srgb, ${b.color} 6%, var(--card))`,
                borderColor: `color-mix(in srgb, ${b.color} 25%, transparent)`,
              }}
            >
              <span
                className="mb-2.5 flex h-9 w-9 items-center justify-center rounded-xl text-lg"
                style={{ background: `color-mix(in srgb, ${b.color} 15%, transparent)` }}
              >
                {b.icon}
              </span>
              <p className="font-serif text-sm font-semibold text-foreground">{b.label}</p>
              <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{b.description}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="section-divider" />

      {/* ── Plate Creator ───────────────────────────────────── */}
      <section className="mx-auto max-w-3xl px-4 py-10">
        <PlateCreatorClient />
      </section>

      {/* ── Footer note ─────────────────────────────────────── */}
      <p className="pb-10 text-center text-xs text-muted-foreground">
        Powered by Claude AI · Plates are suggestions, not medical advice
      </p>
    </main>
  )
}
