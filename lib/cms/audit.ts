import type { SupabaseClient } from "@supabase/supabase-js"

/* ── Append-only Content Studio audit trail ───────────────────────────────
   One row per CMS mutation (create/edit/version/approve/reject/archive…).
   Best-effort: an audit failure is logged but never fails the user's action.
   There is deliberately no update/delete path anywhere in the codebase.
   actor is "admin" until per-user admin identity exists (shared-password
   model — see lib/admin-auth.ts). */

export type CmsAuditAction =
  | "content_created"
  | "content_updated"
  | "version_created"
  | "status_changed"
  | "content_approved"
  | "changes_requested"
  | "content_archived"
  | "media_uploaded"
  | "media_updated"
  | "media_archived"
  | "media_attached"
  | "media_detached"

export async function recordCmsAudit(
  sb: SupabaseClient,
  action: CmsAuditAction,
  entityType: string,
  entityId: string | null,
  metadata: Record<string, unknown> = {}
): Promise<void> {
  try {
    await sb.from("cms_audit_log").insert({
      actor_user_id: "admin",
      action,
      entity_type: entityType,
      entity_id: entityId,
      metadata_json: metadata,
    })
  } catch (err) {
    console.error("[cms-audit] failed to record", action, err)
  }
}
