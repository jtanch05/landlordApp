"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { ensureUserProfileAndDefaultPortfolio } from "@/server/services/onboarding";

function text(formData: FormData, name: string, required = false) {
  const value = String(formData.get(name) ?? "").trim();
  if (required && !value) throw new Error(`${name} is required.`);
  return value || null;
}

export async function createVendorAction(formData: FormData) {
  const supabase = await createClient();
  const onboarding = await ensureUserProfileAndDefaultPortfolio(supabase);

  const ratingRaw = String(formData.get("rating") ?? "").trim();
  const ratingNum = ratingRaw ? Number(ratingRaw) : null;
  const rating =
    ratingNum !== null && Number.isInteger(ratingNum) && ratingNum >= 1 && ratingNum <= 5
      ? ratingNum
      : null;

  const { error } = await supabase.from("vendors").insert({
    created_by: onboarding.profileId,
    email: text(formData, "email"),
    last_used_date: text(formData, "lastUsedDate"),
    name: text(formData, "name", true),
    notes: text(formData, "notes"),
    phone: text(formData, "phone"),
    portfolio_id: onboarding.portfolioId,
    rating,
    service_type: text(formData, "serviceType"),
  });

  if (error) throw new Error(`Failed to create vendor: ${error.message}`);
  revalidatePath("/vendors");
}
