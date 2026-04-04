"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { X, Download, Share } from "lucide-react"

const DISMISSED_KEY = "eb_install_dismissed"

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

export function PwaInstallPrompt() {
  const [show, setShow] = useState<"android" | "ios" | null>(null)
  const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    // Don't show if already dismissed
    if (localStorage.getItem(DISMISSED_KEY)) return

    // Don't show if already running as a PWA
    if (window.matchMedia("(display-mode: standalone)").matches) return

    // Detect iOS Safari (where beforeinstallprompt doesn't fire)
    const isIos =
      /iphone|ipad|ipod/i.test(navigator.userAgent) &&
      !(window.navigator as unknown as { standalone?: boolean }).standalone

    if (isIos) {
      const timer = setTimeout(() => setShow("ios"), 3000)
      return () => clearTimeout(timer)
    }

    // Android / Chrome — wait for beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault()
      deferredPrompt.current = e as BeforeInstallPromptEvent
      const timer = setTimeout(() => setShow("android"), 3000)
      // Clean up timer if component unmounts before it fires
      return () => clearTimeout(timer)
    }

    window.addEventListener("beforeinstallprompt", handler)
    return () => window.removeEventListener("beforeinstallprompt", handler)
  }, [])

  const dismiss = () => {
    localStorage.setItem(DISMISSED_KEY, "1")
    setShow(null)
  }

  const install = async () => {
    if (!deferredPrompt.current) return
    await deferredPrompt.current.prompt()
    const { outcome } = await deferredPrompt.current.userChoice
    if (outcome === "accepted") {
      localStorage.setItem(DISMISSED_KEY, "1")
    }
    deferredPrompt.current = null
    setShow(null)
  }

  if (!show) return null

  return (
    <div
      className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-sm rounded-2xl bg-white shadow-2xl shadow-black/10 border border-border"
      role="dialog"
      aria-label="Install EatoBiotics app"
    >
      {/* Top accent bar */}
      <div
        className="h-1 w-full rounded-t-2xl"
        style={{
          background:
            "linear-gradient(90deg, var(--icon-lime), var(--icon-green), var(--icon-teal), var(--icon-yellow), var(--icon-orange))",
        }}
      />

      <div className="flex items-start gap-3 p-4">
        {/* App icon */}
        <Image
          src="/icons/icon-192.png"
          alt="EatoBiotics"
          width={48}
          height={48}
          className="rounded-xl flex-shrink-0"
        />

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">
            Add to Home Screen
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
            {show === "ios"
              ? <>Tap the Share button below, then choose &ldquo;Add to Home Screen&rdquo;.</>
              : "Install EatoBiotics for quick access to your daily food system."}
          </p>

          {show === "android" && (
            <button
              onClick={install}
              className="mt-3 inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold text-white"
              style={{ background: "var(--icon-green)" }}
            >
              <Download size={12} />
              Install
            </button>
          )}

          {show === "ios" && (
            <p
              className="mt-2 inline-flex items-center gap-1 text-xs font-medium"
              style={{ color: "var(--icon-green)" }}
            >
              <Share size={12} />
              Tap Share, then &ldquo;Add to Home Screen&rdquo;
            </p>
          )}
        </div>

        {/* Dismiss */}
        <button
          onClick={dismiss}
          className="flex-shrink-0 rounded-full p-1 text-muted-foreground transition-colors hover:text-foreground hover:bg-muted"
          aria-label="Dismiss"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  )
}
