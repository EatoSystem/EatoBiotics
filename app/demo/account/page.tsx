import { redirect } from "next/navigation"

// Single-membership model: there is one account (Member), so the demo goes
// straight to it (which shows the Living Twin + a link to the full Twin view).
// The old four-tier picker is retired.
export default function DemoAccountPage() {
  redirect("/demo/account/member")
}
