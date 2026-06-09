"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { ensureUserProfileAndDefaultPortfolio } from "@/server/services/onboarding";
import { recordAuditEvent } from "@/server/services/audit-events";

type PropertyStatus = "occupied" | "vacant";

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

function readPropertyStatus(formData: FormData): PropertyStatus {
  const status = String(formData.get("status") ?? "vacant");

  if (status === "occupied") {
    return "occupied";
  }

  return "vacant";
}

export async function createPropertyAction(formData: FormData) {
  const supabase = await createClient();
  const onboarding = await ensureUserProfileAndDefaultPortfolio(supabase);

  const { data, error } = await supabase
    .from("properties")
    .insert({
      address_line1: readOptionalText(formData, "addressLine1"),
      city: readOptionalText(formData, "city"),
      created_by: onboarding.profileId,
      nickname: readRequiredText(formData, "nickname"),
      notes: readOptionalText(formData, "notes"),
      portfolio_id: onboarding.portfolioId,
      postcode: readOptionalText(formData, "postcode"),
      state: readOptionalText(formData, "state"),
      status: readPropertyStatus(formData),
      type: readRequiredText(formData, "type"),
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(`Failed to create property: ${error.message}`);
  }

  await recordAuditEvent(supabase, {
    action: "create",
    actorId: onboarding.profileId,
    entityId: data.id as string,
    entityType: "property",
    portfolioId: onboarding.portfolioId,
    propertyId: data.id as string,
    summary: `Created property ${readRequiredText(formData, "nickname")}`,
  });

  redirect(`/properties/${data.id}`);
}

export async function updatePropertyAction(formData: FormData) {
  const supabase = await createClient();
  const onboarding = await ensureUserProfileAndDefaultPortfolio(supabase);
  const propertyId = readRequiredText(formData, "propertyId");
  const nickname = readRequiredText(formData, "nickname");

  const { data: existingProperty, error: existingError } = await supabase
    .from("properties")
    .select("portfolio_id")
    .eq("id", propertyId)
    .single();

  if (existingError) {
    throw new Error(`Failed to load property before update: ${existingError.message}`);
  }

  const { error } = await supabase
    .from("properties")
    .update({
      address_line1: readOptionalText(formData, "addressLine1"),
      city: readOptionalText(formData, "city"),
      nickname,
      notes: readOptionalText(formData, "notes"),
      postcode: readOptionalText(formData, "postcode"),
      state: readOptionalText(formData, "state"),
      status: readPropertyStatus(formData),
      type: readRequiredText(formData, "type"),
    })
    .eq("id", propertyId);

  if (error) {
    throw new Error(`Failed to update property: ${error.message}`);
  }

  await recordAuditEvent(supabase, {
    action: "update",
    actorId: onboarding.profileId,
    entityId: propertyId,
    entityType: "property",
    portfolioId: existingProperty.portfolio_id as string,
    propertyId,
    summary: `Updated property ${nickname}`,
  });
}

export async function archivePropertyAction(formData: FormData) {
  const supabase = await createClient();
  const onboarding = await ensureUserProfileAndDefaultPortfolio(supabase);
  const propertyId = readRequiredText(formData, "propertyId");

  const { data: existingProperty, error: existingError } = await supabase
    .from("properties")
    .select("portfolio_id,nickname")
    .eq("id", propertyId)
    .single();

  if (existingError) {
    throw new Error(`Failed to load property before archive: ${existingError.message}`);
  }

  const { error } = await supabase
    .from("properties")
    .update({
      archived_at: new Date().toISOString(),
      archived_by: onboarding.profileId,
      status: "archived",
    })
    .eq("id", propertyId);

  if (error) {
    throw new Error(`Failed to archive property: ${error.message}`);
  }

  await recordAuditEvent(supabase, {
    action: "archive",
    actorId: onboarding.profileId,
    entityId: propertyId,
    entityType: "property",
    portfolioId: existingProperty.portfolio_id as string,
    propertyId,
    summary: `Archived property ${existingProperty.nickname as string}`,
  });

  redirect("/properties");
}
