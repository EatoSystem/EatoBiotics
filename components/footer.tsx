import Link from "next/link"
import Image from "next/image"

export function Footer() {
  return (
    <footer className="bg-background">
      {/* Gradient divider at top */}
      <div className="section-divider" />

      <div className="mx-auto max-w-[1200px] px-6 py-16">
        <div className="flex flex-col gap-12 md:flex-row md:justify-between">
          <div className="max-w-xs">
            <div className="flex items-center gap-2.5">
              <Image
                src="/eatobiotics-icon.webp"
                alt="EatoBiotics"
                width={32}
                height={32}
                className="h-8 w-8"
              />
              <p className="font-serif text-xl font-semibold text-foreground">EatoBiotics</p>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Build the food system inside you... and help build the food system around you.
            </p>
            <div className="mt-5 flex items-center gap-1.5">
              <span className="biotic-pill bg-icon-lime" />
              <span className="biotic-pill bg-icon-green" />
              <span className="biotic-pill bg-icon-teal" />
              <span className="biotic-pill bg-icon-yellow" />
              <span className="biotic-pill bg-icon-orange" />
            </div>
          </div>

          <div className="flex flex-wrap gap-16">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-icon-green">
                Explore
              </p>
              <div className="mt-4 flex flex-col gap-3">
                <Link href="/biotics" className="text-sm text-foreground transition-colors hover:text-icon-green">
                  The Biotics
                </Link>
                <Link href="/book" className="text-sm text-foreground transition-colors hover:text-icon-green">
                  The Book
                </Link>
                <Link href="/eatosystem" className="text-sm text-foreground transition-colors hover:text-icon-green">
                  EatoSystem
                </Link>
                <Link href="/app" className="text-sm text-foreground transition-colors hover:text-icon-green">
                  The App
                </Link>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-icon-orange">
                Connect
              </p>
              <div className="mt-4 flex flex-col gap-3">
                <a
                  href="https://eatobiotics.substack.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-foreground transition-colors hover:text-icon-orange"
                >
                  Substack
                </a>
                <a
                  href="https://www.eatosystem.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-foreground transition-colors hover:text-icon-orange"
                >
                  EatoSystem.com
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-16 flex flex-col items-center gap-4 border-t border-border pt-8 md:flex-row md:justify-between">
          <p className="text-xs text-muted-foreground">
            {'EatoBiotics. All rights reserved.'}
          </p>
          <div className="brand-gradient h-1 w-24 rounded-full" />
        </div>
      </div>
    </footer>
  )
}
