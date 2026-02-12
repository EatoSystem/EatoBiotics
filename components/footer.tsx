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
                <Link href="/app" className="text-sm text-foreground transition-colors hover:text-icon-green">
                  The App
                </Link>
                <Link href="/eatosystem" className="text-sm text-foreground transition-colors hover:text-icon-green">
                  EatoSystem
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

              {/* Social icons */}
              <div className="mt-6 flex items-center gap-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="0" height="0" className="absolute">
                  <defs>
                    <linearGradient id="social-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#A8E063" />
                      <stop offset="25%" stopColor="#4CB648" />
                      <stop offset="50%" stopColor="#2DAA6E" />
                      <stop offset="75%" stopColor="#F5C518" />
                      <stop offset="100%" stopColor="#F5A623" />
                    </linearGradient>
                  </defs>
                </svg>

                {/* LinkedIn */}
                <a
                  href="https://www.linkedin.com/company/eatobiotics"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="EatoBiotics on LinkedIn"
                  className="transition-opacity hover:opacity-70"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="url(#social-gradient)">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                </a>

                {/* X (Twitter) */}
                <a
                  href="https://x.com/EatoBiotics"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="EatoBiotics on X"
                  className="transition-opacity hover:opacity-70"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="url(#social-gradient)">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>

                {/* Instagram */}
                <a
                  href="https://www.instagram.com/EatoBiotics"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="EatoBiotics on Instagram"
                  className="transition-opacity hover:opacity-70"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="url(#social-gradient)">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
                  </svg>
                </a>

                {/* TikTok */}
                <a
                  href="https://www.tiktok.com/@EatoBiotics"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="EatoBiotics on TikTok"
                  className="transition-opacity hover:opacity-70"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="url(#social-gradient)">
                    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
                  </svg>
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
