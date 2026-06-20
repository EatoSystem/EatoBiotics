import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { ScrollReveal } from "@/components/scroll-reveal"
import { Glp1Check } from "@/components/eatobetics/glp1-check"

export const metadata: Metadata = {
  title: { absolute: "GLP-1 Muscle-Preservation Check — EatoBetics" },
  description:
    "A 90-second check for people on Ozempic, Wegovy, or Mounjaro. See how well you're set up to protect muscle while you lose weight, and get tailored next steps.",
}

export default function Glp1CheckPage() {
  return (
    <main className="bg-white">
      <section className="relative px-6 pt-28 pb-20 md:pt-32">
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[360px]" style={{ background: "radial-gradient(60% 70% at 50% 0%, color-mix(in srgb, var(--icon-yellow) 14%, transparent), transparent 70%)" }} />
        <div className="relative z-10 mx-auto max-w-xl">
          <ScrollReveal>
            <Link href="/glucose/glp1" className="inline-flex items-center gap-1.5 text-sm font-medium transition-colors" style={{ color: "var(--muted-foreground)" }}>
              <ArrowLeft size={14} /> GLP-1 Companion
            </Link>
            <h1 className="mt-4 text-center font-serif text-3xl font-bold leading-tight text-balance sm:text-4xl" style={{ color: "var(--foreground)" }}>
              Muscle-Preservation Check
            </h1>
            <p className="mx-auto mt-3 max-w-md text-center text-base leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
              Five quick questions. See how well you&apos;re set up to keep muscle while you lose
              weight — and get your top moves.
            </p>
          </ScrollReveal>
          <div className="mt-10">
            <Glp1Check />
          </div>
        </div>
      </section>
    </main>
  )
}
