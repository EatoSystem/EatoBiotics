import { redirect } from "next/navigation"

// Reconciled with the real app: the home IS the Today/ritual screen. The
// separate ritual route now points at the unified Today mock.
export default function AppRitualRedirect() {
  redirect("/app-home")
}
