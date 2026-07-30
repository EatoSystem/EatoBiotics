"use client"

import { useRef, useEffect, useState } from "react"
import { cn } from "@/lib/utils"

interface ScrollRevealProps {
  children: React.ReactNode
  className?: string
  delay?: number
}

export function ScrollReveal({ children, className, delay = 0 }: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.unobserve(entry.target)
        }
      },
      { threshold: 0.1 }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      // The hidden/revealed states live in app/globals.css under `.js .sr-reveal`
      // rather than in Tailwind classes here, so that the server-rendered HTML is
      // visible by default and only hides once the inline script in
      // app/layout.tsx has confirmed JavaScript is running. Expressing the hidden
      // state in the markup meant a failed or blocked bundle rendered a blank
      // page across the ~136 files that use this component.
      className={cn("sr-reveal transition-all duration-700 ease-out", className)}
      data-revealed={isVisible}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}
