import { Suspense } from "react"
import { SignInClient } from "./signin-client"

export const metadata = {
  title: "Sign In — EatoBiotics",
  description: "Access your EatoBiotics account",
}

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6 pt-[57px]">
      <div className="w-full max-w-md">
        <Suspense fallback={<SignInSkeleton />}>
          <SignInClient />
        </Suspense>
      </div>
    </div>
  )
}

function SignInSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card p-8 text-center space-y-4">
      <div className="w-12 h-12 rounded-full bg-secondary/40 mx-auto animate-pulse" />
      <div className="h-5 bg-secondary/40 rounded w-48 mx-auto animate-pulse" />
      <div className="h-4 bg-secondary/30 rounded w-64 mx-auto animate-pulse" />
    </div>
  )
}
