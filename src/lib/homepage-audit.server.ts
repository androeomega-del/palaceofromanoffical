/**
 * Server-only helper to append a row to `homepage_layout_audit`.
 * Never throws — audit failure must not break the parent transaction.
 */
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type HomepageAuditAction =
  | "generated"
  | "activated"
  | "archived"
  | "force_refresh"
  | "force_publish"
  | "preview_generated"
  | "generation_failed"
  | "manual_edit";

export async function logHomepageAudit(input: {
  action: HomepageAuditAction;
  edition_id?: string | null;
  actor?: string | null;
  details?: Record<string, unknown>;
}): Promise<void> {
  try {
    await supabaseAdmin.from("homepage_layout_audit").insert({
      action: input.action,
      edition_id: input.edition_id ?? null,
      actor: input.actor ?? null,
      details: (input.details ?? {}) as never,
    });
  } catch (e) {
    console.error("[homepage-audit] write failed (ignored):", e);
  }
}
