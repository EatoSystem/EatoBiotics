/** A persistent, honest banner marking every app-concept page as a mockup —
    not a shipping product, not a real download. Concept-only. */
export function ConceptBanner() {
  return (
    <div
      className="w-full px-4 py-2 text-center text-[11px] font-semibold"
      style={{ background: "rgba(245,166,35,0.14)", color: "#F5A623", borderBottom: "1px solid rgba(245,166,35,0.3)" }}
    >
      Concept mockup — a preview of the EatoBiotics companion app in design. Not a live app or download.
    </div>
  )
}
