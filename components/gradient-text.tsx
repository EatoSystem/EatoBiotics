import { cn } from "@/lib/utils"

interface GradientTextProps {
  children: React.ReactNode
  className?: string
  as?: "span" | "p" | "h1" | "h2" | "h3" | "h4"
}

export function GradientText({ children, className, as: Tag = "span" }: GradientTextProps) {
  return (
    <Tag className={cn("brand-gradient-text", className)}>
      {children}
    </Tag>
  )
}
