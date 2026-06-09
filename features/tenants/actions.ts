"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { recordAuditEvent } from "@/server/services/audit-events";
import { ensureUserProfileAndDefaultPortfolio } from "@/server/services/onboarding";

function readRequiredText(formData: FormData, name: string) {
  const value = String(formData.get(name) ?? "").trim();

  if (!value) {
    throw new Error(`${name} is required.`);
  }

  return value;
}

function readOptionalText(formData: FormData, name: string) {
  const value = String(formData.get(name) ?? "").trim();
  return value || null;
}

export async function createTenantAction(formData: FormData) {
  const supabase = await createClient();
  const onboarding = await ensureUserProfileAndDefaultPortfolio(supabase);
  const propertyId = readRequiredText(formData, "propertyId");
  const tenantName = readRequiredText(formData, "name");

  const { data: property, error: propertyError } = await supabase
    .from("properties")
    .select("portfolio_id")
    .eq("id", propertyId)
    .single();

  if (propertyError) {
    throw new Error(`Failed to load property: ${propertyError.message}`);
  }

  const portfolioId = property.portfolio_id as string;

  const { data: tenant, error } = await supabase
    .from("tenants")
    .insert({
      created_by: onboarding.profileId,
      email: readOptionalText(formData, "email"),
      name: tenantName,
      notes: readOptionalText(formData, "notes"),
      phone: readOptionalText(formData, "phone"),
      portfolio_id: portfolioId,
      property_id: propertyId,
      status: "active",
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(`Failed to create tenant: ${error.message}`);
  }

  await recordAuditEvent(supabase, {
    action: "create",
    actorId: onboarding.profileId,
    entityId: tenant.id as string,
    entityType: "tenant",
    portfolioId,
    propertyId,
    summary: `Created tenant ${tenantName}`,
  });

  revalidatePath(`/properties/${propertyId}`);
}
