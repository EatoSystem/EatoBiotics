"use client"

import { useState } from "react"
import Link from "next/link"
import { Plus } from "lucide-react"
import { ScrollReveal } from "@/components/scroll-reveal"

const FAQS = [
  {
    q: "What is the EatoBetics Score?",
    a: "Your EatoBetics Score is a single number that reflects how well your current food and lifestyle patterns support steady glucose, energy, and metabolic health. It's built from your assessment across stability, energy, and rhythm — with a clear breakdown of where to focus first.",
  },
  {
    q: "What is glucose intelligence?",
    a: "Glucose intelligence is understanding how the meals you actually eat affect your energy, cravings, and glucose response — not just counting sugar or carbs. EatoBetics looks at how a meal is built: fibre, protein, fat, carbohydrate type, food order, timing, and movement.",
  },
  {
    q: "Do I need a CGM or blood tests?",
    a: "No. EatoBetics works from your food and lifestyle patterns, so you can start with nothing more than the free assessment. If you do have a CGM or recent blood results, that context makes your insights sharper — but it's never required.",
  },
  {
    q: "Is this a diet plan?",
    a: "No. EatoBetics isn't a restrictive diet and it won't tell you to cut out the foods you love. It helps you rebuild your most-repeated meals so they work better for your body — more fibre, better order, smarter timing. You build in, you don't cut out.",
  },
  {
    q: "Is EatoBetics suitable if I have diabetes or take medication?",
    a: "EatoBetics is a food education tool, not a medical programme. If you have diabetes, prediabetes, take glucose-lowering or GLP-1 medication, or have any concern about your blood sugar, please work with your GP, diabetes team, or dietitian. EatoBetics can support better daily decisions and better conversations — it does not replace medical care.",
  },
  {
    q: "How is EatoBetics different from other nutrition apps?",
    a: "Most apps count calories or macros. EatoBetics focuses on your glucose system — how each meal affects your energy, cravings, and long-term metabolic health — and gives you one specific pattern to improve at a time. It's the glucose companion to EatoBiotics' gut-health model.",
  },
]

export function EatobeticsFaq() {
  const [open, setOpen] = useState<number | null>(0)

  return (
    <section className="px-6 py-24 md:py-32" style={{ background: "linear-gradient(180deg, #FFFFFF 0%, #F6FAF2 100%)" }}>
      <div className="mx-auto grid max-w-[1100px] gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
        <ScrollReveal>
          <div className="lg:sticky lg:top-28">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--icon-teal)" }}>FAQ</p>
            <h2 className="font-serif text-4xl font-semibold text-foreground sm:text-5xl text-balance">
              Questions &amp; <span className="brand-gradient-text">Answers</span>
            </h2>
            <p className="mt-4 max-w-sm text-base leading-relaxed text-muted-foreground">
              Everything you need to know about the EatoBetics Score, glucose intelligence, and how to start.
            </p>
            <p className="mt-6 text-sm text-muted-foreground">
              Still have questions?{" "}
              <Link href="/eatobetics/assessment" className="font-medium text-foreground underline underline-offset-4 transition-colors hover:text-icon-green">
                Take the free assessment →
              </Link>
            </p>
          </div>
        </ScrollReveal>

        <div className="space-y-3">
          {FAQS.map((faq, i) => {
            const isOpen = open === i
            return (
              <ScrollReveal key={i} delay={i * 40}>
                <div
                  className="overflow-hidden rounded-2xl border bg-white transition-all duration-300"
                  style={{
                    borderColor: isOpen ? "color-mix(in srgb, var(--icon-green) 35%, transparent)" : "var(--border)",
                    boxShadow: isOpen ? "0 16px 40px -18px rgba(26,46,18,0.22)" : "0 2px 10px -6px rgba(26,46,18,0.08)",
                  }}
                >
                  <button
                    onClick={() => setOpen(isOpen ? null : i)}
                    className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                    aria-expanded={isOpen}
                  >
                    <span className="text-base font-semibold leading-snug text-foreground">{faq.q}</span>
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
                  <div className="grid transition-all duration-300 ease-out" style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}>
                    <div className="overflow-hidden">
                      <p className="px-6 pb-5 text-sm leading-relaxed text-muted-foreground">{faq.a}</p>
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
