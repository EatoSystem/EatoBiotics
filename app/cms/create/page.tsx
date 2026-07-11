import { CreateClient } from "./create-client"

/* Content Studio — "What are you creating?" The type picker + per-type
   metadata form live in the client component; creation posts to
   /api/cms/content (admin-gated) and redirects into the editor. */
export default function CmsCreatePage() {
  return <CreateClient />
}
