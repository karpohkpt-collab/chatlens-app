import type { SupabaseClient } from "@supabase/supabase-js";

export async function logAudit(
  supabase: SupabaseClient,
  action: string,
  entityType: string,
  entityId: string,
  detail: Record<string, unknown> = {},
) {
  await supabase.from("audit_logs").insert({
    action,
    entity_type: entityType,
    entity_id: entityId,
    detail,
  });
}
