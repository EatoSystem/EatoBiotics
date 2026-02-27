"use client"

import { useState } from "react"
import { Copy, Check, AlertCircle } from "lucide-react"

interface CopyButtonProps {
  targetId: string
  label?: string
  copiedLabel?: string
}

export function CopyButton({
  targetId,
  label = "Copy Chapter",
  copiedLabel = "Copied! Paste into Substack",
}: CopyButtonProps) {
  const [state, setState] = useState<"idle" | "copied" | "error">("idle")

  const handleCopy = async () => {
    const el = document.getElementById(targetId)
    if (!el) return

    try {
      // Primary: ClipboardItem API — preserves rich HTML so Substack gets structure
      const html = el.innerHTML
      const blob = new Blob([html], { type: "text/html" })
      const plainBlob = new Blob([el.innerText], { type: "text/plain" })
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": blob,
          "text/plain": plainBlob,
        }),
      ])
      setState("copied")
    } catch {
      // Fallback: select + execCommand (Safari / older browsers)
      try {
        const selection = window.getSelection()
        const range = document.createRange()
        range.selectNodeContents(el)
        selection?.removeAllRanges()
        selection?.addRange(range)
        document.execCommand("copy")
        selection?.removeAllRanges()
        setState("copied")
      } catch {
        setState("error")
      }
    }

    setTimeout(() => setState("idle"), 3000)
  }

  return (
    <button
      onClick={handleCopy}
      className={`inline-flex shrink-0 items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-all ${
        state === "copied"
          ? "bg-green-600 text-white"
          : state === "error"
            ? "bg-red-500 text-white"
            : "bg-gray-900 text-white hover:bg-gray-700 active:scale-95"
      }`}
    >
      {state === "copied" ? (
        <>
          <Check size={14} />
          {copiedLabel}
        </>
      ) : state === "error" ? (
        <>
          <AlertCircle size={14} />
          Try selecting manually
        </>
      ) : (
        <>
          <Copy size={14} />
          {label}
        </>
      )}
    </button>
  )
}
