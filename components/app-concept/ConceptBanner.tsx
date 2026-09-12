/** A persistent, honest banner marking every app-concept page as a mockup —
    not a shipping product, not a real download. Concept-only. */
import { APP } from "./theme"

export function ConceptBanner() {
  return (
    <div
      className="w-full px-4 py-2 text-center text-[11px] font-semibold"
      style={{ background: "rgba(232,160,85,0.16)", color: "#9a6520", borderBottom: `1px solid ${APP.apricot}`, fontFamily: APP.ui }}
    >
      Concept mockup — a preview of the EatoBiotics companion app in design. Not a live app or download.
    </div>
  )
}
