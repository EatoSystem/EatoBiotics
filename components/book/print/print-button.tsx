"use client"

import { Printer } from "lucide-react"

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="inline-flex items-center gap-2 rounded-full bg-icon-green px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-icon-green/20 transition-opacity hover:opacity-90"
    >
      <Printer size={14} />
      Print / Save as PDF
    </button>
  )
}
