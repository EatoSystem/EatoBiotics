import { permanentRedirect } from "next/navigation"

/**
 * The quadrant builder + plants tracker + journal experience that used to
 * live here now lives as a tab inside the unified /plate-builder. This page
 * keeps the old URL alive as a 308 permanent redirect.
 *
 * The underlying React component is still at ./myplate-client and is
 * imported by the tabs wrapper at components/plate-builder/plate-builder-tabs.tsx.
 */
export default function MyPlatePage() {
  permanentRedirect("/plate-builder?tab=my-plate")
}
