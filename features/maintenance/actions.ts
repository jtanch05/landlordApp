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

function optionalAmountCents(formData: FormData, name: string) {
  const raw = text(formData, name);
  if (!raw) return null;
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0) throw new Error(`${name} must be valid.`);
  return Math.round(value * 100);
}

export async function createMaintenanceIssueAction(formData: FormData) {
  const supabase = await createClient();
  const onboarding = await ensureUserProfileAndDefaultPortfolio(supabase);
  const propertyId = text(formData, "propertyId", true) as string;
  const description = text(formData, "description", true) as string;

  const { data: property, error: propertyError } = await supabase
    .from("properties")
    .select("portfolio_id")
    .eq("id", propertyId)
    .single();
  if (propertyError) throw new Error(`Failed to load property: ${propertyError.message}`);

  const portfolioId = property.portfolio_id as string;
  const costCents = optionalAmountCents(formData, "cost");
  const expenseCategoryId = text(formData, "expenseCategoryId");

  const { data: issue, error } = await supabase
    .from("maintenance_issues")
    .insert({
      cost_cents: costCents,
      created_by: onboarding.profileId,
      description,
      issue_type: text(formData, "issueType"),
      notes: text(formData, "notes"),
      portfolio_id: portfolioId,
      property_id: propertyId,
      reported_date: text(formData, "reportedDate", true),
      status: "open",
      vendor_id: text(formData, "vendorId"),
    })
    .select("id")
    .single();
  if (error) throw new Error(`Failed to create maintenance issue: ${error.message}`);

  if (costCents !== null && expenseCategoryId) {
    const { data: expense, error: expenseError } = await supabase
      .from("expenses")
      .insert({
        amount_cents: costCents,
        category_id: expenseCategoryId,
        created_by: onboarding.profileId,
        description: `Maintenance: ${description}`,
        expense_date: text(formData, "reportedDate", true),
        linked_maintenance_issue_id: issue.id,
        portfolio_id: portfolioId,
        property_id: propertyId,
        status: "unpaid",
        tax_deductible: false,
      })
      .select("id")
      .single();

    if (expenseError) {
      throw new Error(`Failed to create linked maintenance expense: ${expenseError.message}`);
    }

    const { error: linkError } = await supabase
      .from("maintenance_issues")
      .update({ linked_expense_id: expense.id })
      .eq("id", issue.id);

    if (linkError) {
      throw new Error(`Failed to link maintenance expense: ${linkError.message}`);
    }
  }

  await recordAuditEvent(supabase, {
    action: "create",
    actorId: onboarding.profileId,
    entityId: issue.id as string,
    entityType: "maintenance_issue",
    portfolioId,
    propertyId,
    summary: `Created maintenance issue ${description}`,
  });

  revalidatePath(`/properties/${propertyId}`);
}
