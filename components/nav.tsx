"use client"

import Link from "next/link"
import Image from "next/image"
import { useState } from "react"
import { Menu, X } from "lucide-react"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const links = [
  { href: "/", label: "Home" },
  { href: "/framework", label: "The Framework" },
  { href: "/book", label: "The Book" },
  { href: "/eatosystem", label: "EatoSystem" },
  { href: "/app", label: "The App" },
]

export function Nav() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background">
      <div className="mx-auto flex max-w-[1200px] items-center justify-between px-6 py-3">
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
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "text-sm font-medium transition-colors",
                pathname === link.href
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {link.label}
            </Link>
          ))}
          <a
            href="https://eatobiotics.substack.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="brand-gradient rounded-full px-5 py-2 text-sm font-semibold text-background transition-opacity hover:opacity-90"
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
          <div className="flex flex-col gap-4">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "text-base font-medium transition-colors",
                  pathname === link.href
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {link.label}
              </Link>
            ))}
            <a
              href="https://eatobiotics.substack.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="brand-gradient mt-2 rounded-full px-5 py-3 text-center text-sm font-semibold text-background"
            >
              Subscribe
            </a>
          </div>
        </div>
      )}
    </nav>
  )
}
