"use client"

/**
 * Concept mock: onboarding — native email/password (not magic-link), light
 * theme, green primary, inline red errors. Toggles sign-in / sign-up with the
 * app's real framing ("same system as the website"). Concept-only.
 */
import { useState } from "react"
import { APP } from "../theme"

export function OnboardingScreen() {
  const [mode, setMode] = useState<"in" | "up">("in")
  const isUp = mode === "up"

  return (
    <div className="flex h-full flex-col px-7 pt-10" style={{ color: APP.ink, fontFamily: APP.ui }}>
      {/* Mark */}
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-xl" style={{ background: APP.green }} />
        <span className="font-bold" style={{ fontFamily: APP.display, fontSize: 18 }}>EatoBiotics</span>
      </div>

      <h1 className="mt-9 font-bold leading-tight" style={{ fontFamily: APP.display, fontSize: 30 }}>
        {isUp ? "Create your\naccount" : "Welcome\nback"}
      </h1>
      <p className="mt-2 text-sm leading-relaxed" style={{ color: APP.inkDim }}>
        {isUp
          ? "This creates your account on the same system as the website — your food-system history stays in sync."
          : "Use your existing EatoBiotics account — the same one as the website."}
      </p>

      <div className="mt-7 space-y-3">
        <div>
          <input readOnly value="jason@eatosystem.com"
            className="w-full rounded-xl px-4 py-3 text-sm outline-none"
            style={{ background: APP.card, border: `1.5px solid ${APP.border}`, color: APP.ink }} />
        </div>
        <div>
          <input readOnly type="password" value="••••••••••"
            className="w-full rounded-xl px-4 py-3 text-sm outline-none"
            style={{ background: APP.card, border: `1.5px solid ${isUp ? "#D9463E" : APP.border}`, color: APP.ink }} />
          {isUp && (
            <p className="mt-1.5 px-1 text-[12px] font-medium" style={{ color: "#D9463E" }}>
              Password must be at least 8 characters.
            </p>
          )}
        </div>
      </div>

      <button className="mt-6 w-full rounded-xl py-3.5 text-sm font-bold text-white" style={{ background: APP.green }}>
        {isUp ? "Create account" : "Sign in"}
      </button>

      <button onClick={() => setMode(isUp ? "in" : "up")} className="mt-5 text-center text-sm font-semibold" style={{ color: APP.green }}>
        {isUp ? "Already have an account? Sign in" : "New here? Create your account"}
      </button>

      <div className="mt-auto pb-8 text-center">
        <p className="text-[11px]" style={{ color: APP.inkFaint }}>
          Your gut, in sync across the app and the website.
        </p>
      </div>
    </div>
  )
}
