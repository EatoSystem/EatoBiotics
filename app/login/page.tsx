import { Suspense } from "react"
import { SignInClient } from "@/app/account/signin/signin-client"

export const metadata = {
  title: "Log In — EatoBiotics",
  description: "Access your EatoBiotics account",
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6 pt-[57px]">
      <div className="w-full max-w-md">
        <Suspense fallback={<div className="rounded-2xl border border-border bg-card p-8 h-48 animate-pulse" />}>
          <SignInClient />
        </Suspense>
      </div>
    </div>
  )
}
