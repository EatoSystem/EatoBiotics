"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { CTA_HREF, CTA_LABEL } from "./cta"

/**
 * A /newdemo-only CTA bar that appears once the hero scrolls out of view.
 *
 * Why not just change the header: components/nav.tsx is shared chrome rendered
 * on every route, and its CTA ("Understand My Food System →") is always visible
 * rather than scroll-triggered. Editing it would change the label site-wide, so
 * per the brief this wraps rather than modifies.
 *
 * ── Why createPortal ────────────────────────────────────────────────────────
 * `position: fixed` does not work inside <main> on this site. The `page-enter`
 * animation in globals.css finishes on `transform: none`, but animating *to*
 * `none` leaves the element with an interpolated identity matrix rather than no
 * transform at all — and any transform on an ancestor makes it the containing
 * block for fixed descendants, so the bar would scroll with the page instead of
 * pinning. Rendering into document.body escapes that ancestor entirely.
 *
 * IntersectionObserver on the hero rather than a scroll listener: no per-frame
 * work, and it stays correct if the hero's height changes across breakpoints.
 */
export function StickyCta({ watchId }: { watchId: string }) {
  const [show, setShow] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    const hero = document.getElementById(watchId)
    if (!hero) return
    const observer = new IntersectionObserver(
      ([entry]) => setShow(!entry.isIntersecting),
      { rootMargin: "-80px 0px 0px 0px" }
    )
    observer.observe(hero)
    return () => observer.disconnect()
  }, [watchId])

  if (!mounted) return null

  return createPortal(
    <div
      className={`fixed inset-x-0 top-0 z-40 border-b border-border/60 bg-background/95 backdrop-blur transition-transform duration-300 motion-reduce:transition-none ${
        show ? "translate-y-0" : "-translate-y-full"
      }`}
      // Hidden from assistive tech and keyboard order while off-screen, so the
      // CTA is not reachable as a phantom control above the fold. tabIndex on
      // the link below handles keyboard order; aria-hidden handles the AT tree.
      // (No `inert` — React 19 warns on an empty-string boolean attribute, and
      // the two together already cover it.)
      aria-hidden={!show}
    >
      <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-4 px-6 py-3">
        <span className="hidden text-sm font-semibold text-foreground sm:block">
          The Food System Inside You
        </span>
        <Link
          href={CTA_HREF}
          tabIndex={show ? 0 : -1}
          className="brand-gradient ml-auto inline-flex min-h-[44px] items-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-icon-green"
        >
          {CTA_LABEL} <ArrowRight size={15} aria-hidden />
        </Link>
      </div>
    </div>,
    document.body
  )
}
