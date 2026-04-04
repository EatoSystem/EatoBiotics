"use client"

import { useEffect } from "react"
import { toast } from "sonner"

export function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return

    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        console.log("[PWA] Service worker registered:", registration.scope)

        // Listen for a new SW version becoming available
        registration.addEventListener("updatefound", () => {
          const installingWorker = registration.installing
          if (!installingWorker) return

          installingWorker.addEventListener("statechange", () => {
            // A new SW has finished installing and there was an existing controller
            // (i.e. this is an update, not the very first install)
            if (
              installingWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              toast("A new version is available", {
                description: "Refresh to get the latest EatoBiotics.",
                duration: Infinity,
                action: {
                  label: "Refresh",
                  onClick: () => window.location.reload(),
                },
              })
            }
          })
        })
      })
      .catch((err) => {
        console.warn("[PWA] Service worker registration failed:", err)
      })
  }, [])

  return null
}
