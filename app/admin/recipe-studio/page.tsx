import { cookies } from "next/headers"
import { ADMIN_COOKIE, verifyAdminCookie } from "@/lib/admin-auth"
import { AdminLogin } from "../admin-login"
import { RecipeStudioClient } from "./recipe-studio-client"

export const metadata = {
  title: "Recipe Studio | EatoBiotics Admin",
  robots: { index: false, follow: false },
}

export default async function RecipeStudioPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const params = await searchParams
  const cookieStore = await cookies()
  const isAuthed = verifyAdminCookie(cookieStore.get(ADMIN_COOKIE)?.value)

  if (!isAuthed) {
    return <AdminLogin error={params.error === "1"} />
  }

  return <RecipeStudioClient />
}
