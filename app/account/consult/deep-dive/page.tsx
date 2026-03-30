"use client"
import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, ArrowRight } from "lucide-react"

const CONDITIONS = [
  { id: "ibs", label: "IBS", desc: "Irritable Bowel Syndrome — bloating, cramping, irregular digestion", color: "var(--icon-orange)" },
  { id: "sibo", label: "SIBO", desc: "Small Intestinal Bacterial Overgrowth — bloating after meals, gas", color: "var(--icon-teal)" },
  { id: "low-energy", label: "Low Energy", desc: "Chronic fatigue, afternoon slumps, poor recovery", color: "var(--icon-yellow)" },
  { id: "poor-sleep", label: "Poor Sleep", desc: "Difficulty falling asleep, poor quality, waking tired", color: "var(--icon-green)" },
  { id: "bloating", label: "Bloating", desc: "Persistent bloating, gas, abdominal discomfort", color: "var(--icon-lime)" },
  { id: "skin", label: "Skin Health", desc: "Acne, eczema, redness — often rooted in gut-skin axis", color: "var(--icon-orange)" },
  { id: "mental-clarity", label: "Mental Clarity", desc: "Brain fog, focus, mood — the gut-brain connection", color: "var(--icon-teal)" },
  { id: "weight", label: "Weight Management", desc: "Metabolism, appetite regulation, microbiome diversity", color: "var(--icon-green)" },
  { id: "ibd", label: "IBD", desc: "Crohn's Disease or Ulcerative Colitis — working with your diagnosis", color: "var(--icon-orange)" },
]

export default function DeepDivePage() {
  // Suppress unused warning — useState needed for future interactivity
  const [, setHovered] = useState<string | null>(null)

  return (
    <div className="min-h-screen bg-background pt-20">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <Link href="/account/consult" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft size={14} /> Back to EatoBiotic
        </Link>

        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "var(--icon-orange)" }}>Deep Dive</p>
          <h1 className="font-serif text-3xl font-semibold text-foreground mb-2">Choose a Focus Area</h1>
          <p className="text-muted-foreground leading-relaxed">
            Select a specific condition or goal. EatoBiotic will ask you targeted questions and produce a personalised food protocol saved to your account.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {CONDITIONS.map((c) => (
            <Link
              key={c.id}
              href={`/account/consult?q=${encodeURIComponent(`I want to do a deep dive on ${c.label}. Please ask me the key diagnostic questions you need to create a personalised food protocol for me.`)}&deepdive=${c.id}`}
              className="flex flex-col rounded-2xl border p-4 transition-all hover:shadow-md"
              style={{ borderTopWidth: "3px", borderTopColor: c.color }}
              onMouseEnter={() => setHovered(c.id)}
              onMouseLeave={() => setHovered(null)}
            >
              <div className="flex items-center justify-between mb-2">
                <p className="font-semibold text-foreground">{c.label}</p>
                <ArrowRight size={14} className="text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{c.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
