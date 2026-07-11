"use client"

import Link from "next/link"

/* Belt-and-suspenders boundary for the editor page: if a preview render (or
   anything else server-side) throws, the admin gets a recover-able message
   instead of a blank 500 — the underlying content is untouched and editable. */
export default function EditorError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-2xl rounded-2xl border border-border p-8 text-center">
      <p className="font-serif text-lg font-semibold text-foreground">Something went wrong rendering this item</p>
      <p className="mt-2 text-sm text-muted-foreground">
        Your content is saved and safe. This is usually a preview that couldn&apos;t render — try again, or go back to the library.
      </p>
      <div className="mt-5 flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="brand-gradient rounded-full px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          Try again
        </button>
        <Link
          href="/cms/library"
          className="rounded-full border border-border px-5 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
        >
          Back to library
        </Link>
      </div>
    </div>
  )
}
