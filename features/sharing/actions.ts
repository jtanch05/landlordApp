"use server";

import crypto from "node:crypto";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { recordAuditEvent } from "@/server/services/audit-events";
import { ensureUserProfileAndDefaultPortfolio } from "@/server/services/onboarding";

function text(formData: FormData, name: string, required = false) {
  const value = String(formData.get(name) ?? "").trim();
  if (required && !value) throw new Error(`${name} is required.`);
  return value || null;
}

function checked(formData: FormData, name: string) {
  return formData.get(name) === "on";
}

export async function inviteCoOwnerAction(formData: FormData) {
  const supabase = await createClient();
  const onboarding = await ensureUserProfileAndDefaultPortfolio(supabase);
  const propertyId = text(formData, "propertyId", true) as string;
  const email = (text(formData, "email", true) as string).toLowerCase();

  const { data: property, error: propertyError } = await supabase
    .from("properties")
    .select("portfolio_id,nickname")
    .eq("id", propertyId)
    .single();
  if (propertyError) throw new Error(`Failed to load property: ${propertyError.message}`);

  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const expiresAt = new Date();
  expiresAt.setUTCDate(expiresAt.getUTCDate() + 14);

  const { data, error } = await supabase
    .from("invitations")
    .insert({
      can_edit: checked(formData, "canEdit"),
      can_view_tenant_contact: checked(formData, "canViewTenantContact"),
      email,
      expires_at: expiresAt.toISOString(),
      invited_by: onboarding.profileId,
      portfolio_id: property.portfolio_id,
      property_id: propertyId,
      token_hash: tokenHash,
    })
    .select("id")
    .single();
  if (error) throw new Error(`Failed to invite Co-owner: ${error.message}`);

  await recordAuditEvent(supabase, {
    action: "invite",
    actorId: onboarding.profileId,
    entityId: data.id as string,
    entityType: "invitation",
    portfolioId: property.portfolio_id as string,
    propertyId,
    summary: `Invited ${email} to ${property.nickname as string}`,
  });

  revalidatePath(`/properties/${propertyId}`);
}

export async function updatePropertyAccessAction(formData: FormData) {
  const supabase = await createClient();
  const propertyId = text(formData, "propertyId", true) as string;
  const accessId = text(formData, "accessId", true) as string;

  const { error } = await supabase
    .from("property_access")
    .update({
      can_edit: checked(formData, "canEdit"),
      can_view_tenant_contact: checked(formData, "canViewTenantContact"),
    })
    .eq("id", accessId)
    .eq("property_id", propertyId);
  if (error) throw new Error(`Failed to update Co-owner access: ${error.message}`);

  revalidatePath(`/properties/${propertyId}`);
}

export async function revokePropertyAccessAction(formData: FormData) {
  const supabase = await createClient();
  const onboarding = await ensureUserProfileAndDefaultPortfolio(supabase);
  const propertyId = text(formData, "propertyId", true) as string;
  const accessId = text(formData, "accessId", true) as string;

  const { error } = await supabase
    .from("property_access")
    .update({
      revoked_at: new Date().toISOString(),
      revoked_by: onboarding.profileId,
    })
    .eq("id", accessId)
    .eq("property_id", propertyId);
  if (error) throw new Error(`Failed to revoke Co-owner access: ${error.message}`);

  revalidatePath(`/properties/${propertyId}`);
}
