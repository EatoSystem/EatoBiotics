import { ScrollReveal } from "@/components/scroll-reveal"
import { GradientText } from "@/components/gradient-text"
import { cn } from "@/lib/utils"

interface ZigZagSectionProps {
  number: string
  label: string
  action: string
  heading: string
  body: string
  foods: string[]
  reverse?: boolean
}

export function ZigZagSection({
  number,
  label,
  action,
  heading,
  body,
  foods,
  reverse = false,
}: ZigZagSectionProps) {
  return (
    <ScrollReveal>
      <div
        className={cn(
          "flex flex-col gap-12 md:flex-row md:items-start md:gap-16",
          reverse && "md:flex-row-reverse"
        )}
      >
        {/* Number and label */}
        <div className="flex-shrink-0 md:w-[280px]">
          <GradientText className="font-serif text-7xl md:text-8xl">
            {number}
          </GradientText>
          <h3 className="mt-4 text-2xl font-semibold text-[var(--foreground)]">{label}</h3>
          <p className="mt-1 text-sm font-medium text-[var(--accent)]">{action}</p>
        </div>

        {/* Content */}
        <div className="flex-1">
          <h4 className="font-serif text-3xl text-[var(--foreground)] text-pretty">
            {heading}
          </h4>
          <p className="mt-4 max-w-[680px] text-base leading-relaxed text-[var(--muted-foreground)]">
            {body}
          </p>

          {/* Food tags */}
          <div className="mt-6 flex flex-wrap gap-2">
            {foods.map((food) => (
              <span
                key={food}
                className="rounded-full border border-[var(--border)] bg-[var(--secondary)] px-4 py-1.5 text-xs font-medium text-[var(--foreground)]"
              >
                {food}
              </span>
            ))}
          </div>
        </div>
      </div>
    </ScrollReveal>
  )
}
