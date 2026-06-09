"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { recordAuditEvent } from "@/server/services/audit-events";
import { ensureUserProfileAndDefaultPortfolio } from "@/server/services/onboarding";

function text(formData: FormData, name: string, required = false) {
  const value = String(formData.get(name) ?? "").trim();
  if (required && !value) throw new Error(`${name} is required.`);
  return value || null;
}

function amountCents(formData: FormData, name: string) {
  const value = Number(formData.get(name));
  if (!Number.isFinite(value) || value < 0) throw new Error(`${name} must be valid.`);
  return Math.round(value * 100);
}

export async function createDepositAction(formData: FormData) {
  const supabase = await createClient();
  const onboarding = await ensureUserProfileAndDefaultPortfolio(supabase);
  const propertyId = text(formData, "propertyId", true) as string;
  const agreementId = text(formData, "agreementId", true) as string;
  const label = text(formData, "label", true) as string;

  const { data: agreement, error: agreementError } = await supabase
    .from("agreements")
    .select("portfolio_id,tenant_id")
    .eq("id", agreementId)
    .eq("property_id", propertyId)
    .single();
  if (agreementError) throw new Error(`Failed to load agreement: ${agreementError.message}`);

  const { data, error } = await supabase
    .from("deposits")
    .insert({
      agreement_id: agreementId,
      amount_cents: amountCents(formData, "amount"),
      created_by: onboarding.profileId,
      label,
      notes: text(formData, "notes"),
      portfolio_id: agreement.portfolio_id,
      property_id: propertyId,
      status: "held",
      tenant_id: agreement.tenant_id,
    })
    .select("id")
    .single();
  if (error) throw new Error(`Failed to create deposit: ${error.message}`);

  await recordAuditEvent(supabase, {
    action: "create",
    actorId: onboarding.profileId,
    entityId: data.id as string,
    entityType: "deposit",
    portfolioId: agreement.portfolio_id as string,
    propertyId,
    summary: `Created deposit ${label}`,
  });

  revalidatePath(`/properties/${propertyId}`);
}

export async function updateDepositStatusAction(formData: FormData) {
  const supabase = await createClient();
  const propertyId = text(formData, "propertyId", true) as string;
  const depositId = text(formData, "depositId", true) as string;
  const status = formData.get("status") === "refunded" ? "refunded" : "held";

  const { error } = await supabase
    .from("deposits")
    .update({
      refund_date: text(formData, "refundDate"),
      status,
    })
    .eq("id", depositId)
    .eq("property_id", propertyId);
  if (error) throw new Error(`Failed to update deposit: ${error.message}`);

  revalidatePath(`/properties/${propertyId}`);
}
