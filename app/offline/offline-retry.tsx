"use client"

export function OfflineRetry() {
  return (
    <button
      onClick={() => window.location.reload()}
      className="brand-gradient inline-flex items-center gap-2 rounded-full px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-icon-green/20 transition-all hover:opacity-90"
    >
      Try again
    </button>
  )
}
