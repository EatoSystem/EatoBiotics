"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import Link from "next/link"

/**
 * Small corner badge marking a staging page as a preview.
 *
 * Portals to <body> deliberately. `<main>` retains an identity transform from the
 * `page-enter` animation in `app/globals.css`, which makes it the containing block
 * for every position:fixed descendant — so a `fixed` element rendered inside page
 * content pins to the foot of the document rather than the viewport. The site's own
 * fixed chrome (feedback widget, cookie consent) avoids this by living in
 * `app/layout.tsx`, outside <main>; portalling achieves the same from inside a page.
 *
 * Delete this component and its usage when the preview is promoted.
 */
export function PreviewBadge({
  href = "/",
  label = "Preview — compare with live",
}: {
  href?: string
  label?: string
}) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return null

  return createPortal(
    <Link
      href={href}
      className="fixed bottom-4 left-1/2 z-[60] -translate-x-1/2 rounded-full bg-foreground/90 px-4 py-2 text-xs font-semibold text-background shadow-lg backdrop-blur transition-opacity hover:opacity-80"
    >
      {label} ↗
    </Link>,
    document.body
  )
}
