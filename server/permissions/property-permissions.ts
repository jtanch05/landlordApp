import type { SupabaseClient } from "@supabase/supabase-js";

import { PermissionCheckError } from "./errors";

type PermissionRpcName =
  | "can_edit_property"
  | "can_read_portfolio"
  | "can_read_property"
  | "can_view_private_attachment"
  | "is_portfolio_host";

type PermissionRpcArgs =
  | { target_attachment_id: string }
  | { target_portfolio_id: string }
  | { target_property_id: string };

async function callBooleanPermissionRpc(
  supabase: SupabaseClient,
  checkName: PermissionRpcName,
  args: PermissionRpcArgs,
) {
  const { data, error } = await supabase.rpc(checkName, args);

  if (error) {
    throw new PermissionCheckError(checkName, error.message);
  }

  return data === true;
}

export function isPortfolioHost(
  supabase: SupabaseClient,
  portfolioId: string,
) {
  return callBooleanPermissionRpc(supabase, "is_portfolio_host", {
    target_portfolio_id: portfolioId,
  });
}

export function canReadPortfolio(
  supabase: SupabaseClient,
  portfolioId: string,
) {
  return callBooleanPermissionRpc(supabase, "can_read_portfolio", {
    target_portfolio_id: portfolioId,
  });
}

export function canReadProperty(
  supabase: SupabaseClient,
  propertyId: string,
) {
  return callBooleanPermissionRpc(supabase, "can_read_property", {
    target_property_id: propertyId,
  });
}

export function canEditProperty(
  supabase: SupabaseClient,
  propertyId: string,
) {
  return callBooleanPermissionRpc(supabase, "can_edit_property", {
    target_property_id: propertyId,
  });
}

export function canViewPrivateAttachment(
  supabase: SupabaseClient,
  attachmentId: string,
) {
  return callBooleanPermissionRpc(supabase, "can_view_private_attachment", {
    target_attachment_id: attachmentId,
  });
}
