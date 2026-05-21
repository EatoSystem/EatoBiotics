import { cookies } from "next/headers"
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
  const isAuthed = cookieStore.get("admin_auth")?.value === "eatobiotics-admin-ok"

  if (!isAuthed) {
    return <AdminLogin error={params.error === "1"} />
  }

  return <RecipeStudioClient />
}
