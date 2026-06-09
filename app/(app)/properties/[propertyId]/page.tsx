import { notFound, redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";

import {
  archivePropertyAction,
  updatePropertyAction,
} from "@/features/properties/actions";
import {
  createAgreementAction,
  createManualRentRecordAction,
  updateRentRecordPaymentAction,
} from "@/features/agreements/actions";
import { createDepositAction, updateDepositStatusAction } from "@/features/deposits/actions";
import {
  createExpenseAction,
  createRecurringExpenseAction,
} from "@/features/expenses/actions";
import { createMaintenanceIssueAction } from "@/features/maintenance/actions";
import {
  inviteCoOwnerAction,
  revokePropertyAccessAction,
  updatePropertyAccessAction,
} from "@/features/sharing/actions";
import { createTenantAction } from "@/features/tenants/actions";
import { createClient } from "@/lib/supabase/server";
import { formatMyr } from "@/lib/utils/currency";

export const dynamic = "force-dynamic";

type PropertyWorkspacePageProps = {
  params: Promise<{
    propertyId: string;
  }>;
};

type PropertyDetail = {
  address_line1: string | null;
  city: string | null;
  id: string;
  nickname: string;
  notes: string | null;
  postcode: string | null;
  state: string | null;
  status: string;
  type: string;
};

type ActivityEvent = {
  action: string;
  created_at: string;
  id: string;
  summary: string;
};

type AttachmentSummary = {
  created_at: string;
  file_name: string;
  id: string;
  is_private: boolean;
  size_bytes: number | null;
  target_type: string;
};

type TenantSummary = {
  email: string | null;
  id: string;
  name: string;
  phone: string | null;
  status: string;
};

type AgreementSummary = {
  end_date: string;
  id: string;
  rent_amount_cents: number;
  start_date: string;
  type: string;
};

type RentRecordSummary = {
  amount_due_cents: number;
  amount_paid_cents: number;
  due_date: string;
  id: string;
  month: string;
  status: string;
};

type ExpenseCategorySummary = {
  default_tax_deductible: boolean;
  id: string;
  name: string;
};

type ExpenseSummary = {
  amount_cents: number;
  description: string;
  expense_date: string;
  id: string;
  status: string;
};

type VendorSummary = {
  id: string;
  name: string;
  service_type: string | null;
};

type MaintenanceIssueSummary = {
  cost_cents: number | null;
  description: string;
  id: string;
  reported_date: string;
  status: string;
};

type DepositSummary = {
  amount_cents: number;
  id: string;
  label: string;
  refund_date: string | null;
  status: string;
};

type PropertyAccessSummary = {
  can_edit: boolean;
  can_view_tenant_contact: boolean;
  created_at: string;
  id: string;
  user_id: string;
};

type InvitationSummary = {
  can_edit: boolean;
  email: string;
  expires_at: string;
  id: string;
  status: string;
};

const workspaceTabs = [
  "Overview",
  "Tenants",
  "Agreements",
  "Rent",
  "Expenses",
  "Maintenance",
  "Deposits",
  "Files",
  "Activity",
];

async function getProperty(supabase: SupabaseClient, propertyId: string) {
  const { data, error } = await supabase
    .from("properties")
    .select("id,nickname,type,status,address_line1,city,state,postcode,notes")
    .eq("id", propertyId)
    .is("archived_at", null)
    .single();

  if (error) {
    notFound();
  }

  return data as PropertyDetail;
}

async function getPropertyActivity(supabase: SupabaseClient, propertyId: string) {
  const { data, error } = await supabase
    .from("audit_events")
    .select("id,action,summary,created_at")
    .eq("property_id", propertyId)
    .order("created_at", { ascending: false })
    .limit(8);

  if (error) {
    throw new Error(`Failed to load property activity: ${error.message}`);
  }

  return data as ActivityEvent[];
}

async function getPropertyAttachments(supabase: SupabaseClient, propertyId: string) {
  const { data, error } = await supabase
    .from("attachments")
    .select("id,file_name,target_type,size_bytes,is_private,created_at")
    .eq("property_id", propertyId)
    .is("archived_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load property files: ${error.message}`);
  }

  return data as AttachmentSummary[];
}

async function getTenants(supabase: SupabaseClient, propertyId: string) {
  const { data, error } = await supabase
    .from("tenants")
    .select("id,name,phone,email,status")
    .eq("property_id", propertyId)
    .is("archived_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load tenants: ${error.message}`);
  }

  return data as TenantSummary[];
}

async function getAgreements(supabase: SupabaseClient, propertyId: string) {
  const { data, error } = await supabase
    .from("agreements")
    .select("id,type,start_date,end_date,rent_amount_cents")
    .eq("property_id", propertyId)
    .is("archived_at", null)
    .order("start_date", { ascending: false });

  if (error) {
    throw new Error(`Failed to load agreements: ${error.message}`);
  }

  return data as AgreementSummary[];
}

async function getRentRecords(supabase: SupabaseClient, propertyId: string) {
  const { data, error } = await supabase
    .from("rent_records")
    .select("id,month,due_date,amount_due_cents,amount_paid_cents,status")
    .eq("property_id", propertyId)
    .is("archived_at", null)
    .order("due_date", { ascending: true })
    .limit(24);

  if (error) {
    throw new Error(`Failed to load rent records: ${error.message}`);
  }

  return data as RentRecordSummary[];
}

async function getExpenseCategories(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("expense_categories")
    .select("id,name,default_tax_deductible")
    .is("archived_at", null)
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`Failed to load expense categories: ${error.message}`);
  }

  return data as ExpenseCategorySummary[];
}

async function getExpenses(supabase: SupabaseClient, propertyId: string) {
  const { data, error } = await supabase
    .from("expenses")
    .select("id,description,amount_cents,status,expense_date")
    .eq("property_id", propertyId)
    .is("archived_at", null)
    .order("expense_date", { ascending: false })
    .limit(12);

  if (error) {
    throw new Error(`Failed to load expenses: ${error.message}`);
  }

  return data as ExpenseSummary[];
}

async function getVendors(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("vendors")
    .select("id,name,service_type")
    .is("archived_at", null)
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`Failed to load vendors: ${error.message}`);
  }

  return data as VendorSummary[];
}

async function getMaintenanceIssues(supabase: SupabaseClient, propertyId: string) {
  const { data, error } = await supabase
    .from("maintenance_issues")
    .select("id,description,reported_date,status,cost_cents")
    .eq("property_id", propertyId)
    .is("archived_at", null)
    .order("reported_date", { ascending: false })
    .limit(12);

  if (error) {
    throw new Error(`Failed to load maintenance issues: ${error.message}`);
  }

  return data as MaintenanceIssueSummary[];
}

async function getDeposits(supabase: SupabaseClient, propertyId: string) {
  const { data, error } = await supabase
    .from("deposits")
    .select("id,label,amount_cents,status,refund_date")
    .eq("property_id", propertyId)
    .is("archived_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load deposits: ${error.message}`);
  }

  return data as DepositSummary[];
}

async function getPropertyAccess(supabase: SupabaseClient, propertyId: string) {
  const { data, error } = await supabase
    .from("property_access")
    .select("id,user_id,can_edit,can_view_tenant_contact,created_at")
    .eq("property_id", propertyId)
    .is("revoked_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load property access: ${error.message}`);
  }

  return data as PropertyAccessSummary[];
}

async function getInvitations(supabase: SupabaseClient, propertyId: string) {
  const { data, error } = await supabase
    .from("invitations")
    .select("id,email,can_edit,status,expires_at")
    .eq("property_id", propertyId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load invitations: ${error.message}`);
  }

  return data as InvitationSummary[];
}

export default async function PropertyWorkspacePage({
  params,
}: PropertyWorkspacePageProps) {
  const { propertyId } = await params;
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    redirect("/login");
  }

  const [
    property,
    activityEvents,
    attachments,
    tenants,
    agreements,
    rentRecords,
    expenseCategories,
    expenses,
    vendors,
    maintenanceIssues,
    deposits,
    propertyAccess,
    invitations,
  ] = await Promise.all([
    getProperty(supabase, propertyId),
    getPropertyActivity(supabase, propertyId),
    getPropertyAttachments(supabase, propertyId),
    getTenants(supabase, propertyId),
    getAgreements(supabase, propertyId),
    getRentRecords(supabase, propertyId),
    getExpenseCategories(supabase),
    getExpenses(supabase, propertyId),
    getVendors(supabase),
    getMaintenanceIssues(supabase, propertyId),
    getDeposits(supabase, propertyId),
    getPropertyAccess(supabase, propertyId),
    getInvitations(supabase, propertyId),
  ]);
  const isVacant = property.status === "vacant";

  return (
    <div className="space-y-8">
      <header className="space-y-5 border-b border-[#d8decf] pb-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#4d6650]">
              Property workspace
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-[#163300]">
              {property.nickname}
            </h1>
            <p className="mt-2 text-sm text-[#4d6650]">
              {property.type}
              {property.city ? ` in ${property.city}` : ""}
            </p>
          </div>
          <span className="w-fit rounded-full bg-[#f2f5ee] px-3 py-1 text-xs font-semibold capitalize text-[#2f4a34]">
            {property.status}
          </span>
        </div>

        <nav className="flex gap-2 overflow-x-auto pb-1">
          {workspaceTabs.map((tab, index) => (
            <span
              className={
                index === 0
                  ? "rounded-full bg-[#163300] px-3 py-2 text-xs font-semibold text-white"
                  : "rounded-full bg-[#f2f5ee] px-3 py-2 text-xs font-semibold text-[#4d6650]"
              }
              key={tab}
            >
              {tab}
            </span>
          ))}
        </nav>
      </header>

      <section className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <div className="rounded-[8px] border border-[#d8decf] bg-white p-5">
            <h2 className="text-lg font-semibold text-[#163300]">Overview</h2>
            <dl className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-[#7a8577]">
                  Address
                </dt>
                <dd className="mt-1 text-sm text-[#2f4a34]">
                  {[property.address_line1, property.city, property.state, property.postcode]
                    .filter(Boolean)
                    .join(", ") || "Not added yet"}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-[#7a8577]">
                  Property type
                </dt>
                <dd className="mt-1 text-sm text-[#2f4a34]">{property.type}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-[#7a8577]">
                  Notes
                </dt>
                <dd className="mt-1 text-sm leading-6 text-[#2f4a34]">
                  {property.notes || "No notes yet"}
                </dd>
              </div>
            </dl>
          </div>

          <form
            action={updatePropertyAction}
            className="rounded-[8px] border border-[#d8decf] bg-white p-5"
          >
            <input name="propertyId" type="hidden" value={property.id} />
            <h2 className="text-lg font-semibold text-[#163300]">
              Edit property
            </h2>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-medium text-[#2f4a34]">
                Nickname
                <input
                  className="mt-2 w-full rounded-[6px] border border-[#cbd5c1] px-3 py-2 text-sm text-[#163300] outline-none focus:border-[#163300] focus:ring-2 focus:ring-[#9fe870]"
                  defaultValue={property.nickname}
                  name="nickname"
                  required
                />
              </label>

              <label className="block text-sm font-medium text-[#2f4a34]">
                Property type
                <input
                  className="mt-2 w-full rounded-[6px] border border-[#cbd5c1] px-3 py-2 text-sm text-[#163300] outline-none focus:border-[#163300] focus:ring-2 focus:ring-[#9fe870]"
                  defaultValue={property.type}
                  name="type"
                  required
                />
              </label>

              <label className="block text-sm font-medium text-[#2f4a34]">
                Status
                <select
                  className="mt-2 w-full rounded-[6px] border border-[#cbd5c1] bg-white px-3 py-2 text-sm text-[#163300] outline-none focus:border-[#163300] focus:ring-2 focus:ring-[#9fe870]"
                  defaultValue={property.status === "occupied" ? "occupied" : "vacant"}
                  name="status"
                >
                  <option value="vacant">Vacant</option>
                  <option value="occupied">Occupied</option>
                </select>
              </label>

              <label className="block text-sm font-medium text-[#2f4a34]">
                Address
                <input
                  className="mt-2 w-full rounded-[6px] border border-[#cbd5c1] px-3 py-2 text-sm text-[#163300] outline-none focus:border-[#163300] focus:ring-2 focus:ring-[#9fe870]"
                  defaultValue={property.address_line1 ?? ""}
                  name="addressLine1"
                />
              </label>

              <label className="block text-sm font-medium text-[#2f4a34]">
                City
                <input
                  className="mt-2 w-full rounded-[6px] border border-[#cbd5c1] px-3 py-2 text-sm text-[#163300] outline-none focus:border-[#163300] focus:ring-2 focus:ring-[#9fe870]"
                  defaultValue={property.city ?? ""}
                  name="city"
                />
              </label>

              <label className="block text-sm font-medium text-[#2f4a34]">
                Postcode
                <input
                  className="mt-2 w-full rounded-[6px] border border-[#cbd5c1] px-3 py-2 text-sm text-[#163300] outline-none focus:border-[#163300] focus:ring-2 focus:ring-[#9fe870]"
                  defaultValue={property.postcode ?? ""}
                  name="postcode"
                />
              </label>

              <label className="block text-sm font-medium text-[#2f4a34]">
                State
                <input
                  className="mt-2 w-full rounded-[6px] border border-[#cbd5c1] px-3 py-2 text-sm text-[#163300] outline-none focus:border-[#163300] focus:ring-2 focus:ring-[#9fe870]"
                  defaultValue={property.state ?? ""}
                  name="state"
                />
              </label>

              <label className="block text-sm font-medium text-[#2f4a34] sm:col-span-2">
                Notes
                <textarea
                  className="mt-2 min-h-24 w-full rounded-[6px] border border-[#cbd5c1] px-3 py-2 text-sm text-[#163300] outline-none focus:border-[#163300] focus:ring-2 focus:ring-[#9fe870]"
                  defaultValue={property.notes ?? ""}
                  name="notes"
                />
              </label>
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <button
                className="rounded-[6px] bg-[#9fe870] px-4 py-3 text-sm font-semibold text-[#163300] transition hover:bg-[#8bdb5d]"
                type="submit"
              >
                Save changes
              </button>
            </div>
          </form>

          <form
            action={archivePropertyAction}
            className="rounded-[8px] border border-[#ffd6d6] bg-[#fffafa] p-5"
          >
            <input name="propertyId" type="hidden" value={property.id} />
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-[#9c1c1c]">
                  Archive property
                </h2>
                <p className="mt-1 text-sm text-[#754242]">
                  Historical records stay linked and the property leaves the active list.
                </p>
              </div>
              <button
                className="rounded-[6px] border border-[#9c1c1c] px-4 py-3 text-sm font-semibold text-[#9c1c1c] transition hover:bg-[#fff0f0]"
                type="submit"
              >
                Archive
              </button>
            </div>
          </form>

          <section className="rounded-[8px] border border-[#d8decf] bg-white p-5">
            <h2 className="text-lg font-semibold text-[#163300]">Sharing</h2>
            <form
              action={inviteCoOwnerAction}
              className="mt-5 grid gap-3 rounded-[6px] border border-[#d8decf] bg-[#f7f7f2] p-4 sm:grid-cols-[1fr_auto_auto_auto]"
            >
              <input name="propertyId" type="hidden" value={property.id} />
              <label className="block text-sm font-medium text-[#2f4a34]">
                Co-owner email
                <input
                  className="mt-2 w-full rounded-[6px] border border-[#cbd5c1] px-3 py-2 text-sm text-[#163300] outline-none focus:border-[#163300] focus:ring-2 focus:ring-[#9fe870]"
                  name="email"
                  required
                  type="email"
                />
              </label>
              <label className="mt-8 flex items-center gap-2 text-sm font-medium text-[#2f4a34]">
                <input name="canEdit" type="checkbox" />
                Can edit
              </label>
              <label className="mt-8 flex items-center gap-2 text-sm font-medium text-[#2f4a34]">
                <input name="canViewTenantContact" type="checkbox" />
                Tenant contact
              </label>
              <button
                className="mt-7 rounded-[6px] bg-[#9fe870] px-4 py-2 text-sm font-semibold text-[#163300] transition hover:bg-[#8bdb5d]"
                type="submit"
              >
                Invite
              </button>
            </form>

            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              <div>
                <h3 className="text-sm font-semibold text-[#163300]">
                  Active access
                </h3>
                <div className="mt-3 space-y-3">
                  {propertyAccess.length > 0 ? (
                    propertyAccess.map((access) => (
                      <form
                        action={updatePropertyAccessAction}
                        className="rounded-[6px] border border-[#d8decf] px-3 py-3"
                        key={access.id}
                      >
                        <input name="propertyId" type="hidden" value={property.id} />
                        <input name="accessId" type="hidden" value={access.id} />
                        <p className="text-sm font-semibold text-[#2f4a34]">
                          {access.user_id}
                        </p>
                        <div className="mt-3 flex flex-wrap items-center gap-3">
                          <label className="flex items-center gap-2 text-xs font-medium text-[#4d6650]">
                            <input
                              defaultChecked={access.can_edit}
                              name="canEdit"
                              type="checkbox"
                            />
                            Can edit
                          </label>
                          <label className="flex items-center gap-2 text-xs font-medium text-[#4d6650]">
                            <input
                              defaultChecked={access.can_view_tenant_contact}
                              name="canViewTenantContact"
                              type="checkbox"
                            />
                            Tenant contact
                          </label>
                          <button
                            className="rounded-[6px] bg-[#9fe870] px-3 py-2 text-xs font-semibold text-[#163300]"
                            type="submit"
                          >
                            Save
                          </button>
                          <button
                            className="rounded-[6px] border border-[#9c1c1c] px-3 py-2 text-xs font-semibold text-[#9c1c1c]"
                            formAction={revokePropertyAccessAction}
                            type="submit"
                          >
                            Revoke
                          </button>
                        </div>
                      </form>
                    ))
                  ) : (
                    <p className="text-sm leading-6 text-[#4d6650]">
                      No active Co-owner access.
                    </p>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-[#163300]">
                  Invitations
                </h3>
                <div className="mt-3 space-y-3">
                  {invitations.length > 0 ? (
                    invitations.map((invitation) => (
                      <div
                        className="rounded-[6px] border border-[#d8decf] px-3 py-3"
                        key={invitation.id}
                      >
                        <p className="text-sm font-semibold text-[#2f4a34]">
                          {invitation.email}
                        </p>
                        <p className="mt-1 text-xs uppercase tracking-[0.12em] text-[#7a8577]">
                          {invitation.status} · expires{" "}
                          {new Date(invitation.expires_at).toLocaleDateString()}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm leading-6 text-[#4d6650]">
                      No invitations yet.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-[8px] border border-[#d8decf] bg-white p-5">
            <h2 className="text-lg font-semibold text-[#163300]">Tenants</h2>
            <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_320px]">
              <div className="space-y-3">
                {tenants.length > 0 ? (
                  tenants.map((tenant) => (
                    <div
                      className="rounded-[6px] border border-[#d8decf] px-3 py-3"
                      key={tenant.id}
                    >
                      <p className="text-sm font-semibold text-[#2f4a34]">
                        {tenant.name}
                      </p>
                      <p className="mt-1 text-xs uppercase tracking-[0.12em] text-[#7a8577]">
                        {tenant.status}
                      </p>
                      <p className="mt-2 text-sm text-[#4d6650]">
                        {[tenant.phone, tenant.email].filter(Boolean).join(" · ") ||
                          "No contact details"}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm leading-6 text-[#4d6650]">
                    No tenant records yet.
                  </p>
                )}
              </div>

              <form action={createTenantAction} className="space-y-3">
                <input name="propertyId" type="hidden" value={property.id} />
                <label className="block text-sm font-medium text-[#2f4a34]">
                  Tenant name
                  <input
                    className="mt-2 w-full rounded-[6px] border border-[#cbd5c1] px-3 py-2 text-sm text-[#163300] outline-none focus:border-[#163300] focus:ring-2 focus:ring-[#9fe870]"
                    name="name"
                    required
                  />
                </label>
                <label className="block text-sm font-medium text-[#2f4a34]">
                  Phone
                  <input
                    className="mt-2 w-full rounded-[6px] border border-[#cbd5c1] px-3 py-2 text-sm text-[#163300] outline-none focus:border-[#163300] focus:ring-2 focus:ring-[#9fe870]"
                    name="phone"
                  />
                </label>
                <label className="block text-sm font-medium text-[#2f4a34]">
                  Email
                  <input
                    className="mt-2 w-full rounded-[6px] border border-[#cbd5c1] px-3 py-2 text-sm text-[#163300] outline-none focus:border-[#163300] focus:ring-2 focus:ring-[#9fe870]"
                    name="email"
                    type="email"
                  />
                </label>
                <button
                  className="w-full rounded-[6px] bg-[#9fe870] px-4 py-3 text-sm font-semibold text-[#163300] transition hover:bg-[#8bdb5d]"
                  type="submit"
                >
                  Add tenant
                </button>
              </form>
            </div>

            <form
              action={createRecurringExpenseAction}
              className="mt-6 grid gap-3 rounded-[6px] border border-[#d8decf] bg-[#f7f7f2] p-4 sm:grid-cols-5"
            >
              <input name="propertyId" type="hidden" value={property.id} />
              <label className="block text-sm font-medium text-[#2f4a34] sm:col-span-2">
                Recurring description
                <input
                  className="mt-2 w-full rounded-[6px] border border-[#cbd5c1] px-3 py-2 text-sm text-[#163300] outline-none focus:border-[#163300] focus:ring-2 focus:ring-[#9fe870]"
                  name="description"
                  required
                />
              </label>
              <label className="block text-sm font-medium text-[#2f4a34]">
                Category
                <select
                  className="mt-2 w-full rounded-[6px] border border-[#cbd5c1] bg-white px-3 py-2 text-sm text-[#163300] outline-none focus:border-[#163300] focus:ring-2 focus:ring-[#9fe870]"
                  name="categoryId"
                  required
                >
                  <option value="">Select</option>
                  {expenseCategories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm font-medium text-[#2f4a34]">
                Amount
                <input
                  className="mt-2 w-full rounded-[6px] border border-[#cbd5c1] px-3 py-2 text-sm text-[#163300] outline-none focus:border-[#163300] focus:ring-2 focus:ring-[#9fe870]"
                  min="0"
                  name="amount"
                  required
                  step="0.01"
                  type="number"
                />
              </label>
              <label className="block text-sm font-medium text-[#2f4a34]">
                Day
                <input
                  className="mt-2 w-full rounded-[6px] border border-[#cbd5c1] px-3 py-2 text-sm text-[#163300] outline-none focus:border-[#163300] focus:ring-2 focus:ring-[#9fe870]"
                  defaultValue="1"
                  max="31"
                  min="1"
                  name="dayOfMonth"
                  required
                  type="number"
                />
              </label>
              <label className="block text-sm font-medium text-[#2f4a34]">
                Starts
                <input
                  className="mt-2 w-full rounded-[6px] border border-[#cbd5c1] px-3 py-2 text-sm text-[#163300] outline-none focus:border-[#163300] focus:ring-2 focus:ring-[#9fe870]"
                  name="startsOn"
                  required
                  type="date"
                />
              </label>
              <button
                className="rounded-[6px] bg-[#9fe870] px-4 py-3 text-sm font-semibold text-[#163300] transition hover:bg-[#8bdb5d] sm:col-span-4"
                type="submit"
              >
                Save recurring prompt
              </button>
            </form>
          </section>

          <section className="rounded-[8px] border border-[#d8decf] bg-white p-5">
            <h2 className="text-lg font-semibold text-[#163300]">Agreements</h2>
            <div className="mt-5 space-y-3">
              {agreements.length > 0 ? (
                agreements.map((agreement) => (
                  <div
                    className="rounded-[6px] border border-[#d8decf] px-3 py-3"
                    key={agreement.id}
                  >
                    <p className="text-sm font-semibold text-[#2f4a34]">
                      {formatMyr(agreement.rent_amount_cents)} monthly
                    </p>
                    <p className="mt-1 text-sm text-[#4d6650]">
                      {agreement.start_date} to {agreement.end_date}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm leading-6 text-[#4d6650]">
                  No agreements yet.
                </p>
              )}
            </div>

            <form
              action={createAgreementAction}
              className="mt-6 grid gap-4 sm:grid-cols-2"
            >
              <input name="propertyId" type="hidden" value={property.id} />
              <label className="block text-sm font-medium text-[#2f4a34]">
                Tenant
                <select
                  className="mt-2 w-full rounded-[6px] border border-[#cbd5c1] bg-white px-3 py-2 text-sm text-[#163300] outline-none focus:border-[#163300] focus:ring-2 focus:ring-[#9fe870]"
                  name="tenantId"
                  required
                >
                  <option value="">Select tenant</option>
                  {tenants.map((tenant) => (
                    <option key={tenant.id} value={tenant.id}>
                      {tenant.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm font-medium text-[#2f4a34]">
                Type
                <select
                  className="mt-2 w-full rounded-[6px] border border-[#cbd5c1] bg-white px-3 py-2 text-sm text-[#163300] outline-none focus:border-[#163300] focus:ring-2 focus:ring-[#9fe870]"
                  name="type"
                  defaultValue="one_year"
                >
                  <option value="six_months">Six months</option>
                  <option value="one_year">One year</option>
                  <option value="two_years">Two years</option>
                  <option value="three_years">Three years</option>
                  <option value="custom">Custom</option>
                </select>
              </label>
              <label className="block text-sm font-medium text-[#2f4a34]">
                Start date
                <input
                  className="mt-2 w-full rounded-[6px] border border-[#cbd5c1] px-3 py-2 text-sm text-[#163300] outline-none focus:border-[#163300] focus:ring-2 focus:ring-[#9fe870]"
                  name="startDate"
                  required
                  type="date"
                />
              </label>
              <label className="block text-sm font-medium text-[#2f4a34]">
                Custom end date
                <input
                  className="mt-2 w-full rounded-[6px] border border-[#cbd5c1] px-3 py-2 text-sm text-[#163300] outline-none focus:border-[#163300] focus:ring-2 focus:ring-[#9fe870]"
                  name="customEndDate"
                  type="date"
                />
              </label>
              <label className="block text-sm font-medium text-[#2f4a34]">
                Rent amount
                <input
                  className="mt-2 w-full rounded-[6px] border border-[#cbd5c1] px-3 py-2 text-sm text-[#163300] outline-none focus:border-[#163300] focus:ring-2 focus:ring-[#9fe870]"
                  min="0"
                  name="rentAmount"
                  required
                  step="0.01"
                  type="number"
                />
              </label>
              <label className="block text-sm font-medium text-[#2f4a34]">
                Rent due day
                <input
                  className="mt-2 w-full rounded-[6px] border border-[#cbd5c1] px-3 py-2 text-sm text-[#163300] outline-none focus:border-[#163300] focus:ring-2 focus:ring-[#9fe870]"
                  defaultValue="1"
                  max="31"
                  min="1"
                  name="rentDueDay"
                  required
                  type="number"
                />
              </label>
              <button
                className="rounded-[6px] bg-[#9fe870] px-4 py-3 text-sm font-semibold text-[#163300] transition hover:bg-[#8bdb5d] sm:col-span-2"
                type="submit"
              >
                Create agreement and rent records
              </button>
            </form>
          </section>

          <section className="rounded-[8px] border border-[#d8decf] bg-white p-5">
            <h2 className="text-lg font-semibold text-[#163300]">Rent ledger</h2>
            {agreements.length === 0 ? (
              <form
                action={createManualRentRecordAction}
                className="mt-5 grid gap-3 rounded-[6px] border border-[#d8decf] bg-[#f7f7f2] p-4 sm:grid-cols-4"
              >
                <input name="propertyId" type="hidden" value={property.id} />
                <label className="block text-sm font-medium text-[#2f4a34]">
                  Month
                  <input
                    className="mt-2 w-full rounded-[6px] border border-[#cbd5c1] px-3 py-2 text-sm text-[#163300] outline-none focus:border-[#163300] focus:ring-2 focus:ring-[#9fe870]"
                    name="month"
                    required
                    type="month"
                  />
                </label>
                <label className="block text-sm font-medium text-[#2f4a34]">
                  Due date
                  <input
                    className="mt-2 w-full rounded-[6px] border border-[#cbd5c1] px-3 py-2 text-sm text-[#163300] outline-none focus:border-[#163300] focus:ring-2 focus:ring-[#9fe870]"
                    name="dueDate"
                    required
                    type="date"
                  />
                </label>
                <label className="block text-sm font-medium text-[#2f4a34]">
                  Amount
                  <input
                    className="mt-2 w-full rounded-[6px] border border-[#cbd5c1] px-3 py-2 text-sm text-[#163300] outline-none focus:border-[#163300] focus:ring-2 focus:ring-[#9fe870]"
                    min="0"
                    name="amountDue"
                    required
                    step="0.01"
                    type="number"
                  />
                </label>
                <button
                  className="mt-7 rounded-[6px] bg-[#9fe870] px-4 py-2 text-sm font-semibold text-[#163300] transition hover:bg-[#8bdb5d]"
                  type="submit"
                >
                  Add rent
                </button>
              </form>
            ) : null}
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead className="text-xs uppercase tracking-[0.12em] text-[#7a8577]">
                  <tr>
                    <th className="border-b border-[#d8decf] py-2">Month</th>
                    <th className="border-b border-[#d8decf] py-2">Due</th>
                    <th className="border-b border-[#d8decf] py-2">Amount</th>
                    <th className="border-b border-[#d8decf] py-2">Paid</th>
                    <th className="border-b border-[#d8decf] py-2">Status</th>
                    <th className="border-b border-[#d8decf] py-2">Update</th>
                  </tr>
                </thead>
                <tbody className="text-[#2f4a34]">
                  {rentRecords.map((record) => (
                    <tr key={record.id}>
                      <td className="border-b border-[#eef1ea] py-3">
                        {record.month}
                      </td>
                      <td className="border-b border-[#eef1ea] py-3">
                        {record.due_date}
                      </td>
                      <td className="border-b border-[#eef1ea] py-3">
                        {formatMyr(record.amount_due_cents)}
                      </td>
                      <td className="border-b border-[#eef1ea] py-3">
                        {formatMyr(record.amount_paid_cents)}
                      </td>
                      <td className="border-b border-[#eef1ea] py-3 capitalize">
                        {record.status}
                      </td>
                      <td className="border-b border-[#eef1ea] py-3">
                        <form
                          action={updateRentRecordPaymentAction}
                          className="grid min-w-[320px] gap-2"
                        >
                          <input name="propertyId" type="hidden" value={property.id} />
                          <input name="rentRecordId" type="hidden" value={record.id} />
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              className="rounded-[6px] border border-[#cbd5c1] px-2 py-2 text-xs text-[#163300] outline-none focus:border-[#163300] focus:ring-2 focus:ring-[#9fe870]"
                              defaultValue={(record.amount_paid_cents / 100).toFixed(2)}
                              min="0"
                              name="amountPaid"
                              step="0.01"
                              type="number"
                            />
                            <input
                              className="rounded-[6px] border border-[#cbd5c1] px-2 py-2 text-xs text-[#163300] outline-none focus:border-[#163300] focus:ring-2 focus:ring-[#9fe870]"
                              name="paymentDate"
                              type="date"
                            />
                          </div>
                          <div className="grid grid-cols-[1fr_auto] gap-2">
                            <input
                              className="rounded-[6px] border border-[#cbd5c1] px-2 py-2 text-xs text-[#163300] outline-none focus:border-[#163300] focus:ring-2 focus:ring-[#9fe870]"
                              name="paymentMethod"
                              placeholder="Method"
                            />
                            <button
                              className="rounded-[6px] bg-[#9fe870] px-3 py-2 text-xs font-semibold text-[#163300] transition hover:bg-[#8bdb5d]"
                              type="submit"
                            >
                              Save
                            </button>
                          </div>
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {rentRecords.length === 0 ? (
                <p className="mt-4 text-sm leading-6 text-[#4d6650]">
                  Rent records will appear after an agreement is created.
                </p>
              ) : null}
            </div>
          </section>

          <section className="rounded-[8px] border border-[#d8decf] bg-white p-5">
            <h2 className="text-lg font-semibold text-[#163300]">Expenses</h2>
            <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_320px]">
              <div className="space-y-3">
                {expenses.length > 0 ? (
                  expenses.map((expense) => (
                    <div
                      className="rounded-[6px] border border-[#d8decf] px-3 py-3"
                      key={expense.id}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-[#2f4a34]">
                            {expense.description}
                          </p>
                          <p className="mt-1 text-xs uppercase tracking-[0.12em] text-[#7a8577]">
                            {expense.expense_date}
                          </p>
                        </div>
                        <span className="text-sm font-semibold text-[#163300]">
                          {formatMyr(expense.amount_cents)}
                        </span>
                      </div>
                      <p className="mt-2 text-xs capitalize text-[#4d6650]">
                        {expense.status}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm leading-6 text-[#4d6650]">
                    No expenses recorded yet.
                  </p>
                )}
              </div>

              <form action={createExpenseAction} className="space-y-3">
                <input name="propertyId" type="hidden" value={property.id} />
                <label className="block text-sm font-medium text-[#2f4a34]">
                  Description
                  <input
                    className="mt-2 w-full rounded-[6px] border border-[#cbd5c1] px-3 py-2 text-sm text-[#163300] outline-none focus:border-[#163300] focus:ring-2 focus:ring-[#9fe870]"
                    name="description"
                    required
                  />
                </label>
                <label className="block text-sm font-medium text-[#2f4a34]">
                  Category
                  <select
                    className="mt-2 w-full rounded-[6px] border border-[#cbd5c1] bg-white px-3 py-2 text-sm text-[#163300] outline-none focus:border-[#163300] focus:ring-2 focus:ring-[#9fe870]"
                    name="categoryId"
                    required
                  >
                    <option value="">Select category</option>
                    {expenseCategories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block text-sm font-medium text-[#2f4a34]">
                    Amount
                    <input
                      className="mt-2 w-full rounded-[6px] border border-[#cbd5c1] px-3 py-2 text-sm text-[#163300] outline-none focus:border-[#163300] focus:ring-2 focus:ring-[#9fe870]"
                      min="0"
                      name="amount"
                      required
                      step="0.01"
                      type="number"
                    />
                  </label>
                  <label className="block text-sm font-medium text-[#2f4a34]">
                    Date
                    <input
                      className="mt-2 w-full rounded-[6px] border border-[#cbd5c1] px-3 py-2 text-sm text-[#163300] outline-none focus:border-[#163300] focus:ring-2 focus:ring-[#9fe870]"
                      name="expenseDate"
                      required
                      type="date"
                    />
                  </label>
                </div>
                <label className="block text-sm font-medium text-[#2f4a34]">
                  Status
                  <select
                    className="mt-2 w-full rounded-[6px] border border-[#cbd5c1] bg-white px-3 py-2 text-sm text-[#163300] outline-none focus:border-[#163300] focus:ring-2 focus:ring-[#9fe870]"
                    name="status"
                    defaultValue="unpaid"
                  >
                    <option value="unpaid">Unpaid</option>
                    <option value="paid">Paid</option>
                  </select>
                </label>
                <label className="flex items-center gap-2 text-sm font-medium text-[#2f4a34]">
                  <input name="taxDeductible" type="checkbox" />
                  Tax deductible
                </label>
                <button
                  className="w-full rounded-[6px] bg-[#9fe870] px-4 py-3 text-sm font-semibold text-[#163300] transition hover:bg-[#8bdb5d]"
                  type="submit"
                >
                  Add expense
                </button>
              </form>
            </div>
          </section>

          <section className="rounded-[8px] border border-[#d8decf] bg-white p-5">
            <h2 className="text-lg font-semibold text-[#163300]">
              Maintenance
            </h2>
            <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_320px]">
              <div className="space-y-3">
                {maintenanceIssues.length > 0 ? (
                  maintenanceIssues.map((issue) => (
                    <div
                      className="rounded-[6px] border border-[#d8decf] px-3 py-3"
                      key={issue.id}
                    >
                      <p className="text-sm font-semibold text-[#2f4a34]">
                        {issue.description}
                      </p>
                      <p className="mt-1 text-xs uppercase tracking-[0.12em] text-[#7a8577]">
                        {issue.reported_date} · {issue.status}
                      </p>
                      <p className="mt-2 text-sm text-[#4d6650]">
                        {issue.cost_cents ? formatMyr(issue.cost_cents) : "No cost recorded"}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm leading-6 text-[#4d6650]">
                    No maintenance issues recorded yet.
                  </p>
                )}
              </div>

              <form action={createMaintenanceIssueAction} className="space-y-3">
                <input name="propertyId" type="hidden" value={property.id} />
                <label className="block text-sm font-medium text-[#2f4a34]">
                  Description
                  <textarea
                    className="mt-2 min-h-20 w-full rounded-[6px] border border-[#cbd5c1] px-3 py-2 text-sm text-[#163300] outline-none focus:border-[#163300] focus:ring-2 focus:ring-[#9fe870]"
                    name="description"
                    required
                  />
                </label>
                <label className="block text-sm font-medium text-[#2f4a34]">
                  Issue type
                  <input
                    className="mt-2 w-full rounded-[6px] border border-[#cbd5c1] px-3 py-2 text-sm text-[#163300] outline-none focus:border-[#163300] focus:ring-2 focus:ring-[#9fe870]"
                    name="issueType"
                    placeholder="Plumbing, electrical"
                  />
                </label>
                <label className="block text-sm font-medium text-[#2f4a34]">
                  Vendor
                  <select
                    className="mt-2 w-full rounded-[6px] border border-[#cbd5c1] bg-white px-3 py-2 text-sm text-[#163300] outline-none focus:border-[#163300] focus:ring-2 focus:ring-[#9fe870]"
                    name="vendorId"
                  >
                    <option value="">No vendor</option>
                    {vendors.map((vendor) => (
                      <option key={vendor.id} value={vendor.id}>
                        {vendor.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm font-medium text-[#2f4a34]">
                  Expense category for cost
                  <select
                    className="mt-2 w-full rounded-[6px] border border-[#cbd5c1] bg-white px-3 py-2 text-sm text-[#163300] outline-none focus:border-[#163300] focus:ring-2 focus:ring-[#9fe870]"
                    name="expenseCategoryId"
                  >
                    <option value="">No linked expense</option>
                    {expenseCategories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block text-sm font-medium text-[#2f4a34]">
                    Reported
                    <input
                      className="mt-2 w-full rounded-[6px] border border-[#cbd5c1] px-3 py-2 text-sm text-[#163300] outline-none focus:border-[#163300] focus:ring-2 focus:ring-[#9fe870]"
                      name="reportedDate"
                      required
                      type="date"
                    />
                  </label>
                  <label className="block text-sm font-medium text-[#2f4a34]">
                    Cost
                    <input
                      className="mt-2 w-full rounded-[6px] border border-[#cbd5c1] px-3 py-2 text-sm text-[#163300] outline-none focus:border-[#163300] focus:ring-2 focus:ring-[#9fe870]"
                      min="0"
                      name="cost"
                      step="0.01"
                      type="number"
                    />
                  </label>
                </div>
                <button
                  className="w-full rounded-[6px] bg-[#9fe870] px-4 py-3 text-sm font-semibold text-[#163300] transition hover:bg-[#8bdb5d]"
                  type="submit"
                >
                  Add issue
                </button>
              </form>
            </div>
          </section>

          <section className="rounded-[8px] border border-[#d8decf] bg-white p-5">
            <h2 className="text-lg font-semibold text-[#163300]">Deposits</h2>
            <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_320px]">
              <div className="space-y-3">
                {deposits.length > 0 ? (
                  deposits.map((deposit) => (
                    <form
                      action={updateDepositStatusAction}
                      className="rounded-[6px] border border-[#d8decf] px-3 py-3"
                      key={deposit.id}
                    >
                      <input name="propertyId" type="hidden" value={property.id} />
                      <input name="depositId" type="hidden" value={deposit.id} />
                      <p className="text-sm font-semibold text-[#2f4a34]">
                        {deposit.label}
                      </p>
                      <p className="mt-1 text-sm text-[#4d6650]">
                        {formatMyr(deposit.amount_cents)}
                      </p>
                      <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                        <select
                          className="rounded-[6px] border border-[#cbd5c1] bg-white px-2 py-2 text-xs text-[#163300]"
                          defaultValue={deposit.status}
                          name="status"
                        >
                          <option value="held">Held</option>
                          <option value="refunded">Refunded</option>
                        </select>
                        <input
                          className="rounded-[6px] border border-[#cbd5c1] px-2 py-2 text-xs text-[#163300]"
                          defaultValue={deposit.refund_date ?? ""}
                          name="refundDate"
                          type="date"
                        />
                        <button
                          className="rounded-[6px] bg-[#9fe870] px-3 py-2 text-xs font-semibold text-[#163300]"
                          type="submit"
                        >
                          Save
                        </button>
                      </div>
                    </form>
                  ))
                ) : (
                  <p className="text-sm leading-6 text-[#4d6650]">
                    No deposits recorded yet.
                  </p>
                )}
              </div>

              <form action={createDepositAction} className="space-y-3">
                <input name="propertyId" type="hidden" value={property.id} />
                <label className="block text-sm font-medium text-[#2f4a34]">
                  Agreement
                  <select
                    className="mt-2 w-full rounded-[6px] border border-[#cbd5c1] bg-white px-3 py-2 text-sm text-[#163300] outline-none focus:border-[#163300] focus:ring-2 focus:ring-[#9fe870]"
                    name="agreementId"
                    required
                  >
                    <option value="">Select agreement</option>
                    {agreements.map((agreement) => (
                      <option key={agreement.id} value={agreement.id}>
                        {agreement.start_date} to {agreement.end_date}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm font-medium text-[#2f4a34]">
                  Label
                  <input
                    className="mt-2 w-full rounded-[6px] border border-[#cbd5c1] px-3 py-2 text-sm text-[#163300] outline-none focus:border-[#163300] focus:ring-2 focus:ring-[#9fe870]"
                    name="label"
                    placeholder="Security deposit"
                    required
                  />
                </label>
                <label className="block text-sm font-medium text-[#2f4a34]">
                  Amount
                  <input
                    className="mt-2 w-full rounded-[6px] border border-[#cbd5c1] px-3 py-2 text-sm text-[#163300] outline-none focus:border-[#163300] focus:ring-2 focus:ring-[#9fe870]"
                    min="0"
                    name="amount"
                    required
                    step="0.01"
                    type="number"
                  />
                </label>
                <button
                  className="w-full rounded-[6px] bg-[#9fe870] px-4 py-3 text-sm font-semibold text-[#163300] transition hover:bg-[#8bdb5d]"
                  type="submit"
                >
                  Add deposit
                </button>
              </form>
            </div>
          </section>

          <section className="rounded-[8px] border border-[#d8decf] bg-white p-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-[#163300]">
                  Files
                </h2>
                <p className="mt-1 text-sm text-[#4d6650]">
                  {attachments.length} linked {attachments.length === 1 ? "file" : "files"}
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {attachments.length > 0 ? (
                attachments.map((attachment) => (
                  <div
                    className="rounded-[6px] border border-[#d8decf] px-3 py-3"
                    key={attachment.id}
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-[#2f4a34]">
                          {attachment.file_name}
                        </p>
                        <p className="mt-1 text-xs uppercase tracking-[0.12em] text-[#7a8577]">
                          {attachment.target_type}
                        </p>
                      </div>
                      <span className="w-fit rounded-full bg-[#f2f5ee] px-3 py-1 text-xs font-semibold text-[#4d6650]">
                        {attachment.is_private ? "Private" : "Shared"}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-[#7a8577]">
                      {attachment.size_bytes
                        ? `${Math.round(attachment.size_bytes / 1024)} KB`
                        : "Size not recorded"}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm leading-6 text-[#4d6650]">
                  Linked agreement, expense, maintenance, and deposit files will
                  appear here.
                </p>
              )}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <aside className="rounded-[8px] border border-[#d8decf] bg-[#f7f7f2] p-5">
            <h2 className="text-lg font-semibold text-[#163300]">
              {isVacant ? "Vacant setup" : "Current setup"}
            </h2>
            <div className="mt-5 space-y-3">
              {(isVacant
                ? ["Add tenant record", "Create agreement", "Generate rent schedule"]
                : ["Review tenant record", "Check active agreement", "Review rent ledger"]
              ).map((item) => (
                <div
                  className="rounded-[6px] border border-[#d8decf] bg-white px-3 py-3 text-sm font-medium text-[#2f4a34]"
                  key={item}
                >
                  {item}
                </div>
              ))}
            </div>
          </aside>

          <aside className="rounded-[8px] border border-[#d8decf] bg-white p-5">
            <h2 className="text-lg font-semibold text-[#163300]">
              Activity
            </h2>
            <div className="mt-5 space-y-4">
              {activityEvents.length > 0 ? (
                activityEvents.map((event) => (
                  <div className="border-l-2 border-[#9fe870] pl-3" key={event.id}>
                    <p className="text-sm font-medium text-[#2f4a34]">
                      {event.summary}
                    </p>
                    <p className="mt-1 text-xs uppercase tracking-[0.12em] text-[#7a8577]">
                      {event.action} · {new Date(event.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm leading-6 text-[#4d6650]">
                  Activity will appear after property changes are recorded.
                </p>
              )}
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
