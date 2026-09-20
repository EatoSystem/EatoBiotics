"use client"

/**
 * Shared disclosure behaviour for the header's dropdown menus.
 *
 * Extracted from components/nav/mega-menu.tsx when the Food Systems mega menu
 * was withdrawn from the V1 launch surface (lib/v1-surface.ts): every
 * destination in that menu now refuses at runtime, so the panel went with it
 * and the only part still in use was this hook.
 */

import { useCallback, useEffect, useRef, useState } from "react"

export function useDisclosureMenu(pathname: string) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  useEffect(() => setOpen(false), [pathname])

  useEffect(() => {
    if (!open) return
    function onPointerDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false)
        triggerRef.current?.focus()
      }
    }
    document.addEventListener("mousedown", onPointerDown)
    document.addEventListener("keydown", onKeyDown)
    return () => {
      document.removeEventListener("mousedown", onPointerDown)
      document.removeEventListener("keydown", onKeyDown)
    }
  }, [open])

  const onBlurCapture = useCallback((e: React.FocusEvent) => {
    // Close when focus moves entirely outside the menu (tabbing past it).
    if (!e.currentTarget.contains(e.relatedTarget as Node)) setOpen(false)
  }, [])

  return { open, setOpen, containerRef, triggerRef, onBlurCapture }
}
