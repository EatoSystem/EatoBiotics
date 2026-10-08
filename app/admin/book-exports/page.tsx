import Link from "next/link"
import { cookies } from "next/headers"

import { ADMIN_COOKIE, verifyAdminCookie } from "@/lib/admin-auth"
import { chapters } from "@/lib/chapters"
import { PUBLISHING_EXPORT_VARIANTS } from "@/lib/v1-surface"
import { AdminLogin } from "../admin-login"

/**
 * Book exports — the author's entry point to the publishing views.
 *
 * ══ WHY THIS PAGE EXISTS ════════════════════════════════════════════════════
 *
 * Until step 4 the three export links sat in `ChapterNav`, on all twenty-five
 * PUBLIC chapter pages, offering an internal authoring tool to every reader.
 * The routes themselves are kept — the author's Substack, Reedsy and print
 * workflow depends on them — and now require the admin cookie, enforced once
 * in proxy.ts through `requiresAdminSurface`.
 *
 * The obvious alternative was to keep the buttons on the chapter page and show
 * them only to an admin. That is not clean: `admin_auth` is httpOnly, so no
 * client component can see it, and calling `cookies()` in a chapter page would
 * turn twenty-five statically prerendered public pages into dynamic ones — a
 * real cost to readers, paid for an author's convenience. So the controls moved
 * here instead, where all seventy-six are in one place.
 *
 * Same gate as every other /admin page: read the cookie, verify it, and render
 * the login form when it is absent. No new authentication, no client state.
 */

export const metadata = {
  title: "Book exports — EatoBiotics Admin",
  robots: { index: false, follow: false },
}

const VARIANT_LABELS: Record<(typeof PUBLISHING_EXPORT_VARIANTS)[number], string> = {
  substack: "Substack",
  reedsy: "Reedsy",
  print: "Print / PDF",
}

export default async function BookExportsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const params = await searchParams
  const cookieStore = await cookies()

  if (!verifyAdminCookie(cookieStore.get(ADMIN_COOKIE)?.value)) {
    return <AdminLogin error={params.error === "1"} />
  }

  return (
    <main className="mx-auto max-w-[900px] px-6 py-16">
      <Link href="/admin" className="text-xs font-semibold uppercase tracking-widest text-muted-foreground hover:text-foreground">
        ← Admin
      </Link>

      <h1 className="mt-6 font-serif text-3xl font-semibold text-foreground">Book exports</h1>
      <p className="mt-3 max-w-[60ch] text-sm leading-relaxed text-muted-foreground">
        Publishing views of each chapter, for copying into Substack or Reedsy and
        for print. These are not part of the customer product and are not
        reachable without this session.
      </p>

      <div className="mt-8 rounded-2xl border border-border">
        <Link
          href="/book/print"
          className="flex items-center justify-between px-5 py-4 text-sm font-semibold text-foreground transition-colors hover:bg-secondary/40"
        >
          The whole book, laid out for print
          <span className="text-xs font-medium text-muted-foreground">/book/print</span>
        </Link>
      </div>

      <ol className="mt-8 space-y-2">
        {chapters.map((chapter) => (
          <li
            key={chapter.number}
            className="flex flex-col gap-3 rounded-2xl border border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Chapter {chapter.number}
                {chapter.status !== "published" && ` · ${chapter.status}`}
              </p>
              <p className="truncate font-serif text-base font-semibold text-foreground">{chapter.title}</p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              {PUBLISHING_EXPORT_VARIANTS.map((variant) => (
                <Link
                  key={variant}
                  href={`/book-chapter-${chapter.number}/${variant}`}
                  className="rounded-full border border-border px-4 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-icon-green hover:text-icon-green"
                >
                  {VARIANT_LABELS[variant]}
                </Link>
              ))}
            </div>
          </li>
        ))}
      </ol>
    </main>
  )
}
