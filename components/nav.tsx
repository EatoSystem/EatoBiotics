"use client"

import Link from "next/link"
import Image from "next/image"
import { useState, useRef, useEffect } from "react"
import { Menu, X, ChevronDown } from "lucide-react"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { AccountNavItem } from "@/components/account/account-nav-item"
import { NAV_GROUPS, NAV_LINKS, type NavGroup } from "@/lib/nav"

function DropdownMenu({ group, pathname }: { group: NavGroup; pathname: string }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  // Is any child active?
  const isActive = group.items.some(
    (item) => pathname === item.href || pathname.startsWith(item.href + "/")
  )

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center gap-1 text-sm font-medium transition-colors",
          isActive || open ? "text-foreground" : "text-muted-foreground hover:text-foreground"
        )}
      >
        {group.label}
        <ChevronDown
          size={14}
          className={cn("transition-transform duration-200", open && "rotate-180")}
        />
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-3 w-72 rounded-2xl border border-border bg-background shadow-xl shadow-black/10">
          <div className="p-2">
            {group.items.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + "/")
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "group flex items-start gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-secondary/60",
                    active && "bg-secondary/40"
                  )}
                >
                  <div
                    className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                    style={{ background: active ? "linear-gradient(135deg, var(--icon-lime), var(--icon-green))" : undefined }}
                  >
                    <item.icon
                      size={14}
                      className={cn(
                        "transition-colors",
                        active ? "text-white" : "text-muted-foreground group-hover:text-foreground"
                      )}
                    />
                  </div>
                  <div>
                    <p className={cn("text-sm font-medium", active ? "text-foreground" : "text-foreground/80")}>
                      {item.label}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{item.description}</p>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export function Nav() {
  const [open, setOpen] = useState(false)
  const [mobileGroup, setMobileGroup] = useState<string | null>(null)
  const pathname = usePathname()

  // Close mobile menu on route change
  useEffect(() => {
    setOpen(false)
    setMobileGroup(null)
  }, [pathname])

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-[1200px] items-center justify-between px-6 py-3">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <Image
            src="/eatobiotics-icon.webp"
            alt="EatoBiotics"
            width={36}
            height={36}
            className="h-9 w-9"
          />
          <span className="font-serif text-xl font-semibold tracking-tight text-foreground">
            EatoBiotics
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-7 md:flex">
          {NAV_GROUPS.map((group) => (
            <DropdownMenu key={group.label} group={group} pathname={pathname} />
          ))}
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "text-sm font-medium transition-colors",
                pathname === link.href ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {link.label}
            </Link>
          ))}
          <AccountNavItem />
          <Link
            href="/assessment"
            className="brand-gradient rounded-full px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            Understand My Food System →
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setOpen(!open)}
          className="text-foreground md:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="max-h-[calc(100vh-61px)] overflow-y-auto border-t border-border bg-background px-6 py-6 md:hidden">
          <div className="flex flex-col gap-2">
            {NAV_GROUPS.map((group) => {
              const isGroupOpen = mobileGroup === group.label
              const isActive = group.items.some(
                (item) => pathname === item.href || pathname.startsWith(item.href + "/")
              )
              return (
                <div key={group.label}>
                  {/* Group header */}
                  <button
                    onClick={() => setMobileGroup(isGroupOpen ? null : group.label)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-base font-semibold transition-colors",
                      isActive ? "text-foreground" : "text-muted-foreground",
                      isGroupOpen && "bg-secondary/40 text-foreground"
                    )}
                  >
                    {group.label}
                    <ChevronDown
                      size={16}
                      className={cn("transition-transform duration-200", isGroupOpen && "rotate-180")}
                    />
                  </button>

                  {/* Group items */}
                  {isGroupOpen && (
                    <div className="mt-1 mb-2 flex flex-col gap-1 pl-2">
                      {group.items.map((item) => {
                        const active = pathname === item.href || pathname.startsWith(item.href + "/")
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setOpen(false)}
                            className={cn(
                              "flex items-center gap-3 rounded-xl px-3 py-3 transition-colors",
                              active ? "bg-secondary/60 text-foreground" : "text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
                            )}
                          >
                            <div
                              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                              style={{ background: active ? "linear-gradient(135deg, var(--icon-lime), var(--icon-green))" : "var(--secondary)" }}
                            >
                              <item.icon size={14} className={active ? "text-white" : "text-muted-foreground"} />
                            </div>
                            <div>
                              <p className="text-sm font-medium">{item.label}</p>
                              <p className="text-xs text-muted-foreground">{item.description}</p>
                            </div>
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}

            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center rounded-xl px-3 py-3 text-base font-semibold transition-colors",
                  pathname === link.href ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {link.label}
              </Link>
            ))}

            <div className="mt-3 flex items-center gap-4 border-t border-border px-3 pt-5">
              <AccountNavItem />
            </div>
            <Link
              href="/assessment"
              onClick={() => setOpen(false)}
              className="brand-gradient mt-4 rounded-full px-5 py-3.5 text-center text-base font-semibold text-white"
            >
              Understand My Food System →
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}
