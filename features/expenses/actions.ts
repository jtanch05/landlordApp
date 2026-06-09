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

function bool(formData: FormData, name: string) {
  return formData.get(name) === "on";
}

async function propertyPortfolioId(propertyId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("properties")
    .select("portfolio_id")
    .eq("id", propertyId)
    .single();
  if (error) throw new Error(`Failed to load property: ${error.message}`);
  return data.portfolio_id as string;
}

export async function createExpenseCategoryAction(formData: FormData) {
  const supabase = await createClient();
  const onboarding = await ensureUserProfileAndDefaultPortfolio(supabase);
  const name = text(formData, "name", true) as string;

  const { error } = await supabase.from("expense_categories").insert({
    default_tax_deductible: bool(formData, "defaultTaxDeductible"),
    name,
    portfolio_id: onboarding.portfolioId,
  });

  if (error) throw new Error(`Failed to create expense category: ${error.message}`);
  revalidatePath("/settings");
  revalidatePath("/properties");
}

export async function createExpenseAction(formData: FormData) {
  const supabase = await createClient();
  const onboarding = await ensureUserProfileAndDefaultPortfolio(supabase);
  const propertyId = text(formData, "propertyId", true) as string;
  const portfolioId = await propertyPortfolioId(propertyId);
  const description = text(formData, "description", true) as string;
  const status = formData.get("status") === "paid" ? "paid" : "unpaid";

  const { data, error } = await supabase
    .from("expenses")
    .insert({
      amount_cents: amountCents(formData, "amount"),
      category_id: text(formData, "categoryId", true),
      created_by: onboarding.profileId,
      description,
      expense_date: text(formData, "expenseDate", true),
      notes: text(formData, "notes"),
      payment_date: text(formData, "paymentDate"),
      portfolio_id: portfolioId,
      property_id: propertyId,
      status,
      tax_deductible: bool(formData, "taxDeductible"),
    })
    .select("id")
    .single();

  if (error) throw new Error(`Failed to create expense: ${error.message}`);

  await recordAuditEvent(supabase, {
    action: "create",
    actorId: onboarding.profileId,
    entityId: data.id as string,
    entityType: "expense",
    portfolioId,
    propertyId,
    summary: `Created expense ${description}`,
  });

  revalidatePath(`/properties/${propertyId}`);
}

export async function createRecurringExpenseAction(formData: FormData) {
  const supabase = await createClient();
  const onboarding = await ensureUserProfileAndDefaultPortfolio(supabase);
  const propertyId = text(formData, "propertyId", true) as string;
  const portfolioId = await propertyPortfolioId(propertyId);
  const description = text(formData, "description", true) as string;

  const { data, error } = await supabase
    .from("recurring_expenses")
    .insert({
      amount_cents: amountCents(formData, "amount"),
      category_id: text(formData, "categoryId", true),
      created_by: onboarding.profileId,
      day_of_month: Number(formData.get("dayOfMonth") ?? 1),
      description,
      portfolio_id: portfolioId,
      property_id: propertyId,
      starts_on: text(formData, "startsOn", true),
      tax_deductible: bool(formData, "taxDeductible"),
    })
    .select("id")
    .single();

  if (error) throw new Error(`Failed to create recurring expense: ${error.message}`);

  await recordAuditEvent(supabase, {
    action: "create",
    actorId: onboarding.profileId,
    entityId: data.id as string,
    entityType: "recurring_expense",
    portfolioId,
    propertyId,
    summary: `Created recurring expense ${description}`,
  });

  revalidatePath(`/properties/${propertyId}`);
}
