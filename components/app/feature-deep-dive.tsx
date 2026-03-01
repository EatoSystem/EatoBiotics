import { ScrollReveal } from "@/components/scroll-reveal"
import type { LucideIcon } from "lucide-react"

interface FeatureDeepDiveProps {
  index: number // even = text left, odd = text right
  icon: LucideIcon
  iconColor: string
  label: string
  title: string
  description: string
  bullets: string[]
  mockup: React.ReactNode
}

export function FeatureDeepDive({
  index,
  icon: Icon,
  iconColor,
  label,
  title,
  description,
  bullets,
  mockup,
}: FeatureDeepDiveProps) {
  const isReversed = index % 2 === 1

  return (
    <section className="px-6 py-20 md:py-28">
      <div className="mx-auto max-w-[1200px]">
        <div
          className={`flex flex-col items-center gap-12 md:gap-20 ${
            isReversed ? "md:flex-row-reverse" : "md:flex-row"
          }`}
        >
          {/* Mockup */}
          <ScrollReveal delay={isReversed ? 0 : 100}>
            <div className="flex-shrink-0">{mockup}</div>
          </ScrollReveal>

          {/* Text */}
          <div className="flex-1 text-center md:text-left">
            <ScrollReveal delay={isReversed ? 100 : 0}>
              <div
                className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl md:mx-0"
                style={{ backgroundColor: iconColor }}
              >
                <Icon size={24} className="text-white" />
              </div>
              <p
                className="text-xs font-semibold uppercase tracking-widest"
                style={{ color: iconColor }}
              >
                {label}
              </p>
              <h2 className="mt-4 font-serif text-3xl font-semibold text-foreground sm:text-4xl text-balance">
                {title}
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base md:text-lg">
                {description}
              </p>
              <ul className="mt-6 space-y-3">
                {bullets.map((bullet) => (
                  <li key={bullet} className="flex items-start gap-3 text-left">
                    <div
                      className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full"
                      style={{ backgroundColor: iconColor }}
                    />
                    <span className="text-sm text-muted-foreground">{bullet}</span>
                  </li>
                ))}
              </ul>
            </ScrollReveal>
          </div>
        </div>
      </div>
    </section>
  )
}
