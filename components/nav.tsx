"use client"

import Link from "next/link"
import Image from "next/image"
import { useState, useRef, useEffect } from "react"
import { Menu, X, ChevronDown, BookOpen, Leaf, Smartphone, UtensilsCrossed, Calendar, Info, Globe, Map, Mic, Activity, Users, Brain, ClipboardList } from "lucide-react"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { AccountNavItem } from "@/components/account/account-nav-item"

type DropdownItem = {
  href: string
  label: string
  description: string
  icon: React.ComponentType<{ size?: number; className?: string }>
}

type NavGroup = {
  label: string
  items: DropdownItem[]
}

const navGroups: NavGroup[] = [
  {
    label: "Learn",
    items: [
      { href: "/biotics", label: "The Biotics", description: "The 3-part framework for your gut", icon: Leaf },
      { href: "/mind", label: "Mind", description: "The food system inside your mind", icon: Brain },
      { href: "/book", label: "The Book", description: "EatoBiotics — coming 2026", icon: BookOpen },
      { href: "/app", label: "The App", description: "Your daily plate companion", icon: Smartphone },
    ],
  },
  {
    label: "Explore",
    items: [
      { href: "/food", label: "Food Library", description: "Every food profiled for your gut", icon: UtensilsCrossed },
      { href: "/today", label: "Today's Food", description: "A new food spotlight, daily", icon: Calendar },
      { href: "/podcast", label: "The Podcast", description: "Conversations about food & performance", icon: Mic },
      { href: "/family", label: "For Families", description: "The food system for the whole family", icon: Users },
      { href: "/assessment-mind", label: "Mind Assessment", description: "Score your gut-brain connection", icon: ClipboardList },
    ],
  },
  {
    label: "About",
    items: [
      { href: "/about", label: "About", description: "Jason's story and mission", icon: Info },
      { href: "/eatosystem", label: "EatoSystem", description: "The wider food ecosystem", icon: Globe },
      { href: "/roadmap", label: "Roadmap", description: "What's being built next", icon: Map },
    ],
  },
]

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
        <div className="absolute top-full right-0 mt-3 w-64 rounded-2xl border border-border bg-background shadow-xl shadow-black/10">
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
        <div className="hidden items-center gap-8 md:flex">
          {navGroups.map((group) => (
            <DropdownMenu key={group.label} group={group} pathname={pathname} />
          ))}
          <AccountNavItem />
          <a
            href="https://eatobiotics.substack.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="brand-gradient rounded-full px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            Subscribe
          </a>
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
        <div className="border-t border-border bg-background px-6 py-6 md:hidden">
          <div className="flex flex-col gap-2">
            {navGroups.map((group) => {
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

            <div className="mt-1 px-3">
              <AccountNavItem />
            </div>
            <a
              href="https://eatobiotics.substack.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="brand-gradient mt-3 rounded-full px-5 py-3 text-center text-sm font-semibold text-white"
            >
              Subscribe
            </a>
          </div>
        </div>
      )}
    </nav>
  )
}
