import { redirect } from "next/navigation"

// Consolidated into the canonical plate builder. /create-my-plate had no inbound
// links anywhere in the app; its AI plate-generator UI lives on in
// ./plate-creator-client.tsx and can be re-surfaced later if wanted.
export default function CreateMyPlatePage() {
  redirect("/myplate")
}
