import { notFound, redirect } from "next/navigation";

import {
  archivePropertyAction,
  updatePropertyAction,
} from "@/features/properties/actions";
import {
  createAgreementAction,
  createManualRentRecordAction,
  updateRentRecordPaymentAction,
} from "@/features/agreements/actions";
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

async function getProperty(propertyId: string) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    redirect("/login");
  }

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

async function getPropertyActivity(propertyId: string) {
  const supabase = await createClient();

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

async function getPropertyAttachments(propertyId: string) {
  const supabase = await createClient();

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

async function getTenants(propertyId: string) {
  const supabase = await createClient();

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

async function getAgreements(propertyId: string) {
  const supabase = await createClient();

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

async function getRentRecords(propertyId: string) {
  const supabase = await createClient();

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

export default async function PropertyWorkspacePage({
  params,
}: PropertyWorkspacePageProps) {
  const { propertyId } = await params;
  const property = await getProperty(propertyId);
  const activityEvents = await getPropertyActivity(propertyId);
  const attachments = await getPropertyAttachments(propertyId);
  const tenants = await getTenants(propertyId);
  const agreements = await getAgreements(propertyId);
  const rentRecords = await getRentRecords(propertyId);
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
