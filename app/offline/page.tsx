import Image from "next/image"
import type { Metadata } from "next"
import { OfflineRetry } from "./offline-retry"

export const metadata: Metadata = {
  title: "You're Offline",
  description: "No internet connection detected.",
}

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <div className="flex flex-col items-center gap-6 max-w-sm">
        {/* Logo */}
        <Image
          src="/icons/icon-192.png"
          alt="EatoBiotics"
          width={72}
          height={72}
          className="rounded-2xl opacity-80"
        />

        {/* Heading */}
        <div>
          <h1
            className="font-serif text-3xl font-bold sm:text-4xl"
            style={{
              background:
                "linear-gradient(135deg, var(--icon-lime), var(--icon-green), var(--icon-teal))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            You&apos;re offline
          </h1>
          <p className="mt-3 text-base text-muted-foreground leading-relaxed">
            It looks like you&apos;ve lost your connection. Check your internet
            and try again — your data is safe.
          </p>
        </div>

        <OfflineRetry />

        {/* Footer note */}
        <p className="text-xs text-muted-foreground opacity-60">
          EatoBiotics — The Food System Inside You
        </p>
      </div>
    </div>
  )
}
