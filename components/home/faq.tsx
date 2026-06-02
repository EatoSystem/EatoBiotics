"use client"

import { useState } from "react"
import { ScrollReveal } from "@/components/scroll-reveal"
import { ChevronDown } from "lucide-react"
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
  const [open, setOpen] = useState<number | null>(null)

  return (
    <section className="px-6 py-24 md:py-32">
      <div className="mx-auto max-w-[800px]">
        <ScrollReveal className="text-center mb-14">
          <p className="text-xs font-semibold uppercase tracking-widest text-icon-teal mb-3">
            FAQ
          </p>
          <h2 className="font-serif text-4xl font-semibold text-foreground sm:text-5xl text-balance">
            Questions &amp;{" "}
            <span className="brand-gradient-text">Answers</span>
          </h2>
        </ScrollReveal>

        <div className="space-y-3">
          {FAQS.map((faq, i) => (
            <ScrollReveal key={i} delay={i * 40}>
              <div className="overflow-hidden rounded-2xl border border-border bg-background">
                <button
                  onClick={() => setOpen(open === i ? null : i)}
                  className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                >
                  <span className="font-semibold text-foreground text-base leading-snug">
                    {faq.q}
                  </span>
                  <ChevronDown
                    size={18}
                    className="shrink-0 text-muted-foreground transition-transform duration-200"
                    style={{ transform: open === i ? "rotate(180deg)" : "rotate(0deg)" }}
                  />
                </button>
                {open === i && (
                  <div className="px-6 pb-5">
                    <p className="text-sm leading-relaxed text-muted-foreground">{faq.a}</p>
                  </div>
                )}
              </div>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal delay={200}>
          <p className="mt-10 text-center text-sm text-muted-foreground">
            Still have questions?{" "}
            <Link
              href="/biotics"
              className="font-medium text-foreground underline underline-offset-4 hover:text-icon-green transition-colors"
            >
              Learn the full framework →
            </Link>
          </p>
        </ScrollReveal>
      </div>
    </section>
  )
}
