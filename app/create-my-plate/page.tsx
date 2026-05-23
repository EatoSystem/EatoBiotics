import { permanentRedirect } from "next/navigation"

/**
 * The weekly meal-plan generator that used to live here now lives as a tab
 * inside the unified /plate-builder experience. This page keeps the old
 * URL alive as a 308 permanent redirect so existing bookmarks, marketing
 * links, and search-engine results all land in the right place.
 *
 * The underlying React component is still at ./plate-creator-client and
 * is imported by the tabs wrapper at components/plate-builder/plate-builder-tabs.tsx.
 */
export default function CreateMyPlatePage() {
  permanentRedirect("/plate-builder?tab=weekly")
}
