import type { SupabaseClient } from "@supabase/supabase-js";

export type AuditAction =
  | "archive"
  | "create"
  | "invite"
  | "restore"
  | "revoke"
  | "system_generate"
  | "update";

type AuditMetadata = Record<string, unknown>;

export type RecordAuditEventInput = {
  action: AuditAction;
  actorEmail?: string | null;
  actorId?: string | null;
  entityId?: string | null;
  entityType: string;
  metadata?: AuditMetadata;
  portfolioId: string;
  propertyId?: string | null;
  summary: string;
};

export async function recordAuditEvent(
  supabase: SupabaseClient,
  input: RecordAuditEventInput,
) {
  const { data, error } = await supabase
    .from("audit_events")
    .insert({
      action: input.action,
      actor_email: input.actorEmail ?? null,
      actor_id: input.actorId ?? null,
      entity_id: input.entityId ?? null,
      entity_type: input.entityType,
      metadata: input.metadata ?? {},
      portfolio_id: input.portfolioId,
      property_id: input.propertyId ?? null,
      summary: input.summary,
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(`Failed to record audit event: ${error.message}`);
  }

  return data.id as string;
}
