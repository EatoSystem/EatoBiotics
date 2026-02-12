"use client"

import { useState, useEffect } from "react"
import Image from "next/image"

export function IPhoneMockup() {
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
    <div className="relative mx-auto w-[260px] sm:w-[280px]">
      {/* Phone frame */}
      <div className="overflow-hidden rounded-[2.5rem] border-[6px] border-foreground bg-background p-6 shadow-xl">
        {/* Notch */}
        <div className="mx-auto mb-6 h-6 w-24 rounded-full bg-foreground" />

        {/* Screen content */}
        <div className="flex flex-col items-center py-4">
          {/* Small icon */}
          <Image
            src="/eatobiotics-icon.webp"
            alt=""
            width={28}
            height={28}
            className="mb-2 h-7 w-7"
          />
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Biotics Score
          </p>

          {/* Circular score */}
          <div className="relative mt-6 h-36 w-36">
            <svg className="h-full w-full -rotate-90" viewBox="0 0 128 128">
              <circle
                cx="64"
                cy="64"
                r="58"
                fill="none"
                stroke="var(--border)"
                strokeWidth="6"
              />
              <circle
                cx="64"
                cy="64"
                r="58"
                fill="none"
                stroke="url(#scoreGradientIcon)"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={circumference - progress}
                className="transition-all duration-1000 ease-out"
              />
              <defs>
                <linearGradient id="scoreGradientIcon" x1="0%" y1="0%" x2="100%" y2="100%">
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

          {/* Mini stats — each biotic gets its icon colour */}
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

          {/* CTA button */}
          <div className="mt-6 w-full">
            <div className="brand-gradient rounded-full py-3 text-center text-sm font-semibold text-background">
              Log a Meal
            </div>
          </div>
        </div>

        {/* Home indicator */}
        <div className="mx-auto mt-4 h-1 w-20 rounded-full bg-foreground/20" />
      </div>
    </div>
  )
}
