import { ScrollReveal } from "@/components/scroll-reveal"
import { cn } from "@/lib/utils"

interface ZigZagSectionProps {
  number: string
  label: string
  action: string
  color: string
  heading: string
  body: string
  foods: string[]
  reverse?: boolean
}

export function ZigZagSection({
  number,
  label,
  action,
  color,
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
          <span
            className="font-serif text-7xl font-extrabold md:text-8xl"
            style={{ color }}
          >
            {number}
          </span>
          <h3 className="mt-4 font-serif text-2xl font-bold text-foreground">{label}</h3>
          <p className="mt-1 text-sm font-bold uppercase tracking-wider" style={{ color }}>
            {action}
          </p>
          {/* Decorative pill */}
          <div
            className="mt-4 h-1.5 w-16 rounded-full"
            style={{ backgroundColor: color }}
          />
        </div>

        {/* Content */}
        <div className="flex-1">
          <h4 className="font-serif text-3xl font-bold text-foreground text-pretty">
            {heading}
          </h4>
          <p className="mt-4 max-w-[680px] text-base leading-relaxed text-muted-foreground">
            {body}
          </p>

          {/* Food tags */}
          <div className="mt-6 flex flex-wrap gap-2">
            {foods.map((food) => (
              <span
                key={food}
                className="rounded-full border px-4 py-1.5 text-xs font-medium text-foreground"
                style={{ borderColor: `color-mix(in srgb, ${color} 40%, transparent)` }}
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
