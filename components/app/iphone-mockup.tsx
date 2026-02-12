"use client"

import { useState, useEffect } from "react"

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
      <div className="relative overflow-hidden rounded-[2.5rem] border-[6px] border-[var(--foreground)] bg-[var(--background)] p-6 shadow-xl">
        {/* Notch */}
        <div className="mx-auto mb-6 h-6 w-24 rounded-full bg-[var(--foreground)]" />

        {/* Screen content */}
        <div className="flex flex-col items-center py-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">
            Biotics Score
          </p>

          {/* Circular score */}
          <div className="relative mt-6 h-36 w-36">
            <svg className="h-full w-full -rotate-90" viewBox="0 0 128 128">
              {/* Background circle */}
              <circle
                cx="64"
                cy="64"
                r="58"
                fill="none"
                stroke="var(--border)"
                strokeWidth="6"
              />
              {/* Progress arc */}
              <circle
                cx="64"
                cy="64"
                r="58"
                fill="none"
                stroke="url(#scoreGradient)"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={circumference - progress}
                className="transition-all duration-1000 ease-out"
              />
              <defs>
                <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#A8E063" />
                  <stop offset="50%" stopColor="#56C135" />
                  <stop offset="100%" stopColor="#F0921A" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-serif text-4xl text-[var(--foreground)]">{score}</span>
              <span className="text-xs text-[var(--muted-foreground)]">/ 100</span>
            </div>
          </div>

          <p className="mt-4 text-sm font-medium text-[var(--primary)]">Great progress!</p>

          {/* Mini stats */}
          <div className="mt-6 flex w-full justify-between px-2">
            <div className="text-center">
              <p className="text-lg font-semibold text-[var(--foreground)]">6</p>
              <p className="text-[10px] text-[var(--muted-foreground)]">Pre</p>
            </div>
            <div className="h-8 w-px bg-[var(--border)]" />
            <div className="text-center">
              <p className="text-lg font-semibold text-[var(--foreground)]">4</p>
              <p className="text-[10px] text-[var(--muted-foreground)]">Pro</p>
            </div>
            <div className="h-8 w-px bg-[var(--border)]" />
            <div className="text-center">
              <p className="text-lg font-semibold text-[var(--foreground)]">3</p>
              <p className="text-[10px] text-[var(--muted-foreground)]">Post</p>
            </div>
          </div>

          {/* CTA button */}
          <div className="mt-6 w-full">
            <div className="brand-gradient rounded-full py-3 text-center text-sm font-semibold text-[var(--background)]">
              Log a Meal
            </div>
          </div>
        </div>

        {/* Home indicator */}
        <div className="mx-auto mt-4 h-1 w-20 rounded-full bg-[var(--foreground)]/20" />
      </div>
    </div>
  )
}
