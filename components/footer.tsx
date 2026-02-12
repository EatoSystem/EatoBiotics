import Link from "next/link"

export function Footer() {
  return (
    <footer className="border-t border-[var(--border)] bg-[var(--secondary)]">
      <div className="mx-auto max-w-[1200px] px-6 py-16">
        <div className="flex flex-col gap-12 md:flex-row md:justify-between">
          <div className="max-w-xs">
            <p className="font-serif text-2xl text-[var(--foreground)]">EatoBiotics</p>
            <p className="mt-3 text-sm leading-relaxed text-[var(--muted-foreground)]">
              Build the food system inside you... and help build the food system around you.
            </p>
          </div>

          <div className="flex flex-wrap gap-16">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">
                Explore
              </p>
              <div className="mt-4 flex flex-col gap-3">
                <Link href="/framework" className="text-sm text-[var(--foreground)] hover:text-[var(--primary)] transition-colors">
                  The Framework
                </Link>
                <Link href="/book" className="text-sm text-[var(--foreground)] hover:text-[var(--primary)] transition-colors">
                  The Book
                </Link>
                <Link href="/eatosystem" className="text-sm text-[var(--foreground)] hover:text-[var(--primary)] transition-colors">
                  EatoSystem
                </Link>
                <Link href="/app" className="text-sm text-[var(--foreground)] hover:text-[var(--primary)] transition-colors">
                  The App
                </Link>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">
                Connect
              </p>
              <div className="mt-4 flex flex-col gap-3">
                <a
                  href="https://eatobiotics.substack.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-[var(--foreground)] hover:text-[var(--primary)] transition-colors"
                >
                  Substack
                </a>
                <a
                  href="https://www.eatosystem.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-[var(--foreground)] hover:text-[var(--primary)] transition-colors"
                >
                  EatoSystem.com
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-16 flex flex-col items-center gap-4 border-t border-[var(--border)] pt-8 md:flex-row md:justify-between">
          <p className="text-xs text-[var(--muted-foreground)]">
            {'EatoBiotics. All rights reserved.'}
          </p>
          <div className="brand-gradient h-1 w-24 rounded-full" />
        </div>
      </div>
    </footer>
  )
}
