"use client"

/**
 * MenuScan — "Eating out? Score the menu."
 *
 * Paste a restaurant menu and the Twin picks the three best dishes for the
 * member's weakest biotic (POST /api/menu-scan — AI-guarded server-side).
 * `mock` mode (demos + tests) resolves canned picks without the API. The
 * real-world decision moment: the Twin helping at the point of ordering.
 */

import { useState } from "react"
import { UtensilsCrossed, Leaf, Sparkles } from "lucide-react"

interface MenuPick {
  name: string
  why: string
  biotic: "prebiotics" | "probiotics" | "postbiotics"
}

const BIOTIC_COLOR: Record<MenuPick["biotic"], string> = {
  prebiotics: "#A8E063",
  probiotics: "#2DAA6E",
  postbiotics: "#F5C518",
}

const MOCK_PICKS: { weakest: string; picks: MenuPick[] } = {
  weakest: "probiotics",
  picks: [
    { name: "Miso-glazed salmon bowl", why: "The miso brings live cultures — exactly what your probiotic side needs — with omega-rich salmon alongside.", biotic: "probiotics" },
    { name: "Roast vegetable & lentil salad", why: "Six different plants in one dish feeds your microbes broadly.", biotic: "prebiotics" },
    { name: "Sourdough with olive tapenade", why: "Fermented bread and olives support the postbiotic follow-through.", biotic: "postbiotics" },
  ],
}

export function MenuScan({ mock = false }: { mock?: boolean }) {
  const [menu, setMenu] = useState("")
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<{ weakest: string; picks: MenuPick[] } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const scan = async () => {
    if (menu.trim().length < 20 || busy) return
    setBusy(true)
    setError(null)
    try {
      if (mock) {
        await new Promise((r) => setTimeout(r, 1100))
        setResult(MOCK_PICKS)
      } else {
        const res = await fetch("/api/menu-scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ menuText: menu.trim() }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data?.error ?? "Scan failed")
        setResult(data)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Scan failed — try again")
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="mx-auto max-w-5xl px-4 pt-8 md:px-8">
      <div className="mb-4">
        <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--icon-green)" }}>Eating out?</p>
        <h3 className="mt-1 font-serif text-xl font-bold" style={{ color: "var(--foreground)" }}>Score the menu.</h3>
        <p className="mt-1 text-sm" style={{ color: "var(--muted-foreground)" }}>
          Paste any menu and your Twin picks the best dishes for what it needs most right now.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5" style={{ boxShadow: "0 2px 12px rgba(26,46,18,0.05)" }}>
        {!result ? (
          <>
            <textarea
              value={menu}
              onChange={(e) => setMenu(e.target.value)}
              disabled={busy}
              rows={4}
              placeholder="Paste the menu here — starters, mains, sides…"
              className="w-full resize-none rounded-xl border border-border bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-[var(--icon-green)]"
              style={{ color: "var(--foreground)" }}
            />
            {error && <p className="mt-2 text-xs font-semibold" style={{ color: "#a05a0a" }}>{error}</p>}
            <button
              type="button"
              onClick={() => void scan()}
              disabled={menu.trim().length < 20 || busy}
              className="mt-3 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold text-white transition-transform enabled:hover:-translate-y-0.5 disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #4CB648, #2DAA6E)", boxShadow: "0 4px 16px rgba(76,182,72,0.3)" }}
            >
              <UtensilsCrossed size={14} /> {busy ? "Your Twin is reading the menu…" : "Pick my best dishes"}
            </button>
          </>
        ) : (
          <>
            <p className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest" style={{ background: "color-mix(in srgb, var(--icon-green) 10%, white)", border: "1px solid var(--border)", color: "var(--icon-green)" }}>
              <Sparkles size={10} /> Chosen for your {result.weakest}
            </p>
            <div className="mt-3 space-y-2.5">
              {result.picks.map((p, i) => (
                <div key={p.name} className="flex items-start gap-3 rounded-xl px-4 py-3" style={{ background: `color-mix(in srgb, ${BIOTIC_COLOR[p.biotic]} 7%, white)`, border: `1px solid color-mix(in srgb, ${BIOTIC_COLOR[p.biotic]} 35%, transparent)` }}>
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white" style={{ background: BIOTIC_COLOR[p.biotic] }}>{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold" style={{ color: "var(--foreground)" }}>{p.name}</p>
                    <p className="mt-0.5 text-xs leading-relaxed" style={{ color: "var(--muted-foreground)" }}>{p.why}</p>
                  </div>
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: "white", border: "1px solid var(--border)", color: BIOTIC_COLOR[p.biotic] }}>
                    <Leaf size={9} /> {p.biotic}
                  </span>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => {
                setResult(null)
                setMenu("")
              }}
              className="mt-3 text-xs font-bold underline underline-offset-2"
              style={{ color: "var(--icon-green)" }}
            >
              Scan another menu
            </button>
          </>
        )}
        <p className="mt-3 text-[11px] leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
          Food-first suggestions from your Twin&apos;s current levels — not medical advice.
        </p>
      </div>
    </section>
  )
}
