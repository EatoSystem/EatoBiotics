"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { useEffect, useState } from "react"

export function StickyCta() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > window.innerHeight * 0.85)
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 px-4 pb-5 pt-3 md:hidden transition-all duration-300 ${
        visible ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
      }`}
      style={{
        background: "linear-gradient(to top, var(--background) 70%, transparent)",
      }}
    >
      <Link
        href="/assessment"
        className="brand-gradient flex w-full items-center justify-center gap-2 rounded-full py-4 text-base font-semibold text-white shadow-xl shadow-icon-green/30"
      >
        Check your Food System Score
        <ArrowRight size={16} />
      </Link>
    </div>
  )
}
