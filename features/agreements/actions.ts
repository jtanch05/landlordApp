"use server";

import { revalidatePath } from "next/cache";

import {
  type AgreementType,
  calculateAgreementEndDate,
  calculateRentStatus,
  generateRentSchedule,
} from "@/features/agreements/domain";
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

function readAgreementType(formData: FormData): AgreementType {
  const type = String(formData.get("type") ?? "");

  if (
    type === "custom" ||
    type === "one_year" ||
    type === "six_months" ||
    type === "three_years" ||
    type === "two_years"
  ) {
    return type;
  }

  throw new Error("Invalid agreement type.");
}

function readPositiveInteger(formData: FormData, name: string) {
  const value = Number(formData.get(name));

  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${name} must be a positive whole number.`);
  }

  return value;
}

function readRinggitAsCents(formData: FormData, name: string) {
  const value = Number(formData.get(name));

  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${name} must be a valid amount.`);
  }

  return Math.round(value * 100);
}

export async function createAgreementAction(formData: FormData) {
  const supabase = await createClient();
  const onboarding = await ensureUserProfileAndDefaultPortfolio(supabase);
  const propertyId = readRequiredText(formData, "propertyId");
  const tenantId = readRequiredText(formData, "tenantId");
  const type = readAgreementType(formData);
  const startDate = readRequiredText(formData, "startDate");
  const rentDueDay = readPositiveInteger(formData, "rentDueDay");
  const rentAmountCents = readRinggitAsCents(formData, "rentAmount");
  const endDate = calculateAgreementEndDate({
    customEndDate: readOptionalText(formData, "customEndDate") ?? undefined,
    startDate,
    type,
  });

  const { data: property, error: propertyError } = await supabase
    .from("properties")
    .select("portfolio_id")
    .eq("id", propertyId)
    .single();

  if (propertyError) {
    throw new Error(`Failed to load property: ${propertyError.message}`);
  }

  const portfolioId = property.portfolio_id as string;

  const { data: agreement, error: agreementError } = await supabase
    .from("agreements")
    .insert({
      created_by: onboarding.profileId,
      end_date: endDate,
      notes: readOptionalText(formData, "notes"),
      portfolio_id: portfolioId,
      property_id: propertyId,
      renewal_option: readOptionalText(formData, "renewalOption"),
      rent_amount_cents: rentAmountCents,
      rent_due_day: rentDueDay,
      start_date: startDate,
      tenant_id: tenantId,
      type,
    })
    .select("id")
    .single();

  if (agreementError) {
    throw new Error(`Failed to create agreement: ${agreementError.message}`);
  }

  const agreementId = agreement.id as string;
  const rentRecords = generateRentSchedule({
    amountDueCents: rentAmountCents,
    dueDay: rentDueDay,
    endDate,
    startDate,
  }).map((record) => ({
    agreement_id: agreementId,
    amount_due_cents: record.amountDueCents,
    created_by: onboarding.profileId,
    due_date: record.dueDate,
    month: record.month,
    portfolio_id: portfolioId,
    property_id: propertyId,
    status: "unpaid",
    tenant_id: tenantId,
  }));

  const { error: rentRecordsError } = await supabase
    .from("rent_records")
    .insert(rentRecords);

  if (rentRecordsError) {
    throw new Error(`Failed to generate rent records: ${rentRecordsError.message}`);
  }

  await recordAuditEvent(supabase, {
    action: "system_generate",
    actorId: onboarding.profileId,
    entityId: agreementId,
    entityType: "agreement",
    metadata: { rentRecordCount: rentRecords.length },
    portfolioId,
    propertyId,
    summary: `Created agreement and generated ${rentRecords.length} rent records`,
  });

  revalidatePath(`/properties/${propertyId}`);
}

export async function updateRentRecordPaymentAction(formData: FormData) {
  const supabase = await createClient();
  const onboarding = await ensureUserProfileAndDefaultPortfolio(supabase);
  const propertyId = readRequiredText(formData, "propertyId");
  const rentRecordId = readRequiredText(formData, "rentRecordId");
  const amountPaidCents = readRinggitAsCents(formData, "amountPaid");

  const { data: rentRecord, error: rentRecordError } = await supabase
    .from("rent_records")
    .select("portfolio_id,amount_due_cents,month")
    .eq("id", rentRecordId)
    .eq("property_id", propertyId)
    .single();

  if (rentRecordError) {
    throw new Error(`Failed to load rent record: ${rentRecordError.message}`);
  }

  const status = calculateRentStatus(
    amountPaidCents,
    rentRecord.amount_due_cents as number,
  );

  const { error } = await supabase
    .from("rent_records")
    .update({
      amount_paid_cents: amountPaidCents,
      notes: readOptionalText(formData, "paymentNotes"),
      payment_date: readOptionalText(formData, "paymentDate"),
      payment_method: readOptionalText(formData, "paymentMethod"),
      status,
    })
    .eq("id", rentRecordId)
    .eq("property_id", propertyId);

  if (error) {
    throw new Error(`Failed to update rent payment: ${error.message}`);
  }

  await recordAuditEvent(supabase, {
    action: "update",
    actorId: onboarding.profileId,
    entityId: rentRecordId,
    entityType: "rent_record",
    portfolioId: rentRecord.portfolio_id as string,
    propertyId,
    summary: `Updated rent payment for ${rentRecord.month as string}`,
  });

  revalidatePath(`/properties/${propertyId}`);
}

export async function createManualRentRecordAction(formData: FormData) {
  const supabase = await createClient();
  const onboarding = await ensureUserProfileAndDefaultPortfolio(supabase);
  const propertyId = readRequiredText(formData, "propertyId");
  const month = readRequiredText(formData, "month");
  const dueDate = readRequiredText(formData, "dueDate");
  const amountDueCents = readRinggitAsCents(formData, "amountDue");

  const { data: property, error: propertyError } = await supabase
    .from("properties")
    .select("portfolio_id")
    .eq("id", propertyId)
    .single();

  if (propertyError) {
    throw new Error(`Failed to load property: ${propertyError.message}`);
  }

  const { data: activeAgreement, error: agreementError } = await supabase
    .from("agreements")
    .select("id")
    .eq("property_id", propertyId)
    .is("archived_at", null)
    .lte("start_date", dueDate)
    .gte("end_date", dueDate)
    .limit(1)
    .maybeSingle();

  if (agreementError) {
    throw new Error(`Failed to check active agreements: ${agreementError.message}`);
  }

  if (activeAgreement) {
    throw new Error("Manual rent records are only allowed without an active agreement.");
  }

  const portfolioId = property.portfolio_id as string;

  const { data: rentRecord, error } = await supabase
    .from("rent_records")
    .insert({
      amount_due_cents: amountDueCents,
      created_by: onboarding.profileId,
      due_date: dueDate,
      month,
      notes: readOptionalText(formData, "notes"),
      portfolio_id: portfolioId,
      property_id: propertyId,
      status: "unpaid",
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(`Failed to create manual rent record: ${error.message}`);
  }

  await recordAuditEvent(supabase, {
    action: "create",
    actorId: onboarding.profileId,
    entityId: rentRecord.id as string,
    entityType: "rent_record",
    portfolioId,
    propertyId,
    summary: `Created manual rent record for ${month}`,
  });

  revalidatePath(`/properties/${propertyId}`);
}
