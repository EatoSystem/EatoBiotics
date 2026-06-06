"use client"

import { useState } from "react"
import { ScrollReveal } from "@/components/scroll-reveal"
import { Plus } from "lucide-react"
import Link from "next/link"

const FAQS = [
  {
    q: "What is the Biotics Score?",
    a: "Your Biotics Score measures how well your diet supports your microbiome across five pillars: Diversity, Feeding (prebiotics), Live Foods (probiotics), Consistency, and How You Feel. It gives you a single number between 0 and 100 — and a breakdown of exactly where to improve.",
  },
  {
    q: "What are Pre, Pro, and Postbiotics?",
    a: "Prebiotics are the plant fibres that feed your gut bacteria — found in leafy greens, legumes, and whole grains. Probiotics are the live bacteria themselves — found in fermented foods like yogurt, kefir, and kimchi. Postbiotics are the beneficial compounds your gut bacteria produce when they're well-fed — things like short-chain fatty acids that regulate immunity, mood, and inflammation.",
  },
  {
    q: "Is this a diet plan?",
    a: "No. EatoBiotics is a food framework — not a restrictive diet. It works with whatever you already eat and shows you how to improve the parts of your plate that matter most for your microbiome. You don't cut anything out. You build in.",
  },
  {
    q: "Do I need to subscribe to use EatoBiotics?",
    a: "No. Your free Biotics Score assessment is completely free with no card required. You'll get your score, a breakdown across five pillars, and a sense of where to start. Paid tiers unlock daily meal analysis, streak tracking, personalised plans, and AI consultation — but the foundation is always free.",
  },
  {
    q: "Is this suitable if I have a health condition?",
    a: "EatoBiotics is a food education tool, not a medical programme. If you have a diagnosed condition — IBS, IBD, diabetes, or anything else — please consult your GP or dietitian before making significant dietary changes. Our framework supports good gut health generally; it is not condition-specific treatment.",
  },
  {
    q: "How is EatoBiotics different from other nutrition apps?",
    a: "Most nutrition apps count calories or macros. EatoBiotics focuses on your microbiome — the 38 trillion bacteria in your gut that regulate how you digest, how you feel, how you sleep, and how your immune system functions. We score your plate for Pre, Pro, and Postbiotic impact. That's a different lens entirely.",
  },
]

export function FAQ() {
  const [open, setOpen] = useState<number | null>(0)

  return (
    <section className="px-6 py-24 md:py-32" style={{ background: "linear-gradient(180deg, #FFFFFF 0%, #F6FAF2 100%)" }}>
      <div className="mx-auto grid max-w-[1100px] gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
        {/* Left: heading (sticky on desktop) */}
        <ScrollReveal>
          <div className="lg:sticky lg:top-28">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-icon-teal">
              FAQ
            </p>
            <h2 className="font-serif text-4xl font-semibold text-foreground sm:text-5xl text-balance">
              Questions &amp;{" "}
              <span className="brand-gradient-text">Answers</span>
            </h2>
            <p className="mt-4 max-w-sm text-base leading-relaxed text-muted-foreground">
              Everything you need to know about the Biotics Score, the framework, and how to start.
            </p>
            <p className="mt-6 text-sm text-muted-foreground">
              Still have questions?{" "}
              <Link
                href="/biotics"
                className="font-medium text-foreground underline underline-offset-4 transition-colors hover:text-icon-green"
              >
                Learn the full framework →
              </Link>
            </p>
          </div>
        </ScrollReveal>

        {/* Right: accordion */}
        <div className="space-y-3">
          {FAQS.map((faq, i) => {
            const isOpen = open === i
            return (
              <ScrollReveal key={i} delay={i * 40}>
                <div
                  className="overflow-hidden rounded-2xl border bg-white transition-all duration-300"
                  style={{
                    borderColor: isOpen ? "color-mix(in srgb, var(--icon-green) 35%, transparent)" : "var(--border)",
                    boxShadow: isOpen
                      ? "0 16px 40px -18px rgba(26,46,18,0.22)"
                      : "0 2px 10px -6px rgba(26,46,18,0.08)",
                  }}
                >
                  <button
                    onClick={() => setOpen(isOpen ? null : i)}
                    className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                    aria-expanded={isOpen}
                  >
                    <span className="text-base font-semibold leading-snug text-foreground">
                      {faq.q}
                    </span>
                    <span
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-all duration-300"
                      style={{
                        background: isOpen ? "var(--icon-green)" : "color-mix(in srgb, var(--icon-green) 12%, transparent)",
                        color: isOpen ? "#fff" : "var(--icon-green)",
                        transform: isOpen ? "rotate(45deg)" : "rotate(0deg)",
                      }}
                    >
                      <Plus size={16} />
                    </span>
                  </button>
                  {/* Smooth height animation via grid-rows */}
                  <div
                    className="grid transition-all duration-300 ease-out"
                    style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
                  >
                    <div className="overflow-hidden">
                      <p className="px-6 pb-5 text-sm leading-relaxed text-muted-foreground">
                        {faq.a}
                      </p>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}
