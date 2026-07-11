import type { Metadata } from "next"
import Link from "next/link"
import { cookies } from "next/headers"
import { ADMIN_COOKIE, verifyAdminCookie } from "@/lib/admin-auth"
import { AdminLogin } from "@/app/admin/admin-login"

export const metadata: Metadata = {
  title: "Content Studio — EatoBiotics",
  robots: { index: false, follow: false },
}

/* EatoBiotics Content Studio shell. Second gate behind the proxy.ts
   default-deny (defence in depth): every /cms child is protected by
   construction — unauthenticated visitors get the admin login, and all data
   fetching happens in server components below this gate. */
export default async function CmsLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const isAuthed = verifyAdminCookie(cookieStore.get(ADMIN_COOKIE)?.value)
  if (!isAuthed) {
    return <AdminLogin />
  }

  const nav = [
    { href: "/cms", label: "Dashboard" },
    { href: "/cms/create", label: "Create" },
    { href: "/cms/library", label: "Library" },
  ]

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-40 border-b border-border bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-3 px-6 py-3">
          <div className="flex items-center gap-3">
            <p className="font-serif text-lg font-bold text-foreground">Content Studio</p>
            <span
              className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white"
              style={{ background: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))" }}
            >
              Private
            </span>
          </div>
          <nav className="flex items-center gap-1">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-full px-4 py-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-icon-green/5 hover:text-icon-green"
              >
                {item.label}
              </Link>
            ))}
            <form action="/api/admin/logout" method="POST">
              <button
                type="submit"
                className="ml-2 rounded-full border border-border px-4 py-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
              >
                Sign out
              </button>
            </form>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-[1200px] px-6 py-8">{children}</main>
      <footer className="mx-auto max-w-[1200px] px-6 pb-8">
        <p className="text-xs text-muted-foreground">
          Create once. Adapt intelligently. Publish everywhere. — AI drafts, the founder
          reviews; only approved content can ever be published.
        </p>
      </footer>
    </div>
  )
}
