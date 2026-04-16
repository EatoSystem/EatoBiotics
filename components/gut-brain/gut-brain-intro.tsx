import { Brain } from "lucide-react"
import { ScrollReveal } from "@/components/scroll-reveal"

export function GutBrainIntro() {
  return (
    <section className="relative overflow-hidden px-6 py-20 md:py-28">
      {/* Background blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute left-[-10%] top-[-5%] h-[500px] w-[500px] rounded-full"
          style={{
            background: "radial-gradient(circle, var(--icon-teal), transparent 70%)",
            opacity: 0.07,
          }}
        />
        <div
          className="absolute right-[-8%] top-[20%] h-[420px] w-[420px] rounded-full"
          style={{
            background: "radial-gradient(circle, var(--icon-green), transparent 70%)",
            opacity: 0.06,
          }}
        />
      </div>

      <div className="relative mx-auto max-w-[720px] text-center">
        <ScrollReveal>
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-background/80 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground backdrop-blur-sm">
            <Brain size={12} className="text-[var(--icon-teal)]" />
            The Science Behind Gut-Brain Health
          </div>

          <h2 className="font-serif text-5xl font-semibold leading-tight text-foreground sm:text-6xl md:text-7xl text-balance">
            Your gut is talking
            <br />
            to your brain.{" "}
            <span
              style={{
                background: "linear-gradient(135deg, var(--icon-teal), var(--icon-green))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Are you listening?
            </span>
          </h2>
        </ScrollReveal>

        <ScrollReveal delay={100}>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
            90–95% of your body&apos;s serotonin is made in your gut — not your brain.
            The food you eat shapes your mood, focus, and mental clarity more directly
            than almost any other factor you can control.
          </p>
        </ScrollReveal>
      </div>
    </section>
  )
}
