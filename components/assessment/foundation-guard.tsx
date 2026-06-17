"use client"

/**
 * Wraps an add-on assessment so it can never be taken without a Food System
 * foundation. If no foundation is complete, it redirects to the add-on gate
 * (which enforces You/Family first). Once the add-on itself completes, it
 * surfaces a "view combined report" banner — without modifying the add-on's
 * own client.
 */

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowRight, Loader2 } from "lucide-react"
import { hasAnyFoundation, patchJourney } from "@/lib/assessment/journey"
import { isComplete, ADDONS, type AddonKey } from "@/lib/assessment/registry"

export function FoundationGuard({ addon, children }: { addon: AddonKey; children: React.ReactNode }) {
  const router = useRouter()
  const [status, setStatus] = useState<"checking" | "ok">("checking")
  const [addonDone, setAddonDone] = useState(false)

  useEffect(() => {
    if (!hasAnyFoundation()) {
      router.replace(`/assessment/add/${addon}`)
      return
    }
    patchJourney({ selectedAddon: addon })
    setStatus("ok")
  }, [addon, router])

  // Once the add-on completes, surface the combined-report CTA.
  useEffect(() => {
    if (status !== "ok") return
    const tick = () => setAddonDone(isComplete(addon))
    tick()
    const id = window.setInterval(tick, 1500)
    return () => window.clearInterval(id)
  }, [status, addon])

  if (status === "checking") {
    return (
      <section className="flex min-h-[60vh] items-center justify-center px-6">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 size={20} className="animate-spin text-icon-green" />
          <span>Loading your assessment…</span>
        </div>
      </section>
    )
  }

  return (
    <>
      {children}
      {addonDone && (
        <div className="fixed inset-x-0 bottom-0 z-50 px-4 pb-5 pt-3" style={{ background: "linear-gradient(to top, var(--background) 70%, transparent)" }}>
          <Link
            href="/assessment/results"
            className="brand-gradient mx-auto flex w-full max-w-md items-center justify-center gap-2 rounded-full py-4 text-base font-semibold text-white shadow-xl shadow-icon-green/30"
          >
            View your combined report ({ADDONS[addon].label}) <ArrowRight size={18} />
          </Link>
        </div>
      )}
    </>
  )
}
