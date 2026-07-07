"use client"

/**
 * The "Food Systems" mega menu — a full-width premium panel under the header,
 * driven entirely by the lib/systems.ts catalog via MEGA_MENU_GROUPS
 * (Foundation / Health / Life). Keyboard accessible: Escape closes and returns
 * focus to the trigger; the panel closes when focus or pointer leaves it.
 * Motion is transition-only (opacity/transform), so reduced-motion users simply
 * see less easing.
 */

import Link from "next/link"
import { useCallback, useEffect, useRef, useState } from "react"
import { ArrowRight, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { MEGA_MENU_GROUPS, type MegaMenuGroup, type MegaMenuItem } from "@/lib/nav"
import { LIFE_SYSTEM_DISCLAIMER } from "@/lib/assessment-disclaimers"

/**
 * Shared disclosure behaviour for header menus: outside click, Escape (with
 * focus returned to the trigger), close when focus leaves, close on route change.
 */
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

function MegaMenuCard({
  item,
  large = false,
  onNavigate,
}: {
  item: MegaMenuItem
  large?: boolean
  onNavigate: () => void
}) {
  const Icon = item.icon
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className="group/card flex items-start gap-3 rounded-xl p-3 transition-colors hover:bg-secondary/60 focus-visible:bg-secondary/60"
      style={{ ["--accent" as string]: item.accent }}
    >
      <span
        className={cn("flex shrink-0 items-center justify-center rounded-lg shadow-sm", large ? "h-10 w-10" : "h-8 w-8")}
        style={{ background: item.gradient }}
      >
        <Icon size={large ? 18 : 15} className="text-white" />
      </span>
      <span className="min-w-0">
        <span className="flex items-center gap-2">
          <span className={cn("font-medium text-foreground/90 transition-colors group-hover/card:text-[color:var(--accent)]", large ? "text-[15px]" : "text-sm")}>
            {item.label}
          </span>
          {item.comingSoon && (
            <span className="rounded-full border border-border px-1.5 py-px text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
              Soon
            </span>
          )}
        </span>
        <span className="mt-0.5 block truncate text-xs text-muted-foreground">{item.description}</span>
      </span>
    </Link>
  )
}

function MegaMenuSection({
  group,
  onNavigate,
  className,
}: {
  group: MegaMenuGroup
  onNavigate: () => void
  className?: string
}) {
  const health = group.family === "health"
  return (
    <div className={className}>
      <p className="text-[11px] font-bold uppercase tracking-widest text-icon-green">{group.label}</p>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{group.blurb}</p>
      <div className={cn("mt-3", health ? "grid grid-cols-2 gap-x-2 gap-y-1" : "flex flex-col gap-1")}>
        {group.items.map((item) => (
          <MegaMenuCard key={item.href} item={item} large={group.family === "foundation"} onNavigate={onNavigate} />
        ))}
      </div>
      {group.family === "life" && (
        <p className="mt-3 px-3 text-[10px] leading-relaxed text-muted-foreground/70">{LIFE_SYSTEM_DISCLAIMER}</p>
      )}
    </div>
  )
}

export function MegaMenu({ pathname }: { pathname: string }) {
  const { open, setOpen, containerRef, triggerRef, onBlurCapture } = useDisclosureMenu(pathname)
  const close = useCallback(() => setOpen(false), [setOpen])

  const isActive = MEGA_MENU_GROUPS.some((g) =>
    g.items.some((i) => pathname === i.href || pathname.startsWith(i.href + "/")),
  ) || pathname === "/food-systems"

  return (
    <div ref={containerRef} onBlurCapture={onBlurCapture}>
      <button
        ref={triggerRef}
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="true"
        aria-controls="fs-mega-panel"
        className={cn(
          "flex items-center gap-1 text-sm font-medium transition-colors",
          isActive || open ? "text-foreground" : "text-muted-foreground hover:text-foreground",
        )}
      >
        Food Systems
        <ChevronDown size={14} className={cn("transition-transform duration-200", open && "rotate-180")} />
      </button>

      {open && (
        <div
          id="fs-mega-panel"
          className="absolute left-0 right-0 top-full max-h-[calc(100vh-80px)] overflow-y-auto border-t border-border bg-background shadow-[0_48px_80px_-40px_rgba(20,37,15,0.35)]"
        >
          {/* Top gradient hairline */}
          <div aria-hidden className="h-px w-full" style={{ background: "linear-gradient(90deg, transparent, #A8E063, #4CB648, #2DAA6E, #F5C518, #F5A623, transparent)" }} />
          {/* Ambient wash */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-60"
            style={{ background: "radial-gradient(60% 80% at 50% 0%, color-mix(in srgb, var(--icon-green) 6%, transparent), transparent 70%)" }}
          />
          <div className="relative mx-auto max-w-[1200px] px-6 py-8">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,2.1fr)_minmax(0,1.1fr)]">
              <MegaMenuSection group={MEGA_MENU_GROUPS[0]} onNavigate={close} />
              <MegaMenuSection
                group={MEGA_MENU_GROUPS[1]}
                onNavigate={close}
                className="lg:border-l lg:border-r lg:border-border/70 lg:px-8"
              />
              <MegaMenuSection group={MEGA_MENU_GROUPS[2]} onNavigate={close} />
            </div>

            <div className="mt-7 flex flex-wrap items-center justify-between gap-3 border-t border-border/70 pt-5">
              <p className="text-xs text-muted-foreground">
                One Food System. Many ways to support it.
              </p>
              <Link
                href="/food-systems"
                onClick={close}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-icon-green transition-colors hover:text-icon-teal"
              >
                Explore All Food Systems <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
