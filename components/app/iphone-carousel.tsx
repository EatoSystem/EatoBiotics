"use client"

import { useCallback, useEffect, useState } from "react"
import useEmblaCarousel from "embla-carousel-react"
import Autoplay from "embla-carousel-autoplay"
import { IPhoneMockup } from "./iphone-mockup"
import { IPhoneScreenFoodLog } from "./iphone-screen-food-log"
import { IPhoneScreenTrends } from "./iphone-screen-trends"
import { IPhoneScreenFoodProfile } from "./iphone-screen-food-profile"
import { IPhoneScreenPlate } from "./iphone-screen-plate"

interface Screen {
  label: string
  content: React.ReactNode
}

const SCREENS: Screen[] = [
  { label: "Biotics Score", content: null }, // null = use existing IPhoneMockup
  { label: "Food Log", content: <IPhoneScreenFoodLog /> },
  { label: "Trends", content: <IPhoneScreenTrends /> },
  { label: "Food Profile", content: <IPhoneScreenFoodProfile /> },
  { label: "My Plate", content: <IPhoneScreenPlate /> },
]

export function IPhoneCarousel() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [
    Autoplay({ delay: 4000, stopOnInteraction: true, stopOnMouseEnter: true }),
  ])
  const [selectedIndex, setSelectedIndex] = useState(0)

  const onSelect = useCallback(() => {
    if (!emblaApi) return
    setSelectedIndex(emblaApi.selectedScrollSnap())
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    emblaApi.on("select", onSelect)
    onSelect()
    return () => {
      emblaApi.off("select", onSelect)
    }
  }, [emblaApi, onSelect])

  function scrollTo(index: number) {
    emblaApi?.scrollTo(index)
  }

  return (
    <div className="relative mx-auto w-[260px] sm:w-[280px]">
      {/* Phone frame */}
      <div className="overflow-hidden rounded-[2.5rem] border-[6px] border-foreground bg-background shadow-xl">
        {/* Notch */}
        <div className="mx-auto mt-6 mb-2 h-6 w-24 rounded-full bg-foreground" />

        {/* Carousel viewport */}
        <div ref={emblaRef} className="overflow-hidden">
          <div className="flex">
            {SCREENS.map((screen, i) => (
              <div key={i} className="min-w-0 flex-[0_0_100%] px-6 pb-4">
                {screen.content === null ? (
                  /* Reuse existing IPhoneMockup screen content (without the phone frame) */
                  <IPhoneMockupInner />
                ) : (
                  screen.content
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Home indicator */}
        <div className="mx-auto mb-4 h-1 w-20 rounded-full bg-foreground/20" />
      </div>

      {/* Dot indicators */}
      <div className="mt-4 flex items-center justify-center gap-2">
        {SCREENS.map((_, i) => (
          <button
            key={i}
            onClick={() => scrollTo(i)}
            className={`h-2 rounded-full transition-all ${
              i === selectedIndex
                ? "w-6 bg-icon-green"
                : "w-2 bg-border hover:bg-muted-foreground"
            }`}
            aria-label={`Go to screen ${i + 1}`}
          />
        ))}
      </div>

      {/* Label */}
      <p className="mt-2 text-center text-xs font-medium text-muted-foreground">
        {SCREENS[selectedIndex]?.label}
      </p>
    </div>
  )
}

/* Inner content of IPhoneMockup (score screen) without the phone frame */
function IPhoneMockupInner() {
  const [score, setScore] = useState(0)
  const targetScore = 78

  useEffect(() => {
    const duration = 1500
    const steps = 60
    const increment = targetScore / steps
    let current = 0
    const timer = setInterval(() => {
      current += increment
      if (current >= targetScore) {
        setScore(targetScore)
        clearInterval(timer)
      } else {
        setScore(Math.round(current))
      }
    }, duration / steps)
    return () => clearInterval(timer)
  }, [])

  const circumference = 2 * Math.PI * 58
  const progress = (score / 100) * circumference

  return (
    <div className="flex flex-col items-center py-4">
      <img src="/eatobiotics-icon.webp" alt="" width={28} height={28} className="mb-2 h-7 w-7" />
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        Biotics Score
      </p>

      <div className="relative mt-6 h-36 w-36">
        <svg className="h-full w-full -rotate-90" viewBox="0 0 128 128">
          <circle cx="64" cy="64" r="58" fill="none" stroke="var(--border)" strokeWidth="6" />
          <circle
            cx="64"
            cy="64"
            r="58"
            fill="none"
            stroke="url(#scoreGradCarousel)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - progress}
            className="transition-all duration-1000 ease-out"
          />
          <defs>
            <linearGradient id="scoreGradCarousel" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--icon-lime)" />
              <stop offset="33%" stopColor="var(--icon-teal)" />
              <stop offset="66%" stopColor="var(--icon-yellow)" />
              <stop offset="100%" stopColor="var(--icon-orange)" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-serif text-4xl font-semibold text-foreground">{score}</span>
          <span className="text-xs text-muted-foreground">/ 100</span>
        </div>
      </div>

      <p className="mt-4 text-sm font-medium text-icon-green">Great progress!</p>

      <div className="mt-6 flex w-full justify-between px-2">
        <div className="text-center">
          <p className="text-lg font-semibold text-icon-lime">6</p>
          <p className="text-[10px] text-muted-foreground">Pre</p>
        </div>
        <div className="h-8 w-px bg-border" />
        <div className="text-center">
          <p className="text-lg font-semibold text-icon-teal">4</p>
          <p className="text-[10px] text-muted-foreground">Pro</p>
        </div>
        <div className="h-8 w-px bg-border" />
        <div className="text-center">
          <p className="text-lg font-semibold text-icon-orange">3</p>
          <p className="text-[10px] text-muted-foreground">Post</p>
        </div>
      </div>

      <div className="mt-6 w-full">
        <div className="brand-gradient rounded-full py-3 text-center text-sm font-semibold text-background">
          Log a Meal
        </div>
      </div>
    </div>
  )
}
