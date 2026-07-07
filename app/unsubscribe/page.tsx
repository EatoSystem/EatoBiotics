import type { Metadata } from "next"
import { UnsubscribeClient } from "./unsubscribe-client"

export const metadata: Metadata = {
  title: "Unsubscribe",
  robots: { index: false, follow: false },
}

/**
 * Public email opt-out page. Linked from the footer of marketing emails
 * (/unsubscribe?email=…&token=…). Works even without a token via a manual
 * confirm. Reachable while the site password gate is on (see proxy.ts).
 */
export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; token?: string; done?: string }>
}) {
  const sp = await searchParams
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-6 py-24 text-center">
      <UnsubscribeClient
        email={(sp.email ?? "").trim()}
        token={(sp.token ?? "").trim()}
        done={sp.done === "1"}
      />
    </div>
  )
}
