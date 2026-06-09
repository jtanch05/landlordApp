"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { ensureUserProfileAndDefaultPortfolio } from "@/server/services/onboarding";

export async function reconcileRentRemindersAction() {
  const supabase = await createClient();
  const onboarding = await ensureUserProfileAndDefaultPortfolio(supabase);
  const today = new Date();
  const horizon = new Date(today.getTime());
  horizon.setUTCDate(horizon.getUTCDate() + 30);

  const { data: rentRecords, error } = await supabase
    .from("rent_records")
    .select("id,portfolio_id,property_id,month,due_date,amount_due_cents,status")
    .eq("portfolio_id", onboarding.portfolioId)
    .in("status", ["unpaid", "partial"])
    .lte("due_date", horizon.toISOString().slice(0, 10))
    .is("archived_at", null);

  if (error) {
    throw new Error(`Failed to load rent reminders: ${error.message}`);
  }

  if (!rentRecords?.length) {
    revalidatePath("/dashboard");
    return;
  }

  const reminders = rentRecords.map((record) => ({
    description: `Rent ${record.status} for ${record.month}.`,
    due_date: record.due_date,
    portfolio_id: record.portfolio_id,
    property_id: record.property_id,
    source_id: record.id,
    source_type: "rent_record",
    status: "active",
    title: `Rent due ${record.month}`,
  }));

  const { error: upsertError } = await supabase
    .from("reminders")
    .upsert(reminders, {
      onConflict: "source_type,source_id,title,due_date",
    });

  if (upsertError) {
    throw new Error(`Failed to reconcile reminders: ${upsertError.message}`);
  }

  revalidatePath("/dashboard");
  revalidatePath("/activity");
}

export async function dismissReminderAction(formData: FormData) {
  const reminderId = String(formData.get("reminderId") ?? "").trim();
  if (!reminderId) throw new Error("reminderId is required.");

  const supabase = await createClient();
  const onboarding = await ensureUserProfileAndDefaultPortfolio(supabase);

  const { error } = await supabase
    .from("reminders")
    .update({
      dismissed_at: new Date().toISOString(),
      dismissed_by: onboarding.profileId,
      status: "dismissed",
    })
    .eq("id", reminderId);

  if (error) {
    throw new Error(`Failed to dismiss reminder: ${error.message}`);
  }

  revalidatePath("/dashboard");
}
