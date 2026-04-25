"use client"

import Link from "next/link"
import Image from "next/image"
import { Home } from "lucide-react"
import { useMemo } from "react"
import { foods } from "@/lib/foods"

const BIOTIC_LABELS: Record<string, string> = {
  prebiotic: "Prebiotic",
  probiotic: "Probiotic",
  postbiotic: "Postbiotic",
  protein: "Protein",
}

const BIOTIC_COLORS: Record<string, string> = {
  prebiotic: "var(--icon-lime)",
  probiotic: "var(--icon-teal)",
  postbiotic: "var(--icon-orange)",
  protein: "var(--icon-yellow)",
}

export default function NotFound() {
  const food = useMemo(
    () => foods[Math.floor(Math.random() * foods.length)],
    []
  )

  const bioticColor = BIOTIC_COLORS[food.biotic] ?? "var(--icon-green)"
  const bioticLabel = BIOTIC_LABELS[food.biotic] ?? food.biotic

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center px-6 text-center">
      <Image
        src="/eatobiotics-icon.webp"
        alt=""
        width={48}
        height={48}
        className="mb-6 opacity-60"
      />
      <p className="text-xs font-semibold uppercase tracking-widest text-icon-green mb-4">
        404 — Page Not Found
      </p>
      <h1 className="font-serif text-5xl font-bold text-foreground sm:text-6xl text-balance">
        This page doesn&apos;t<br />
        <span className="brand-gradient-text">exist yet.</span>
      </h1>
      <p className="mt-6 max-w-md text-base leading-relaxed text-muted-foreground">
        The page you&apos;re looking for has moved, been removed, or hasn&apos;t been built yet.
        Head back to the homepage and pick up where you left off.
      </p>

      <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Link
          href="/"
          className="brand-gradient inline-flex items-center gap-2 rounded-full px-8 py-4 text-base font-semibold text-white shadow-lg transition-all hover:opacity-90"
        >
          <Home size={16} />
          Go to Homepage
        </Link>
        <Link
          href="/assessment"
          className="inline-flex items-center gap-2 rounded-full border border-border px-8 py-4 text-base font-semibold text-foreground transition-all hover:bg-muted"
        >
          Get My Free Biotics Score
        </Link>
      </div>

      {/* Easter egg — random food fact */}
      <div className="mt-14 max-w-sm">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
          While you&apos;re here — did you know?
        </p>
        <Link
          href={`/food/${food.slug}`}
          className="group block overflow-hidden rounded-2xl border border-border bg-background p-5 text-left transition-all hover:shadow-md"
        >
          <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl" />
          <div className="flex items-center gap-3 mb-3">
            <span className="text-3xl">{food.emoji}</span>
            <div>
              <p className="font-semibold text-foreground text-sm">{food.name}</p>
              <span
                className="inline-block rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
                style={{ backgroundColor: bioticColor }}
              >
                {bioticLabel}
              </span>
            </div>
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground line-clamp-3">
            {food.benefits[0]?.detail ?? food.tagline}
          </p>
          <p
            className="mt-3 text-xs font-semibold transition-colors group-hover:opacity-70"
            style={{ color: bioticColor }}
          >
            Read the full profile →
          </p>
        </Link>
      </div>
    </div>
  )
}
