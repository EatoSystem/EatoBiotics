import { redirect } from "next/navigation"

// Old tier-specific routes (/account-you/grow, /account-you/restore etc.)
// now redirect to the single unified demo page.
export default function AccountYouTierPage() {
  redirect("/account-you")
}
